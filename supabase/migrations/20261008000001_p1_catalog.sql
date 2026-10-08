-- Migration: 20261008000001_p1_catalog.sql
-- Description: Phase 1 (Stage 1) - Commercial Catalog, Categories, Warehouses, and Product Variants with Cost Protection & Hierarchical RLS

-- 1. Warehouses
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.warehouses (id, code, name, address)
VALUES ('00000000-0000-0000-0000-000000000001', 'BOD-CENTRAL', 'Bodega Principal', 'Bogotá D.C., Colombia')
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

-- Dynamically handle 'general' category: insert if absent, reuse existing ID if present
DO $$
DECLARE
  v_gen_id UUID;
BEGIN
  SELECT id INTO v_gen_id FROM public.categories WHERE slug = 'general' LIMIT 1;
  IF v_gen_id IS NULL THEN
    INSERT INTO public.categories (id, slug, name, description)
    VALUES ('00000000-0000-0000-0000-000000000001', 'general', 'General', 'Categoría general por defecto')
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- Defensive backfill from products.category ONLY if products.category exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'category'
  ) THEN
    EXECUTE '
      INSERT INTO public.categories (slug, name)
      SELECT DISTINCT 
        lower(regexp_replace(COALESCE(category, ''general''), ''[^a-zA-Z0-9]+'', ''-'', ''g'')),
        COALESCE(category, ''General'')
      FROM public.products
      WHERE category IS NOT NULL AND trim(category) != ''''
      ON CONFLICT (slug) DO NOTHING;
    ';
  END IF;
END $$;

-- 3. Evolve Products (Non-destructive & Backward-Compatible)
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS media_gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_age_restricted BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Defensive backfill for image_url from legacy image column if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'image'
  ) THEN
    EXECUTE '
      UPDATE public.products
      SET image_url = image
      WHERE (image_url IS NULL OR trim(image_url) = '''') 
        AND image IS NOT NULL AND trim(image) != '''';
    ';
  END IF;
END $$;

-- Backfill category_id and collision-free slug, resolving the real UUID of the 'general' category
DO $$
DECLARE
  v_default_cat UUID;
BEGIN
  SELECT id INTO v_default_cat FROM public.categories WHERE slug = 'general' LIMIT 1;
  IF v_default_cat IS NULL THEN
    SELECT id INTO v_default_cat FROM public.categories LIMIT 1;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'category'
  ) THEN
    EXECUTE '
      UPDATE public.products p
      SET 
        category_id = COALESCE(c.id, $1),
        slug = lower(regexp_replace(COALESCE(p.name, ''prod''), ''[^a-zA-Z0-9]+'', ''-'', ''g'')) || ''-'' || substr(p.id::text, 1, 8)
      FROM public.categories c
      WHERE lower(regexp_replace(COALESCE(p.category, ''general''), ''[^a-zA-Z0-9]+'', ''-'', ''g'')) = c.slug
        AND p.category_id IS NULL;
    ' USING v_default_cat;
  END IF;

  -- Fallback for any product without category_id or slug
  UPDATE public.products
  SET 
    category_id = COALESCE(category_id, v_default_cat),
    slug = COALESCE(slug, lower(regexp_replace(COALESCE(name, 'prod'), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 8))
  WHERE category_id IS NULL OR slug IS NULL;

  -- Dynamically set category_id DEFAULT using the verified v_default_cat UUID
  EXECUTE 'ALTER TABLE public.products ALTER COLUMN category_id SET DEFAULT ' || quote_literal(v_default_cat::text) || '::uuid';
END $$;

ALTER TABLE public.products ALTER COLUMN category_id SET NOT NULL;

-- Trigger to guarantee collision-free slug and default category on INSERT if omitted
CREATE OR REPLACE FUNCTION public.handle_product_defaults()
RETURNS TRIGGER AS $$
DECLARE
  v_default_cat UUID;
BEGIN
  IF NEW.slug IS NULL OR trim(NEW.slug) = '' THEN
    NEW.slug := lower(regexp_replace(COALESCE(NEW.name, 'prod'), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(COALESCE(NEW.id, gen_random_uuid())::text, 1, 8);
  END IF;

  IF NEW.category_id IS NULL THEN
    SELECT id INTO v_default_cat FROM public.categories WHERE slug = 'general' LIMIT 1;
    IF v_default_cat IS NULL THEN
      SELECT id INTO v_default_cat FROM public.categories ORDER BY created_at ASC LIMIT 1;
    END IF;
    NEW.category_id := v_default_cat;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_slug ON public.products;
DROP TRIGGER IF EXISTS trg_product_defaults ON public.products;
CREATE TRIGGER trg_product_defaults
BEFORE INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.handle_product_defaults();

-- Bidirectional sync trigger for image <-> image_url if legacy image column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'image'
  ) THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.handle_product_image_sync()
      RETURNS TRIGGER AS $f$
      BEGIN
        IF (NEW.image_url IS NULL OR trim(NEW.image_url) = '''') AND NEW.image IS NOT NULL THEN
          NEW.image_url := NEW.image;
        ELSIF (NEW.image IS NULL OR trim(NEW.image) = '''') AND NEW.image_url IS NOT NULL THEN
          NEW.image := NEW.image_url;
        END IF;
        RETURN NEW;
      END;
      $f$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_product_image_sync ON public.products;
      CREATE TRIGGER trg_product_image_sync
      BEFORE INSERT OR UPDATE ON public.products
      FOR EACH ROW EXECUTE FUNCTION public.handle_product_image_sync();
    ';
  END IF;
END $$;

ALTER TABLE public.products ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

-- 4. Product Variants
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT,
  presentation_label TEXT NOT NULL DEFAULT 'Unidad Estándar',
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

-- Backfill default 1:1 variant for existing products with unique SKU
INSERT INTO public.product_variants (
  product_id, sku, presentation_label, price_in_cents, cost_in_cents, is_active
)
SELECT 
  id, 
  'SKU-' || upper(replace(id::text, '-', '')), 
  'Presentación Estándar', 
  GREATEST(0, (COALESCE(price, 0) * 100)::bigint), 
  0, 
  true
FROM public.products
ON CONFLICT (sku) DO NOTHING;

-- Trigger to auto-create default variant for newly inserted products if no variant exists yet
CREATE OR REPLACE FUNCTION public.handle_product_default_variant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.product_variants (
    product_id, sku, presentation_label, price_in_cents, cost_in_cents, is_active
  ) VALUES (
    NEW.id,
    'SKU-' || upper(replace(NEW.id::text, '-', '')),
    'Presentación Estándar',
    GREATEST(0, (COALESCE(NEW.price, 0) * 100)::bigint),
    0,
    true
  ) ON CONFLICT (sku) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_default_variant ON public.products;
CREATE TRIGGER trg_product_default_variant
AFTER INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.handle_product_default_variant();

-- 5. Row Level Security & Column-Level Privilege Separation
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.warehouses FROM public, anon, authenticated;
REVOKE ALL ON public.categories FROM public, anon, authenticated;
REVOKE ALL ON public.products FROM public, anon, authenticated;
REVOKE ALL ON public.product_variants FROM public, anon, authenticated;

-- Public read access on warehouses
GRANT SELECT ON public.warehouses TO anon, authenticated;
DROP POLICY IF EXISTS "Active warehouses are viewable by all" ON public.warehouses;
CREATE POLICY "Active warehouses are viewable by all"
  ON public.warehouses FOR SELECT USING (is_active = true);

-- Public read access on categories
GRANT SELECT ON public.categories TO anon, authenticated;
DROP POLICY IF EXISTS "Active categories are viewable by all" ON public.categories;
CREATE POLICY "Active categories are viewable by all"
  ON public.categories FOR SELECT USING (is_active = true);

-- Public read access on products: visible only if product is active AND parent category is active
GRANT SELECT ON public.products TO anon, authenticated;
DROP POLICY IF EXISTS "Active products of active categories are viewable" ON public.products;
CREATE POLICY "Active products of active categories are viewable"
  ON public.products FOR SELECT 
  USING (
    is_active = true 
    AND EXISTS (
      SELECT 1 FROM public.categories c 
      WHERE c.id = products.category_id AND c.is_active = true
    )
  );

-- STRICT COST PROTECTION: Grant SELECT ONLY on safe columns for product_variants (Excluding cost_in_cents)
GRANT SELECT (
  id, product_id, sku, barcode, presentation_label, attributes, 
  price_in_cents, compare_at_price_in_cents, is_active, created_at, updated_at
) ON public.product_variants TO anon, authenticated;

-- Hierarchical variant visibility: visible only if variant is active AND product is active AND category is active
DROP POLICY IF EXISTS "Active variants of active products are viewable" ON public.product_variants;
CREATE POLICY "Active variants of active products are viewable"
  ON public.product_variants FOR SELECT 
  USING (
    is_active = true 
    AND EXISTS (
      SELECT 1 FROM public.products p 
      JOIN public.categories c ON c.id = p.category_id
      WHERE p.id = product_variants.product_id 
        AND p.is_active = true 
        AND c.is_active = true
    )
  );

-- Service Role & Admin full access (including internal cost_in_cents)
GRANT ALL ON public.warehouses TO service_role;
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.product_variants TO service_role;
