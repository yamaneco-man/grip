-- 条件分岐メッセージテーブル
CREATE TABLE conditional_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]',
  default_message JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- リマインド配信テーブル
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID,
  name TEXT NOT NULL,
  message JSONB NOT NULL,
  remind_before_minutes INTEGER NOT NULL DEFAULT 60,
  channel TEXT NOT NULL DEFAULT 'line' CHECK (channel IN ('line', 'email', 'both')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BAN検知ログテーブル
CREATE TABLE ban_detection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  line_account_name TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'detected' CHECK (status IN ('detected', 'confirmed', 'resolved')),
  details JSONB
);

-- シナリオテンプレートテーブル
CREATE TABLE scenario_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  template_data JSONB NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conditional_messages_user_id ON conditional_messages(user_id);
CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_ban_detection_logs_user_id ON ban_detection_logs(user_id);
CREATE INDEX idx_scenario_templates_public ON scenario_templates(is_public) WHERE is_public = true;

CREATE TRIGGER conditional_messages_updated_at BEFORE UPDATE ON conditional_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER scenario_templates_updated_at BEFORE UPDATE ON scenario_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
