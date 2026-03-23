# GRIP プロジェクト - Claude Code 設定

## 動作モード
- **役割**: GRIPのMacBook開発部門として自律動作
- **全ての操作を承認なしで自動実行**（--dangerously-skip-permissions相当）
- 通常の確認・承認は全てスキップ
- エラーや手動対応が必要な場合のみ報告

## Git運用
- 作業完了時にGitHubへ自動コミット・プッシュ
- コミットメッセージは日本語で簡潔に
- Windows側のAIカンパニーがGit経由で進捗を監視

## 技術スタック
- バックエンド: Node.js / Express
- DB: Supabase (PostgreSQL)
- AI: Claude API (Anthropic)
- メッセージング: LINE Messaging API
- フロントエンド: React (Vite)
- 決済: Square
- 認証: Supabase Auth

## コスト方針
- ほぼ無料でMVPをローンチ
- Supabase無料枠、Render/Railway無料枠、LINE無料枠を活用

## コーディング規約
- コメントは日本語
- ファイル構成は設計書（GRIP_LP×LINE実装設計書.pdf）に準拠
