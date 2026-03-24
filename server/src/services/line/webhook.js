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

  // LP追跡: フォローイベントのパラメータからソースLPを特定
  // LINE友達追加URL: https://lin.ee/xxx?lp={lp_id} or リッチメニューのpostback
  let sourceLpId = null;
  if (event.follow?.isUnblocked === false) {
    // 初回フォロー時のみLP追跡（再フォローは除く）
    sourceLpId = await resolveSourceLP(userId);
  }

  // Supabaseに友達情報を保存
  const { data: follower, error } = await supabaseAdmin
    .from('line_followers')
    .upsert({
      user_id: userId,
      follower_line_id: followerLineId,
      display_name: displayName,
      source_lp_id: sourceLpId,
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

  // メッセージをログに保存
  await supabaseAdmin.from('messages').insert({
    follower_id: follower.id,
    direction: 'in',
    content,
  });

  // 最終返信日時を更新
  await supabaseAdmin
    .from('line_followers')
    .update({ last_replied_at: new Date().toISOString() })
    .eq('id', follower.id);

  // AI自動返信（非同期で実行、エラーでもWebhookは200返す）
  generateAutoReply(follower.id, content).catch(e => {
    console.error('自動返信エラー:', e.message);
  });
}

module.exports = { handleWebhookEvent };
