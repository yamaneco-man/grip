const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { lineConfig } = require('../config/line');
const { handleWebhookEvent } = require('../services/line/webhook');
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// LINE署名検証（express.raw()で受け取ったbodyを手動検証）
function verifyLineSignature(req) {
  const signature = req.headers['x-line-signature'];
  if (!signature) return false;

  const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
  const hash = crypto
    .createHmac('SHA256', lineConfig.channelSecret)
    .update(body)
    .digest('base64');

  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}

// LINE Webhook受信（署名検証付き）
router.post('/webhook', async (req, res) => {
  // 署名検証
  if (!verifyLineSignature(req)) {
    return res.status(401).json({ error: '署名検証に失敗しました' });
  }

  // raw bodyをJSONにパース
  const body = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;

  // MVP: 環境変数で1売り手を設定
  const userId = process.env.DEFAULT_USER_ID;

  try {
    await Promise.all(
      body.events.map(event => handleWebhookEvent(event, userId))
    );
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook処理エラー:', err);
    res.status(500).json({ error: 'Webhook処理に失敗しました' });
  }
});

// LINE友達一覧取得（認証必須）
router.get('/followers', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('line_followers')
      .select('*, churn_scores(score, calculated_at), closing_scores(probability, recommended_action)')
      .eq('user_id', req.user.id)
      .order('registered_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LINE友達詳細（メッセージ履歴付き）— user_idで所有権チェック
router.get('/followers/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('line_followers')
      .select('*, messages(direction, content, emotion_score, created_at)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: '友達が見つかりません' });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'データの取得に失敗しました' });
  }
});

module.exports = router;
