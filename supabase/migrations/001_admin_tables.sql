-- ══════════════════════════════════════════════════════════════════
-- Lam Tuyen Linen — Admin Tables Migration
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vyldmdavizedqhihnkwg/sql/new
-- Safe to re-run — uses IF NOT EXISTS throughout.
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Extend orders table with admin workflow columns ───────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'new';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quoted_price_vnd bigint;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS final_price bigint;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS owner_notes text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quoted_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Measurement columns (from the bespoke form update)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS high_hip numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shoulder_to_shoulder numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS across_chest numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS across_back numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bust_point numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bust_height numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS under_bust numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS arm_length numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS elbow numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS armhole numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS head numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS waist_to_hip numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS waist_to_knee numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS back_length numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS front_length numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS waist_to_floor numeric;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS posture_notes text;

-- ── 2. customers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  email text UNIQUE,
  phone text,
  country text,
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  measurements jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 3. order_items ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_ref text,
  garment text,
  colour text,
  size text,
  quantity integer DEFAULT 1,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ── 4. pricing_data ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pricing_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_ref text,
  garment text,
  measurements jsonb,
  fabric_meters numeric,
  fabric_cost_per_meter numeric,
  labour_cost numeric,
  shipping_cost numeric,
  total_cost numeric,
  final_price numeric,
  profit_margin numeric,
  country text,
  created_at timestamptz DEFAULT now()
);

-- ── 5. settings ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO settings (key, value) VALUES
('profit_margin', '2.5'),
('fabric_costs', '{"default": 150000}'),
('fabric_meters', '{
  "Womens Dress Midi": 2.8,
  "Womens Dress Maxi": 3.2,
  "Wide-Sleeve Blouse": 2.0,
  "Classic Linen Shirt": 2.2,
  "Tapered Linen Trousers": 2.5,
  "Linen Two-Piece Set": 4.0,
  "Linen Maxi Wrap Dress": 3.5,
  "Ao Dai": 2.8,
  "Bespoke Linen Suit": 4.5,
  "Custom Linen Dress": 3.0,
  "Custom Linen Set": 4.2
}'),
('shipping_zones', '{
  "Vietnam": 35000,
  "Japan": 450000,
  "South Korea": 420000,
  "Singapore": 380000,
  "Hong Kong": 380000,
  "Taiwan": 400000,
  "Australia": 520000,
  "New Zealand": 540000,
  "United States": 580000,
  "Canada": 600000,
  "United Kingdom": 560000,
  "France": 550000,
  "Germany": 550000,
  "default_asia": 430000,
  "default_oceania": 530000,
  "default_americas": 590000,
  "default_europe": 560000,
  "default_world": 620000
}'),
('bank_transfer', '{
  "bank_name": "Vietcombank",
  "account_name": "Vo Thi Tuyen",
  "account_number": "",
  "branch": "Da Nang"
}'),
('auto_pricing_enabled', 'false'),
('orders_until_auto_pricing', '350')
ON CONFLICT (key) DO NOTHING;

-- ── 6. linen_club ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS linen_club (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  email text UNIQUE,
  joined_at timestamptz DEFAULT now()
);

-- ── 7. Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_email_idx ON orders(email);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_ref_idx ON orders(order_ref);
CREATE INDEX IF NOT EXISTS pricing_data_garment_idx ON pricing_data(garment);
CREATE INDEX IF NOT EXISTS pricing_data_country_idx ON pricing_data(country);

-- ── 8. Row Level Security ────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE linen_club ENABLE ROW LEVEL SECURITY;

-- orders: public INSERT (customer form), authenticated SELECT/UPDATE
DROP POLICY IF EXISTS "public insert orders" ON orders;
CREATE POLICY "public insert orders" ON orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "auth select orders" ON orders;
CREATE POLICY "auth select orders" ON orders FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "auth update orders" ON orders;
CREATE POLICY "auth update orders" ON orders FOR UPDATE USING (auth.role() = 'authenticated');

-- customers: authenticated full access
DROP POLICY IF EXISTS "auth manage customers" ON customers;
CREATE POLICY "auth manage customers" ON customers FOR ALL USING (auth.role() = 'authenticated');

-- order_items: authenticated full access
DROP POLICY IF EXISTS "auth manage order_items" ON order_items;
CREATE POLICY "auth manage order_items" ON order_items FOR ALL USING (auth.role() = 'authenticated');

-- pricing_data: authenticated full access
DROP POLICY IF EXISTS "auth manage pricing_data" ON pricing_data;
CREATE POLICY "auth manage pricing_data" ON pricing_data FOR ALL USING (auth.role() = 'authenticated');

-- settings: authenticated full access
DROP POLICY IF EXISTS "auth manage settings" ON settings;
CREATE POLICY "auth manage settings" ON settings FOR ALL USING (auth.role() = 'authenticated');

-- linen_club: public INSERT, authenticated SELECT
DROP POLICY IF EXISTS "public insert linen_club" ON linen_club;
CREATE POLICY "public insert linen_club" ON linen_club FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "auth select linen_club" ON linen_club;
CREATE POLICY "auth select linen_club" ON linen_club FOR SELECT USING (auth.role() = 'authenticated');

-- ── 9. Realtime — enable for orders table ────────────────────────
-- Run this to enable realtime notifications for new orders:
-- ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ══════════════════════════════════════════════════════════════════
-- After running this SQL:
-- 1. Add https://lamtuyenlinen.com/admin to Supabase Auth → URL Configuration → Redirect URLs
-- 2. Deploy edge functions:
--    npx supabase functions deploy admin-api --no-verify-jwt
-- 3. The owner (tailorlamtuyen@gmail.com) should sign in via admin.html
--    to create their Supabase Auth account.
-- ══════════════════════════════════════════════════════════════════
