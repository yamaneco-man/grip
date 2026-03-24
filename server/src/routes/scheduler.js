const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase');
const { lineClient } = require('../config/line');
const { generateStepMessage } = require('../services/ai/stepMessages');
const { batchCalculateChurnScores } = require('../services/churn/detector');
const { PLANS } = require('../config/square');

// ステップ配信のプラン別対象判定
// FREE: 対象外、STANDARD: 固定テンプレ、PRO/VIP: AI自動生成
const STEP_TEMPLATES = {
  1: '{name}さん、登録ありがとうございます！今日は{product}の活用事例をお伝えしますね。',
  2: '{name}さん、{product}を使って成果を出した方の声をご紹介します。',
  3: '{name}さん、昨日の事例いかがでしたか？今日は別の成功パターンをご紹介しますね。',
  4: '{name}さん、{product}で一番大事なポイントをお伝えします。',
  5: '{name}さん、{product}の具体的な使い方を解説しますね。',
  6: '{name}さん、実は今だけの特別なご案内があります。詳しくはこちら👇',
  7: '{name}さん、昨日お伝えした特別なご案内は本日までです。気になる方はお早めに！',
};

// 離脱検知のプラン別実行判定
// FREE: なし、STANDARD: 週次(日曜のみ)、PRO: 日次、VIP: 日次
function shouldRunChurn(plan) {
  if (plan === 'free') return false;
  if (plan === 'standard') return new Date().getDay() === 0; // 日曜のみ
  return true; // pro, vip は毎日
}

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
    // 全ユーザーの対象友達を取得（ユーザーのプラン情報も結合）
    const { data: followers, error } = await supabaseAdmin
      .from('line_followers')
      .select('id, display_name, follower_line_id, user_id, step_day, users!inner(plan)')
      .eq('is_blocked', false)
      .lt('step_day', 7);

    if (error) throw error;

    const results = [];
    for (const follower of (followers || [])) {
      const userPlan = follower.users?.plan || 'free';

      // FREEプランはステップ配信対象外
      if (userPlan === 'free') {
        results.push({ followerId: follower.id, name: follower.display_name, status: 'skipped', reason: 'FREEプラン' });
        continue;
      }

      const nextDay = follower.step_day + 1;

      try {
        // プラン別メッセージ生成: STANDARDは固定テンプレ、PRO/VIPはAI生成
        let message;
        if (userPlan === 'standard') {
          const { data: lp } = await supabaseAdmin
            .from('lps').select('product_name').eq('user_id', follower.user_id)
            .order('created_at', { ascending: false }).limit(1).single();
          message = (STEP_TEMPLATES[nextDay] || STEP_TEMPLATES[1])
            .replace('{name}', follower.display_name)
            .replace('{product}', lp?.product_name || 'サービス');
        } else {
          message = await generateStepMessage(follower.id, nextDay);
        }

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
    // 全ユーザーを取得（プラン情報付き）
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, plan');

    if (error) throw error;

    const allResults = [];
    for (const user of (users || [])) {
      const plan = user.plan || 'free';

      // プラン別実行判定: FREE=なし、STANDARD=週次、PRO/VIP=日次
      if (!shouldRunChurn(plan)) {
        allResults.push({ userId: user.id, plan, status: 'skipped' });
        continue;
      }

      try {
        const results = await batchCalculateChurnScores(user.id);
        allResults.push({ userId: user.id, plan, calculated: results.length, alerts: results.filter(r => r.score >= 80).length });
      } catch (e) {
        console.error(`離脱計算エラー (${user.id}):`, e.message);
        allResults.push({ userId: user.id, plan, error: e.message });
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
