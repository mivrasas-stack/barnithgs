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

-- Validate zero stock loss: abort migration if any unmigrated inventory row remains
DO $$
DECLARE
  v_unmigrated_count INTEGER;
  v_unmigrated_ids TEXT;
BEGIN
  SELECT count(*), string_agg(COALESCE(product_id::text, 'UNKNOWN'), ', ')
  INTO v_unmigrated_count, v_unmigrated_ids
  FROM public.inventory
  WHERE variant_id IS NULL;

  IF v_unmigrated_count > 0 THEN
    RAISE EXCEPTION 'MIGRATION_FAILED: Found % unmigrated inventory records without variant_id (product_ids: %). Aborting migration to preserve stock data.', 
      v_unmigrated_count, v_unmigrated_ids;
  END IF;
END $$;

-- Redefine Primary Key on inventory (variant_id, warehouse_id)
DO $$
DECLARE
  v_pk_name TEXT;
BEGIN
  SELECT constraint_name INTO v_pk_name
  FROM information_schema.table_constraints
  WHERE table_schema = 'public' AND table_name = 'inventory' AND constraint_type = 'PRIMARY KEY';

  IF v_pk_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.inventory DROP CONSTRAINT ' || quote_ident(v_pk_name);
  END IF;

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_stock_res_quantity'
  ) THEN
    ALTER TABLE public.stock_reservations 
      ADD CONSTRAINT chk_stock_res_quantity CHECK (quantity > 0 AND quantity <= 99);
  END IF;
END $$;

-- Backfill variant_id in stock_reservations and make product_id nullable
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

-- 4. Bidirectional backward-compatibility triggers for inventory and stock_reservations

-- 4.1 Inventory defaults trigger (syncs product_id <-> variant_id)
CREATE OR REPLACE FUNCTION public.handle_inventory_defaults()
RETURNS TRIGGER AS $$
DECLARE
  v_var_id UUID;
  v_default_wh UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  IF NEW.warehouse_id IS NULL THEN
    NEW.warehouse_id := v_default_wh;
  END IF;

  -- Consistency verification when both product_id and variant_id are supplied
  IF NEW.variant_id IS NOT NULL AND NEW.product_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.product_variants 
      WHERE id = NEW.variant_id AND product_id = NEW.product_id
    ) THEN
      RAISE EXCEPTION 'INCONSISTENT_PRODUCT_VARIANT: variant % does not belong to product %', NEW.variant_id, NEW.product_id;
    END IF;
  END IF;

  IF NEW.variant_id IS NOT NULL AND NEW.product_id IS NULL THEN
    SELECT product_id INTO NEW.product_id 
    FROM public.product_variants 
    WHERE id = NEW.variant_id;
  END IF;

  IF NEW.product_id IS NOT NULL AND NEW.variant_id IS NULL THEN
    SELECT id INTO v_var_id 
    FROM public.product_variants 
    WHERE product_id = NEW.product_id 
    ORDER BY created_at ASC 
    LIMIT 1;

    IF v_var_id IS NULL THEN
      INSERT INTO public.product_variants (
        product_id, sku, presentation_label, price_in_cents, is_active
      ) VALUES (
        NEW.product_id,
        'SKU-INV-' || upper(replace(NEW.product_id::text, '-', '')),
        'Presentación Estándar',
        0,
        true
      ) RETURNING id INTO v_var_id;
    END IF;

    NEW.variant_id := v_var_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventory_defaults ON public.inventory;
CREATE TRIGGER trg_inventory_defaults
BEFORE INSERT OR UPDATE ON public.inventory
FOR EACH ROW EXECUTE FUNCTION public.handle_inventory_defaults();

-- 4.2 Stock reservations defaults trigger (syncs product_id <-> variant_id)
CREATE OR REPLACE FUNCTION public.handle_stock_reservation_defaults()
RETURNS TRIGGER AS $$
DECLARE
  v_var_id UUID;
  v_default_wh UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  IF NEW.warehouse_id IS NULL THEN
    NEW.warehouse_id := v_default_wh;
  END IF;

  -- Consistency verification when both product_id and variant_id are supplied
  IF NEW.variant_id IS NOT NULL AND NEW.product_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.product_variants 
      WHERE id = NEW.variant_id AND product_id = NEW.product_id
    ) THEN
      RAISE EXCEPTION 'INCONSISTENT_PRODUCT_VARIANT: variant % does not belong to product %', NEW.variant_id, NEW.product_id;
    END IF;
  END IF;

  IF NEW.variant_id IS NOT NULL AND NEW.product_id IS NULL THEN
    SELECT product_id INTO NEW.product_id 
    FROM public.product_variants 
    WHERE id = NEW.variant_id;
  END IF;

  IF NEW.product_id IS NOT NULL AND NEW.variant_id IS NULL THEN
    SELECT id INTO v_var_id 
    FROM public.product_variants 
    WHERE product_id = NEW.product_id 
    ORDER BY created_at ASC 
    LIMIT 1;

    NEW.variant_id := v_var_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stock_reservation_defaults ON public.stock_reservations;
CREATE TRIGGER trg_stock_reservation_defaults
BEFORE INSERT OR UPDATE ON public.stock_reservations
FOR EACH ROW EXECUTE FUNCTION public.handle_stock_reservation_defaults();

-- 4.3 Trigger to auto-create inventory entry when a new variant is inserted
CREATE OR REPLACE FUNCTION public.handle_variant_default_inventory()
RETURNS TRIGGER AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.inventory (variant_id, warehouse_id, product_id, physical_quantity, safety_stock)
  VALUES (NEW.id, '00000000-0000-0000-0000-000000000001', NEW.product_id, 0, 0)
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
  v_product_id UUID;
BEGIN
  -- Strict parameter validation (positive, max 99 quantity; positive, max 15m TTL)
  IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity > 99 THEN
    RETURN FALSE;
  END IF;

  IF p_ttl_minutes IS NULL OR p_ttl_minutes <= 0 OR p_ttl_minutes > 15 THEN
    RETURN FALSE;
  END IF;

  -- Lock the specific variant & warehouse inventory row
  SELECT physical_quantity, safety_stock, product_id
  INTO v_physical_stock, v_safety_stock, v_product_id
  FROM public.inventory
  WHERE variant_id = p_variant_id AND warehouse_id = p_warehouse_id
  FOR UPDATE;

  IF v_physical_stock IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_product_id IS NULL THEN
    SELECT product_id INTO v_product_id FROM public.product_variants WHERE id = p_variant_id;
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
      variant_id, warehouse_id, product_id, cart_id, quantity, status, renewal_count, expires_at
    ) VALUES (
      p_variant_id, p_warehouse_id, v_product_id, p_cart_id, p_quantity, 'active', 0, now() + (p_ttl_minutes || ' minutes')::interval
    );
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5.2 Renew an active reservation (Max 1 renewal allowed, max 15m extension, max 30m total duration)
CREATE OR REPLACE FUNCTION public.renew_reservation(
  p_reservation_id UUID,
  p_extension_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
  v_res RECORD;
  v_new_expiry TIMESTAMPTZ;
BEGIN
  -- Strict extension limits: positive, max 15 minutes
  IF p_extension_minutes IS NULL OR p_extension_minutes <= 0 OR p_extension_minutes > 15 THEN
    RETURN FALSE;
  END IF;

  SELECT id, status, renewal_count, created_at, expires_at
  INTO v_res
  FROM public.stock_reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  -- Must be active, non-expired, and max 1 renewal
  IF NOT FOUND OR v_res.status != 'active' OR v_res.expires_at <= now() OR v_res.renewal_count >= 1 THEN
    RETURN FALSE;
  END IF;

  v_new_expiry := now() + (p_extension_minutes || ' minutes')::interval;

  -- Total duration cannot exceed 30 minutes from creation
  IF v_new_expiry > (v_res.created_at + INTERVAL '30 minutes') THEN
    RETURN FALSE;
  END IF;

  UPDATE public.stock_reservations
  SET 
    expires_at = v_new_expiry,
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
  v_physical_qty INTEGER;
  v_updated_rows INTEGER;
BEGIN
  -- 1. Pessimistic lock on reservation
  SELECT id, variant_id, warehouse_id, quantity, status
  INTO v_res
  FROM public.stock_reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND OR v_res.status != 'active' THEN
    RETURN FALSE;
  END IF;

  -- 2. Pessimistic lock on inventory row
  SELECT physical_quantity
  INTO v_physical_qty
  FROM public.inventory
  WHERE variant_id = v_res.variant_id AND warehouse_id = v_res.warehouse_id
  FOR UPDATE;

  -- Verify inventory exists and has sufficient physical quantity
  IF NOT FOUND OR v_physical_qty < v_res.quantity THEN
    RETURN FALSE;
  END IF;

  -- 3. Atomic deduction without GREATEST(0, ...), strictly requiring physical_quantity >= v_res.quantity
  UPDATE public.inventory
  SET physical_quantity = physical_quantity - v_res.quantity,
      updated_at = now()
  WHERE variant_id = v_res.variant_id 
    AND warehouse_id = v_res.warehouse_id
    AND physical_quantity >= v_res.quantity;

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  IF v_updated_rows != 1 THEN
    RETURN FALSE;
  END IF;

  -- 4. Mark reservation as consumed
  UPDATE public.stock_reservations
  SET status = 'consumed'
  WHERE id = p_reservation_id AND status = 'active';

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  IF v_updated_rows != 1 THEN
    RETURN FALSE;
  END IF;

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
  -- Strict parameter validation
  IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity > 99 THEN
    RETURN FALSE;
  END IF;

  IF p_ttl_minutes IS NULL OR p_ttl_minutes <= 0 OR p_ttl_minutes > 15 THEN
    RETURN FALSE;
  END IF;

  SELECT id INTO v_variant_id 
  FROM public.product_variants 
  WHERE product_id = p_product_id AND is_active = true
  ORDER BY created_at ASC 
  LIMIT 1;

  IF v_variant_id IS NULL THEN
    SELECT id INTO v_variant_id 
    FROM public.product_variants 
    WHERE product_id = p_product_id
    LIMIT 1;
  END IF;

  IF v_variant_id IS NULL THEN
    INSERT INTO public.product_variants (
      product_id, sku, presentation_label, price_in_cents, is_active
    ) VALUES (
      p_product_id,
      'SKU-' || upper(replace(p_product_id::text, '-', '')),
      'Presentación Estándar',
      0,
      true
    ) RETURNING id INTO v_variant_id;
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 7. Row Level Security & Column Privileges
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.inventory FROM public, anon, authenticated;
REVOKE ALL ON public.stock_reservations FROM public, anon, authenticated;

-- Explicitly revoke execution on sensitive reservation functions from public, anon, and authenticated
REVOKE EXECUTE ON FUNCTION public.reserve_variant_stock(UUID, UUID, UUID, INTEGER, INTEGER) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reserve_stock(UUID, UUID, INTEGER, INTEGER) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.renew_reservation(UUID, INTEGER) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_reservation(UUID) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.consume_reservation(UUID) FROM public, anon, authenticated;

-- Function Execution Privileges (Only public read stock status is permitted to anon and authenticated)
GRANT EXECUTE ON FUNCTION public.is_variant_in_stock(UUID, UUID) TO anon, authenticated;

-- Service Role full access (Backend execution only)
GRANT ALL ON public.inventory TO service_role;
GRANT ALL ON public.stock_reservations TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
