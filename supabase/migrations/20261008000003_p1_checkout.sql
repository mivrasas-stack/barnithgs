-- ==============================================================================
-- P1 STAGE 3: TRANSACTIONAL CHECKOUT ENGINE & ORDERS EVOLUTION
-- 1. Carts table with guest & authenticated session tracking and RLS
-- 2. Commercial orders & order_items schema evolution (integer cents & snapshots)
-- 3. Deterministic backend delivery fee calculation
-- 4. process_checkout_atomic: ACID order creation, lock hierarchy, idempotency,
--    strict warehouse & reservation integrity, and count mismatch validation
-- 5. Strict service_role execution privilege revocation & RLS user isolation
-- ==============================================================================

-- 1. Carts Table (Persistent server-side cart sessions)
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_token TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'checked_out', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session_token ON public.carts(session_token);

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.carts FROM public, anon;
GRANT SELECT, INSERT, UPDATE ON public.carts TO authenticated;
GRANT ALL ON public.carts TO service_role;

DROP POLICY IF EXISTS carts_user_isolation_select ON public.carts;
CREATE POLICY carts_user_isolation_select ON public.carts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS carts_user_isolation_insert ON public.carts;
CREATE POLICY carts_user_isolation_insert ON public.carts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS carts_user_isolation_update ON public.carts;
CREATE POLICY carts_user_isolation_update ON public.carts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Orders Table Evolution (Backward-compatible additive columns)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cart_id UUID REFERENCES public.carts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS customer_phone TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS customer_email TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS delivery_address TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS delivery_city TEXT NOT NULL DEFAULT 'Bogotá D.C.',
  ADD COLUMN IF NOT EXISTS delivery_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS delivery_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
  ADD COLUMN IF NOT EXISTS subtotal_in_cents BIGINT NOT NULL DEFAULT 0 CHECK (subtotal_in_cents >= 0),
  ADD COLUMN IF NOT EXISTS delivery_fee_in_cents BIGINT NOT NULL DEFAULT 0 CHECK (delivery_fee_in_cents >= 0),
  ADD COLUMN IF NOT EXISTS tip_in_cents BIGINT NOT NULL DEFAULT 0 CHECK (tip_in_cents >= 0),
  ADD COLUMN IF NOT EXISTS total_in_cents BIGINT NOT NULL DEFAULT 0 CHECK (total_in_cents >= 0),
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid' 
    CHECK (payment_status IN ('unpaid', 'authorized', 'captured', 'declined', 'voided', 'refunded')),
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_cart_id ON public.orders(cart_id);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON public.orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.orders FROM public, anon;
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

DROP POLICY IF EXISTS orders_user_isolation_select ON public.orders;
CREATE POLICY orders_user_isolation_select ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3. Order Items Table Evolution (Immutable Historic Snapshots)
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS product_name_snapshot TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS presentation_snapshot TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sku_snapshot TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS unit_price_in_cents BIGINT NOT NULL DEFAULT 0 CHECK (unit_price_in_cents >= 0),
  ADD COLUMN IF NOT EXISTS unit_cost_in_cents BIGINT NOT NULL DEFAULT 0 CHECK (unit_cost_in_cents >= 0),
  ADD COLUMN IF NOT EXISTS total_in_cents BIGINT NOT NULL DEFAULT 0 CHECK (total_in_cents >= 0);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_items FROM public, anon;
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

DROP POLICY IF EXISTS order_items_user_isolation_select ON public.order_items;
CREATE POLICY order_items_user_isolation_select ON public.order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

-- 4. Stock Reservations: Link to Orders
ALTER TABLE public.stock_reservations
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stock_reservations_order_id ON public.stock_reservations(order_id);

-- 5. Deterministic Backend Delivery Fee Rule Engine
CREATE OR REPLACE FUNCTION public.calculate_delivery_fee(
  p_subtotal_in_cents BIGINT,
  p_city TEXT
) RETURNS BIGINT AS $$
BEGIN
  -- Free delivery promotion: subtotal >= $100,000 COP (10,000,000 cents)
  IF p_subtotal_in_cents >= 10000000 THEN
    RETURN 0;
  END IF;

  -- Urban flat rate for Bogotá D.C.: $5,000 COP (500,000 cents)
  IF lower(trim(COALESCE(p_city, ''))) IN ('bogotá d.c.', 'bogota d.c.', 'bogotá', 'bogota') THEN
    RETURN 500000;
  END IF;

  -- Regional / Cundinamarca rate: $10,000 COP (1,000,000 cents)
  RETURN 1000000;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. Atomic Transactional Checkout Procedure
CREATE OR REPLACE FUNCTION public.process_checkout_atomic(
  p_cart_id UUID,
  p_warehouse_id UUID,
  p_idempotency_key TEXT,
  p_user_id UUID DEFAULT NULL,
  p_customer_name TEXT DEFAULT '',
  p_customer_phone TEXT DEFAULT '',
  p_customer_email TEXT DEFAULT '',
  p_delivery_address TEXT DEFAULT '',
  p_delivery_city TEXT DEFAULT 'Bogotá D.C.',
  p_delivery_lat DOUBLE PRECISION DEFAULT NULL,
  p_delivery_lng DOUBLE PRECISION DEFAULT NULL,
  p_delivery_notes TEXT DEFAULT NULL,
  p_tip_in_cents BIGINT DEFAULT 0
) RETURNS JSONB AS $$
DECLARE
  v_existing_order RECORD;
  v_order_id UUID;
  v_order_number TEXT;
  v_res RECORD;
  v_variant RECORD;
  v_subtotal BIGINT := 0;
  v_delivery_fee BIGINT := 0;
  v_total BIGINT := 0;
  v_line_total BIGINT;
  v_res_count INTEGER := 0;
  v_updated_rows INTEGER := 0;
BEGIN
  -- 1. Input parameter validation
  IF p_cart_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: cart_id cannot be null';
  END IF;

  IF p_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: warehouse_id cannot be null';
  END IF;

  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) = 0 THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: idempotency_key is required';
  END IF;

  IF p_tip_in_cents < 0 OR p_tip_in_cents > 5000000 THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: tip must be between 0 and 5,000,000 cents';
  END IF;

  -- 2. Fast-Path Idempotency Check
  SELECT id, order_number, cart_id, user_id, customer_phone, total_in_cents, status, payment_status
  INTO v_existing_order
  FROM public.orders
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    -- Validate that the key is not being replayed with a different cart or identity
    IF (v_existing_order.cart_id IS NOT NULL AND v_existing_order.cart_id != p_cart_id)
       OR (p_user_id IS NOT NULL AND v_existing_order.user_id IS NOT NULL AND v_existing_order.user_id != p_user_id)
       OR (v_existing_order.customer_phone != '' AND v_existing_order.customer_phone != trim(p_customer_phone)) THEN
      RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT: Idempotency key % already used for another cart or customer', p_idempotency_key;
    END IF;

    RETURN jsonb_build_object(
      'status', 'idempotent_hit',
      'order_id', v_existing_order.id,
      'order_number', v_existing_order.order_number,
      'total_in_cents', v_existing_order.total_in_cents,
      'payment_status', v_existing_order.payment_status
    );
  END IF;

  -- 3. Strict Cart Status and Ownership Check
  IF EXISTS (SELECT 1 FROM public.carts WHERE id = p_cart_id) THEN
    IF EXISTS (
      SELECT 1 FROM public.carts WHERE id = p_cart_id AND status = 'checked_out'
    ) THEN
      RAISE EXCEPTION 'CART_ALREADY_PROCESSED: Cart % has already been checked out', p_cart_id;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.carts 
      WHERE id = p_cart_id 
        AND user_id IS NOT NULL 
        AND (p_user_id IS NULL OR user_id != p_user_id)
    ) THEN
      RAISE EXCEPTION 'FORBIDDEN_CART_ACCESS: Cart % does not belong to user %', p_cart_id, p_user_id;
    END IF;
  END IF;

  -- 4. Strict Reservation Integrity Check:
  -- If cart has ANY reservation belonging to another warehouse, not active, with an order_id, or expired:
  IF EXISTS (
    SELECT 1 FROM public.stock_reservations
    WHERE cart_id = p_cart_id 
      AND (warehouse_id != p_warehouse_id OR status != 'active' OR order_id IS NOT NULL OR expires_at <= now())
  ) THEN
    RAISE EXCEPTION 'RESERVATION_INVALID: Cart % contains invalid, expired, foreign-warehouse, or already-ordered reservations', p_cart_id;
  END IF;

  -- 5. Level 1 Lock: Lock inventory rows ordered by variant_id ASC (matching cart & warehouse)
  PERFORM i.variant_id
  FROM public.inventory i
  WHERE (i.variant_id, i.warehouse_id) IN (
    SELECT DISTINCT sr.variant_id, sr.warehouse_id
    FROM public.stock_reservations sr
    WHERE sr.cart_id = p_cart_id 
      AND sr.warehouse_id = p_warehouse_id
      AND sr.status = 'active'
      AND sr.order_id IS NULL
      AND sr.expires_at > now()
  )
  ORDER BY i.variant_id ASC
  FOR UPDATE;

  -- Re-check cart status after acquiring inventory locks
  IF EXISTS (
    SELECT 1 FROM public.carts WHERE id = p_cart_id AND status = 'checked_out'
  ) THEN
    RAISE EXCEPTION 'CART_ALREADY_PROCESSED: Cart % has already been checked out', p_cart_id;
  END IF;

  -- 6. Level 2 Lock: Lock and validate active reservations for cart_id and warehouse_id
  FOR v_res IN
    SELECT id, variant_id, warehouse_id, quantity, expires_at
    FROM public.stock_reservations
    WHERE cart_id = p_cart_id 
      AND warehouse_id = p_warehouse_id
      AND status = 'active'
      AND order_id IS NULL
      AND expires_at > now()
    ORDER BY id ASC
    FOR UPDATE
  LOOP
    v_res_count := v_res_count + 1;

    -- Fetch trusted prices directly from database
    SELECT 
      pv.id AS variant_id,
      pv.sku,
      pv.presentation_label,
      pv.price_in_cents,
      p.name AS product_name,
      p.is_active AS product_active,
      pv.is_active AS variant_active
    INTO v_variant
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = v_res.variant_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'CATALOG_ERROR: Variant % does not exist in catalog', v_res.variant_id;
    END IF;

    IF NOT v_variant.product_active OR NOT v_variant.variant_active THEN
      RAISE EXCEPTION 'CATALOG_ERROR: Variant % is inactive', v_res.variant_id;
    END IF;

    IF v_variant.price_in_cents <= 0 THEN
      RAISE EXCEPTION 'PRICING_ERROR: Variant % has non-positive price %', v_res.variant_id, v_variant.price_in_cents;
    END IF;

    v_line_total := v_res.quantity * v_variant.price_in_cents;
    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  IF v_res_count = 0 THEN
    RAISE EXCEPTION 'CHECKOUT_FAILED: No active, unlinked reservations found for cart % in warehouse %', p_cart_id, p_warehouse_id;
  END IF;

  -- 7. Backend Fee & Total Calculations
  v_delivery_fee := public.calculate_delivery_fee(v_subtotal, p_delivery_city);
  v_total := v_subtotal + v_delivery_fee + p_tip_in_cents;

  -- 8. Generate Identifiers
  v_order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));
  v_order_id := gen_random_uuid();

  -- 9. Level 3: Insert Order with Concurrency Collision Protection
  BEGIN
    INSERT INTO public.orders (
      id,
      order_number,
      user_id,
      cart_id,
      status,
      payment_status,
      customer_name,
      customer_phone,
      customer_email,
      delivery_address,
      delivery_city,
      delivery_lat,
      delivery_lng,
      delivery_notes,
      subtotal_in_cents,
      delivery_fee_in_cents,
      tip_in_cents,
      total_in_cents,
      total_amount,
      delivery_fee,
      tip_amount,
      payment_method,
      idempotency_key,
      created_at,
      updated_at
    ) VALUES (
      v_order_id,
      v_order_number,
      p_user_id,
      p_cart_id,
      'pending',
      'unpaid',
      trim(p_customer_name),
      trim(p_customer_phone),
      trim(p_customer_email),
      trim(p_delivery_address),
      trim(p_delivery_city),
      p_delivery_lat,
      p_delivery_lng,
      p_delivery_notes,
      v_subtotal,
      v_delivery_fee,
      p_tip_in_cents,
      v_total,
      (v_total / 100.0),
      (v_delivery_fee / 100.0),
      (p_tip_in_cents / 100.0),
      'wompi_pending',
      p_idempotency_key,
      now(),
      now()
    );
  EXCEPTION WHEN unique_violation THEN
    -- Concurrent duplicate request raced past Step 2; fetch committed record
    SELECT id, order_number, cart_id, user_id, customer_phone, total_in_cents, status, payment_status
    INTO v_existing_order
    FROM public.orders
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      IF (v_existing_order.cart_id IS NOT NULL AND v_existing_order.cart_id != p_cart_id)
         OR (p_user_id IS NOT NULL AND v_existing_order.user_id IS NOT NULL AND v_existing_order.user_id != p_user_id)
         OR (v_existing_order.customer_phone != '' AND v_existing_order.customer_phone != trim(p_customer_phone)) THEN
        RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT: Idempotency key % already used for another cart or customer', p_idempotency_key;
      END IF;

      RETURN jsonb_build_object(
        'status', 'idempotent_hit',
        'order_id', v_existing_order.id,
        'order_number', v_existing_order.order_number,
        'total_in_cents', v_existing_order.total_in_cents,
        'payment_status', v_existing_order.payment_status
      );
    ELSE
      RAISE;
    END IF;
  END;

  -- 10. Level 4: Insert Frozen Snapshots into order_items
  FOR v_res IN
    SELECT sr.id, sr.variant_id, sr.quantity
    FROM public.stock_reservations sr
    WHERE sr.cart_id = p_cart_id 
      AND sr.warehouse_id = p_warehouse_id
      AND sr.status = 'active'
      AND sr.order_id IS NULL
      AND sr.expires_at > now()
    ORDER BY sr.id ASC
  LOOP
    SELECT 
      pv.id AS variant_id,
      pv.product_id,
      pv.sku,
      pv.presentation_label,
      pv.price_in_cents,
      p.name AS product_name
    INTO v_variant
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = v_res.variant_id;

    INSERT INTO public.order_items (
      id,
      order_id,
      product_id,
      variant_id,
      quantity,
      unit_cost,
      product_name_snapshot,
      presentation_snapshot,
      sku_snapshot,
      unit_price_in_cents,
      unit_cost_in_cents,
      total_in_cents
    ) VALUES (
      gen_random_uuid(),
      v_order_id,
      (SELECT product_id FROM public.product_variants WHERE id = v_res.variant_id),
      v_res.variant_id,
      v_res.quantity,
      0,
      v_variant.product_name,
      v_variant.presentation_label,
      v_variant.sku,
      v_variant.price_in_cents,
      0,
      v_res.quantity * v_variant.price_in_cents
    );
  END LOOP;

  -- 11. Level 5: Bind Reservations to Order with strict row count verification
  UPDATE public.stock_reservations
  SET order_id = v_order_id
  WHERE cart_id = p_cart_id 
    AND warehouse_id = p_warehouse_id
    AND status = 'active' 
    AND order_id IS NULL
    AND expires_at > now();

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  IF v_updated_rows != v_res_count THEN
    RAISE EXCEPTION 'RESERVATION_COUNT_MISMATCH: Expected to bind % reservations for cart %, but % were affected', v_res_count, p_cart_id, v_updated_rows;
  END IF;

  -- 12. Mark Cart as Checked Out if carts row exists
  UPDATE public.carts
  SET status = 'checked_out', updated_at = now()
  WHERE id = p_cart_id AND status = 'active';

  -- 13. Return Structured Response
  RETURN jsonb_build_object(
    'status', 'created',
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal_in_cents', v_subtotal,
    'delivery_fee_in_cents', v_delivery_fee,
    'tip_in_cents', p_tip_in_cents,
    'total_in_cents', v_total,
    'payment_status', 'unpaid'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Security Privileges Revocation
REVOKE EXECUTE ON FUNCTION public.calculate_delivery_fee(BIGINT, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.calculate_delivery_fee(BIGINT, TEXT) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.process_checkout_atomic(
  UUID, UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, BIGINT
) FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.process_checkout_atomic(
  UUID, UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, BIGINT
) TO service_role;
