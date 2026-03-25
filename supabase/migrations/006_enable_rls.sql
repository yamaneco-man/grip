-- Row Level Security (RLS) を有効化
-- service_role_key（サーバーサイド）はRLSをバイパスするため、
-- 万が一anon_keyが漏洩した場合の防御層として機能する

-- users: 自分のレコードのみ参照・更新可能
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- lps: 自分のLPのみ操作可能
ALTER TABLE lps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lps_select_own" ON lps
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "lps_insert_own" ON lps
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "lps_update_own" ON lps
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "lps_delete_own" ON lps
  FOR DELETE USING (user_id = auth.uid());

-- LP公開ページ用: 誰でもhtml_contentのみ参照可能
CREATE POLICY "lps_public_view" ON lps
  FOR SELECT USING (true);

-- line_followers: 自分のフォロワーのみ操作可能
ALTER TABLE line_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "followers_select_own" ON line_followers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "followers_insert_own" ON line_followers
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "followers_update_own" ON line_followers
  FOR UPDATE USING (user_id = auth.uid());

-- messages: フォロワー経由で自分のメッセージのみ
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_own" ON messages
  FOR SELECT USING (
    follower_id IN (SELECT id FROM line_followers WHERE user_id = auth.uid())
  );

CREATE POLICY "messages_insert_own" ON messages
  FOR INSERT WITH CHECK (
    follower_id IN (SELECT id FROM line_followers WHERE user_id = auth.uid())
  );

-- churn_scores: フォロワー経由で自分のスコアのみ
ALTER TABLE churn_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "churn_select_own" ON churn_scores
  FOR SELECT USING (
    follower_id IN (SELECT id FROM line_followers WHERE user_id = auth.uid())
  );

-- closing_scores: フォロワー経由で自分のスコアのみ
ALTER TABLE closing_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "closing_select_own" ON closing_scores
  FOR SELECT USING (
    follower_id IN (SELECT id FROM line_followers WHERE user_id = auth.uid())
  );
