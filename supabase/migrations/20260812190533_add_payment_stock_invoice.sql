/*
# Optics Dashboard: Add payment method, lens stock, update seed data to ILS

## Overview
Extends the existing schema to support:
- Payment methods (cash/credit/check) on orders
- Per-power lens stock tracking
- Updated seed data with Israeli Shekel (₪) pricing

## Changes

### Modified Tables
1. `orders`
   - ADD COLUMN `payment_method` text NOT NULL DEFAULT 'cash'
     (values: 'cash' | 'credit' | 'check')

### New Tables
1. `lens_stock` — stock quantity per lens product per SPH power
   - `id` (uuid PK)
   - `lens_product_id` (uuid FK → lens_products, cascade delete)
   - `sph` (numeric(5,2), sphere power, e.g. -2.50)
   - `stock_qty` (integer, available boxes)
   - UNIQUE constraint on (lens_product_id, sph)

2. `invoices` — invoice records for printed invoices
   - `id` (uuid PK)
   - `order_id` (uuid FK → orders, cascade delete)
   - `invoice_number` (text, unique, auto-generated)
   - `created_at` (timestamptz)

### Seed Data Updates
- Lens products: prices in ₪ (Israeli Shekel)
- Products: prices in ₪
- Lens stock: per-power stock for each lens product
- Clients: credit limits in ₪

## Security
- RLS enabled on new tables with anon+authenticated full CRUD (internal dashboard)
*/

-- Add payment_method to orders
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_method text NOT NULL DEFAULT 'cash';
  END IF;
END $$;

-- Lens stock table
CREATE TABLE IF NOT EXISTS lens_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lens_product_id uuid NOT NULL REFERENCES lens_products(id) ON DELETE CASCADE,
  sph numeric(5,2) NOT NULL,
  stock_qty integer NOT NULL DEFAULT 0,
  UNIQUE (lens_product_id, sph)
);
ALTER TABLE lens_stock ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_lens_stock" ON lens_stock;
CREATE POLICY "anon_select_lens_stock" ON lens_stock FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_lens_stock" ON lens_stock;
CREATE POLICY "anon_insert_lens_stock" ON lens_stock FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_lens_stock" ON lens_stock;
CREATE POLICY "anon_update_lens_stock" ON lens_stock FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_lens_stock" ON lens_stock;
CREATE POLICY "anon_delete_lens_stock" ON lens_stock FOR DELETE TO anon, authenticated USING (true);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_invoices" ON invoices;
CREATE POLICY "anon_select_invoices" ON invoices FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_invoices" ON invoices;
CREATE POLICY "anon_insert_invoices" ON invoices FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_invoices" ON invoices;
CREATE POLICY "anon_update_invoices" ON invoices FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_invoices" ON invoices;
CREATE POLICY "anon_delete_invoices" ON invoices FOR DELETE TO anon, authenticated USING (true);

-- Update existing seed prices to ₪ (Israeli Shekel)
UPDATE lens_products SET unit_price = 45.00 WHERE brand = 'أكوفيو أوازيس';
UPDATE lens_products SET unit_price = 38.00 WHERE brand = 'بايوفينيتي';
UPDATE lens_products SET unit_price = 52.00 WHERE brand = 'ديليز أجيل';
UPDATE lens_products SET unit_price = 30.00 WHERE brand = 'سوف كلير';
UPDATE lens_products SET unit_price = 42.00 WHERE brand = 'أوبرا فيجن';
UPDATE lens_products SET unit_price = 35.00 WHERE brand = 'فريش لوك';

-- Update product prices to ₪
UPDATE products SET unit_price = 25.00, stock_qty = 200 WHERE sku = 'SOL-360';
UPDATE products SET unit_price = 12.00, stock_qty = 150 WHERE sku = 'SOL-120';
UPDATE products SET unit_price = 18.00, stock_qty = 300 WHERE sku = 'DRP-15';
UPDATE products SET unit_price = 15.00, stock_qty = 180 WHERE sku = 'DRP-10';
UPDATE products SET unit_price = 85.00, stock_qty = 75 WHERE sku = 'FRM-M01';
UPDATE products SET unit_price = 65.00, stock_qty = 90 WHERE sku = 'FRM-P01';
UPDATE products SET unit_price = 120.00, stock_qty = 40 WHERE sku = 'FRM-S01';
UPDATE products SET unit_price = 110.00, stock_qty = 35 WHERE sku = 'FRM-S02';
UPDATE products SET unit_price = 8.00, stock_qty = 500 WHERE sku = 'ACC-LC';
UPDATE products SET unit_price = 6.00, stock_qty = 400 WHERE sku = 'ACC-TW';
UPDATE products SET unit_price = 5.00, stock_qty = 600 WHERE sku = 'ACC-MF';
UPDATE products SET unit_price = 3.00, stock_qty = 800 WHERE sku = 'ACC-STR';

-- Update client credit limits to ₪
UPDATE clients SET credit_limit = 50000, outstanding_balance = 12500 WHERE code = 'CL-001';
UPDATE clients SET credit_limit = 80000, outstanding_balance = 78000 WHERE code = 'CL-002';
UPDATE clients SET credit_limit = 30000, outstanding_balance = 5000 WHERE code = 'CL-003';
UPDATE clients SET credit_limit = 120000, outstanding_balance = 0 WHERE code = 'CL-004';
UPDATE clients SET credit_limit = 25000, outstanding_balance = 25000 WHERE code = 'CL-005';

-- Seed lens stock: generate stock for each lens product across SPH values -0.50 to -10.00
-- Using a DO block to insert programmatically
DO $$
DECLARE
  lp RECORD;
  sph_val numeric;
  qty int;
BEGIN
  FOR lp IN SELECT id FROM lens_products LOOP
    sph_val := -0.50;
    WHILE sph_val >= -10.00 LOOP
      -- Generate realistic random-ish stock between 5 and 80
      qty := 5 + abs(hashtext(lp.id::text || sph_val::text)) % 76;
      INSERT INTO lens_stock (lens_product_id, sph, stock_qty)
      VALUES (lp.id, sph_val, qty)
      ON CONFLICT (lens_product_id, sph) DO NOTHING;
      sph_val := sph_val - 0.25;
    END LOOP;
  END LOOP;
END $$;
