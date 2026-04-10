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
    max_tokens: 8192,
    system: LP_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const html = response.content[0].text;

  // HTMLが途中で切れていないかチェック
  if (response.stop_reason === 'max_tokens') {
    throw new Error('LP生成がトークン上限で途中終了しました。入力内容を短くして再試行してください。');
  }

  // 完全なHTMLか検証
  if (!html.includes('</html>')) {
    throw new Error('生成されたHTMLが不完全です。再度お試しください。');
  }

  return html;
}

/**
 * LP生成 → DB保存
 */
async function createLP(userId, params) {
  const htmlContent = await generateLP(params);

  const insertPayload = {
    user_id: userId,
    product_name: params.productName,
    price: params.price ? parseInt(params.price) : null,
    target: params.target,
    strengths: params.strengths || null,
    reviews: params.reviews || null,
    line_url: params.lineUrl || null,
    html_content: htmlContent,
  };

  const { data, error } = await supabaseAdmin
    .from('lps')
    .insert(insertPayload)
    .select()
    .maybeSingle();

  if (error) {
    console.error('LP DB保存エラー:', error.message, error.details, error.hint);
    throw new Error('LP保存に失敗しました: ' + error.message);
  }
  if (!data) {
    throw new Error('LP保存後のデータ取得に失敗しました');
  }

  // html_urlを設定（LP公開リンク用）
  const htmlUrl = `/api/lp/view/${data.id}`;
  const { error: updateError } = await supabaseAdmin
    .from('lps')
    .update({ html_url: htmlUrl })
    .eq('id', data.id);

  if (updateError) console.error('html_url更新エラー:', updateError.message);

  return { ...data, html_url: htmlUrl };
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

  // html_urlが未設定の既存LPを補完
  return data.map(lp => ({
    ...lp,
    html_url: lp.html_url || `/api/lp/view/${lp.id}`,
  }));
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
 * HTMLサニタイズ — scriptタグ・イベントハンドラを除去
 */
function sanitizeHTML(html) {
  if (!html) return html;
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^>]*>/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bon\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '');
}

/**
 * LP HTML配信（公開ページ用）— XSSサニタイズ付き
 */
async function serveLPHtml(lpId) {
  const { data, error } = await supabaseAdmin
    .from('lps')
    .select('html_content, pv_count')
    .eq('id', lpId)
    .single();

  if (error) throw error;

  // PV数をインクリメント
  const { error: rpcErr } = await supabaseAdmin.rpc('increment_pv', { lp_id: lpId });
  if (rpcErr) {
    console.warn('increment_pv RPC失敗、fallbackで更新:', rpcErr.message);
    await supabaseAdmin
      .from('lps')
      .update({ pv_count: (data.pv_count || 0) + 1 })
      .eq('id', lpId);
  }

  return sanitizeHTML(data.html_content);
}

/**
 * LPメタ情報更新（HTML再生成なし）
 */
async function updateLP(lpId, userId, params) {
  // 自分のLPのみ更新可能
  const { data: existing, error: findError } = await supabaseAdmin
    .from('lps')
    .select('id, user_id')
    .eq('id', lpId)
    .single();

  if (findError) throw new Error('LPが見つかりません');
  if (existing.user_id !== userId) throw new Error('このLPを編集する権限がありません');

  const updateData = {};
  if (params.productName !== undefined) updateData.product_name = params.productName;
  if (params.price !== undefined) updateData.price = params.price ? parseInt(params.price) : null;
  if (params.target !== undefined) updateData.target = params.target;
  if (params.strengths !== undefined) updateData.strengths = params.strengths;
  if (params.reviews !== undefined) updateData.reviews = params.reviews;
  if (params.lineUrl !== undefined) updateData.line_url = params.lineUrl;

  const { data, error } = await supabaseAdmin
    .from('lps')
    .update(updateData)
    .eq('id', lpId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * LP削除（自分のLPのみ）
 */
async function deleteLP(lpId, userId) {
  const { data: existing, error: findError } = await supabaseAdmin
    .from('lps')
    .select('id, user_id')
    .eq('id', lpId)
    .single();

  if (findError) throw new Error('LPが見つかりません');
  if (existing.user_id !== userId) throw new Error('このLPを削除する権限がありません');

  const { error } = await supabaseAdmin
    .from('lps')
    .delete()
    .eq('id', lpId);

  if (error) throw error;
  return { success: true };
}

module.exports = { generateLP, createLP, getLPs, getLP, serveLPHtml, updateLP, deleteLP };
