-- リッチメニュー管理テーブル
CREATE TABLE rich_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  line_rich_menu_id TEXT,
  chat_bar_text TEXT DEFAULT 'メニュー',
  areas JSONB NOT NULL DEFAULT '[]',
  image_url TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- リッチメニュー自動切替ルール
CREATE TABLE rich_menu_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rich_menu_id UUID NOT NULL REFERENCES rich_menus(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('tag_added', 'tag_removed', 'step_day', 'follow', 'keyword', 'schedule')),
  trigger_value TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rich_menus_user_id ON rich_menus(user_id);
CREATE INDEX idx_rich_menu_rules_user_id ON rich_menu_rules(user_id);

CREATE TRIGGER rich_menus_updated_at BEFORE UPDATE ON rich_menus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
