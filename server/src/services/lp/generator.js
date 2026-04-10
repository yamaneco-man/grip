const { anthropic } = require('../../config/anthropic');
const { supabaseAdmin } = require('../../config/supabase');

/**
 * AIにコンテンツJSONだけ生成させるプロンプト
 */
const CONTENT_SYSTEM_PROMPT = `あなたは日本トップクラスのLPコピーライターです。
商品情報からLP用のコンテンツを生成し、指定されたJSON形式で出力してください。

## ルール
- 数字で語る（「多くの」→「150社以上の」）
- 変化を描く（「できます」→「になれます」）
- 1文は短く（40文字以内）
- 専門用語は使わない
- Before→Afterを意識する
- 景表法・薬機法違反表現は絶対NG
- 口コミが提供されていない場合はリアルな口コミを3件創作する

## 出力形式
以下のJSON形式のみを出力してください。説明文やコードブロックは不要です。JSONだけを出力。`;

const CONTENT_USER_PROMPT = (params) => `以下の商品情報からLP用コンテンツを生成してください。

商品名: ${params.productName}
価格: ${params.price || '未定'}
ターゲット: ${params.target}
強み・実績: ${params.strengths || '推測して作成してください'}
口コミ: ${params.reviews || '創作してください（※個人の感想です と注記必須）'}

以下のJSON形式で出力:
{
  "headline": "キャッチコピー（ターゲットの欲求を数字入りで突く。20文字以内）",
  "subheadline": "サブコピー（具体的なベネフィット1行。30文字以内）",
  "stats": [
    { "number": "3分", "label": "でLP完成" },
    { "number": "80%", "label": "作業時間削減" },
    { "number": "9,800円", "label": "月額〜" }
  ],
  "problems": [
    "ターゲットの悩み1",
    "ターゲットの悩み2",
    "ターゲットの悩み3",
    "ターゲットの悩み4",
    "ターゲットの悩み5"
  ],
  "solution": "○○が、すべて解決します。サービス概要を2行で。",
  "benefits": [
    { "icon": "zap", "title": "得られる変化の見出し", "desc": "2行の説明文" },
    { "icon": "clock", "title": "得られる変化の見出し", "desc": "2行の説明文" },
    { "icon": "trending-up", "title": "得られる変化の見出し", "desc": "2行の説明文" },
    { "icon": "shield-check", "title": "得られる変化の見出し", "desc": "2行の説明文" },
    { "icon": "users", "title": "得られる変化の見出し", "desc": "2行の説明文" },
    { "icon": "star", "title": "得られる変化の見出し", "desc": "2行の説明文" }
  ],
  "comparison": [
    { "feature": "機能名1", "others": false, "ours": true },
    { "feature": "機能名2", "others": false, "ours": true },
    { "feature": "機能名3", "others": true, "ours": true },
    { "feature": "機能名4", "others": false, "ours": true },
    { "feature": "機能名5", "others": false, "ours": true }
  ],
  "steps": [
    { "title": "ステップ1の名前", "desc": "1行の説明" },
    { "title": "ステップ2の名前", "desc": "1行の説明" },
    { "title": "ステップ3の名前", "desc": "1行の説明" }
  ],
  "testimonials": [
    { "name": "T.K.", "role": "コーチ・30代", "text": "導入前は○○だったが、今では○○に。Before→Afterで書く。" },
    { "name": "M.S.", "role": "美容サロンオーナー・40代", "text": "Before→After形式の感想" },
    { "name": "A.Y.", "role": "個人事業主・30代", "text": "Before→After形式の感想" }
  ],
  "faq": [
    { "q": "質問1", "a": "回答1" },
    { "q": "質問2", "a": "回答2" },
    { "q": "質問3", "a": "回答3" },
    { "q": "質問4", "a": "回答4" },
    { "q": "質問5", "a": "回答5" }
  ],
  "closing": "最後の一押しコピー（限定感・価値を1文で）",
  "ctaText": "CTAボタンのテキスト（例: 無料で始める）",
  "ctaSub": "CTAボタン上の小さなテキスト（例: ＼ 30秒で完了 ／）"
}`;

/**
 * テンプレートHTMLを生成
 */
function buildHTML(content, lineUrl, productName) {
  const c = content;
  const cta = lineUrl || '#';

  const benefitsHTML = c.benefits.map(b => `
        <div class="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <div class="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-5">
            <i data-lucide="${b.icon}" class="w-7 h-7 text-indigo-600"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-3">${b.title}</h3>
          <p class="text-gray-600 leading-relaxed">${b.desc}</p>
        </div>`).join('\n');

  const statsHTML = c.stats.map(s => `
          <div class="text-center">
            <div class="text-4xl lg:text-6xl font-black text-indigo-600">${s.number}</div>
            <div class="text-gray-600 mt-2 text-lg">${s.label}</div>
          </div>`).join('\n');

  const problemsHTML = c.problems.map(p => `
            <li class="flex items-start gap-4">
              <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <i data-lucide="x" class="w-4 h-4 text-red-500"></i>
              </div>
              <span class="text-lg text-gray-700">${p}</span>
            </li>`).join('\n');

  const comparisonHTML = c.comparison.map(r => `
            <tr class="border-b border-gray-100">
              <td class="py-4 px-6 text-gray-700">${r.feature}</td>
              <td class="py-4 px-6 text-center">${r.others ? '<span class="text-gray-400">△</span>' : '<span class="text-red-400 font-bold">✕</span>'}</td>
              <td class="py-4 px-6 text-center"><span class="text-emerald-500 font-bold">✓</span></td>
            </tr>`).join('\n');

  const stepsHTML = c.steps.map((s, i) => `
          <div class="flex items-start gap-6">
            <div class="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">${i + 1}</div>
            <div>
              <h3 class="text-xl font-bold text-gray-900 mb-1">${s.title}</h3>
              <p class="text-gray-600">${s.desc}</p>
            </div>
          </div>`).join('\n          <div class="w-0.5 h-8 bg-indigo-200 ml-6"></div>\n');

  const testimonialsHTML = c.testimonials.map(t => `
          <div class="bg-white rounded-2xl shadow-xl p-8">
            <div class="flex items-center gap-4 mb-4">
              <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=6366f1&color=fff&size=80&font-size=0.4" class="w-14 h-14 rounded-full" alt="${t.name}">
              <div>
                <div class="font-bold text-gray-900">${t.name}</div>
                <div class="text-sm text-gray-500">${t.role}</div>
              </div>
            </div>
            <div class="text-yellow-400 mb-3">★★★★★</div>
            <p class="text-gray-600 leading-relaxed">${t.text}</p>
          </div>`).join('\n');

  const faqHTML = c.faq.map(f => `
          <details class="group border-b border-gray-200">
            <summary class="flex items-center justify-between cursor-pointer py-5 text-lg font-bold text-gray-900">
              <span>${f.q}</span>
              <span class="text-2xl text-gray-400 group-open:rotate-45 transition-transform duration-200">+</span>
            </summary>
            <div class="pb-5 text-gray-600 leading-relaxed">${f.a}</div>
          </details>`).join('\n');

  const ctaBlock = `
      <div class="text-center">
        <p class="text-sm text-gray-500 mb-3">${c.ctaSub}</p>
        <a href="${cta}" class="inline-block bg-orange-500 hover:bg-orange-600 text-white text-lg lg:text-xl font-bold py-5 px-14 rounded-full shadow-2xl hover:shadow-orange-500/30 transform hover:scale-105 transition-all duration-300">
          ${c.ctaText}
        </a>
      </div>`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${productName}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"><\/script>
  <style>
    body { font-family: 'Noto Sans JP', sans-serif; }
    details summary::-webkit-details-marker { display: none; }
    details summary { list-style: none; }
  </style>
</head>
<body class="bg-white text-gray-900">

  <!-- ファーストビュー -->
  <section class="relative min-h-screen flex items-center justify-center" style="background-image: url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&q=80'); background-size: cover; background-position: center;">
    <div class="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-indigo-900/50"></div>
    <div class="relative z-10 text-center px-4 max-w-5xl mx-auto">
      <h1 class="text-4xl lg:text-7xl font-black text-white leading-tight mb-6">${c.headline}</h1>
      <p class="text-xl lg:text-2xl text-white/90 mb-10">${c.subheadline}</p>
${ctaBlock.replace('text-gray-500', 'text-white/60')}
    </div>
  </section>

  <!-- 実績数字 -->
  <section class="py-16 bg-white">
    <div class="max-w-5xl mx-auto px-4">
      <div class="grid grid-cols-${c.stats.length} gap-8">
${statsHTML}
      </div>
    </div>
  </section>

  <!-- 悩み共感 -->
  <section class="py-20 lg:py-28 bg-gray-50">
    <div class="max-w-6xl mx-auto px-4 lg:px-8">
      <h2 class="text-3xl lg:text-5xl font-bold text-center mb-6">こんなお悩み、ありませんか？</h2>
      <div class="w-20 h-1.5 bg-orange-500 mx-auto mb-12"></div>
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80" class="w-full h-80 object-cover rounded-2xl shadow-xl" alt="悩み">
        </div>
        <ul class="space-y-5">
${problemsHTML}
        </ul>
      </div>
      <p class="text-center text-xl text-gray-700 mt-12 font-medium">一つでも当てはまるなら、<span class="text-indigo-600 font-bold">解決策があります</span></p>
    </div>
  </section>

  <!-- 解決策 + CTA -->
  <section class="py-20 lg:py-28 bg-white">
    <div class="max-w-4xl mx-auto px-4 text-center">
      <h2 class="text-3xl lg:text-5xl font-bold mb-6">${productName}</h2>
      <div class="w-20 h-1.5 bg-orange-500 mx-auto mb-8"></div>
      <p class="text-xl text-gray-600 leading-relaxed mb-12">${c.solution}</p>
${ctaBlock}
    </div>
  </section>

  <!-- ベネフィット -->
  <section class="py-20 lg:py-28 bg-gray-50">
    <div class="max-w-6xl mx-auto px-4 lg:px-8">
      <h2 class="text-3xl lg:text-5xl font-bold text-center mb-6">選ばれる理由</h2>
      <div class="w-20 h-1.5 bg-orange-500 mx-auto mb-12"></div>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
${benefitsHTML}
      </div>
    </div>
  </section>

  <!-- 比較表 -->
  <section class="py-20 lg:py-28 bg-white">
    <div class="max-w-4xl mx-auto px-4">
      <h2 class="text-3xl lg:text-5xl font-bold text-center mb-6">他社との違い</h2>
      <div class="w-20 h-1.5 bg-orange-500 mx-auto mb-12"></div>
      <div class="rounded-2xl shadow-xl overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-900 text-white">
              <th class="py-4 px-6 text-left">機能</th>
              <th class="py-4 px-6 text-center">他社ツール</th>
              <th class="py-4 px-6 text-center bg-indigo-600">${productName}</th>
            </tr>
          </thead>
          <tbody class="bg-white">
${comparisonHTML}
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- 導入フロー -->
  <section class="py-20 lg:py-28 bg-gray-50">
    <div class="max-w-3xl mx-auto px-4">
      <h2 class="text-3xl lg:text-5xl font-bold text-center mb-6">ご利用の流れ</h2>
      <div class="w-20 h-1.5 bg-orange-500 mx-auto mb-12"></div>
      <div class="space-y-0">
${stepsHTML}
      </div>
    </div>
  </section>

  <!-- お客様の声 + CTA -->
  <section class="py-20 lg:py-28 bg-white">
    <div class="max-w-6xl mx-auto px-4 lg:px-8">
      <h2 class="text-3xl lg:text-5xl font-bold text-center mb-6">お客様の声</h2>
      <div class="w-20 h-1.5 bg-orange-500 mx-auto mb-12"></div>
      <div class="grid md:grid-cols-3 gap-8 mb-4">
${testimonialsHTML}
      </div>
      <p class="text-sm text-gray-400 text-center mb-12">※個人の感想です。成果を保証するものではありません。</p>
${ctaBlock}
    </div>
  </section>

  <!-- FAQ -->
  <section class="py-20 lg:py-28 bg-gray-50">
    <div class="max-w-3xl mx-auto px-4">
      <h2 class="text-3xl lg:text-5xl font-bold text-center mb-6">よくある質問</h2>
      <div class="w-20 h-1.5 bg-orange-500 mx-auto mb-12"></div>
${faqHTML}
    </div>
  </section>

  <!-- 最終クロージング -->
  <section class="py-20 lg:py-28 bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900">
    <div class="max-w-4xl mx-auto px-4 text-center">
      <h2 class="text-3xl lg:text-5xl font-bold text-white mb-8">${c.closing}</h2>
${ctaBlock.replace('text-gray-500', 'text-white/60')}
    </div>
  </section>

  <!-- フッター -->
  <footer class="py-8 bg-gray-900 text-center text-gray-500 text-sm">
    <p>&copy; ${new Date().getFullYear()} ${productName}. All rights reserved.</p>
  </footer>

  <script>lucide.createIcons();<\/script>
</body>
</html>`;
}

/**
 * Claude APIでコンテンツJSONを生成 → テンプレートに埋め込み
 */
async function generateLP({ productName, price, target, strengths, reviews, lineUrl }) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: CONTENT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: CONTENT_USER_PROMPT({ productName, price, target, strengths, reviews }) }],
  });

  const raw = response.content[0].text.trim();

  // JSONパース
  let content;
  try {
    content = JSON.parse(raw);
  } catch {
    // コードブロックで囲まれている場合の対応
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      content = JSON.parse(match[1].trim());
    } else {
      console.error('LP JSON parse error. Raw:', raw.substring(0, 500));
      throw new Error('LP生成結果のパースに失敗しました。再度お試しください。');
    }
  }

  return buildHTML(content, lineUrl, productName);
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
 * HTMLサニタイズ
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
 * LP HTML配信（公開ページ用）
 */
async function serveLPHtml(lpId) {
  const { data, error } = await supabaseAdmin
    .from('lps')
    .select('html_content, pv_count')
    .eq('id', lpId)
    .single();

  if (error) throw error;

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
 * LPメタ情報更新
 */
async function updateLP(lpId, userId, params) {
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
 * LP削除
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
