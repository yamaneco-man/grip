const { anthropic } = require('../../config/anthropic');
const { supabaseAdmin } = require('../../config/supabase');
const { lineClient } = require('../../config/line');

/**
 * 受信メッセージに対するAI自動返信
 * 会話履歴・商品情報・ステップ進行度を考慮して返信を生成・送信
 */
async function generateAutoReply(followerId, incomingMessage) {
  // 友達情報取得
  const { data: follower } = await supabaseAdmin
    .from('line_followers')
    .select('display_name, user_id, follower_line_id, step_day')
    .eq('id', followerId)
    .single();

  if (!follower) return null;

  // 売り手のプラン確認（freeプランは自動返信なし）
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('plan')
    .eq('id', follower.user_id)
    .single();

  if (!user || user.plan === 'free') return null;

  // 会話履歴取得（直近15件）
  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('direction, content, created_at')
    .eq('follower_id', followerId)
    .order('created_at', { ascending: false })
    .limit(15);

  const chatHistory = (messages || [])
    .reverse()
    .map(m => `${m.direction === 'in' ? '友達' : 'あなた'}: ${m.content}`)
    .join('\n');

  // 商品情報取得
  const { data: lp } = await supabaseAdmin
    .from('lps')
    .select('product_name, price, target, strengths')
    .eq('user_id', follower.user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    system: `あなたはLINE公式アカウントの担当者です。
友達からのメッセージに自然に返信してください。

ルール：
- 200文字以内の自然な口語体
- 押し売り感を出さない
- 質問には丁寧に答える
- 悩みを深掘りして共感する
- ステップDay${follower.step_day}に合った対応をする（Day0-2: 信頼構築、Day3-5: 価値提供、Day6-7: クロージング）
- 絵文字は1-2個まで
- テキストのみ返答（JSON不要）`,
    messages: [{
      role: 'user',
      content: `友達「${follower.display_name}」からのメッセージに返信してください。

商品名: ${lp?.product_name || '未設定'}
価格: ${lp?.price || '未設定'}
強み: ${lp?.strengths || '未設定'}
ステップ進行: Day${follower.step_day}

会話履歴:
${chatHistory}

最新メッセージ: ${incomingMessage}`,
    }],
  });

  const replyText = response.content[0].text;

  // LINE送信
  await lineClient.pushMessage({
    to: follower.follower_line_id,
    messages: [{ type: 'text', text: replyText }],
  });

  // 送信メッセージをログに保存
  await supabaseAdmin.from('messages').insert({
    follower_id: followerId,
    direction: 'out',
    content: replyText,
  });

  return replyText;
}

module.exports = { generateAutoReply };
