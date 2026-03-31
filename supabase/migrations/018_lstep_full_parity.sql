-- Lステップ完全上位互換: 全15機能のDB追加
-- 2026-03-31

-- ============================================================
-- 1. 回答フォーム (forms / form_questions / form_responses)
-- ============================================================
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  auto_tag_ids UUID[] DEFAULT '{}',
  thank_you_message TEXT DEFAULT 'ご回答ありがとうございます！',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE form_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'text' CHECK (question_type IN ('text', 'textarea', 'radio', 'checkbox', 'select', 'number', 'date', 'email')),
  options JSONB DEFAULT '[]',
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  tag_mapping JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  follower_id UUID REFERENCES line_followers(id) ON DELETE SET NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_forms_user ON forms(user_id);
CREATE INDEX idx_form_questions_form ON form_questions(form_id);
CREATE INDEX idx_form_responses_form ON form_responses(form_id);
CREATE INDEX idx_form_responses_follower ON form_responses(follower_id);

-- ============================================================
-- 2. 一斉配信 (broadcasts)
-- ============================================================
CREATE TABLE broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'rich', 'template')),
  content JSONB NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'segment', 'tag')),
  target_tag_ids UUID[] DEFAULT '{}',
  target_match_all BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_broadcasts_user ON broadcasts(user_id);
CREATE INDEX idx_broadcasts_status ON broadcasts(status);

-- ============================================================
-- 3. キーワード応答 (keyword_rules)
-- ============================================================
CREATE TABLE keyword_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'partial' CHECK (match_type IN ('exact', 'partial', 'regex')),
  response_type TEXT NOT NULL DEFAULT 'text' CHECK (response_type IN ('text', 'rich', 'template')),
  response_content JSONB NOT NULL,
  action_tag_ids UUID[] DEFAULT '{}',
  action_scenario_id UUID,
  priority INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_keyword_rules_user ON keyword_rules(user_id);
CREATE INDEX idx_keyword_rules_active ON keyword_rules(user_id, is_active);

-- ============================================================
-- 4. リマインダ配信 (reminder_sequences)
-- ============================================================
CREATE TABLE reminder_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  target_date_field TEXT DEFAULT 'event_date',
  steps JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES reminder_sequences(id) ON DELETE CASCADE,
  follower_id UUID NOT NULL REFERENCES line_followers(id) ON DELETE CASCADE,
  step_index INT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sequence_id, follower_id, step_index)
);

CREATE INDEX idx_reminder_sequences_user ON reminder_sequences(user_id);
CREATE INDEX idx_reminder_logs_sequence ON reminder_logs(sequence_id);

-- ============================================================
-- 5. テンプレート管理 (message_templates)
-- ============================================================
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'rich', 'flex')),
  content JSONB NOT NULL,
  usage_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_message_templates_user ON message_templates(user_id);

-- ============================================================
-- 6. カスタム検索管理 (saved_filters)
-- ============================================================
CREATE TABLE saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filter_conditions JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_filters_user ON saved_filters(user_id);

-- ============================================================
-- 7. オペレーター機能 (operators)
-- ============================================================
CREATE TABLE operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '["chat","booking"]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, email)
);

CREATE INDEX idx_operators_user ON operators(user_id);

-- ============================================================
-- 8. 通知機能 (notification_settings / notification_logs)
-- ============================================================
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('follow', 'message', 'booking', 'form_response', 'purchase', 'churn_alert')),
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'line', 'both')),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  destination TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_type)
);

CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_settings_user ON notification_settings(user_id);
CREATE INDEX idx_notification_logs_user ON notification_logs(user_id, is_read);

-- ============================================================
-- 9. CSVインポート/エクスポート (import_jobs)
-- ============================================================
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('followers', 'tags', 'emails')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_name TEXT,
  total_rows INT DEFAULT 0,
  processed_rows INT DEFAULT 0,
  error_rows INT DEFAULT 0,
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_import_jobs_user ON import_jobs(user_id);

-- ============================================================
-- 10. コンバージョン測定 (conversion_goals / conversion_events)
-- ============================================================
CREATE TABLE conversion_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal_type TEXT NOT NULL DEFAULT 'url' CHECK (goal_type IN ('url', 'tag', 'event', 'purchase')),
  conditions JSONB NOT NULL DEFAULT '{}',
  auto_tag_id UUID REFERENCES tags(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES conversion_goals(id) ON DELETE CASCADE,
  follower_id UUID REFERENCES line_followers(id) ON DELETE SET NULL,
  source_broadcast_id UUID REFERENCES broadcasts(id) ON DELETE SET NULL,
  source_type TEXT,
  converted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversion_goals_user ON conversion_goals(user_id);
CREATE INDEX idx_conversion_events_goal ON conversion_events(goal_id);
CREATE INDEX idx_conversion_events_converted ON conversion_events(converted_at);

-- ============================================================
-- 11. サイトスクリプト (site_tracking)
-- ============================================================
CREATE TABLE site_tracking_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_url TEXT,
  script_code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE site_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES site_tracking_scripts(id) ON DELETE CASCADE,
  follower_id UUID REFERENCES line_followers(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL DEFAULT 'pageview',
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_site_tracking_scripts_user ON site_tracking_scripts(user_id);
CREATE INDEX idx_site_tracking_events_script ON site_tracking_events(script_id);
CREATE INDEX idx_site_tracking_events_follower ON site_tracking_events(follower_id);

-- ============================================================
-- 12. スタッフ権限設定 (staff_members)
-- ============================================================
CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'general' CHECK (role IN ('admin', 'sub_admin', 'operator', 'general')),
  permissions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, email)
);

CREATE INDEX idx_staff_members_user ON staff_members(user_id);

-- ============================================================
-- 13. カレンダー予約 (calendar_slots / calendar_bookings)
-- ============================================================
CREATE TABLE calendar_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '予約枠',
  day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6),
  specific_date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_bookings INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE calendar_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES calendar_slots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  follower_id UUID REFERENCES line_followers(id) ON DELETE SET NULL,
  booking_date DATE NOT NULL,
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_calendar_slots_user ON calendar_slots(user_id);
CREATE INDEX idx_calendar_bookings_slot ON calendar_bookings(slot_id);
CREATE INDEX idx_calendar_bookings_date ON calendar_bookings(booking_date);
CREATE INDEX idx_calendar_bookings_user ON calendar_bookings(user_id);

-- ============================================================
-- 14. Googleスプレッドシート連携 (sheet_connections)
-- ============================================================
CREATE TABLE sheet_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  spreadsheet_id TEXT NOT NULL,
  sheet_name TEXT NOT NULL DEFAULT 'Sheet1',
  data_type TEXT NOT NULL CHECK (data_type IN ('followers', 'messages', 'analytics', 'forms', 'orders')),
  sync_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'manual')),
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  credentials JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sheet_connections_user ON sheet_connections(user_id);

-- ============================================================
-- 15. アクション管理・スケジュール実行 (scheduled_actions)
-- ============================================================
CREATE TABLE scheduled_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('send_message', 'add_tag', 'remove_tag', 'move_scenario', 'send_email', 'notify')),
  action_config JSONB NOT NULL DEFAULT '{}',
  trigger_type TEXT NOT NULL DEFAULT 'datetime' CHECK (trigger_type IN ('datetime', 'cron', 'event')),
  trigger_config JSONB NOT NULL DEFAULT '{}',
  target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'segment', 'tag', 'individual')),
  target_config JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'failed')),
  last_executed_at TIMESTAMPTZ,
  next_execution_at TIMESTAMPTZ,
  execution_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES scheduled_actions(id) ON DELETE CASCADE,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  target_count INT DEFAULT 0,
  success_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  errors JSONB DEFAULT '[]'
);

CREATE INDEX idx_scheduled_actions_user ON scheduled_actions(user_id);
CREATE INDEX idx_scheduled_actions_next ON scheduled_actions(next_execution_at) WHERE status = 'active';
CREATE INDEX idx_action_logs_action ON action_logs(action_id);

-- ============================================================
-- RLS ポリシー
-- ============================================================
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_forms" ON forms FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE form_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_form_questions" ON form_questions FOR ALL USING (
  form_id IN (SELECT id FROM forms WHERE user_id = auth.uid())
) WITH CHECK (form_id IN (SELECT id FROM forms WHERE user_id = auth.uid()));

ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_form_responses" ON form_responses FOR ALL USING (
  form_id IN (SELECT id FROM forms WHERE user_id = auth.uid())
) WITH CHECK (form_id IN (SELECT id FROM forms WHERE user_id = auth.uid()));

ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_broadcasts" ON broadcasts FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE keyword_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_keyword_rules" ON keyword_rules FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE reminder_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_reminder_sequences" ON reminder_sequences FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_reminder_logs" ON reminder_logs FOR ALL USING (
  sequence_id IN (SELECT id FROM reminder_sequences WHERE user_id = auth.uid())
) WITH CHECK (sequence_id IN (SELECT id FROM reminder_sequences WHERE user_id = auth.uid()));

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_message_templates" ON message_templates FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_saved_filters" ON saved_filters FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_operators" ON operators FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_notification_settings" ON notification_settings FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_notification_logs" ON notification_logs FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_import_jobs" ON import_jobs FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE conversion_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_conversion_goals" ON conversion_goals FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_conversion_events" ON conversion_events FOR ALL USING (
  goal_id IN (SELECT id FROM conversion_goals WHERE user_id = auth.uid())
) WITH CHECK (goal_id IN (SELECT id FROM conversion_goals WHERE user_id = auth.uid()));

ALTER TABLE site_tracking_scripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_site_scripts" ON site_tracking_scripts FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE site_tracking_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_site_events" ON site_tracking_events FOR ALL USING (
  script_id IN (SELECT id FROM site_tracking_scripts WHERE user_id = auth.uid())
) WITH CHECK (script_id IN (SELECT id FROM site_tracking_scripts WHERE user_id = auth.uid()));

ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_staff" ON staff_members FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE calendar_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_calendar_slots" ON calendar_slots FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE calendar_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_calendar_bookings" ON calendar_bookings FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE sheet_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_sheet_connections" ON sheet_connections FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE scheduled_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_scheduled_actions" ON scheduled_actions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_action_logs" ON action_logs FOR ALL USING (
  action_id IN (SELECT id FROM scheduled_actions WHERE user_id = auth.uid())
) WITH CHECK (action_id IN (SELECT id FROM scheduled_actions WHERE user_id = auth.uid()));

-- updated_atトリガー
CREATE TRIGGER forms_updated BEFORE UPDATE ON forms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER keyword_rules_updated BEFORE UPDATE ON keyword_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER reminder_sequences_updated BEFORE UPDATE ON reminder_sequences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER message_templates_updated BEFORE UPDATE ON message_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER saved_filters_updated BEFORE UPDATE ON saved_filters FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER operators_updated BEFORE UPDATE ON operators FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER staff_members_updated BEFORE UPDATE ON staff_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER calendar_bookings_updated BEFORE UPDATE ON calendar_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER scheduled_actions_updated BEFORE UPDATE ON scheduled_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
