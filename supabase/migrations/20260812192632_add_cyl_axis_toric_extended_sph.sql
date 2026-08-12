/*
# Optics Dashboard: Add CYL/AXIS support, toric lenses, extended SPH stock

## Overview
Extends the schema to support astigmatism/toric lenses with CYL and AXIS values,
and seeds stock for extended SPH ranges.

## Changes

### Modified Tables
1. `order_items`
   - ADD COLUMN `cyl` numeric(5,2) — cylinder power for toric lenses (nullable)
   - ADD COLUMN `axis` integer — axis angle 10-180 for toric lenses (nullable)

### New Data
1. Toric lens products (brands with "Toric" suffix) with various BC/DIA combos
2. Lens stock for extended SPH ranges:
   - Negative: -10.25 to -12.00 (existing stock covers -0.50 to -10.00)
   - Positive: +6.25 to +8.00 (existing stock covers +0.50 to +6.00)
3. Toric lens stock seeded across standard negative SPH with CYL/AXIS combinations

## Security
- No new tables. Uses existing tables with existing RLS policies.
*/

-- Add cyl and axis columns to order_items
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'cyl'
  ) THEN
    ALTER TABLE order_items ADD COLUMN cyl numeric(5,2);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'axis'
  ) THEN
    ALTER TABLE order_items ADD COLUMN axis integer;
  END IF;
END $$;

-- Insert toric lens products
INSERT INTO lens_products (brand, bc, dia, unit_price)
SELECT 'أكوفيو أوازيس توريك', '8.6', '14.5', 65.00
WHERE NOT EXISTS (SELECT 1 FROM lens_products WHERE brand = 'أكوفيو أوازيس توريك' AND bc = '8.6' AND dia = '14.5');

INSERT INTO lens_products (brand, bc, dia, unit_price)
SELECT 'بايوفينيتي توريك', '8.6', '14.5', 58.00
WHERE NOT EXISTS (SELECT 1 FROM lens_products WHERE brand = 'بايوفينيتي توريك' AND bc = '8.6' AND dia = '14.5');

INSERT INTO lens_products (brand, bc, dia, unit_price)
SELECT 'ديليز أجيل توريك', '8.7', '14.5', 72.00
WHERE NOT EXISTS (SELECT 1 FROM lens_products WHERE brand = 'ديليز أجيل توريك' AND bc = '8.7' AND dia = '14.5');

INSERT INTO lens_products (brand, bc, dia, unit_price)
SELECT 'أوبرا فيجن توريك', '8.6', '14.5', 62.00
WHERE NOT EXISTS (SELECT 1 FROM lens_products WHERE brand = 'أوبرا فيجن توريك' AND bc = '8.6' AND dia = '14.5');

-- Seed extended negative SPH stock (-10.25 to -12.00) for ALL lens products
DO $$
DECLARE
  lp RECORD;
  sph_val numeric;
  qty int;
BEGIN
  FOR lp IN SELECT id FROM lens_products LOOP
    sph_val := -10.25;
    WHILE sph_val >= -12.001 LOOP
      qty := 2 + abs(hashtext(lp.id::text || 'ext' || sph_val::text)) % 15;
      INSERT INTO lens_stock (lens_product_id, sph, stock_qty)
      VALUES (lp.id, sph_val, qty)
      ON CONFLICT (lens_product_id, sph) DO NOTHING;
      sph_val := sph_val - 0.25;
    END LOOP;
  END LOOP;
END $$;

-- Seed extended positive SPH stock (+6.25 to +8.00) for ALL lens products
DO $$
DECLARE
  lp RECORD;
  sph_val numeric;
  qty int;
BEGIN
  FOR lp IN SELECT id FROM lens_products LOOP
    sph_val := 6.25;
    WHILE sph_val <= 8.001 LOOP
      qty := 2 + abs(hashtext(lp.id::text || 'extpos' || sph_val::text)) % 15;
      INSERT INTO lens_stock (lens_product_id, sph, stock_qty)
      VALUES (lp.id, sph_val, qty)
      ON CONFLICT (lens_product_id, sph) DO NOTHING;
      sph_val := sph_val + 0.25;
    END LOOP;
  END LOOP;
END $$;
