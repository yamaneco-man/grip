# GRIP - マルチステージビルド
FROM node:20-alpine AS client-build

ENV NODE_OPTIONS="--max-old-space-size=256"

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install --prefer-offline --no-audit --no-fund
COPY client/ ./
RUN npm run build

FROM node:20-alpine

WORKDIR /app

# サーバー依存パッケージインストール
COPY server/package*.json ./
RUN npm install --omit=dev --prefer-offline --no-audit --no-fund

# サーバーコード
COPY server/src/ ./src/

# クライアントビルド成果物
COPY --from=client-build /app/client/dist ./public/

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
