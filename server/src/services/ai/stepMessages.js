const { anthropic } = require('../../config/anthropic');
const { supabaseAdmin } = require('../../config/supabase');

/**
 * ウェルカムメッセージ生成（登録直後30秒以内）
 * 設計書 第3章 3-2準拠
 */
async function generateWelcomeMessage(displayName, userId) {
  // ユーザーの商品情報を取得（直近のLP）
  const { data: lp } = await supabaseAdmin
    .from('lps')
    .select('product_name')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const productName = lp?.product_name || 'サービス';

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: 'あなたはフレンドリーなLINE公式アカウントの担当者です。自然な口語体で、短く親しみやすいメッセージを書いてください。',
    messages: [{
      role: 'user',
      content: `以下の条件でLINE友達追加直後のウェルカムメッセージを1通だけ作成してください。
名前: ${displayName}
商品名: ${productName}

条件：
- 200文字以内
- 登録のお礼
- 「今一番悩んでいることは何ですか？」と質問で締める
- 絵文字は1-2個まで`,
    }],
  });

  return response.content[0].text;
}

/**
 * ステップ配信メッセージ生成（Day1〜Day7）
 * 設計書 第3章 3-2のステップ設計に準拠
 */
async function generateStepMessage(followerId, day, customConfig = null) {
  const { data: follower } = await supabaseAdmin
    .from('line_followers')
    .select('display_name, user_id')
    .eq('id', followerId)
    .single();

  if (!follower) throw new Error('友達が見つかりません');

  // 過去のメッセージ履歴を取得
  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('direction, content')
    .eq('follower_id', followerId)
    .order('created_at', { ascending: true })
    .limit(20);

  const chatHistory = (messages || [])
    .map(m => `${m.direction === 'in' ? '友達' : 'bot'}: ${m.content}`)
    .join('\n');

  // 商品情報取得
  const { data: lp } = await supabaseAdmin
    .from('lps')
    .select('product_name, price, target, strengths')
    .eq('user_id', follower.user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const dayPrompts = {
    1: '前回の返信内容を踏まえ、悩みに対する価値提供コンテンツを送信。信頼構築が目的。',
    2: 'お客様の声・実績データをストーリー形式で配信。社会的証明の構築。',
    3: 'お客様の声・実績の続き。別の成功事例を紹介。',
    4: '商品の核心的なベネフィットを体験談ベースで伝える。欲求の最大化。',
    5: '商品の具体的な活用イメージを伝える。自分でもできそうと思わせる。',
    6: '期間限定オファーを提示。希少性・緊急性による購買促進。',
    7: 'オファー終了のリマインド。損失回避による最終クロージング。',
  };

  // カスタム設定がある場合はそのpurpose/tone/custom_promptを使用
  const purpose = customConfig?.purpose || dayPrompts[day] || '価値提供とフォローアップ';
  const tone = customConfig?.tone || 'friendly';
  const toneLabels = {
    friendly: 'フレンドリーで親しみやすい',
    professional: 'プロフェッショナルで信頼感のある',
    casual: 'カジュアルで気さくな',
    urgent: '緊急性を感じさせる',
  };
  const toneInstruction = toneLabels[tone] || toneLabels.friendly;
  const customPromptSection = customConfig?.custom_prompt
    ? `\n追加指示: ${customConfig.custom_prompt}`
    : '';

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: `あなたはLINEマーケティングの専門家です。${toneInstruction}口調のLINEメッセージを作成してください。300文字以内。`,
    messages: [{
      role: 'user',
      content: `Day${day}のステップ配信メッセージを作成してください。

目的: ${purpose}
友達の名前: ${follower.display_name}
商品名: ${lp?.product_name || 'サービス'}
価格: ${lp?.price || '未設定'}
ターゲット: ${lp?.target || '未設定'}
強み: ${lp?.strengths || '未設定'}

これまでの会話:
${chatHistory || '(なし)'}${customPromptSection}`,
    }],
  });

  return response.content[0].text;
}

module.exports = { generateWelcomeMessage, generateStepMessage };
