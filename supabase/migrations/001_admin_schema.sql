-- ══════════════════════════════════════════════════════════════
-- Lam Tuyen Linen — Admin Schema Migration
-- Run this once in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vyldmdavizedqhihnkwg/sql/new
-- ══════════════════════════════════════════════════════════════

-- ── 1. Add admin columns to the orders table ─────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'new';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quoted_price_vnd bigint;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost_vnd bigint;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS owner_notes text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quoted_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS production_started_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Add new measurement columns (from FIX 1 — safe to run even if some already exist)
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

-- ── 2. Create pricing_settings table ─────────────────────────
CREATE TABLE IF NOT EXISTS pricing_settings (
  id text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Insert default pricing config (only if not already present)
INSERT INTO pricing_settings (id, value, updated_at)
VALUES (
  'config',
  '{
    "fabric_cost_per_meter": 180000,
    "margin_multiplier": 2.5,
    "shipping_zones": {
      "Vietnam": 50000,
      "Southeast Asia": 350000,
      "Asia Pacific": 500000,
      "Australia & NZ": 550000,
      "Europe": 650000,
      "Americas": 700000,
      "Rest of World": 600000
    },
    "garment_types": {
      "Shirt / Blouse":           {"meters": 2.2, "labour": 200000},
      "Dress (simple)":           {"meters": 2.8, "labour": 280000},
      "Dress (complex)":          {"meters": 3.2, "labour": 450000},
      "Trousers / Pants":         {"meters": 2.0, "labour": 250000},
      "Jacket / Blazer":          {"meters": 2.8, "labour": 500000},
      "Suit (2-piece)":           {"meters": 4.5, "labour": 900000},
      "Skirt":                    {"meters": 1.8, "labour": 180000},
      "Jumpsuit":                 {"meters": 3.0, "labour": 380000},
      "Linen Set (top + bottom)": {"meters": 3.8, "labour": 450000},
      "Custom / Other":           {"meters": 2.5, "labour": 300000}
    }
  }',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- ── 3. Create linen_club table (if not exists) ────────────────
CREATE TABLE IF NOT EXISTS linen_club (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  joined_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS linen_club_email_idx ON linen_club(email);

-- ── 4. Row Level Security ─────────────────────────────────────
-- Enable RLS on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE linen_club ENABLE ROW LEVEL SECURITY;

-- Orders: anyone (anon) can INSERT new orders (customer form)
DROP POLICY IF EXISTS "anon can insert orders" ON orders;
CREATE POLICY "anon can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Orders: authenticated users (admin) can read and update
DROP POLICY IF EXISTS "auth can select orders" ON orders;
CREATE POLICY "auth can select orders" ON orders
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "auth can update orders" ON orders;
CREATE POLICY "auth can update orders" ON orders
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Pricing settings: authenticated only
DROP POLICY IF EXISTS "auth can manage settings" ON pricing_settings;
CREATE POLICY "auth can manage settings" ON pricing_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Linen club: anon can insert (signup form), auth can read
DROP POLICY IF EXISTS "anon can insert linen_club" ON linen_club;
CREATE POLICY "anon can insert linen_club" ON linen_club
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "auth can select linen_club" ON linen_club;
CREATE POLICY "auth can select linen_club" ON linen_club
  FOR SELECT USING (auth.role() = 'authenticated');

-- ── 5. Index for fast order lookups ──────────────────────────
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_ref_idx ON orders(order_ref);

-- ── DONE ──────────────────────────────────────────────────────
-- After running this SQL:
-- 1. Go to Authentication > URL Configuration in Supabase Dashboard
--    Add https://lamtuyenlinen.com/admin to "Redirect URLs"
-- 2. Go to Authentication > Users — the owner (tailorlamtuyen@gmail.com)
--    will be created automatically on first magic link login
-- 3. Deploy the new Edge Functions:
--    npx supabase functions deploy send-quote-email --no-verify-jwt
--    npx supabase functions deploy send-shipped-email --no-verify-jwt
