const { anthropic } = require('../../config/anthropic');
const { supabaseAdmin } = require('../../config/supabase');

/**
 * 成約確率スコアを計算（設計書 第4章準拠）
 * 返信内容の感情分析 × 反応速度 × ステップ到達度
 */
async function calculateClosingScore(followerId) {
  const { data: follower } = await supabaseAdmin
    .from('line_followers')
    .select('*, messages(*)')
    .eq('id', followerId)
    .single();

  if (!follower) throw new Error('友達が見つかりません');

  const messages = follower.messages || [];
  const inMessages = messages.filter(m => m.direction === 'in');

  // メッセージがない場合はデフォルトスコア
  if (inMessages.length === 0) {
    return { probability: 20, recommendedAction: 'まだ返信がありません。別角度のアプローチを検討してください。' };
  }

  // 直近のメッセージで感情分析
  const recentMessages = inMessages.slice(-5).map(m => m.content).join('\n');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: `あなたはマーケティング分析の専門家です。LINEの会話から成約確率を分析してください。
以下のJSON形式で回答：
{"probability": 0-100の数字, "recommendedAction": "推奨アクション1行", "sentiment": "positive/neutral/negative"}`,
    messages: [{
      role: 'user',
      content: `以下の友達の返信内容から成約確率を判定してください。

友達の返信履歴:
${recentMessages}

ステップ到達日: Day${follower.step_day}
最終返信: ${follower.last_replied_at || '未返信'}`,
    }],
  });

  try {
    const result = JSON.parse(response.content[0].text);

    // DB保存
    await supabaseAdmin.from('closing_scores').upsert({
      follower_id: followerId,
      probability: result.probability,
      recommended_action: result.recommendedAction,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'follower_id' });

    return result;
  } catch {
    return { probability: 50, recommendedAction: '分析中にエラーが発生しました' };
  }
}

/**
 * 反論処理AI（設計書 第4章 4-2準拠）
 * 3パターンの切り返しを生成
 */
async function generateObjectionHandling(followerId, userMessage) {
  const { data: follower } = await supabaseAdmin
    .from('line_followers')
    .select('display_name, user_id')
    .eq('id', followerId)
    .single();

  // 商品情報取得
  const { data: lp } = await supabaseAdmin
    .from('lps')
    .select('product_name, price, strengths')
    .eq('user_id', follower.user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // 会話履歴取得
  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('direction, content')
    .eq('follower_id', followerId)
    .order('created_at', { ascending: true })
    .limit(10);

  const chatHistory = (messages || [])
    .map(m => `${m.direction === 'in' ? '友達' : 'bot'}: ${m.content}`)
    .join('\n');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    system: `あなたはセールスの専門家です。返信に対する最適な切り返しを3パターン生成してください。
パターンA：共感から入る柔らかいアプローチ
パターンB：事実・実績で論理的に返す
パターンC：限定性・希少性を使った感情的アプローチ
各100文字以内。LINEで送りやすい自然な口語体。
JSON配列で返答: [{"pattern": "A", "message": "..."}, ...]`,
    messages: [{
      role: 'user',
      content: `ユーザーの最新返信：${userMessage}
商品名：${lp?.product_name || '不明'}
価格：${lp?.price || '不明'}
強み：${lp?.strengths || '不明'}
会話履歴：
${chatHistory}`,
    }],
  });

  try {
    const replies = JSON.parse(response.content[0].text);

    // DB保存
    await supabaseAdmin.from('closing_scores').upsert({
      follower_id: followerId,
      generated_replies_json: replies,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'follower_id' });

    return replies;
  } catch {
    return [{ pattern: 'A', message: '分析中にエラーが発生しました' }];
  }
}

module.exports = { calculateClosingScore, generateObjectionHandling };
