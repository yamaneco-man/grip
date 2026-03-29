-- セグメント配信: タグ管理テーブル
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- フォロワーとタグの中間テーブル
CREATE TABLE IF NOT EXISTS follower_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES line_followers(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, tag_id)
);

-- メールアドレス収集（LINE垢BANバックアップ）
ALTER TABLE line_followers ADD COLUMN IF NOT EXISTS email TEXT;

-- カスタムドメイン管理
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- オンボーディング状態管理
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- RLS有効化
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE follower_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

-- tagsポリシー
CREATE POLICY "tags_select_own" ON tags FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "tags_insert_own" ON tags FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "tags_update_own" ON tags FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "tags_delete_own" ON tags FOR DELETE USING (user_id = auth.uid());

-- follower_tagsポリシー（tagsテーブル経由で所有権チェック）
CREATE POLICY "follower_tags_select" ON follower_tags FOR SELECT
  USING (EXISTS (SELECT 1 FROM tags WHERE tags.id = follower_tags.tag_id AND tags.user_id = auth.uid()));
CREATE POLICY "follower_tags_insert" ON follower_tags FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tags WHERE tags.id = follower_tags.tag_id AND tags.user_id = auth.uid()));
CREATE POLICY "follower_tags_delete" ON follower_tags FOR DELETE
  USING (EXISTS (SELECT 1 FROM tags WHERE tags.id = follower_tags.tag_id AND tags.user_id = auth.uid()));

-- custom_domainsポリシー
CREATE POLICY "domains_select_own" ON custom_domains FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "domains_insert_own" ON custom_domains FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "domains_delete_own" ON custom_domains FOR DELETE USING (user_id = auth.uid());
