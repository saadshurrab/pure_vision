/*
# Optics Order Entry Dashboard Schema

## Overview
Creates the database for an internal optics supply company order entry dashboard.
Single-tenant app (no auth) — all data is shared among internal operators.

## New Tables

1. `clients` — optical shop customers
   - `id` (uuid PK)
   - `name` (text, Arabic display name)
   - `code` (text, unique short code)
   - `credit_limit` (numeric, max allowed outstanding balance)
   - `outstanding_balance` (numeric, current unpaid balance)
   - `phone` (text)
   - `city` (text)
   - `active` (boolean, default true)
   - `created_at` (timestamptz)

2. `lens_products` — contact lens types (brand + base curve + diameter)
   - `id` (uuid PK)
   - `brand` (text, Arabic brand name)
   - `bc` (text, base curve, e.g. "8.6")
   - `dia` (text, diameter, e.g. "14.2")
   - `unit_price` (numeric)
   - `active` (boolean, default true)
   - `created_at` (timestamptz)

3. `products` — additional items (solutions, frames, accessories)
   - `id` (uuid PK)
   - `name` (text, Arabic name)
   - `category` (text: 'solution' | 'frame' | 'accessory')
   - `sku` (text)
   - `unit_price` (numeric)
   - `stock_qty` (integer, current stock)
   - `active` (boolean, default true)
   - `created_at` (timestamptz)

4. `orders` — order header
   - `id` (uuid PK)
   - `client_id` (uuid FK → clients)
   - `subtotal` (numeric)
   - `discount_percent` (numeric, 0-100)
   - `discount_amount` (numeric)
   - `total` (numeric)
   - `status` (text: 'draft' | 'confirmed' | 'cancelled')
   - `notes` (text)
   - `created_at` (timestamptz)

5. `order_items` — line items (products and lenses)
   - `id` (uuid PK)
   - `order_id` (uuid FK → orders, cascade delete)
   - `item_type` (text: 'product' | 'lens')
   - `product_id` (uuid nullable FK → products)
   - `lens_product_id` (uuid nullable FK → lens_products)
   - `sph` (numeric nullable, sphere power for lens items)
   - `quantity` (integer)
   - `unit_price` (numeric)
   - `line_total` (numeric)

## Security
- RLS enabled on all tables.
- All tables allow anon + authenticated full CRUD (internal shared dashboard, no auth).
*/

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  credit_limit numeric(12,2) NOT NULL DEFAULT 0,
  outstanding_balance numeric(12,2) NOT NULL DEFAULT 0,
  phone text,
  city text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_clients" ON clients;
CREATE POLICY "anon_select_clients" ON clients FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_clients" ON clients;
CREATE POLICY "anon_insert_clients" ON clients FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_clients" ON clients;
CREATE POLICY "anon_update_clients" ON clients FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_clients" ON clients;
CREATE POLICY "anon_delete_clients" ON clients FOR DELETE TO anon, authenticated USING (true);

-- Lens products
CREATE TABLE IF NOT EXISTS lens_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  bc text NOT NULL,
  dia text NOT NULL,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE lens_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_lens_products" ON lens_products;
CREATE POLICY "anon_select_lens_products" ON lens_products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_lens_products" ON lens_products;
CREATE POLICY "anon_insert_lens_products" ON lens_products FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_lens_products" ON lens_products;
CREATE POLICY "anon_update_lens_products" ON lens_products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_lens_products" ON lens_products;
CREATE POLICY "anon_delete_lens_products" ON lens_products FOR DELETE TO anon, authenticated USING (true);

-- Products (additional items)
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'accessory',
  sku text,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  stock_qty integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE TO anon, authenticated USING (true);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_orders" ON orders;
CREATE POLICY "anon_select_orders" ON orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE TO anon, authenticated USING (true);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_type text NOT NULL DEFAULT 'product',
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  lens_product_id uuid REFERENCES lens_products(id) ON DELETE SET NULL,
  sph numeric(5,2),
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  line_total numeric(12,2) NOT NULL DEFAULT 0
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_order_items" ON order_items;
CREATE POLICY "anon_select_order_items" ON order_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_order_items" ON order_items;
CREATE POLICY "anon_insert_order_items" ON order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_order_items" ON order_items;
CREATE POLICY "anon_update_order_items" ON order_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_order_items" ON order_items;
CREATE POLICY "anon_delete_order_items" ON order_items FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Seed: clients
INSERT INTO clients (name, code, credit_limit, outstanding_balance, phone, city) VALUES
('صيدلية النور', 'CL-001', 50000, 12500, '0501234567', 'الرياض'),
('مركز البصرة للبصريات', 'CL-002', 80000, 78000, '0559876543', 'جدة'),
('محلات الرؤية الذهبية', 'CL-003', 30000, 5000, '0533334444', 'الدمام'),
('مؤسسة الإبصار الطبية', 'CL-004', 120000, 0, '0545556666', 'مكة'),
('بصريات الواحة', 'CL-005', 25000, 25000, '0567778888', 'الخبر')
ON CONFLICT (code) DO NOTHING;

-- Seed: lens products
INSERT INTO lens_products (brand, bc, dia, unit_price) VALUES
('أكوفيو أوازيس', '8.6', '14.2', 45.00),
('بايوفينيتي', '8.6', '14.0', 38.00),
('ديليز أجيل', '8.7', '14.2', 52.00),
('سوف كلير', '8.4', '14.0', 30.00),
('أوبرا فيجن', '8.6', '14.2', 42.00),
('فريش لوك', '8.5', '14.2', 35.00)
ON CONFLICT DO NOTHING;

-- Seed: products (solutions, frames, accessories)
INSERT INTO products (name, category, sku, unit_price, stock_qty) VALUES
('محلول تنظيف متعدد الأغراض 360مل', 'solution', 'SOL-360', 25.00, 200),
('محلول تنظيف متعدد الأغراض 120مل', 'solution', 'SOL-120', 12.00, 150),
('قطرة عيون مرطبة 15مل', 'solution', 'DRP-15', 18.00, 300),
('قطرات عدسات لاصقة 10مل', 'solution', 'DRP-10', 15.00, 180),
('إطار نظارة طبي معدني', 'frame', 'FRM-M01', 85.00, 75),
('إطار نظارة طبي بلاستيكي', 'frame', 'FRM-P01', 65.00, 90),
('إطار نظارة شمسية رجالي', 'frame', 'FRM-S01', 120.00, 40),
('إطار نظارة شمسية نسائي', 'frame', 'FRM-S02', 110.00, 35),
('علبة عدسات لاصقة', 'accessory', 'ACC-LC', 8.00, 500),
('ملقط عدسات لاصقة', 'accessory', 'ACC-TW', 6.00, 400),
('منشفة نظافة ميكروفايبر', 'accessory', 'ACC-MF', 5.00, 600),
('سوار نظارة', 'accessory', 'ACC-STR', 3.00, 800)
ON CONFLICT DO NOTHING;
