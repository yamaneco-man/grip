const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { lineClient } = require('../config/line');
const { generateStepMessage } = require('../services/ai/stepMessages');
const { batchCalculateChurnScores } = require('../services/churn/detector');

// n8n用APIキー認証
function requireSchedulerKey(req, res, next) {
  const key = req.headers['x-scheduler-key'] || req.query.key;
  const expected = process.env.SCHEDULER_API_KEY;

  if (!expected) {
    return res.status(503).json({ error: 'SCHEDULER_API_KEY が未設定です' });
  }
  if (key !== expected) {
    return res.status(401).json({ error: '無効なスケジューラーキーです' });
  }
  next();
}

/**
 * 7日間ステップ配信の自動実行
 * n8nから毎朝呼び出す: POST /api/scheduler/step-delivery
 *
 * ロジック:
 * 1. step_day < 7 かつ is_blocked = false の友達を全取得
 * 2. 各友達にDay(step_day+1)のメッセージを生成・送信
 * 3. step_dayをインクリメント
 */
router.post('/step-delivery', requireSchedulerKey, async (req, res) => {
  try {
    // 全ユーザーの対象友達を取得
    const { data: followers, error } = await supabaseAdmin
      .from('line_followers')
      .select('id, display_name, follower_line_id, user_id, step_day')
      .eq('is_blocked', false)
      .lt('step_day', 7);

    if (error) throw error;

    const results = [];
    for (const follower of (followers || [])) {
      const nextDay = follower.step_day + 1;

      try {
        // ステップメッセージ生成
        const message = await generateStepMessage(follower.id, nextDay);

        // LINE送信
        await lineClient.pushMessage({
          to: follower.follower_line_id,
          messages: [{ type: 'text', text: message }],
        });

        // メッセージログ保存
        await supabaseAdmin.from('messages').insert({
          follower_id: follower.id,
          direction: 'out',
          content: message,
        });

        // step_dayをインクリメント
        await supabaseAdmin
          .from('line_followers')
          .update({ step_day: nextDay })
          .eq('id', follower.id);

        results.push({ followerId: follower.id, name: follower.display_name, day: nextDay, status: 'sent' });
      } catch (e) {
        console.error(`ステップ配信エラー (${follower.display_name}):`, e.message);
        results.push({ followerId: follower.id, name: follower.display_name, day: nextDay, status: 'error', error: e.message });
      }
    }

    res.json({
      executed: new Date().toISOString(),
      total: followers?.length || 0,
      sent: results.filter(r => r.status === 'sent').length,
      errors: results.filter(r => r.status === 'error').length,
      results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 全ユーザーの離脱スコアバッチ計算
 * n8nから毎晩呼び出す: POST /api/scheduler/churn-batch
 */
router.post('/churn-batch', requireSchedulerKey, async (req, res) => {
  try {
    // 全ユーザーを取得
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id');

    if (error) throw error;

    const allResults = [];
    for (const user of (users || [])) {
      try {
        const results = await batchCalculateChurnScores(user.id);
        allResults.push({ userId: user.id, calculated: results.length, alerts: results.filter(r => r.score >= 80).length });
      } catch (e) {
        console.error(`離脱計算エラー (${user.id}):`, e.message);
        allResults.push({ userId: user.id, error: e.message });
      }
    }

    res.json({
      executed: new Date().toISOString(),
      users: users?.length || 0,
      results: allResults,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * スケジューラーステータス確認
 * GET /api/scheduler/status
 */
router.get('/status', requireSchedulerKey, async (req, res) => {
  try {
    // 配信対象の友達数
    const { data: pendingStep } = await supabaseAdmin
      .from('line_followers')
      .select('id', { count: 'exact' })
      .eq('is_blocked', false)
      .lt('step_day', 7);

    // アラート対象（離脱スコア80以上）
    const { data: alerts } = await supabaseAdmin
      .from('churn_scores')
      .select('id', { count: 'exact' })
      .gte('score', 80)
      .eq('alerted', true);

    res.json({
      timestamp: new Date().toISOString(),
      pendingStepDelivery: pendingStep?.length || 0,
      churnAlerts: alerts?.length || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
