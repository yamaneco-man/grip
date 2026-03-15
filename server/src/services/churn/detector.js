const { anthropic } = require('../../config/anthropic');
const { supabaseAdmin } = require('../../config/supabase');

/**
 * 離脱スコア計算（設計書 第5章 5-1準拠）
 * 6つの行動シグナルから冷め度スコアを算出
 */
async function calculateChurnScore(followerId) {
  const { data: follower } = await supabaseAdmin
    .from('line_followers')
    .select('*')
    .eq('id', followerId)
    .single();

  if (!follower) throw new Error('友達が見つかりません');

  // 過去7日間のメッセージ取得
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentMessages } = await supabaseAdmin
    .from('messages')
    .select('direction, content, created_at')
    .eq('follower_id', followerId)
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: true });

  const msgs = recentMessages || [];
  const inMsgs = msgs.filter(m => m.direction === 'in');
  const outMsgs = msgs.filter(m => m.direction === 'out');

  // スコア計算（各要素の重み付け）
  const scoreDetail = {};

  // 返信頻度の変化（重み25%）: 送信に対する返信率
  const replyRate = outMsgs.length > 0 ? inMsgs.length / outMsgs.length : 0;
  scoreDetail.replyRate = Math.min(100, Math.round((1 - replyRate) * 100)) * 0.25;

  // 最後の返信からの経過日数（重み20%）
  const lastReply = follower.last_replied_at
    ? (Date.now() - new Date(follower.last_replied_at).getTime()) / (24 * 60 * 60 * 1000)
    : 30;
  scoreDetail.daysSinceReply = Math.min(100, Math.round(lastReply / 7 * 100)) * 0.20;

  // メッセージ開封率の代替: 返信内容の長さ変化（重み30%）
  const avgLength = inMsgs.length > 0
    ? inMsgs.reduce((sum, m) => sum + m.content.length, 0) / inMsgs.length
    : 0;
  scoreDetail.engagement = Math.min(100, avgLength < 5 ? 80 : avgLength < 20 ? 40 : 10) * 0.30;

  // リアクション有無（重み10%）
  const hasReaction = inMsgs.some(m => /[👍❤️😊🙏✨]/.test(m.content));
  scoreDetail.reactions = (hasReaction ? 10 : 60) * 0.10;

  // 返信スピード（重み15%）: 直近の返信がどれだけ早かったか
  scoreDetail.replySpeed = (inMsgs.length === 0 ? 80 : 20) * 0.15;

  // 合計スコア（0〜100）
  const totalScore = Math.round(
    scoreDetail.replyRate + scoreDetail.daysSinceReply + scoreDetail.engagement +
    scoreDetail.reactions + scoreDetail.replySpeed
  );

  const score = Math.min(100, Math.max(0, totalScore));

  // DB保存
  await supabaseAdmin.from('churn_scores').insert({
    follower_id: followerId,
    score,
    score_detail_json: scoreDetail,
    alerted: score >= 80,
    calculated_at: new Date().toISOString(),
  });

  return { score, detail: scoreDetail };
}

/**
 * 全友達の離脱スコアをバッチ計算（毎日深夜実行用）
 */
async function batchCalculateChurnScores(userId) {
  const { data: followers } = await supabaseAdmin
    .from('line_followers')
    .select('id')
    .eq('user_id', userId)
    .eq('is_blocked', false);

  const results = [];
  for (const follower of (followers || [])) {
    try {
      const result = await calculateChurnScore(follower.id);
      results.push({ followerId: follower.id, ...result });
    } catch (e) {
      console.error(`スコア計算エラー (${follower.id}):`, e.message);
    }
  }

  return results;
}

/**
 * 復活メッセージ生成（設計書 第5章 5-3準拠）
 */
async function generateRecoveryMessage(followerId) {
  const { data: follower } = await supabaseAdmin
    .from('line_followers')
    .select('display_name, user_id')
    .eq('id', followerId)
    .single();

  // 会話履歴取得
  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('direction, content')
    .eq('follower_id', followerId)
    .order('created_at', { ascending: false })
    .limit(10);

  const chatHistory = (messages || [])
    .map(m => `${m.direction === 'in' ? '友達' : 'bot'}: ${m.content}`)
    .join('\n');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: `あなたはLINEマーケティングの専門家です。反応が薄くなっている友達に送る復活メッセージを3パターン作成してください。
自然な口語体。各100文字以内。押し売り感なし。
JSON配列で返答: [{"type": "casual", "message": "..."}, {"type": "value", "message": "..."}, {"type": "offer", "message": "..."}]`,
    messages: [{
      role: 'user',
      content: `友達の名前: ${follower.display_name}
過去の会話:
${chatHistory || '(なし)'}`,
    }],
  });

  try {
    return JSON.parse(response.content[0].text);
  } catch {
    return [{ type: 'casual', message: `${follower.display_name}さん、お久しぶりです！最近いかがですか？` }];
  }
}

module.exports = { calculateChurnScore, batchCalculateChurnScores, generateRecoveryMessage };
