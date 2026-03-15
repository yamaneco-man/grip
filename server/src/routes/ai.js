const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { calculateClosingScore, generateObjectionHandling } = require('../services/ai/closingAI');
const { generateStepMessage } = require('../services/ai/stepMessages');

// 成約確率スコア取得
router.get('/closing-score/:followerId', authenticate, async (req, res) => {
  try {
    const result = await calculateClosingScore(req.params.followerId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 反論処理AI（3パターン生成）
router.post('/objection-handling', authenticate, async (req, res) => {
  try {
    const { followerId, userMessage } = req.body;
    if (!followerId || !userMessage) {
      return res.status(400).json({ error: 'followerId と userMessage は必須です' });
    }
    const replies = await generateObjectionHandling(followerId, userMessage);
    res.json(replies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ステップ配信メッセージ生成
router.post('/step-message', authenticate, async (req, res) => {
  try {
    const { followerId, day } = req.body;
    if (!followerId || !day) {
      return res.status(400).json({ error: 'followerId と day は必須です' });
    }
    const message = await generateStepMessage(followerId, day);
    res.json({ message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
