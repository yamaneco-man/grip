-- 商品管理（統合EC）
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  sale_price INTEGER,
  product_type TEXT NOT NULL DEFAULT 'digital' CHECK (product_type IN ('digital', 'subscription', 'course', 'service')),
  image_url TEXT,
  delivery_method TEXT DEFAULT 'auto' CHECK (delivery_method IN ('auto', 'manual', 'course', 'download')),
  download_url TEXT,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- オーダーバンプ設定
CREATE TABLE order_bumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  bump_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  description TEXT NOT NULL,
  discount_percent INTEGER DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- アップセル設定
CREATE TABLE upsells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trigger_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  offer_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  description TEXT NOT NULL,
  page_html TEXT,
  discount_percent INTEGER DEFAULT 0,
  upsell_type TEXT NOT NULL DEFAULT 'upsell' CHECK (upsell_type IN ('upsell', 'downsell', 'cross_sell')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 注文テーブル
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  follower_id UUID REFERENCES line_followers(id) ON DELETE SET NULL,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'cancelled')),
  subtotal INTEGER NOT NULL DEFAULT 0,
  discount INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'square',
  payment_id TEXT,
  ip_address TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 注文明細
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'main' CHECK (item_type IN ('main', 'bump', 'upsell')),
  price INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1
);

-- ファネル設計
CREATE TABLE funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 広告コンバージョン追跡
CREATE TABLE ad_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'meta' CHECK (platform IN ('meta', 'google', 'tiktok', 'yahoo')),
  event_name TEXT NOT NULL,
  event_data JSONB,
  pixel_id TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  follower_id UUID REFERENCES line_followers(id) ON DELETE SET NULL,
  value INTEGER,
  currency TEXT DEFAULT 'JPY',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 領収書・請求書テーブル
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  invoice_type TEXT NOT NULL DEFAULT 'receipt' CHECK (invoice_type IN ('receipt', 'invoice')),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  business_name TEXT,
  business_address TEXT,
  business_registration_number TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal INTEGER NOT NULL,
  tax INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  notes TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_order_bumps_product ON order_bumps(product_id);
CREATE INDEX idx_upsells_trigger ON upsells(trigger_product_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_customer ON orders(customer_email);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_funnels_user_id ON funnels(user_id);
CREATE INDEX idx_ad_conversions_user_id ON ad_conversions(user_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_order ON invoices(order_id);

CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER funnels_updated_at BEFORE UPDATE ON funnels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
