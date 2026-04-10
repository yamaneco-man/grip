const { anthropic } = require('../../config/anthropic');
const { supabaseAdmin } = require('../../config/supabase');

// LP生成プロンプト
const LP_SYSTEM_PROMPT = `あなたは日本トップクラスのLP制作ディレクター兼コピーライターです。
CVR（コンバージョン率）3%以上を叩き出すLPを、完全なHTMLとして生成してください。

## LP構成（上から順番に配置）

### 1. ファーストビュー（最重要 — 3秒で離脱を防ぐ）
- キャッチコピー: ターゲットの最大の悩み・欲求を1行で突く。数字を入れる
- サブコピー: 解決策を1〜2行で提示
- CTA第1: LINE友達追加ボタン（大きく目立つ）
- 背景: グラデーション or 印象的なカラー

### 2. 共感セクション
- 「こんなお悩みありませんか？」形式
- ターゲットの悩み・課題を5つ箇条書き（チェックマーク付き）
- 悩みに寄り添うトーンで書く

### 3. 解決策の提示
- 「そのお悩み、○○で解決できます」
- 商品・サービスの概要を簡潔に紹介

### 4. ベネフィット（3〜5つ）
- 各ベネフィットはアイコン + 見出し + 2行の説明
- 機能ではなく「得られる変化・未来」を書く
- カード型レイアウトで視覚的に整理

### 5. 実績・数字
- 導入数・満足度・改善率などの数字を大きく表示
- 数字がない場合は強み・特徴を3つカード形式で

### 6. お客様の声（3件）
- 名前（イニシャル可）・属性・感想
- 「Before → After」が伝わる内容
- カード形式、引用符付き

### 7. CTA第2
- 「今すぐ無料で始める」等のアクションワード
- LINE友達追加ボタン

### 8. よくある質問（FAQ 5件）
- アコーディオン風のデザイン（開閉はCSS only）
- 購入前の不安を解消する内容

### 9. 最後の一押し + CTA第3
- 限定感・緊急性のある文言（ただし嘘はNG）
- 最終CTA: LINE友達追加ボタン

## デザイン要件（必須）
- TailwindCSS CDN（<script src="https://cdn.tailwindcss.com"></script>）を使用
- モバイルファースト: スマホで美しく、PCでも崩れない
- フォント: Google Fonts の Noto Sans JP を読み込んで適用
- 配色: プロフェッショナルで信頼感のある配色。メインカラー1色 + アクセント1色
- CTAボタン: 大きく（py-4 px-8以上）、角丸、影付き、ホバーアニメーション。色は緑系（bg-emerald-500等）
- セクション間: 十分な余白（py-16以上）
- アイコン: 絵文字を効果的に使用（✅❌💡🎯📈等）
- 背景: セクションごとに白/淡色を交互に使い、視覚的リズムを作る
- テキスト: 読みやすいサイズ（本文16px以上）、適切な行間

## コピーライティングルール
- 「〜できます」より「〜になれます」（変化を描く）
- 専門用語は避け、中学生でもわかる言葉で
- 1文は短く（40文字以内推奨）
- 数字を積極的に使う
- 景表法・薬機法に違反する表現は絶対に使わない

## 出力形式
- <!DOCTYPE html>から</html>までの完全なHTML
- コードブロック(\`\`\`)で囲まない。HTMLだけを出力
- CSSはTailwindのユーティリティクラスで完結させる（<style>タグ最小限）
- JavaScriptはFAQのアコーディオン等、最小限のみ`;

/**
 * Claude APIでLP HTMLを生成
 */
async function generateLP({ productName, price, target, strengths, reviews, lineUrl }) {
  const userPrompt = `以下の情報を元に、高品質なLPを生成してください。

【商品・サービス名】
${productName}

【価格】
${price || '未定'}

【ターゲット（誰に届けたいか）】
${target}

【強み・実績・特徴】
${strengths || '特になし（一般的な強みを推測して書いてください）'}

【お客様の声・口コミ】
${reviews || 'なし（リアルな口コミを3件創作してください。ただし「個人の感想です」と注記を入れること）'}

【LINE友達追加URL】
${lineUrl || '#'}

上記の情報から、ターゲットに最も刺さるLPを生成してください。情報が少ない項目は、商品特性から推測して補完してください。`;

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
