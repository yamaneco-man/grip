const express = require('express');
const router = express.Router();

// LINE Webhook受信（友達追加・メッセージ受信）
router.post('/webhook', async (req, res) => {
  // TODO: LINE Webhookイベントの処理
  // - follow: 友達追加 → Supabaseに保存 → 即時フォローメッセージ送信
  // - message: メッセージ受信 → 感情分析 → スコア更新
  // - unfollow: ブロック検知 → 離脱ログ記録
  res.status(200).json({ status: 'ok' });
});

// LINE友達一覧取得
router.get('/followers', async (req, res) => {
  // TODO: ユーザーに紐づくLINE友達一覧を取得
  res.json({ message: 'LINE友達一覧' });
});

// LINE友達詳細（メッセージ履歴含む）
router.get('/followers/:id', async (req, res) => {
  // TODO: 特定の友達の詳細情報・メッセージ履歴を取得
  res.json({ message: `友達詳細: ${req.params.id}` });
});

module.exports = router;
