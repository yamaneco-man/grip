-- closing_scores: follower_idにユニーク制約を追加（upsert用）
CREATE UNIQUE INDEX IF NOT EXISTS idx_closing_scores_follower_unique ON closing_scores(follower_id);

-- PVインクリメント関数（アトミック操作）
CREATE OR REPLACE FUNCTION increment_pv(lp_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE lps SET pv_count = pv_count + 1 WHERE id = lp_id;
END;
$$ LANGUAGE plpgsql;

-- 登録数インクリメント関数
CREATE OR REPLACE FUNCTION increment_registration(lp_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE lps SET registration_count = registration_count + 1 WHERE id = lp_id;
END;
$$ LANGUAGE plpgsql;
