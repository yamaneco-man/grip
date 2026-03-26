-- トラッキングリンクテーブル（経路別LINE友達追加リンク管理）
CREATE TABLE IF NOT EXISTS tracking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel TEXT NOT NULL,
  tracking_code TEXT UNIQUE NOT NULL,
  original_line_url TEXT,
  click_count INTEGER NOT NULL DEFAULT 0,
  follow_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracking_links_user_id ON tracking_links(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tracking_links_code ON tracking_links(tracking_code);

-- RLS
ALTER TABLE tracking_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tracking_links_select_own" ON tracking_links
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "tracking_links_insert_own" ON tracking_links
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "tracking_links_delete_own" ON tracking_links
  FOR DELETE USING (user_id = auth.uid());

-- lp_access_logsのlp_id制約を緩和（トラッキングリンク経由はlp_id=null）
ALTER TABLE lp_access_logs ALTER COLUMN lp_id DROP NOT NULL;
