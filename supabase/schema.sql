-- =============================================
-- THE SHEHRI CO. — SUPABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS products (
  id           uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug         text UNIQUE NOT NULL,
  name         text NOT NULL,
  price        int NOT NULL,
  description  text,
  images       text[],
  color_images jsonb DEFAULT '{}'::jsonb,
  fabric_info  text,
  fit_notes    text,
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  size        text NOT NULL CHECK (size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size')),
  stock       int DEFAULT 0,
  reserved    int DEFAULT 0,
  sku         text UNIQUE,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name            text NOT NULL,
  phone           text UNIQUE NOT NULL,
  email           text,
  address_line1   text,
  address_line2   text,
  city            text,
  state           text,
  pincode         text,
  total_orders    int DEFAULT 0,
  total_spent     int DEFAULT 0,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  last_ordered_at timestamptz
);

CREATE TABLE IF NOT EXISTS orders (
  id                   uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number         text UNIQUE NOT NULL,
  customer_id          uuid REFERENCES customers(id),
  status               text DEFAULT 'pending' CHECK (status IN ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
  payment_status       text DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  razorpay_order_id    text,
  razorpay_payment_id  text,
  razorpay_signature   text,
  subtotal             int NOT NULL,
  shipping             int NOT NULL DEFAULT 199,
  discount             int NOT NULL DEFAULT 0,
  total                int NOT NULL,
  delivery_note        text,
  tracking_number      text,
  tracking_url         text,
  admin_notes          text,
  shipped_at           timestamptz,
  delivered_at         timestamptz,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id            uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id      uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id    uuid REFERENCES products(id),
  variant_id    uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name  text NOT NULL,
  size          text NOT NULL,
  price         int NOT NULL,
  quantity      int DEFAULT 1,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS waitlist (
  id           uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  email        text NOT NULL,
  phone        text,
  name         text,
  notified_at  timestamptz,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drops (
  id           uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name         text NOT NULL,
  launched_at  timestamptz,
  closed_at    timestamptz,
  notes        text,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS preorders (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name       text NOT NULL,
  email      text NOT NULL,
  phone      text,
  product    text,
  size       text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS broadcasts (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  type        text NOT NULL CHECK (type IN ('email','whatsapp')),
  subject     text,
  body        text NOT NULL,
  audience    text DEFAULT 'all',
  sent_to     int DEFAULT 0,
  sent_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS returns (
  id             uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ticket_number  text UNIQUE NOT NULL,
  order_id       uuid REFERENCES orders(id),
  customer_id    uuid REFERENCES customers(id),
  reason         text,
  status         text DEFAULT 'open' CHECK (status IN ('open','in_review','resolved','rejected')),
  admin_notes    text,
  resolved_at    timestamptz,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_history (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  variant_id      uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  previous_stock  int,
  new_stock       int,
  changed_by      text DEFAULT 'admin',
  note            text,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_log (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  type        text NOT NULL,
  message     text NOT NULL,
  is_read     boolean DEFAULT false,
  related_id  uuid,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id            uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id    text,
  event_type    text NOT NULL,
  page          text,
  product_slug  text,
  size          text,
  device        text,
  source        text,
  medium        text,
  campaign      text,
  referrer      text,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

-- Public: read active products
CREATE POLICY "Public read products" ON products
  FOR SELECT USING (is_active = true);

-- Public: read variants
CREATE POLICY "Public read variants" ON product_variants
  FOR SELECT USING (true);

-- Public: insert events (anonymous tracking)
CREATE POLICY "Public insert events" ON events
  FOR INSERT WITH CHECK (true);

-- Public: join waitlist
CREATE POLICY "Public insert waitlist" ON waitlist
  FOR INSERT WITH CHECK (true);

-- =============================================
-- SEED DATA
-- =============================================

INSERT INTO products (slug, name, price, description, images, fabric_info, fit_notes) VALUES
(
  'korean-pants',
  'Korean Pants',
  2000,
  'Korean-inspired trousers built for Delhi streets — relaxed through the hip, clean taper below the knee, zero logo noise. Structured enough to hold a silhouette, easy enough to live in all day. Part of Batch 001 — limited run, no restocks.',
  ARRAY['/model.png', '/details.png'],
  'Premium cotton twill with a medium hand-feel. Breathable for long days out, substantial enough to drape clean. Side pockets + back pockets. Machine wash cold, inside out. Hang dry. Low iron if needed.',
  'Relaxed fit with a tapered leg — sits at the natural waist. True to size for the intended drape; size up if you want a looser street hang or are between sizes. Model refs: 5''10" wears M.'
),
(
  'linen-pants',
  'Linen Pants',
  1500,
  'Easy, airy, effortless. The everyday bottom.',
  ARRAY['/model2.png', '/details.png'],
  '100% Pure Linen. Lightweight. Hand wash recommended.',
  'Relaxed fit. True to size. Light and breathable for all-day wear.'
)
ON CONFLICT (slug) DO NOTHING;

-- Korean Pants variants
INSERT INTO product_variants (product_id, size, stock, sku)
SELECT id, 'S',  15, 'KP-S'  FROM products WHERE slug = 'korean-pants'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_variants (product_id, size, stock, sku)
SELECT id, 'M',  20, 'KP-M'  FROM products WHERE slug = 'korean-pants'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_variants (product_id, size, stock, sku)
SELECT id, 'L',  18, 'KP-L'  FROM products WHERE slug = 'korean-pants'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_variants (product_id, size, stock, sku)
SELECT id, 'XL', 12, 'KP-XL' FROM products WHERE slug = 'korean-pants'
ON CONFLICT (sku) DO NOTHING;

-- Linen Pants variants
INSERT INTO product_variants (product_id, size, stock, sku)
SELECT id, 'S',  10, 'LP-S'  FROM products WHERE slug = 'linen-pants'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_variants (product_id, size, stock, sku)
SELECT id, 'M',  15, 'LP-M'  FROM products WHERE slug = 'linen-pants'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_variants (product_id, size, stock, sku)
SELECT id, 'L',  12, 'LP-L'  FROM products WHERE slug = 'linen-pants'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_variants (product_id, size, stock, sku)
SELECT id, 'XL',  8, 'LP-XL' FROM products WHERE slug = 'linen-pants'
ON CONFLICT (sku) DO NOTHING;

-- =============================================
-- HELPER FUNCTION: Order number generator
-- =============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  next_num int;
BEGIN
  SELECT COUNT(*) + 1 INTO next_num FROM orders;
  RETURN 'SHR-' || LPAD(next_num::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- updated_at trigger for orders
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- STORE SETTINGS (shipping rates)
-- =============================================
CREATE TABLE IF NOT EXISTS settings (
  id                  text PRIMARY KEY DEFAULT 'default',
  shipping_rate       integer NOT NULL DEFAULT 199,
  free_shipping_above integer NOT NULL DEFAULT 2000,
  updated_at          timestamptz DEFAULT now()
);

INSERT INTO settings (id, shipping_rate, free_shipping_above)
VALUES ('default', 199, 2000)
ON CONFLICT (id) DO NOTHING;
