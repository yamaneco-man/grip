const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { batchCalculateChurnScores, calculateChurnScore, generateRecoveryMessage } = require('../services/churn/detector');
const { supabaseAdmin } = require('../config/supabase');

// 離脱スコア一覧取得
router.get('/scores', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('line_followers')
      .select('id, display_name, follower_line_id, churn_scores(score, score_detail_json, calculated_at)')
      .eq('user_id', req.user.id)
      .eq('is_blocked', false)
      .order('registered_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 全友達の離脱スコアをバッチ計算
router.post('/scores/batch', authenticate, async (req, res) => {
  try {
    const results = await batchCalculateChurnScores(req.user.id);
    res.json({ calculated: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 特定友達の離脱スコア計算
router.post('/scores/:followerId', authenticate, async (req, res) => {
  try {
    const result = await calculateChurnScore(req.params.followerId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 復活メッセージ生成
router.post('/recovery-message', authenticate, async (req, res) => {
  try {
    const { followerId } = req.body;
    if (!followerId) return res.status(400).json({ error: 'followerId は必須です' });
    const messages = await generateRecoveryMessage(followerId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
