const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * AI拡張サービス（UTAGEにない独自AI機能）
 * メール文面生成、会員コンテンツ生成、ウェビナー台本生成
 */

function sanitizeInput(input, maxLength = 500) {
  if (typeof input !== 'string') return String(input || '');
  return input.replace(/[\`\$\{\}]/g, '').substring(0, maxLength);
}

// メールステップ配信をAI自動生成
async function generateEmailSequence(productInfo, sequenceLength = 7) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `あなたはメールマーケティングの専門家です。以下の商品情報に基づいて、${sequenceLength}日間のステップメール配信シナリオを作成してください。

商品情報:
- 商品名: ${sanitizeInput(productInfo.name)}
- 価格: ¥${productInfo.price?.toLocaleString() || '未設定'}
- ターゲット: ${sanitizeInput(productInfo.target || '未設定')}
- 商品の強み: ${sanitizeInput(productInfo.strengths || '未設定')}

要件:
- 各メールは件名(subject)と本文(body_html)を含むJSON配列で返してください
- Day1: ウェルカム＋自己紹介
- Day2-3: 問題提起＋共感
- Day4-5: 解決策の提示＋社会的証明
- Day6: 限定オファー
- Day7: 最終クロージング
- 本文はHTML形式で、読みやすいフォーマットにしてください
- 件名は開封率を意識した魅力的なものにしてください
- 日本の個人事業主/コーチ向けの口調で

JSON配列のみを返してください。他のテキストは不要です。
[{"day": 1, "subject": "件名", "body_html": "<p>本文</p>", "delay_days": 0}, ...]`
    }],
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('AI応答のパースに失敗しました');
  return JSON.parse(jsonMatch[0]);
}

// メールキャンペーン文面をAI生成
async function generateCampaignEmail(topic, tone, productInfo) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `以下の条件でメール配信用の文面を1通作成してください。

トピック: ${sanitizeInput(topic)}
トーン: ${sanitizeInput(tone || 'フレンドリーで専門的')}
商品名: ${sanitizeInput(productInfo?.name || '未設定')}
ターゲット: ${sanitizeInput(productInfo?.target || '未設定')}

JSON形式で返してください:
{"subject": "件名", "body_html": "<p>本文HTML</p>", "body_text": "プレーンテキスト版"}`
    }],
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI応答のパースに失敗しました');
  return JSON.parse(jsonMatch[0]);
}

// 会員サイトのレッスンコンテンツをAI生成
async function generateLessonContent(courseInfo, lessonTitle, lessonOutline) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `あなたはオンライン教育のコンテンツ設計専門家です。以下の情報に基づいてレッスンコンテンツを作成してください。

コース名: ${sanitizeInput(courseInfo.name)}
コース概要: ${sanitizeInput(courseInfo.description || '未設定')}
レッスンタイトル: ${sanitizeInput(lessonTitle)}
レッスン概要: ${sanitizeInput(lessonOutline || '')}

要件:
- 実践的で具体的な内容にすること
- ステップバイステップで進めること
- 見出し・リスト・強調を使ったHTML形式
- 1レッスン2,000〜3,000文字程度
- 最後にアクションアイテム（受講者がやるべきこと）を含める
- 日本語で作成

HTML本文のみを返してください。`
    }],
  });

  return response.content[0].text;
}

// ウェビナー台本をAI生成
async function generateWebinarScript(webinarInfo) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 6000,
    messages: [{
      role: 'user',
      content: `あなたはウェビナーマーケティングの専門家です。以下の情報に基づいて、成約率の高いウェビナー台本を作成してください。

ウェビナータイトル: ${sanitizeInput(webinarInfo.title)}
商品/サービス名: ${sanitizeInput(webinarInfo.productName || '未設定')}
価格: ¥${(webinarInfo.price || 0).toLocaleString()}
ターゲット: ${sanitizeInput(webinarInfo.target || '未設定')}
所要時間: ${webinarInfo.durationMinutes || 60}分

台本構成:
1. オープニング（自己紹介・共感・今日得られるもの）
2. 問題提起（視聴者の悩み3つ）
3. 解決策の提示（メソッド紹介）
4. 社会的証明（実績・事例）
5. オファー提示（商品紹介・特典）
6. Q&A想定（よくある質問5つ）
7. クロージング（限定性・希少性・行動喚起）

JSON形式で返してください:
{
  "sections": [
    {"title": "セクション名", "duration_minutes": 5, "script": "台本テキスト", "notes": "スライド指示等"}
  ],
  "total_duration_minutes": 60,
  "cta_timing_minutes": 45
}`
    }],
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI応答のパースに失敗しました');
  return JSON.parse(jsonMatch[0]);
}

// LP → ウェビナー登録ページをAI生成
async function generateWebinarRegistrationPage(webinarInfo) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `以下のウェビナー情報に基づいて、登録率の高いウェビナー登録ページのHTMLを生成してください。

タイトル: ${sanitizeInput(webinarInfo.title)}
説明: ${sanitizeInput(webinarInfo.description || '')}
所要時間: ${webinarInfo.durationMinutes || 60}分
ターゲット: ${sanitizeInput(webinarInfo.target || '')}

要件:
- モバイルファースト・レスポンシブデザイン
- ヘッドライン（ベネフィット訴求）
- 3つの学べるポイント
- 講師プロフィール欄
- 登録フォーム（名前・メール）
- 限定性の演出（残りX席）
- Tailwind CSSクラスを使用
- formのaction属性は空（JSで処理）

HTML全体を返してください。`
    }],
  });

  return response.content[0].text;
}

// リマインドメッセージ最適化
async function optimizeReminderMessage(eventInfo, reminderTiming) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `以下のイベント情報に基づいて、出席率を最大化するリマインドメッセージを作成してください。

イベント名: ${sanitizeInput(eventInfo.title)}
開催日時: ${sanitizeInput(eventInfo.startAt)}
リマインドタイミング: ${reminderTiming}分前
配信チャネル: ${eventInfo.channel || 'LINE'}

短く簡潔に、参加への期待感を高めるメッセージにしてください。テキストのみ返してください。`
    }],
  });

  return response.content[0].text.trim();
}

module.exports = {
  generateEmailSequence,
  generateCampaignEmail,
  generateLessonContent,
  generateWebinarScript,
  generateWebinarRegistrationPage,
  optimizeReminderMessage,
};
