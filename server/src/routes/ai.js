const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');
const { calculateClosingScore, generateObjectionHandling } = require('../services/ai/closingAI');
const { generateStepMessage } = require('../services/ai/stepMessages');

// フォロワー所有権チェック
async function verifyFollowerOwnership(followerId, userId) {
  const { data } = await supabaseAdmin
    .from('line_followers')
    .select('id')
    .eq('id', followerId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

// 成約確率スコア取得
router.get('/closing-score/:followerId', authenticate, async (req, res) => {
  try {
    if (!await verifyFollowerOwnership(req.params.followerId, req.user.id)) {
      return res.status(403).json({ error: 'アクセス権限がありません' });
    }
    const result = await calculateClosingScore(req.params.followerId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'スコアの取得に失敗しました' });
  }
});

// 反論処理AI（3パターン生成）
router.post('/objection-handling', authenticate, async (req, res) => {
  try {
    const { followerId, userMessage } = req.body;
    if (!followerId || !userMessage) {
      return res.status(400).json({ error: 'followerId と userMessage は必須です' });
    }
    if (!await verifyFollowerOwnership(followerId, req.user.id)) {
      return res.status(403).json({ error: 'アクセス権限がありません' });
    }
    const replies = await generateObjectionHandling(followerId, userMessage);
    res.json(replies);
  } catch (err) {
    res.status(500).json({ error: '反論処理の生成に失敗しました' });
  }
});

// ステップ配信メッセージ生成
router.post('/step-message', authenticate, async (req, res) => {
  try {
    const { followerId, day } = req.body;
    if (!followerId || !day) {
      return res.status(400).json({ error: 'followerId と day は必須です' });
    }
    if (!await verifyFollowerOwnership(followerId, req.user.id)) {
      return res.status(403).json({ error: 'アクセス権限がありません' });
    }
    const message = await generateStepMessage(followerId, day);
    res.json({ message });
  } catch (err) {
    res.status(500).json({ error: 'メッセージの生成に失敗しました' });
  }
});

module.exports = router;
