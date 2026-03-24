const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { squareClient, PLANS } = require('../config/square');
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// Square未設定時のガード
function requireSquare(req, res, next) {
  if (!squareClient) {
    return res.status(503).json({ error: '決済は現在利用できません' });
  }
  next();
}

// プラン一覧取得
router.get('/plans', (req, res) => {
  res.json(PLANS);
});

// Checkoutリンク作成（プラン購入）
router.post('/checkout', authenticate, requireSquare, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan || !PLANS[plan] || plan === 'free') {
      return res.status(400).json({ error: '有効なプランを指定してください（monitor, standard, pro, vip）' });
    }

    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      return res.status(503).json({ error: 'Square Location IDが未設定です' });
    }

    const baseUrl = req.headers.origin || 'https://grip-api-production.up.railway.app';

    // Square Checkout APIでPayment Linkを作成
    const response = await squareClient.checkoutApi.createPaymentLink({
      idempotencyKey: crypto.randomUUID(),
      order: {
        locationId,
        lineItems: [{
          name: `GRIP ${PLANS[plan].name}プラン`,
          quantity: '1',
          basePriceMoney: {
            amount: BigInt(PLANS[plan].price),
            currency: 'JPY',
          },
        }],
        metadata: {
          grip_user_id: req.user.id,
          plan,
        },
      },
      checkoutOptions: {
        redirectUrl: `${baseUrl}/?payment=success`,
      },
    });

    const paymentLink = response.result.paymentLink;
    res.json({ url: paymentLink.url });
  } catch (err) {
    console.error('Checkout作成エラー:', err.message || err);
    res.status(500).json({ error: err.message || '決済リンクの作成に失敗しました' });
  }
});

// Square Webhook受信
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!squareClient) return res.status(503).send();

  const signature = req.headers['x-square-hmacsha256-signature'];
  const webhookSecret = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

  // 署名検証
  if (process.env.NODE_ENV === 'production' && !webhookSecret) {
    console.error('Square Webhook署名キーが未設定です');
    return res.status(503).json({ error: 'Webhook署名検証が設定されていません' });
  }

  if (webhookSecret && signature) {
    const notificationUrl = `${process.env.SQUARE_WEBHOOK_URL || ''}/api/payment/webhook`;
    const body = typeof req.body === 'string' ? req.body : req.body.toString('utf8');
    const hmac = crypto.createHmac('sha256', webhookSecret)
      .update(notificationUrl + body)
      .digest('base64');

    if (hmac !== signature) {
      console.error('Square署名検証エラー');
      return res.status(400).json({ error: '署名検証に失敗しました' });
    }
  }

  try {
    const event = typeof req.body === 'string' ? JSON.parse(req.body) : JSON.parse(req.body.toString('utf8'));

    // 決済完了イベント
    if (event.type === 'payment.completed') {
      const payment = event.data.object.payment;
      const orderId = payment.orderId;

      if (orderId) {
        // 注文からメタデータを取得
        const orderResponse = await squareClient.ordersApi.retrieveOrder(orderId);
        const metadata = orderResponse.result.order.metadata;

        if (metadata && metadata.grip_user_id && metadata.plan) {
          await supabaseAdmin
            .from('users')
            .update({ plan: metadata.plan })
            .eq('id', metadata.grip_user_id);

          console.log(`プランアップグレード: ${metadata.grip_user_id} → ${metadata.plan}`);
        }
      }
    }
  } catch (err) {
    console.error('Webhook処理エラー:', err.message);
  }

  res.json({ received: true });
});

// 現在のプラン取得
router.get('/current-plan', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('plan')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json({ plan: data.plan, details: PLANS[data.plan] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
