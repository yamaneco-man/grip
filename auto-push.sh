#!/bin/bash
# GRIP 自動コミット・プッシュスクリプト
# 使い方: ./auto-push.sh "コミットメッセージ"

MSG="${1:-自動更新}"

cd "$(dirname "$0")"

git add -A
git commit -m "$MSG

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push origin main
