-- VIPプラン専用: カスタムステップ設計テーブル
CREATE TABLE IF NOT EXISTS custom_step_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day INTEGER NOT NULL CHECK (day BETWEEN 1 AND 7),
  purpose TEXT NOT NULL,
  tone TEXT DEFAULT 'friendly',
  custom_prompt TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day)
);
