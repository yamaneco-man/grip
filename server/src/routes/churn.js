const express = require('express');
const router = express.Router();

// 離脱スコア一覧取得
router.get('/scores', async (req, res) => {
  // TODO: 全友達の離脱スコアを取得
  res.json({ message: '離脱スコア一覧' });
});

// 特定友達の離脱スコア詳細
router.get('/scores/:followerId', async (req, res) => {
  // TODO: 個別の離脱スコア詳細を取得
  res.json({ message: `離脱スコア詳細: ${req.params.followerId}` });
});

// 復活メッセージ生成
router.post('/recovery-message', async (req, res) => {
  // TODO: Claude APIで復活メッセージ3案を生成
  res.json({ message: '復活メッセージ生成' });
});

module.exports = router;
