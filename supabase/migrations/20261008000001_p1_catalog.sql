-- Migration: 20261008000001_p1_catalog.sql
-- Description: Phase 1 (Stage 1) - Commercial Catalog, Categories, Warehouses, and Product Variants

-- 1. Warehouses (Default location setup with multi-warehouse readiness)
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default central warehouse
INSERT INTO public.warehouses (id, code, name, address)
VALUES ('00000000-0000-0000-0000-000000000001', 'BOD-CENTRAL', 'Bodega Principal', 'Bogota D.C., Colombia')
ON CONFLICT (id) DO NOTHING;

-- 2. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);

-- Backfill categories from existing products table
INSERT INTO public.categories (slug, name)
SELECT DISTINCT 
  lower(regexp_replace(COALESCE(category, 'General'), '[^a-zA-Z0-9]+', '-', 'g')),
  COALESCE(category, 'General')
FROM public.products
ON CONFLICT (slug) DO NOTHING;

-- 3. Evolve Products (Non-destructive extension of baseline products table)
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS media_gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_age_restricted BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill category_id and slug for existing products
UPDATE public.products p
SET 
  category_id = c.id,
  slug = lower(regexp_replace(p.name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(p.id::text, 1, 6)
FROM public.categories c
WHERE lower(regexp_replace(COALESCE(p.category, 'General'), '[^a-zA-Z0-9]+', '-', 'g')) = c.slug
  AND p.category_id IS NULL;

-- Default fallback category if any product remains unmatched
DO $$
DECLARE
  v_default_cat UUID;
BEGIN
  SELECT id INTO v_default_cat FROM public.categories LIMIT 1;
  IF v_default_cat IS NOT NULL THEN
    UPDATE public.products 
    SET 
      category_id = v_default_cat,
      slug = 'prod-' || substr(id::text, 1, 8)
    WHERE category_id IS NULL;
  END IF;
END $$;

ALTER TABLE public.products ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

-- 4. Product Variants (Sellable SKUs)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT,
  presentation_label TEXT NOT NULL DEFAULT 'Unidad Estandar',
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  price_in_cents BIGINT NOT NULL CHECK (price_in_cents >= 0),
  cost_in_cents BIGINT NOT NULL DEFAULT 0 CHECK (cost_in_cents >= 0),
  compare_at_price_in_cents BIGINT CHECK (compare_at_price_in_cents IS NULL OR compare_at_price_in_cents >= price_in_cents),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_variants_active ON public.product_variants(is_active);

-- Backfill default 1:1 variant for existing products
INSERT INTO public.product_variants (
  product_id, sku, presentation_label, price_in_cents, cost_in_cents, is_active
)
SELECT 
  id, 
  'SKU-' || upper(substr(id::text, 1, 8)), 
  'Presentacion Estandar', 
  (COALESCE(price, 0) * 100)::bigint, 
  0, 
  true
FROM public.products
ON CONFLICT (sku) DO NOTHING;

-- 5. Row Level Security & Explicit Privileges
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.warehouses FROM public, anon, authenticated;
REVOKE ALL ON public.categories FROM public, anon, authenticated;
REVOKE ALL ON public.products FROM public, anon, authenticated;
REVOKE ALL ON public.product_variants FROM public, anon, authenticated;

-- Public read access for active catalog entities
GRANT SELECT ON public.warehouses TO anon, authenticated;
CREATE POLICY "Active warehouses are viewable by all"
  ON public.warehouses FOR SELECT USING (is_active = true);

GRANT SELECT ON public.categories TO anon, authenticated;
CREATE POLICY "Active categories are viewable by all"
  ON public.categories FOR SELECT USING (is_active = true);

GRANT SELECT ON public.products TO anon, authenticated;
CREATE POLICY "Active products are viewable by all"
  ON public.products FOR SELECT USING (is_active = true);

GRANT SELECT ON public.product_variants TO anon, authenticated;
CREATE POLICY "Active variants are viewable by all"
  ON public.product_variants FOR SELECT USING (is_active = true);

-- Admin & Service Role full management
GRANT ALL ON public.warehouses TO service_role;
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.product_variants TO service_role;
