const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { batchCalculateChurnScores, calculateChurnScore, generateRecoveryMessage } = require('../services/churn/detector');
const { supabaseAdmin } = require('../config/supabase');

// フォロワー所有権チェック
async function verifyOwnership(followerId, userId) {
  const { data } = await supabaseAdmin
    .from('line_followers')
    .select('id')
    .eq('id', followerId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

// 離脱スコア一覧取得
router.get('/scores', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('line_followers')
      .select('id, display_name, follower_line_id, churn_scores(score, score_detail_json, calculated_at, alerted)')
      .eq('user_id', req.user.id)
      .eq('is_blocked', false)
      .order('registered_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch {
    res.status(500).json({ error: 'データの取得に失敗しました' });
  }
});

// 全友達の離脱スコアをバッチ計算
router.post('/scores/batch', authenticate, async (req, res) => {
  try {
    const results = await batchCalculateChurnScores(req.user.id);
    res.json({ calculated: results.length, results });
  } catch {
    res.status(500).json({ error: 'バッチ計算に失敗しました' });
  }
});

// 特定友達の離脱スコア計算（所有権チェック付き）
router.post('/scores/:followerId', authenticate, async (req, res) => {
  try {
    if (!await verifyOwnership(req.params.followerId, req.user.id)) {
      return res.status(403).json({ error: 'アクセス権限がありません' });
    }
    const result = await calculateChurnScore(req.params.followerId);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'スコア計算に失敗しました' });
  }
});

// 復活メッセージ生成（所有権チェック付き）
router.post('/recovery-message', authenticate, async (req, res) => {
  try {
    const { followerId } = req.body;
    if (!followerId) return res.status(400).json({ error: 'followerId は必須です' });
    if (!await verifyOwnership(followerId, req.user.id)) {
      return res.status(403).json({ error: 'アクセス権限がありません' });
    }
    const messages = await generateRecoveryMessage(followerId);
    res.json(messages);
  } catch {
    res.status(500).json({ error: 'メッセージ生成に失敗しました' });
  }
});

module.exports = router;
