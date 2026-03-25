# GRIP - マルチステージビルド
FROM node:20-alpine AS client-build

ENV NODE_OPTIONS="--max-old-space-size=256"

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install --prefer-offline --no-audit --no-fund
COPY client/ ./
RUN npm run build

FROM node:20-alpine

# 非rootユーザーで実行（セキュリティ対策）
RUN addgroup -g 1001 -S grip && adduser -S grip -u 1001 -G grip

WORKDIR /app

# サーバー依存パッケージインストール
COPY server/package*.json ./
RUN npm install --omit=dev --prefer-offline --no-audit --no-fund

# サーバーコード
COPY server/src/ ./src/

# クライアントビルド成果物
COPY --from=client-build /app/client/dist ./public/

# ファイル所有権を非rootユーザーに変更
RUN chown -R grip:grip /app

USER grip

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
