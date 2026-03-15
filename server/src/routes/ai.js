const express = require('express');
const router = express.Router();

// 成約確率スコア取得
router.get('/closing-score/:followerId', async (req, res) => {
  // TODO: 友達の成約確率スコアを計算・取得
  res.json({ message: `成約スコア: ${req.params.followerId}` });
});

// 反論処理AI（3パターン生成）
router.post('/objection-handling', async (req, res) => {
  // TODO: ユーザーの返信に対する切り返し3パターンを生成
  res.json({ message: '反論処理AIエンドポイント' });
});

// ステップ配信メッセージ生成
router.post('/step-message', async (req, res) => {
  // TODO: Day1〜Day7のステップ配信メッセージを生成
  res.json({ message: 'ステップ配信メッセージ生成' });
});

module.exports = router;
