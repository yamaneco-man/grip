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

## デザイン要件（必須 — これがLPの品質を決める）

### 技術基盤
- TailwindCSS CDN: <script src="https://cdn.tailwindcss.com"></script>
- Google Fonts: Noto Sans JP (weights: 400,500,700) を<link>で読み込み、body全体に適用
- Lucide Icons CDN: <script src="https://unpkg.com/lucide@latest"></script> を読み込み、アイコン表示に使う
- viewport meta タグ必須

### 画像・ビジュアル（重要 — LPの見た目を大きく左右する）

#### ヒーロー画像
- ファーストビューにUnsplash写真を背景またはサイドに配置
- URLフォーマット: https://images.unsplash.com/photo-{ID}?w=1200&q=80
- 商品カテゴリに合った写真を選ぶ。以下から適切なものを使用:
  - ビジネス/マーケ: photo-1460925895917-afdab827c52f, photo-1553877522-43269d4ea984, photo-1522071820081-009f0129c71c
  - 美容/サロン: photo-1560066984-138dadb4c035, photo-1522337360788-8b13dee7a37e
  - 教育/コーチ: photo-1524178232363-1fb2b075b655, photo-1531482615713-2afd69097998
  - 飲食: photo-1414235077428-338989a2e8c0, photo-1504674900247-0877df9cc836
  - IT/テクノロジー: photo-1519389950473-47ba0277781c, photo-1551288049-bebda4e38f71
  - 汎用: photo-1553484771-371a605b060b, photo-1497032628192-86f99b9a3293
- background-imageで使う場合: bg-cover bg-center で表示し、暗いオーバーレイ(bg-black/50)をかける
- <img>で使う場合: rounded-2xl shadow-xl object-cover

#### 機能・ベネフィットのアイコン
- Lucide Iconsを使用: <i data-lucide="icon-name"></i> + ページ末尾に <script>lucide.createIcons()</script>
- 使えるアイコン例: zap, clock, shield-check, trending-up, users, star, check-circle, heart, target, sparkles, rocket, bar-chart, mail, message-circle, settings, award
- アイコンをカラー丸背景の中に配置: <div class="w-14 h-14 bg-{color}-100 rounded-full flex items-center justify-center"><i data-lucide="zap" class="w-7 h-7 text-{color}-600"></i></div>

#### お客様の声のアバター
- UIアバター画像: https://ui-avatars.com/api/?name={名前}&background=random&size=80&font-size=0.4
- 丸形: rounded-full w-14 h-14

#### 装飾的ビジュアル
- セクション間に斜め区切り線を入れる（SVGまたはCSS clip-path）:
  <div class="h-16 bg-gray-50" style="clip-path: polygon(0 0, 100% 100%, 100% 100%, 0 100%)"></div>
- 背景にぼかし円を配置して奥行き感を出す:
  <div class="absolute -top-20 -right-20 w-72 h-72 bg-{color}-200 rounded-full blur-3xl opacity-30"></div>

### 配色ルール（重要）
- 商品イメージに合うメインカラーを1色選ぶ（blue, indigo, violet, teal, cyan等から）
- CTAボタンは必ずメインカラーと補色関係のアクセントカラー（emerald, green, amber等）
- 背景は白(white)と極薄グレー(gray-50/slate-50)を交互に
- テキストは gray-900（見出し）と gray-600（本文）
- 絶対にセクション全体を濃い色で塗りつぶさない

### レイアウト
- max-w-6xl mx-auto で中央寄せ（広がりすぎ防止）
- セクション間の余白: py-20 lg:py-28（たっぷり取る）
- カード: bg-white rounded-2xl shadow-lg p-8（角丸大きめ・影しっかり）
- グリッド: sm:grid-cols-2 lg:grid-cols-3 gap-8

### ファーストビュー（最重要）
- 高さ: min-h-[80vh] で画面いっぱいに
- 背景: 繊細なグラデーション（from-{color}-600 via-{color}-700 to-{color}-900）
- テキスト: 白文字、キャッチコピーはtext-4xl lg:text-6xl font-bold
- サブコピー: text-xl lg:text-2xl text-white/80
- CTAボタン: text-lg py-5 px-10 rounded-full shadow-2xl + transform hover:scale-105 transition

### CTAボタン（全箇所共通）
- サイズ: text-lg font-bold py-5 px-10 以上
- 形状: rounded-full（完全角丸）
- 色: bg-emerald-500 hover:bg-emerald-600 text-white
- 効果: shadow-2xl hover:shadow-emerald-500/25 transform hover:scale-105 transition-all duration-300
- ボタンの上に小さく「＼ 無料で始める ／」のような吹き出しテキスト
- 中央揃え: block mx-auto text-center

### タイポグラフィ
- 見出し（h2）: text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-4
- 見出し下に短い装飾ライン: <div class="w-16 h-1 bg-{accent} mx-auto mb-8"></div>
- 本文: text-lg text-gray-600 leading-relaxed
- 強調: font-bold text-gray-900 または text-{main-color}-600

### お客様の声
- カード形式: bg-white rounded-2xl shadow-lg p-8
- 上部に大きな引用符（text-6xl text-{color}-200 font-serif）
- 感想本文 + 氏名・属性（text-sm text-gray-400）
- ★★★★★ の星評価を表示

### FAQ
- CSSのみでアコーディオン（details/summaryタグ使用）
- summary: cursor-pointer py-4 font-bold text-lg border-b
- 開閉アイコン: summary::marker を非表示にし、CSSで＋/−を表現

### 絶対にやってはいけないこと
- セクション全体を濃い背景色で塗りつぶすこと（ファーストビューのみ例外）
- 絵文字を見出しの先頭に並べること（安っぽくなる）
- 太字だらけにすること（メリハリがなくなる）
- CTAボタンを小さくすること
- 余白を狭くすること

## コピーライティングルール
- 「〜できます」より「〜になれます」（変化を描く）
- 専門用語は避け、中学生でもわかる言葉で
- 1文は短く（40文字以内推奨）
- 数字を積極的に使う
- 景表法・薬機法に違反する表現は絶対に使わない
- 煽り表現（「機会を逃します」等）は使わない。ポジティブに誘導する

## 出力形式
- <!DOCTYPE html>から</html>までの完全なHTML
- コードブロック(\`\`\`)で囲まない。HTMLだけを出力
- CSSはTailwindのユーティリティクラスで完結させる（<style>タグは最小限、details/summaryのスタイルのみ）
- JavaScriptは一切不要（FAQはdetails/summaryで実装）`;

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
