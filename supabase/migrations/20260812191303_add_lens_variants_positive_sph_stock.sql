/*
# Optics Dashboard: Add lens variants, positive SPH stock, BC/DIA diversity

## Overview
Expands lens product catalog with multiple BC/DIA variants per brand and seeds
stock for positive SPH powers (+0.50 to +6.00) across all lens products.

## Changes

### New Data
1. New lens_products entries — additional BC/DIA variants for existing brands:
   - أكوفيو أوازيس: BC 8.4 / DIA 14.0, BC 8.8 / DIA 14.5
   - بايوفينيتي: BC 8.4 / DIA 14.0, BC 8.7 / DIA 14.2
   - ديليز أجيل: BC 8.4 / DIA 14.0, BC 8.6 / DIA 14.2
   - سوف كلير: BC 8.6 / DIA 14.2, BC 8.7 / DIA 14.5
   - أوبرا فيجن: BC 8.4 / DIA 14.0, BC 8.7 / DIA 14.5
   - فريش لوك: BC 8.6 / DIA 14.0, BC 8.7 / DIA 14.2

2. Lens stock for positive SPH values (+0.50 to +6.00 in 0.25 steps = 23 values)
   seeded for ALL lens products (existing + new variants).

## Security
- No new tables. Uses existing lens_products and lens_stock tables with existing RLS policies.
*/

-- Insert new lens product variants with different BC/DIA
-- Using ON CONFLICT DO NOTHING against a potential unique constraint on (brand, bc, dia)
-- There's no such constraint, so we guard with NOT EXISTS checks

INSERT INTO lens_products (brand, bc, dia, unit_price)
SELECT 'أكوفيو أوازيس', '8.4', '14.0', 45.00
WHERE NOT EXISTS (
  SELECT 1 FROM lens_products WHERE brand = 'أكوفيو أوازيس' AND bc = '8.4' AND dia = '14.0'
);

INSERT INTO lens_products (brand, bc, dia, unit_price)
SELECT 'أكوفيو أوازيس', '8.8', '14.5', 48.00
WHERE NOT EXISTS (
  SELECT 1 FROM lens_products WHERE brand = 'أكوفيو أوازيس' AND bc = '8.8' AND dia = '14.5'
);

INSERT INTO lens_products (brand, bc, dia, unit_price)
SELECT 'بايوفينيتي', '8.4', '14.0', 36.00
WHERE NOT EXISTS (
  SELECT 1 FROM lens_products WHERE brand = 'بايوفينيتي' AND bc = '8.4' AND dia = '14.0'
);

INSERT INTO lens_products (brand, bc, dia, unit_price)
SELECT 'بايوفينيتي', '8.7', '14.2', 40.00
WHERE NOT EXISTS (
  SELECT 1 FROM lens_products WHERE brand = 'بايوفينيتي' AND bc = '8.7' AND dia = '14.2'
);

INSERT INTO lens_products (brand, bc, dia, unit_price)
SELECT 'ديليز أجيل', '8.4', '14.0', 50.00
WHERE NOT EXISTS (
  SELECT 1 FROM lens_products WHERE brand = 'ديليز أجيل' AND bc = '8.4' AND dia = '14.0'
);

INSERT INTO lens_products (brand, bc, dia, unit_price)
SELECT 'ديليز أجيل', '8.6', '14.2', 54.00
WHERE NOT EXISTS (
  SELECT 1 FROM lens_products WHERE brand = 'ديليز أجيل' AND bc = '8.6' AND dia = '14.2'
);

INSERT INTO lens_products (brand, bc, dia, unit_price)
SELECT 'سوف كلير', '8.6', '14.2', 32.00
WHERE NOT EXISTS (
  SELECT 1 FROM lens_products WHERE brand = 'سوف كلير' AND bc = '8.6' AND dia = '14.2'
);

INSERT INTO lens_products (brand, bc, dia, unit_price)
SELECT 'سوف كلير', '8.7', '14.5', 34.00
WHERE NOT EXISTS (
  SELECT 1 FROM lens_products WHERE brand = 'سوف كلير' AND bc = '8.7' AND dia = '14.5'
);

INSERT INTO lens_products (brand, bc, dia, unit_price)
SELECT 'أوبرا فيجن', '8.4', '14.0', 40.00
WHERE NOT EXISTS (
  SELECT 1 FROM lens_products WHERE brand = 'أوبرا فيجن' AND bc = '8.4' AND dia = '14.0'
);

INSERT INTO lens_products (brand, bc, dia, unit_price)
SELECT 'أوبرا فيجن', '8.7', '14.5', 44.00
WHERE NOT EXISTS (
  SELECT 1 FROM lens_products WHERE brand = 'أوبرا فيجن' AND bc = '8.7' AND dia = '14.5'
);

INSERT INTO lens_products (brand, bc, dia, unit_price)
SELECT 'فريش لوك', '8.6', '14.0', 33.00
WHERE NOT EXISTS (
  SELECT 1 FROM lens_products WHERE brand = 'فريش لوك' AND bc = '8.6' AND dia = '14.0'
);

INSERT INTO lens_products (brand, bc, dia, unit_price)
SELECT 'فريش لوك', '8.7', '14.2', 37.00
WHERE NOT EXISTS (
  SELECT 1 FROM lens_products WHERE brand = 'فريش لوك' AND bc = '8.7' AND dia = '14.2'
);

-- Seed positive SPH stock (+0.50 to +6.00 in 0.25 steps) for ALL lens products
DO $$
DECLARE
  lp RECORD;
  sph_val numeric;
  qty int;
BEGIN
  FOR lp IN SELECT id FROM lens_products LOOP
    sph_val := 0.50;
    WHILE sph_val <= 6.001 LOOP
      qty := 3 + abs(hashtext(lp.id::text || 'pos' || sph_val::text)) % 48;
      INSERT INTO lens_stock (lens_product_id, sph, stock_qty)
      VALUES (lp.id, sph_val, qty)
      ON CONFLICT (lens_product_id, sph) DO NOTHING;
      sph_val := sph_val + 0.25;
    END LOOP;
  END LOOP;
END $$;
