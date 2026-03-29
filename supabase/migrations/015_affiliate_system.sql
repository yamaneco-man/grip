-- アフィリエイトプログラム
CREATE TABLE affiliate_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  commission_type TEXT NOT NULL DEFAULT 'recurring' CHECK (commission_type IN ('one_time', 'recurring')),
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  commission_amount INTEGER,
  cookie_days INTEGER NOT NULL DEFAULT 30,
  min_payout INTEGER NOT NULL DEFAULT 5000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- アフィリエイトパートナー
CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES affiliate_programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  partner_email TEXT NOT NULL,
  affiliate_code TEXT NOT NULL UNIQUE,
  payment_info JSONB,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  total_clicks INTEGER NOT NULL DEFAULT 0,
  total_conversions INTEGER NOT NULL DEFAULT 0,
  total_revenue INTEGER NOT NULL DEFAULT 0,
  total_commission INTEGER NOT NULL DEFAULT 0,
  total_paid INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- アフィリエイトクリックログ
CREATE TABLE affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  landing_page TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- アフィリエイトコンバージョン
CREATE TABLE affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  click_id UUID REFERENCES affiliate_clicks(id) ON DELETE SET NULL,
  order_id TEXT,
  revenue INTEGER NOT NULL DEFAULT 0,
  commission INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  converted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- アフィリエイト支払い
CREATE TABLE affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payment_method TEXT,
  payment_reference TEXT,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_affiliate_programs_user ON affiliate_programs(user_id);
CREATE INDEX idx_affiliates_program ON affiliates(program_id);
CREATE INDEX idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX idx_affiliate_clicks_affiliate ON affiliate_clicks(affiliate_id);
CREATE INDEX idx_affiliate_conversions_affiliate ON affiliate_conversions(affiliate_id);
CREATE INDEX idx_affiliate_payouts_affiliate ON affiliate_payouts(affiliate_id);

CREATE TRIGGER affiliate_programs_updated_at BEFORE UPDATE ON affiliate_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER affiliates_updated_at BEFORE UPDATE ON affiliates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
