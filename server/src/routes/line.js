const express = require('express');
const line = require('@line/bot-sdk');
const router = express.Router();
const { lineConfig } = require('../config/line');
const { handleWebhookEvent } = require('../services/line/webhook');
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// LINE Webhook受信（LINE署名検証付き）
router.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  // Webhookの場合、売り手のuser_idはLINEチャネルから逆引き
  // MVP: 環境変数で1売り手を設定
  const userId = process.env.DEFAULT_USER_ID;

  try {
    await Promise.all(
      req.body.events.map(event => handleWebhookEvent(event, userId))
    );
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook処理エラー:', err);
    res.status(500).json({ error: err.message });
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

// LINE友達詳細（メッセージ履歴付き）
router.get('/followers/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('line_followers')
      .select('*, messages(direction, content, emotion_score, created_at)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
