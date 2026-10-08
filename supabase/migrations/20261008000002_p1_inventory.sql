-- Migration: 20261008000002_p1_inventory.sql
-- Description: Phase 1 (Stage 2) - Inventory by Variant and Warehouse with Concurrency Locking & Zero Stock Loss

-- 1. Ensure Default Warehouse exists
INSERT INTO public.warehouses (id, code, name, address)
VALUES ('00000000-0000-0000-0000-000000000001', 'BOD-CENTRAL', 'Bodega Principal', 'Bogotá D.C., Colombia')
ON CONFLICT (id) DO NOTHING;

-- 2. Evolve public.inventory (variant_id + warehouse_id compound key)
ALTER TABLE public.inventory 
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS warehouse_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS safety_stock INTEGER NOT NULL DEFAULT 0 CHECK (safety_stock >= 0);

-- Backfill variant_id for any existing rows in inventory that have product_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'inventory' AND column_name = 'product_id'
  ) THEN
    -- Ensure each product with an inventory record has at least one variant
    INSERT INTO public.product_variants (product_id, sku, presentation_label, price_in_cents, is_active)
    SELECT i.product_id, 'SKU-LEGACY-' || upper(replace(i.product_id::text, '-', '')), 'Presentación Estándar', 0, true
    FROM public.inventory i
    WHERE NOT EXISTS (SELECT 1 FROM public.product_variants pv WHERE pv.product_id = i.product_id)
    ON CONFLICT (sku) DO NOTHING;

    -- Update inventory.variant_id from earliest created variant of product
    UPDATE public.inventory i
    SET variant_id = pv.id
    FROM (
      SELECT DISTINCT ON (product_id) id, product_id 
      FROM public.product_variants 
      ORDER BY product_id, created_at ASC
    ) pv
    WHERE i.product_id = pv.product_id
      AND i.variant_id IS NULL;
  END IF;
END $$;

-- Clean orphan inventory rows if any (cannot exist without variant)
DELETE FROM public.inventory WHERE variant_id IS NULL;

-- Redefine Primary Key on inventory (variant_id, warehouse_id)
DO $$
BEGIN
  ALTER TABLE public.inventory DROP CONSTRAINT IF EXISTS inventory_pkey;
  ALTER TABLE public.inventory ALTER COLUMN variant_id SET NOT NULL;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'inventory' AND column_name = 'product_id'
  ) THEN
    ALTER TABLE public.inventory ALTER COLUMN product_id DROP NOT NULL;
  END IF;

  ALTER TABLE public.inventory ADD CONSTRAINT inventory_pkey PRIMARY KEY (variant_id, warehouse_id);
END $$;

-- 3. Evolve public.stock_reservations
ALTER TABLE public.stock_reservations
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS warehouse_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'released', 'expired')),
  ADD COLUMN IF NOT EXISTS renewal_count INTEGER NOT NULL DEFAULT 0 CHECK (renewal_count >= 0 AND renewal_count <= 1);

-- Backfill variant_id in stock_reservations
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'stock_reservations' AND column_name = 'product_id'
  ) THEN
    UPDATE public.stock_reservations sr
    SET variant_id = pv.id
    FROM (
      SELECT DISTINCT ON (product_id) id, product_id 
      FROM public.product_variants 
      ORDER BY product_id, created_at ASC
    ) pv
    WHERE sr.product_id = pv.product_id
      AND sr.variant_id IS NULL;

    ALTER TABLE public.stock_reservations ALTER COLUMN product_id DROP NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stock_res_variant ON public.stock_reservations(variant_id, warehouse_id, status);
CREATE INDEX IF NOT EXISTS idx_stock_res_expiry ON public.stock_reservations(expires_at) WHERE status = 'active';

-- 4. Trigger to auto-create inventory entry when a new variant is inserted
CREATE OR REPLACE FUNCTION public.handle_variant_default_inventory()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.inventory (variant_id, warehouse_id, physical_quantity, safety_stock)
  VALUES (NEW.id, '00000000-0000-0000-0000-000000000001', 0, 0)
  ON CONFLICT (variant_id, warehouse_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_variant_default_inventory ON public.product_variants;
CREATE TRIGGER trg_variant_default_inventory
AFTER INSERT ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION public.handle_variant_default_inventory();

-- 5. Stored Procedures: Concurrency-Safe Stock Reservation & Management

-- 5.1 Reserve variant stock with pessimistic locking (FOR UPDATE)
CREATE OR REPLACE FUNCTION public.reserve_variant_stock(
  p_variant_id UUID,
  p_warehouse_id UUID,
  p_cart_id UUID,
  p_quantity INTEGER,
  p_ttl_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
  v_physical_stock INTEGER;
  v_safety_stock INTEGER;
  v_reserved_stock INTEGER;
BEGIN
  IF p_quantity <= 0 THEN
    RETURN FALSE;
  END IF;

  -- Lock the specific variant & warehouse inventory row
  SELECT physical_quantity, safety_stock 
  INTO v_physical_stock, v_safety_stock
  FROM public.inventory
  WHERE variant_id = p_variant_id AND warehouse_id = p_warehouse_id
  FOR UPDATE;

  IF v_physical_stock IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Sum active, non-expired reservations for this variant & warehouse
  SELECT COALESCE(SUM(quantity), 0) INTO v_reserved_stock
  FROM public.stock_reservations
  WHERE variant_id = p_variant_id 
    AND warehouse_id = p_warehouse_id 
    AND status = 'active' 
    AND expires_at > now();

  -- Check available stock respecting safety_stock
  IF (v_physical_stock - v_safety_stock - v_reserved_stock) >= p_quantity THEN
    INSERT INTO public.stock_reservations (
      variant_id, warehouse_id, cart_id, quantity, status, renewal_count, expires_at
    ) VALUES (
      p_variant_id, p_warehouse_id, p_cart_id, p_quantity, 'active', 0, now() + (p_ttl_minutes || ' minutes')::interval
    );
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5.2 Renew an active reservation (Max 1 renewal allowed)
CREATE OR REPLACE FUNCTION public.renew_reservation(
  p_reservation_id UUID,
  p_extension_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
  v_res RECORD;
BEGIN
  SELECT id, status, renewal_count, expires_at
  INTO v_res
  FROM public.stock_reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND OR v_res.status != 'active' OR v_res.expires_at <= now() OR v_res.renewal_count >= 1 THEN
    RETURN FALSE;
  END IF;

  UPDATE public.stock_reservations
  SET 
    expires_at = now() + (p_extension_minutes || ' minutes')::interval,
    renewal_count = renewal_count + 1
  WHERE id = p_reservation_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5.3 Release an active reservation (e.g., cart abandoned / item removed)
CREATE OR REPLACE FUNCTION public.release_reservation(
  p_reservation_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.stock_reservations
  SET status = 'released'
  WHERE id = p_reservation_id AND status = 'active';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5.4 Consume reservation on payment capture and deduct physical stock
CREATE OR REPLACE FUNCTION public.consume_reservation(
  p_reservation_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_res RECORD;
BEGIN
  SELECT id, variant_id, warehouse_id, quantity, status
  INTO v_res
  FROM public.stock_reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND OR v_res.status != 'active' THEN
    RETURN FALSE;
  END IF;

  -- Lock and deduct inventory
  UPDATE public.inventory
  SET physical_quantity = GREATEST(0, physical_quantity - v_res.quantity),
      updated_at = now()
  WHERE variant_id = v_res.variant_id AND warehouse_id = v_res.warehouse_id;

  -- Mark reservation as consumed
  UPDATE public.stock_reservations
  SET status = 'consumed'
  WHERE id = p_reservation_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5.5 Backward-compatible reserve_stock(product_id, cart_id, quantity, ttl)
CREATE OR REPLACE FUNCTION public.reserve_stock(
  p_product_id UUID, 
  p_cart_id UUID, 
  p_quantity INTEGER, 
  p_ttl_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
  v_variant_id UUID;
  v_default_warehouse UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  SELECT id INTO v_variant_id 
  FROM public.product_variants 
  WHERE product_id = p_product_id AND is_active = true
  ORDER BY created_at ASC 
  LIMIT 1;

  IF v_variant_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN public.reserve_variant_stock(
    v_variant_id, v_default_warehouse, p_cart_id, p_quantity, p_ttl_minutes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Safe Public Stock Check (Zero Quantity/Safety Exposure)
CREATE OR REPLACE FUNCTION public.is_variant_in_stock(
  p_variant_id UUID,
  p_warehouse_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'
) RETURNS BOOLEAN AS $$
DECLARE
  v_avail INTEGER;
BEGIN
  SELECT (i.physical_quantity - i.safety_stock - COALESCE(sr.reserved, 0))
  INTO v_avail
  FROM public.inventory i
  LEFT JOIN (
    SELECT variant_id, warehouse_id, SUM(quantity) AS reserved
    FROM public.stock_reservations
    WHERE status = 'active' AND expires_at > now()
    GROUP BY variant_id, warehouse_id
  ) sr ON sr.variant_id = i.variant_id AND sr.warehouse_id = i.warehouse_id
  WHERE i.variant_id = p_variant_id AND i.warehouse_id = p_warehouse_id;

  RETURN COALESCE(v_avail, 0) > 0;
END;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 7. Row Level Security & Column Privileges
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.inventory FROM public, anon, authenticated;
REVOKE ALL ON public.stock_reservations FROM public, anon, authenticated;

-- Function Execution Privileges
GRANT EXECUTE ON FUNCTION public.is_variant_in_stock(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_variant_stock(UUID, UUID, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_stock(UUID, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.renew_reservation(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_reservation(UUID) TO authenticated;

-- Service Role full access
GRANT ALL ON public.inventory TO service_role;
GRANT ALL ON public.stock_reservations TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
