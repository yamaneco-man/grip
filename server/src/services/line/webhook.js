const { lineClient } = require('../../config/line');
const { supabaseAdmin } = require('../../config/supabase');
const { generateWelcomeMessage } = require('../ai/stepMessages');
const { generateAutoReply } = require('../ai/autoReply');
const { PLANS } = require('../../config/square');

/**
 * LINE Webhookイベントの処理（設計書 第3章準拠）
 */
async function handleWebhookEvent(event, userId) {
  switch (event.type) {
    case 'follow':
      return handleFollow(event, userId);
    case 'unfollow':
      return handleUnfollow(event, userId);
    case 'message':
      return handleMessage(event, userId);
    default:
      console.log(`未対応イベント: ${event.type}`);
  }
}

/**
 * 友達追加イベント処理
 * LP → LINE登録 → Supabase保存 → 30秒以内に初回メッセージ送信
 */
async function handleFollow(event, userId) {
  const followerLineId = event.source.userId;

  // プランのフォロワー数制限チェック
  const { data: user } = await supabaseAdmin
    .from('users').select('plan').eq('id', userId).single();
  const plan = PLANS[user?.plan || 'free'];
  if (plan.followerLimit) {
    const { count } = await supabaseAdmin
      .from('line_followers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_blocked', false);
    if (count >= plan.followerLimit) {
      console.log(`フォロワー上限到達: ${count}/${plan.followerLimit} (${plan.name})`);
      return;
    }
  }

  // LINEプロフィール取得
  let displayName = '友達';
  try {
    const profile = await lineClient.getProfile(followerLineId);
    displayName = profile.displayName;
  } catch (e) {
    console.error('プロフィール取得エラー:', e.message);
  }

  // LP追跡・流入経路: フォローイベントのパラメータから特定
  let sourceLpId = null;
  let sourceChannel = null;

  if (event.follow?.isUnblocked === false) {
    // 初回フォロー時のみ追跡（再フォローは除く）
    // LINE友達追加URLの?lp=xxx&src=xxxから取得を試みる
    // MVPフォールバック: 直近のLPを自動紐づけ
    sourceLpId = await resolveSourceLP(userId);

    // 直近のLPアクセスログから流入経路を取得
    if (sourceLpId) {
      const { data: accessLog } = await supabaseAdmin
        .from('lp_access_logs')
        .select('source_channel, utm_source')
        .eq('lp_id', sourceLpId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      sourceChannel = accessLog?.source_channel || accessLog?.utm_source || null;
    }
  }

  // Supabaseに友達情報を保存
  const { data: follower, error } = await supabaseAdmin
    .from('line_followers')
    .upsert({
      user_id: userId,
      follower_line_id: followerLineId,
      display_name: displayName,
      source_lp_id: sourceLpId,
      source_channel: sourceChannel,
      registered_at: new Date().toISOString(),
      is_blocked: false,
      blocked_at: null,
      step_day: 0,
    }, { onConflict: 'user_id,follower_line_id' })
    .select()
    .single();

  if (error) {
    console.error('友達保存エラー:', error);
    return;
  }

  // LP元の登録数をインクリメント（source_lp_idがある場合）
  if (follower.source_lp_id) {
    await supabaseAdmin.rpc('increment_registration', { lp_id: follower.source_lp_id }).catch(() => {});
  }

  // 即時ウェルカムメッセージ送信
  try {
    const welcomeMsg = await generateWelcomeMessage(displayName, userId);
    await lineClient.pushMessage({
      to: followerLineId,
      messages: [{ type: 'text', text: welcomeMsg }],
    });

    // 送信メッセージをログに保存
    await supabaseAdmin.from('messages').insert({
      follower_id: follower.id,
      direction: 'out',
      content: welcomeMsg,
    });
  } catch (e) {
    console.error('ウェルカムメッセージ送信エラー:', e.message);
  }

  return follower;
}

/**
 * ソースLP特定（直近に作成されたLPを紐づけ）
 * MVPでは売り手の最新LPを自動紐づけ
 */
async function resolveSourceLP(userId) {
  const { data: lp } = await supabaseAdmin
    .from('lps')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return lp?.id || null;
}

/**
 * ブロック（友達解除）イベント処理
 */
async function handleUnfollow(event, userId) {
  const followerLineId = event.source.userId;

  await supabaseAdmin
    .from('line_followers')
    .update({ is_blocked: true, blocked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('follower_line_id', followerLineId);

  console.log(`ブロック検知: ${followerLineId}`);
}

/**
 * メッセージ受信イベント処理
 * → メッセージ保存 → AI自動返信
 */
async function handleMessage(event, userId) {
  if (event.message.type !== 'text') return;

  const followerLineId = event.source.userId;
  const content = event.message.text;

  // 友達情報取得
  const { data: follower } = await supabaseAdmin
    .from('line_followers')
    .select('id')
    .eq('user_id', userId)
    .eq('follower_line_id', followerLineId)
    .single();

  if (!follower) return;

  // メッセージをログに保存（感情スコア付き）
  const emotionScore = calculateEmotionScore(content);
  await supabaseAdmin.from('messages').insert({
    follower_id: follower.id,
    direction: 'in',
    content,
    emotion_score: emotionScore,
  });

  // 最終返信日時を更新
  await supabaseAdmin
    .from('line_followers')
    .update({ last_replied_at: new Date().toISOString() })
    .eq('id', follower.id);

  // キーワード応答チェック（ルールベース → マッチしなければAI自動返信）
  try {
    const { matchKeywordRule } = require('../../routes/keywordRules');
    const matchedRule = await matchKeywordRule(userId, content);
    if (matchedRule) {
      const responseText = matchedRule.response_type === 'text'
        ? (matchedRule.response_content.text || matchedRule.response_content)
        : JSON.stringify(matchedRule.response_content);

      const { data: seller } = await supabaseAdmin
        .from('users').select('line_channel_access_token').eq('id', userId).single();
      if (seller?.line_channel_access_token) {
        const { Client: LineClient } = require('@line/bot-sdk');
        const lc = new LineClient({ channelAccessToken: seller.line_channel_access_token });
        const messages = matchedRule.response_type === 'text'
          ? [{ type: 'text', text: responseText }]
          : Array.isArray(matchedRule.response_content) ? matchedRule.response_content : [matchedRule.response_content];
        await lc.pushMessage(followerLineId, messages);
        await supabaseAdmin.from('messages').insert({ follower_id: follower.id, direction: 'out', content: responseText });
      }

      // アクションタグ付与
      if (matchedRule.action_tag_ids?.length) {
        for (const tagId of matchedRule.action_tag_ids) {
          await supabaseAdmin.from('follower_tags').insert({ follower_id: follower.id, tag_id: tagId }).catch(() => {});
        }
      }
      return; // キーワードマッチしたのでAI応答はスキップ
    }
  } catch (e) {
    console.error('キーワード応答エラー:', e.message);
  }

  // AI自動返信（非同期で実行、エラーでもWebhookは200返す）
  generateAutoReply(follower.id, content).catch(e => {
    console.error('自動返信エラー:', e.message);
  });

  // VIPプラン: リアルタイム離脱検知
  const { data: seller } = await supabaseAdmin
    .from('users').select('plan').eq('id', userId).single();
  if (seller?.plan === 'vip') {
    const { calculateChurnScore } = require('../churn/detector');
    calculateChurnScore(follower.id).then(async (result) => {
      if (result.score >= 80) {
        console.log(`[VIP リアルタイムアラート] スコア${result.score} (follower: ${follower.id})`);
        // アラートフラグを更新（Dashboard表示用）
        await supabaseAdmin
          .from('churn_scores')
          .update({ alerted: true, alert_type: 'realtime' })
          .eq('follower_id', follower.id)
          .order('calculated_at', { ascending: false })
          .limit(1);
      }
    }).catch(e => console.error('リアルタイム離脱検知エラー:', e.message));
  }
}

/**
 * キーワードベースの感情スコア計算（-100〜100）
 * Claude API呼び出しを増やさないシンプルな分析
 */
function calculateEmotionScore(text) {
  const positive = ['ありがとう', 'うれしい', '嬉しい', '楽しい', 'いいね', '最高', '素敵', '助かる', '感謝', '気になる', '興味', 'やりたい', '欲しい', 'ほしい'];
  const negative = ['いらない', '不要', '高い', '無理', 'やめ', 'うざい', 'しつこい', '迷惑', '解除', 'ブロック', '退会', 'いいです', '結構です', '大丈夫です'];

  let score = 0;
  positive.forEach(w => { if (text.includes(w)) score += 20; });
  negative.forEach(w => { if (text.includes(w)) score -= 20; });
  return Math.max(-100, Math.min(100, score));
}

module.exports = { handleWebhookEvent, calculateEmotionScore };
