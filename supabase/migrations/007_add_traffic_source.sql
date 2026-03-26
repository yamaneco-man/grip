-- 流入経路トラッキング用カラム追加
ALTER TABLE line_followers ADD COLUMN IF NOT EXISTS source_channel TEXT;
-- source_channel: 'tiktok', 'youtube', 'x', 'note', 'seo', 'referral', 'ad', 'agency', 'direct'

ALTER TABLE line_followers ADD COLUMN IF NOT EXISTS source_utm JSONB;
-- source_utm: { "utm_source": "tiktok", "utm_medium": "social", "utm_campaign": "launch" }

-- LPにもUTMトラッキング用のアクセスログテーブル
CREATE TABLE IF NOT EXISTS lp_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lp_id UUID NOT NULL REFERENCES lps(id) ON DELETE CASCADE,
  visitor_id TEXT,
  source_channel TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lp_access_logs_lp_id ON lp_access_logs(lp_id);
CREATE INDEX IF NOT EXISTS idx_lp_access_logs_source ON lp_access_logs(source_channel);

-- RLS
ALTER TABLE lp_access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lp_access_logs_select" ON lp_access_logs
  FOR SELECT USING (lp_id IN (SELECT id FROM lps WHERE user_id = auth.uid()));
