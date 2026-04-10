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

// サーバータイムアウト設定（LP生成等のClaude API呼び出しに90秒以上かかる場合がある）
const server = require('http').createServer(app);
server.timeout = 120000; // 120秒
server.keepAliveTimeout = 120000;
server.headersTimeout = 125000;

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

// 会員ログインのレート制限
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'ログイン試行回数の上限に達しました。しばらくしてからお試しください。' },
});
app.use('/api/member/member-login', loginLimiter);

// AI系API専用レート制限（Claude API課金爆発防止）
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 20,
  message: { error: 'AI機能の利用上限に達しました。1時間後にお試しください。' },
});
app.use('/api/ai/', aiLimiter);
app.use('/api/lp/generate', aiLimiter);
app.use('/api/email/ai/', aiLimiter);
app.use('/api/webinar/ai/', aiLimiter);
app.use('/api/member/courses', (req, res, next) => {
  if (req.path.includes('ai-generate')) return aiLimiter(req, res, next);
  next();
});

// Webhookはraw bodyが必要（署名検証のため）
// express.json()より前にルート登録
app.use('/api/line/webhook', express.raw({ type: 'application/json' }));
app.use('/api/line/webhook/:userId', express.raw({ type: 'application/json' }));
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

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
app.use('/api/line-settings', require('./routes/lineSettings'));
app.use('/api/tracking-links', require('./routes/trackingLinks'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/analytics', require('./routes/analytics'));

// 新機能ルート（UTAGE完全上位互換）
app.use('/api/rich-menu', require('./routes/richMenu'));
app.use('/api/rich-message', require('./routes/richMessage'));
app.use('/api/email', require('./routes/email'));
app.use('/api/member', require('./routes/memberSite'));
app.use('/api/webinar', require('./routes/webinar'));
app.use('/api/events', require('./routes/events'));
app.use('/api/affiliate', require('./routes/affiliate'));
app.use('/api/commerce', require('./routes/commerce'));
app.use('/api/scenario', require('./routes/scenario'));

// Lステップ完全上位互換機能
app.use('/api/forms', require('./routes/forms'));
app.use('/api/broadcast', require('./routes/broadcast'));
app.use('/api/keyword-rules', require('./routes/keywordRules'));
app.use('/api/reminders', require('./routes/reminderSeq'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/saved-filters', require('./routes/savedFilters'));
app.use('/api/operators', require('./routes/operators'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/csv', require('./routes/csvIO'));
app.use('/api/conversions', require('./routes/conversions'));
app.use('/api/site-tracking', require('./routes/siteTracking'));
app.use('/api/staff', require('./routes/staffMembers'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/sheets', require('./routes/sheets'));
app.use('/api/scheduled-actions', require('./routes/scheduledActions'));

// トラッキングリンクのリダイレクト（短縮URL）
app.get('/t/:code', async (req, res) => {
  try {
    const { supabaseAdmin } = require('./config/supabase');
    const { data: link } = await supabaseAdmin
      .from('tracking_links')
      .select('id, original_line_url, channel, user_id')
      .eq('tracking_code', req.params.code)
      .single();

    if (!link || !link.original_line_url) {
      return res.status(404).send('リンクが見つかりません');
    }

    // クリック数をインクリメント
    await supabaseAdmin
      .from('tracking_links')
      .update({ click_count: supabaseAdmin.rpc ? undefined : 0 })
      .eq('id', link.id);
    // RPCがない場合のフォールバック
    await supabaseAdmin.rpc('increment_tracking_click', { link_id: link.id }).catch(async () => {
      const { data: current } = await supabaseAdmin.from('tracking_links').select('click_count').eq('id', link.id).single();
      await supabaseAdmin.from('tracking_links').update({ click_count: (current?.click_count || 0) + 1 }).eq('id', link.id);
    });

    // 最新の流入経路をセッション的に記録（Webhook受信時に参照）
    await supabaseAdmin.from('lp_access_logs').insert({
      lp_id: null,
      source_channel: link.channel,
      utm_source: link.channel,
      utm_medium: 'tracking_link',
      utm_campaign: link.id,
      referrer: req.headers.referer || null,
    }).catch(() => {});

    // LINE友達追加URLにリダイレクト
    res.redirect(302, link.original_line_url);
  } catch {
    res.status(500).send('エラーが発生しました');
  }
});

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
  server.listen(PORT, () => {
    console.log(`GRIP APIサーバーが起動しました: http://localhost:${PORT}`);
  });
}

module.exports = app;
