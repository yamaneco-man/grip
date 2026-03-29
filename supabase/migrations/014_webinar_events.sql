-- 自動ウェビナー
CREATE TABLE webinars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_minutes INTEGER,
  schedule_type TEXT NOT NULL DEFAULT 'evergreen' CHECK (schedule_type IN ('live', 'evergreen', 'scheduled')),
  available_times JSONB DEFAULT '[]',
  registration_page_html TEXT,
  thank_you_page_html TEXT,
  replay_available BOOLEAN NOT NULL DEFAULT true,
  replay_expires_hours INTEGER DEFAULT 48,
  cta_button_text TEXT DEFAULT '今すぐ申し込む',
  cta_button_url TEXT,
  cta_show_at_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ウェビナー登録者
CREATE TABLE webinar_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id UUID NOT NULL REFERENCES webinars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT NOT NULL,
  follower_id UUID REFERENCES line_followers(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ,
  attended BOOLEAN NOT NULL DEFAULT false,
  attended_duration_minutes INTEGER DEFAULT 0,
  clicked_cta BOOLEAN NOT NULL DEFAULT false,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- イベント・予約管理
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'seminar' CHECK (event_type IN ('seminar', 'consultation', 'workshop', 'other')),
  location_type TEXT NOT NULL DEFAULT 'online' CHECK (location_type IN ('online', 'offline', 'hybrid')),
  location_url TEXT,
  location_address TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  max_participants INTEGER,
  price INTEGER NOT NULL DEFAULT 0,
  registration_page_html TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- イベント予約
CREATE TABLE event_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  follower_id UUID REFERENCES line_followers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'attended', 'no_show')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'free')),
  notes TEXT,
  booked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webinars_user_id ON webinars(user_id);
CREATE INDEX idx_webinar_registrations_webinar ON webinar_registrations(webinar_id);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_start_at ON events(start_at);
CREATE INDEX idx_event_bookings_event ON event_bookings(event_id);

CREATE TRIGGER webinars_updated_at BEFORE UPDATE ON webinars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
