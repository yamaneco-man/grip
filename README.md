# GRIP - AI搭載LINEマーケティングプラットフォーム

LP → LINE登録 → 購買クロージング → 離脱防止の全工程を1ツールで完全自動化。

## 対象ユーザー

日本の個人オンラインコース販売者・コーチ

## 5つのコアモジュール

| モジュール | 機能 |
|---|---|
| LP生成エンジン | Claude APIで商品情報からHTML LPを自動生成。LINE友達追加ボタンを自動埋め込み |
| LINE登録トラッカー | どのLPから・いつ登録したかをユーザーIDと紐付けて記録 |
| 即時AIフォローbot | 登録直後〜7日間の自動ステップ配信で信頼構築→購買誘導 |
| クロージングAI | 返信の感情分析・成約確率表示・反論処理3パターン自動生成 |
| 離脱検知AI | 個人レベルの冷め度スコアリング・閾値超えで売り手に即アラート |

## 技術スタック

- **バックエンド**: Node.js / Express
- **DB**: Supabase (PostgreSQL)
- **AI**: Claude API (Anthropic)
- **メッセージング**: LINE Messaging API
- **ワークフロー**: n8n
- **フロントエンド**: React (Vite)
- **決済**: Stripe
- **認証**: Supabase Auth

## ディレクトリ構成

```
grip/
├── server/                  # バックエンドAPI
│   └── src/
│       ├── index.js         # Expressサーバーエントリポイント
│       ├── config/          # 外部サービス接続設定
│       ├── routes/          # APIルート
│       │   ├── lp.js        # LP生成・管理
│       │   ├── line.js      # LINE Webhook・友達管理
│       │   ├── ai.js        # クロージングAI・ステップ配信
│       │   ├── churn.js     # 離脱検知・復活メッセージ
│       │   └── auth.js      # 認証
│       ├── middleware/       # 認証ミドルウェア等
│       ├── services/        # ビジネスロジック
│       └── utils/           # ユーティリティ
├── client/                  # React管理画面
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── utils/
├── supabase/
│   └── migrations/          # DBマイグレーション
└── GRIP_LP×LINE実装設計書.pdf
```

## セットアップ

### 1. 環境変数を設定

```bash
cp server/.env.example server/.env
# .envファイルを編集して各APIキーを設定
```

### 2. バックエンド起動

```bash
cd server
npm install
npm run dev
```

### 3. フロントエンド起動

```bash
cd client
npm install
npm run dev
```

### 4. DBマイグレーション

Supabase管理画面のSQL Editorで `supabase/migrations/001_initial_schema.sql` を実行。

## プラン

| 機能 | FREE | STANDARD ¥9,800 | PRO ¥29,800 | VIP ¥98,000 |
|---|---|---|---|---|
| LP生成 | 3回/月 | 無制限 | 無制限 | 無制限 |
| LINE登録トラッキング | 50人 | 500人 | 無制限 | 無制限 |
| 7日間ステップ配信 | - | 固定テンプレ | AI完全自動 | カスタム |
| 離脱検知AI | - | 週次 | 日次 | リアルタイム |
| 反論処理AI | - | - | ○ | ○ |
