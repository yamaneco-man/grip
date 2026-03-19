require('dotenv').config();

// 必須環境変数のバリデーション
const REQUIRED_VARS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'LINE_CHANNEL_ACCESS_TOKEN',
  'LINE_CHANNEL_SECRET',
  'ANTHROPIC_API_KEY',
];

const OPTIONAL_VARS = [
  'PORT',
  'NODE_ENV',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'DEFAULT_USER_ID',
  'SCHEDULER_API_KEY',
];

function validateEnv() {
  const missing = [];
  const placeholder = [];

  for (const key of REQUIRED_VARS) {
    const val = process.env[key];
    if (!val) {
      missing.push(key);
    } else if (val.startsWith('your-') || val.includes('your-project')) {
      placeholder.push(key);
    }
  }

  if (missing.length > 0) {
    console.error('❌ 必須環境変数が未設定:', missing.join(', '));
    console.error('   → server/.env ファイルを確認してください');
    process.exit(1);
  }

  if (placeholder.length > 0) {
    console.warn('⚠️  プレースホルダーのままの環境変数:', placeholder.join(', '));
    console.warn('   → 本番環境では実際の値を設定してください');
  }

  // Stripe（任意だが警告）
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('your-')) {
    console.warn('⚠️  STRIPE_SECRET_KEY 未設定: 決済機能は無効です');
  }
}

module.exports = { validateEnv };
