-- usersテーブルにroleカラムを追加（権限分離用）
-- role: 'user'（一般ユーザー）、'admin'（管理者）、'partner'（代理店）
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin', 'partner'));

-- roleカラムにインデックス追加（権限チェックの高速化）
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Yamaのアカウントをadminに昇格（メールアドレスで指定）
-- ※ 実行前にYamaのメールアドレスを確認して適宜変更してください
-- UPDATE users SET role = 'admin' WHERE email = 'ymzk0505@gmail.com';
