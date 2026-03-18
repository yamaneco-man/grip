const express = require('express');
const router = express.Router();
const { stripe, PLANS } = require('../config/stripe');
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// Stripe未設定時のガード
function requireStripe(req, res, next) {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe決済は現在利用できません' });
  }
  next();
}

// プラン一覧取得
router.get('/plans', (req, res) => {
  res.json(PLANS);
});

// Checkoutセッション作成（プラン購入）
router.post('/checkout', authenticate, requireStripe, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan || !PLANS[plan] || plan === 'free') {
      return res.status(400).json({ error: '有効なプランを指定してください（standard, pro, vip）' });
    }

    // 既存のStripe顧客IDを取得
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', req.user.id)
      .single();

    let customerId = user.stripe_customer_id;

    // Stripe顧客が未作成の場合は新規作成
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { grip_user_id: req.user.id },
      });
      customerId = customer.id;

      await supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', req.user.id);
    }

    // Checkoutセッション作成（単発決済、MVPではサブスクリプション未実装）
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'jpy',
          product_data: {
            name: `GRIP ${PLANS[plan].name}プラン`,
            description: `GRIP ${PLANS[plan].name}プランへのアップグレード`,
          },
          unit_amount: PLANS[plan].price,
        },
        quantity: 1,
      }],
      metadata: { grip_user_id: req.user.id, plan },
      success_url: `${req.headers.origin || 'http://localhost:3000'}/?payment=success`,
      cancel_url: `${req.headers.origin || 'http://localhost:3000'}/?payment=cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout作成エラー:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Stripe Webhook受信
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(503).send();

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe署名検証エラー:', err.message);
    return res.status(400).json({ error: '署名検証に失敗しました' });
  }

  // 決済完了イベント
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.grip_user_id;
    const plan = session.metadata.plan;

    if (userId && plan) {
      await supabaseAdmin
        .from('users')
        .update({ plan })
        .eq('id', userId);

      console.log(`プランアップグレード: ${userId} → ${plan}`);
    }
  }

  res.json({ received: true });
});

// 現在のプラン取得
router.get('/current-plan', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('plan, stripe_customer_id')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json({ plan: data.plan, details: PLANS[data.plan] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
