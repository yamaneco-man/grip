const { anthropic } = require('../../config/anthropic');
const { supabaseAdmin } = require('../../config/supabase');

// LP生成プロンプト（設計書 第2章 2-2準拠）
const LP_SYSTEM_PROMPT = `あなたはLP制作の専門家です。以下の商品情報を元にコンバージョン率の高いLPを日本語HTMLで生成してください。

必須要素：
- ヘッドライン（最大の悩みを突く1行）
- サブヘッドライン（解決策の提示）
- 3つのベネフィット（商品で得られる変化）
- お客様の声3件
- FAQ5件
- CTA（LINE友達追加ボタン）を2箇所以上

デザイン要件：
- モバイルファースト・レスポンシブ対応
- TailwindCSS CDN使用
- 背景グラデーション・カード型レイアウト
- CTAボタンは目立つ緑色で大きく

禁止事項：景表法・薬機法違反表現

出力形式：完全なHTML（<!DOCTYPE html>から</html>まで）のみ返答。コードブロック不要。`;

/**
 * Claude APIでLP HTMLを生成
 */
async function generateLP({ productName, price, target, strengths, reviews, lineUrl }) {
  const userPrompt = `商品名：${productName}
価格：${price}
ターゲット：${target}
強み・実績：${strengths}
口コミ（任意）：${reviews || 'なし'}
LINE友達追加URL：${lineUrl}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: LP_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  return response.content[0].text;
}

/**
 * LP生成 → DB保存
 */
async function createLP(userId, params) {
  const htmlContent = await generateLP(params);

  const { data, error } = await supabaseAdmin
    .from('lps')
    .insert({
      user_id: userId,
      product_name: params.productName,
      price: params.price ? parseInt(params.price) : null,
      target: params.target,
      strengths: params.strengths,
      reviews: params.reviews,
      line_url: params.lineUrl,
      html_content: htmlContent,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * LP一覧取得
 */
async function getLPs(userId) {
  const { data, error } = await supabaseAdmin
    .from('lps')
    .select('id, product_name, price, target, html_url, pv_count, registration_count, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * LP詳細取得
 */
async function getLP(lpId) {
  const { data, error } = await supabaseAdmin
    .from('lps')
    .select('*')
    .eq('id', lpId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * LP HTML配信（公開ページ用）
 */
async function serveLPHtml(lpId) {
  const { data, error } = await supabaseAdmin
    .from('lps')
    .select('html_content')
    .eq('id', lpId)
    .single();

  if (error) throw error;

  // PV数をインクリメント
  await supabaseAdmin.rpc('increment_pv', { lp_id: lpId }).catch(() => {
    // RPCが未定義の場合はフォールバック
    supabaseAdmin
      .from('lps')
      .update({ pv_count: data.pv_count + 1 })
      .eq('id', lpId);
  });

  return data.html_content;
}

module.exports = { generateLP, createLP, getLPs, getLP, serveLPHtml };
