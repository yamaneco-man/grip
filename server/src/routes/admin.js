const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');
const { squareClient } = require('../config/square');

// 全ルートに認証 + admin権限を要求
router.use(authenticate, requireRole('admin'));

// 全契約者一覧
router.get('/contracts', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, plan, role, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch {
    res.status(500).json({ error: 'データの取得に失敗しました' });
  }
});

// 全代理店一覧
router.get('/agencies', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, created_at')
      .eq('role', 'partner')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch {
    res.status(500).json({ error: 'データの取得に失敗しました' });
  }
});

// ユーザーのrole変更（adminのみ）
router.put('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!role || !['user', 'admin', 'partner'].includes(role)) {
    return res.status(400).json({ error: '有効なroleを指定してください（user, admin, partner）' });
  }
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch {
    res.status(500).json({ error: 'role変更に失敗しました' });
  }
});

// 代理店契約の決済リンク発行
router.post('/agency-checkout', async (req, res) => {
  if (!squareClient) {
    return res.status(503).json({ error: '決済は現在利用できません' });
  }

  const { agencyName, agencyEmail, amount } = req.body;
  if (!agencyName || !amount) {
    return res.status(400).json({ error: '代理店名と金額は必須です' });
  }

  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) {
    return res.status(503).json({ error: 'Square Location IDが未設定です' });
  }

  try {
    const baseUrl = req.headers.origin || 'https://grip-api-production.up.railway.app';

    const response = await squareClient.checkoutApi.createPaymentLink({
      idempotencyKey: crypto.randomUUID(),
      order: {
        locationId,
        lineItems: [{
          name: `GRIP 代理店契約 — ${agencyName}`,
          quantity: '1',
          basePriceMoney: {
            amount: BigInt(amount),
            currency: 'JPY',
          },
        }],
        metadata: {
          type: 'agency_contract',
          agency_name: agencyName,
          agency_email: agencyEmail || '',
        },
      },
      checkoutOptions: {
        redirectUrl: `${baseUrl}/admin?payment=agency_success`,
      },
    });

    const paymentLink = response.result.paymentLink;
    res.json({ url: paymentLink.url, linkId: paymentLink.id });
  } catch (err) {
    console.error('代理店決済リンク作成エラー:', err.message || err);
    res.status(500).json({ error: '決済リンクの作成に失敗しました' });
  }
});

module.exports = router;
