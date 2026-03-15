-- GRIP 初期スキーマ
-- 設計書 第8章 Supabase データベーススキーマ設計に基づく

-- 売り手（GRIPユーザー）テーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'standard', 'pro', 'vip')),
  stripe_customer_id TEXT,
  line_official_token TEXT,
  line_channel_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- LP管理テーブル
CREATE TABLE lps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  price INTEGER,
  target TEXT,
  strengths TEXT,
  reviews TEXT,
  line_url TEXT,
  html_content TEXT,
  html_url TEXT,
  pv_count INTEGER NOT NULL DEFAULT 0,
  registration_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- LINE友達管理テーブル
CREATE TABLE line_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  follower_line_id TEXT NOT NULL,
  display_name TEXT,
  source_lp_id UUID REFERENCES lps(id) ON DELETE SET NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_replied_at TIMESTAMPTZ,
  step_day INTEGER NOT NULL DEFAULT 0,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  blocked_at TIMESTAMPTZ
);

-- ユニーク制約: 同じ売り手に対して同じLINEユーザーは1レコード
CREATE UNIQUE INDEX idx_line_followers_unique ON line_followers(user_id, follower_line_id);

-- メッセージログテーブル
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES line_followers(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  content TEXT NOT NULL,
  emotion_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 離脱スコアテーブル
CREATE TABLE churn_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES line_followers(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  score_detail_json JSONB,
  alerted BOOLEAN NOT NULL DEFAULT false,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 成約スコアテーブル
CREATE TABLE closing_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES line_followers(id) ON DELETE CASCADE,
  probability INTEGER NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  recommended_action TEXT,
  generated_replies_json JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_lps_user_id ON lps(user_id);
CREATE INDEX idx_line_followers_user_id ON line_followers(user_id);
CREATE INDEX idx_messages_follower_id ON messages(follower_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_churn_scores_follower_id ON churn_scores(follower_id);
CREATE INDEX idx_churn_scores_calculated_at ON churn_scores(calculated_at);
CREATE INDEX idx_closing_scores_follower_id ON closing_scores(follower_id);

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER lps_updated_at BEFORE UPDATE ON lps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
