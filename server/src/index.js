const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { validateEnv } = require('./config/validate');

// 起動時に環境変数をバリデーション
validateEnv();

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア設定
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : (process.env.NODE_ENV === 'production' ? false : 'http://localhost:3000'),
  credentials: true,
}));
app.use(morgan('dev'));

// レート制限（API保護）
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'リクエスト数の上限に達しました。しばらくしてからお試しください。' },
});
app.use('/api/', apiLimiter);

// AI系API専用レート制限（Claude API課金爆発防止）
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 20,
  message: { error: 'AI機能の利用上限に達しました。1時間後にお試しください。' },
});
app.use('/api/ai/', aiLimiter);
app.use('/api/lp/generate', aiLimiter);

// LINE Webhookはraw bodyが必要（署名検証のため）
// express.json()より前にルート登録
app.use('/api/line/webhook', express.raw({ type: 'application/json' }));

// その他のルートはJSONパース
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ヘルスチェック（外部にシステム構成を露出しない）
app.get('/api/health', async (req, res) => {
  try {
    const { supabaseAdmin } = require('./config/supabase');
    const { error } = await supabaseAdmin.from('users').select('id').limit(1);
    res.status(error ? 503 : 200).json({ status: error ? 'degraded' : 'ok' });
  } catch {
    res.status(503).json({ status: 'error' });
  }
});

// ルート登録
app.use('/api/lp', require('./routes/lp'));
app.use('/api/line', require('./routes/line'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/churn', require('./routes/churn'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/scheduler', require('./routes/scheduler'));
app.use('/api/step-config', require('./routes/step-config'));
app.use('/api/admin', require('./routes/admin'));

// 本番環境: Reactビルド成果物を配信
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '..', 'public');
  app.use(express.static(publicPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// 404ハンドラー（API用）
app.use((req, res) => {
  res.status(404).json({ error: 'エンドポイントが見つかりません' });
});

// エラーハンドラー
app.use((err, req, res, next) => {
  console.error('サーバーエラー:', err.message);
  res.status(500).json({ error: 'サーバー内部エラーが発生しました' });
});

// テスト環境ではlisten不要（supertestが直接appを使う）
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`GRIP APIサーバーが起動しました: http://localhost:${PORT}`);
  });
}

module.exports = app;
