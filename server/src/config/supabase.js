const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabaseクライアント（公開キー用：フロントエンド向け操作）
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Supabase管理クライアント（サービスロールキー用：バックエンド専用操作）
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = { supabase, supabaseAdmin };
