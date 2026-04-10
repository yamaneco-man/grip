const { anthropic } = require('../../config/anthropic');
const { supabaseAdmin } = require('../../config/supabase');

// LP生成プロンプト
const LP_SYSTEM_PROMPT = `あなたは日本のトップLP制作会社のアートディレクター兼コピーライターです。
プロの制作会社が50万円以上で納品するクオリティのLPを、完全なHTMLで生成してください。

## 参考デザイン基準
https://x-buzz.co.jp/writing/ のような、写真を大胆に使い、数字で説得し、信頼感のある日本のBtoB/BtoC向けLPを目指してください。

## LP構成（この順番で配置）

### 1. ファーストビュー（画面全体を使う没入型）
- 全幅のUnsplash写真を背景に使用（暗いオーバーレイで文字を読みやすく）
- キャッチコピー: text-5xl lg:text-7xl font-bold text-white。ターゲットの欲求を数字入りで突く
- サブコピー: text-xl lg:text-2xl text-white/90。具体的なベネフィットを1行で
- CTA第1: 大きなオレンジ系ボタン
- 高さ: min-h-screen で画面いっぱい、flex items-center justify-center

### 2. 実績数字セクション（ファーストビュー直後）
- 横並び3〜4つの大きな数字パネル
- 例: 「導入実績 150社」「満足度 98%」「作業時間 -80%」「継続率 95%」
- 数字は text-5xl lg:text-7xl font-bold、単位は text-xl
- 背景: 白またはメインカラーの極薄色
- 数字がない場合は、サービスの強みを数値化して推測で作成（「3分で完成」「月額9,800円〜」等）

### 3. 悩み共感セクション（問題提起）
- 「こんなお悩み、ありませんか？」
- 左側にUnsplash写真（悩んでいる人のイメージ）、右側にテキスト（lg:grid-cols-2）
- 悩みを5〜6つ箇条書き。各項目の先頭にLucideアイコン（x-circle, alert-triangle等）
- 悩みの最後に「一つでも当てはまるなら、解決策があります」

### 4. 解決策の提示 + CTA第2
- 商品・サービス名を大きく表示
- 「○○が、すべて解決します」
- サービス概要を2〜3行で説明
- CTA第2: 「まずは無料で試してみる」

### 5. 機能・ベネフィット（3〜6つ）
- 各機能は大きなカード形式（lg:grid-cols-2 or lg:grid-cols-3）
- カード構成: Lucideアイコン（カラー丸背景内）+ 見出し + 2〜3行の説明
- 機能名ではなく「得られる変化」を見出しにする
- カード: bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition

### 6. 比較表（他社との差別化）
- 「従来のやり方」vs「○○を使った場合」の2列比較
- または「他社ツール」vs「当サービス」の機能比較表
- 自社が優れている項目にチェックマーク、他社にバツ印
- テーブル: rounded-2xl overflow-hidden shadow-lg

### 7. 導入フロー（3〜5ステップ）
- 「ご利用の流れ」セクション
- 各ステップ: 丸い番号（1,2,3...）+ ステップ名 + 1行の説明
- ステップ間を点線で接続（border-dashed）
- 「最短○分で始められます」

### 8. お客様の声（3件）+ CTA第3
- カード形式: bg-white rounded-2xl shadow-xl p-8
- 各カード: アバター画像（ui-avatars.com）+ 名前 + 属性 + ★★★★★
- Before→After形式の感想（「導入前は○○だったが、今では○○に」）
- 感想の下に「※個人の感想です。成果を保証するものではありません」
- セクション末にCTA第3

### 9. よくある質問（FAQ 5〜7件）
- details/summaryタグでアコーディオン
- 質問: font-bold text-lg、回答: text-gray-600
- 購入前の不安（料金・解約・サポート・効果）を解消する内容

### 10. 最終クロージング + CTA第4
- 背景: メインカラーの濃いグラデーション + 白文字
- 「今なら○○」「○名様限定」等の限定感（嘘はNG）
- サービスの価値を1文で再提示
- 最大サイズのCTAボタン

## デザイン要件

### 技術基盤
- <script src="https://cdn.tailwindcss.com"></script>
- Google Fonts: Noto Sans JP (400,500,700,900) を<link>で読み込み
- <script src="https://unpkg.com/lucide@latest"></script> + ページ末尾に <script>lucide.createIcons()</script>
- viewport meta必須

### 画像
- Unsplash写真を最低3枚使用（ファーストビュー + 悩み共感 + 機能セクション等）
- URLフォーマット: https://images.unsplash.com/photo-{ID}?w=1200&q=80
- 写真ID一覧:
  - ビジネス: photo-1460925895917-afdab827c52f, photo-1553877522-43269d4ea984, photo-1522071820081-009f0129c71c, photo-1542744173-8e7e91415657
  - マーケ/SNS: photo-1611162617213-7d7a39e9b1d7, photo-1432888622747-4eb9a8efeb07
  - 美容/サロン: photo-1560066984-138dadb4c035, photo-1522337360788-8b13dee7a37e, photo-1570172619644-dfd03ed5d881
  - 教育: photo-1524178232363-1fb2b075b655, photo-1531482615713-2afd69097998
  - 飲食: photo-1414235077428-338989a2e8c0, photo-1504674900247-0877df9cc836
  - IT: photo-1519389950473-47ba0277781c, photo-1551288049-bebda4e38f71
  - 人物/チーム: photo-1522071820081-009f0129c71c, photo-1556761175-5973dc0f32e7
  - 悩み: photo-1534528741775-53994a69daeb, photo-1507003211169-0a1dd7228f2d
- 背景画像: style="background-image:url(...)" + bg-cover bg-center + 暗いオーバーレイ(bg-black/60)
- インライン画像: w-full h-64 lg:h-96 object-cover rounded-2xl shadow-xl

### 配色
- メインカラー: 商品に合う色を1つ選ぶ（indigo, blue, violet, teal, slate等）
- CTAボタン: オレンジ系（bg-orange-500 hover:bg-orange-600）— メインカラーと対比で目立たせる
- 背景: 白(white)と極薄グレー(gray-50)を交互に。1〜2セクションだけメインカラーの極薄(indigo-50等)
- テキスト: gray-900（見出し）、gray-600（本文）、white（暗い背景上）

### CTAボタン（全箇所共通 — LPで最も重要な要素）
- サイズ: text-lg lg:text-xl font-bold py-5 px-12
- 形状: rounded-full
- 色: bg-orange-500 hover:bg-orange-600 text-white
- 効果: shadow-2xl hover:shadow-orange-500/30 transform hover:scale-105 transition-all duration-300
- ボタン上に小さなテキスト: <p class="text-sm text-gray-500 mb-2 text-center">＼ 30秒で完了 ／</p>
- 配置: 各CTAセクションで中央揃え
- 合計4箇所以上に配置

### レイアウト
- 全幅セクション: w-full で端から端まで
- コンテンツ幅: max-w-6xl mx-auto px-4 lg:px-8
- セクション余白: py-20 lg:py-28
- カード: bg-white rounded-2xl shadow-xl p-8 lg:p-10
- グリッド: gap-8 lg:gap-10

### タイポグラフィ
- セクション見出し: text-3xl lg:text-5xl font-bold text-gray-900 text-center mb-6
- 見出し下の装飾: <div class="w-20 h-1.5 bg-orange-500 mx-auto mb-12"></div>
- 本文: text-lg lg:text-xl text-gray-600 leading-relaxed
- 大きな数字: text-5xl lg:text-7xl font-black

### 絶対にやってはいけないこと
- 絵文字を見出しに使うこと（安っぽくなる。Lucideアイコンを使う）
- 余白が狭いこと（各セクションpy-20以上）
- CTAボタンが小さいこと（py-5 px-12以上）
- 写真を使わないこと（最低3枚）
- 全セクション同じ背景色にすること（交互に変える）
- テキストだらけにすること（ビジュアルとテキストのバランス）

## コピーライティングルール
- 数字で語る（「多くの」→「150社以上の」）
- 変化を描く（「できます」→「になれます」）
- 1文40文字以内
- 専門用語禁止（中学生でもわかる言葉）
- Before→Afterを意識
- 景表法・薬機法違反表現は絶対NG
- 煽り表現は避け、ポジティブに誘導

## 出力形式
- <!DOCTYPE html>から</html>までの完全なHTML。コードブロック不要
- TailwindCSSのユーティリティクラスで完結（<style>はdetails/summaryのスタイルのみ）
- <script>はlucide.createIcons()のみ`;

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
