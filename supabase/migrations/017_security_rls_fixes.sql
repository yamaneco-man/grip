-- セキュリティ修正: 全新テーブルにRLS追加

-- rich_menus
ALTER TABLE rich_menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_rich_menus" ON rich_menus FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- rich_menu_rules
ALTER TABLE rich_menu_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_rich_menu_rules" ON rich_menu_rules FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- conditional_messages
ALTER TABLE conditional_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_conditional_messages" ON conditional_messages FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- reminders
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_reminders" ON reminders FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ban_detection_logs
ALTER TABLE ban_detection_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_ban_logs" ON ban_detection_logs FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- scenario_templates (公開テンプレートはSELECT可)
ALTER TABLE scenario_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_read_public_or_own_templates" ON scenario_templates FOR SELECT USING (is_public = true OR user_id = auth.uid());
CREATE POLICY "users_manage_own_templates" ON scenario_templates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_update_own_templates" ON scenario_templates FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "users_delete_own_templates" ON scenario_templates FOR DELETE USING (user_id = auth.uid());

-- email_settings
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_email_settings" ON email_settings FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- email_subscribers
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_email_subscribers" ON email_subscribers FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- email_campaigns
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_email_campaigns" ON email_campaigns FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- email_sequences
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_email_sequences" ON email_sequences FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- email_sequence_steps (親テーブル経由)
ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_email_steps" ON email_sequence_steps FOR ALL USING (
  sequence_id IN (SELECT id FROM email_sequences WHERE user_id = auth.uid())
) WITH CHECK (
  sequence_id IN (SELECT id FROM email_sequences WHERE user_id = auth.uid())
);

-- email_send_logs
ALTER TABLE email_send_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_email_logs" ON email_send_logs FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- member_sites
ALTER TABLE member_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_member_sites" ON member_sites FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_courses" ON courses FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- lessons (親テーブル経由)
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_lessons" ON lessons FOR ALL USING (
  course_id IN (SELECT id FROM courses WHERE user_id = auth.uid())
) WITH CHECK (
  course_id IN (SELECT id FROM courses WHERE user_id = auth.uid())
);

-- members (サイト経由)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_members" ON members FOR ALL USING (
  site_id IN (SELECT id FROM member_sites WHERE user_id = auth.uid())
) WITH CHECK (
  site_id IN (SELECT id FROM member_sites WHERE user_id = auth.uid())
);

-- member_courses (会員経由)
ALTER TABLE member_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_member_courses" ON member_courses FOR ALL USING (
  member_id IN (SELECT m.id FROM members m JOIN member_sites s ON m.site_id = s.id WHERE s.user_id = auth.uid())
) WITH CHECK (
  member_id IN (SELECT m.id FROM members m JOIN member_sites s ON m.site_id = s.id WHERE s.user_id = auth.uid())
);

-- lesson_progress (会員経由)
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_lesson_progress" ON lesson_progress FOR ALL USING (
  member_id IN (SELECT m.id FROM members m JOIN member_sites s ON m.site_id = s.id WHERE s.user_id = auth.uid())
) WITH CHECK (
  member_id IN (SELECT m.id FROM members m JOIN member_sites s ON m.site_id = s.id WHERE s.user_id = auth.uid())
);

-- webinars
ALTER TABLE webinars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_webinars" ON webinars FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- webinar_registrations
ALTER TABLE webinar_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_webinar_regs" ON webinar_registrations FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_events" ON events FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- event_bookings
ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_event_bookings" ON event_bookings FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- affiliate_programs
ALTER TABLE affiliate_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_affiliate_programs" ON affiliate_programs FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- affiliates
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_affiliates" ON affiliates FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- affiliate_clicks (パートナー経由)
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_affiliate_clicks" ON affiliate_clicks FOR ALL USING (
  affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
) WITH CHECK (
  affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
);

-- affiliate_conversions (パートナー経由)
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_affiliate_convs" ON affiliate_conversions FOR ALL USING (
  affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
) WITH CHECK (
  affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
);

-- affiliate_payouts (パートナー経由)
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_affiliate_payouts" ON affiliate_payouts FOR ALL USING (
  affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
) WITH CHECK (
  affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
);

-- products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_products" ON products FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- order_bumps (商品経由)
ALTER TABLE order_bumps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_order_bumps" ON order_bumps FOR ALL USING (
  product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
) WITH CHECK (
  product_id IN (SELECT id FROM products WHERE user_id = auth.uid())
);

-- upsells
ALTER TABLE upsells ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_upsells" ON upsells FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_orders" ON orders FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- order_items (注文経由)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_order_items" ON order_items FOR ALL USING (
  order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
) WITH CHECK (
  order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);

-- funnels
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_funnels" ON funnels FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ad_conversions
ALTER TABLE ad_conversions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_ad_conversions" ON ad_conversions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_invoices" ON invoices FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- DB整合性修正
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_product_type_check;
ALTER TABLE products ADD CONSTRAINT products_product_type_check CHECK (product_type IN ('digital', 'physical', 'subscription', 'course', 'service'));

-- commission_rate制限追加
ALTER TABLE affiliate_programs ADD CONSTRAINT affiliate_programs_rate_check CHECK (commission_rate >= 0 AND commission_rate <= 100);

-- orders, membersにupdated_atカラム追加
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE TRIGGER members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- reminders.event_id に外部キー追加
ALTER TABLE reminders ADD CONSTRAINT reminders_event_id_fk FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;

-- 追加インデックス
CREATE INDEX IF NOT EXISTS idx_email_send_logs_campaign ON email_send_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_send_logs_sequence ON email_send_logs(sequence_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at ON affiliate_clicks(clicked_at);
