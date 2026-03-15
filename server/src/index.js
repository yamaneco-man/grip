const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア設定
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'GRIP API',
    timestamp: new Date().toISOString(),
  });
});

// ルート登録
app.use('/api/lp', require('./routes/lp'));
app.use('/api/line', require('./routes/line'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/churn', require('./routes/churn'));
app.use('/api/auth', require('./routes/auth'));

// 404ハンドラー
app.use((req, res) => {
  res.status(404).json({ error: 'エンドポイントが見つかりません' });
});

// エラーハンドラー
app.use((err, req, res, next) => {
  console.error('サーバーエラー:', err.message);
  res.status(500).json({ error: 'サーバー内部エラーが発生しました' });
});

app.listen(PORT, () => {
  console.log(`GRIP APIサーバーが起動しました: http://localhost:${PORT}`);
});

module.exports = app;
