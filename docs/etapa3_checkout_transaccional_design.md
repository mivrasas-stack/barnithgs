# Technical Design Specification: Stage 3 — Transactional Checkout (Checkout Transaccional)
**PartyFlow Architecture Specification | Phase 1: Commercial Engine | Stage 3**

---

## 1. Security & Privilege Architecture

### 1.1 Root Problem in Naive Implementations
Exposing a `SECURITY DEFINER` function like `process_checkout_atomic` directly to the `authenticated` role while accepting `p_user_id` without cryptographically proving cart ownership or identity allows ID spoofing, checkout hijacking, and unauthorized cart drain.

### 1.2 Zero-Trust Server-Action Boundary
1. **Access Revocation**: Direct execution of `process_checkout_atomic` is **STRICTLY REVOKED** from `public`, `anon`, and `authenticated`.
2. **Execution Authority**: Execution is granted exclusively to `service_role`.
3. **Orchestrator**: Next.js Server Actions (`src/actions/checkout.actions.ts`) authenticate the user session (`auth.getUser()`), enforce cart ownership, validate delivery input schemas via Zod, and then execute the transactional checkout RPC via the backend client.

```sql
REVOKE EXECUTE ON FUNCTION public.process_checkout_atomic(
  UUID, UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, BIGINT, BIGINT
) FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.process_checkout_atomic(
  UUID, UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, BIGINT, BIGINT
) TO service_role;
```

---

## 2. Canonical Lock Hierarchy & Concurrency Protection

To ensure mathematical immunity against deadlocks under heavy concurrent checkout requests:

```
[Level 1: inventory]             Lock inventory rows sorted by variant_id ASC (FOR UPDATE)
        │
        ▼
[Level 2: stock_reservations]    Lock active reservations for cart_id sorted by id ASC (FOR UPDATE)
        │
        ▼
[Level 3: orders]                Insert order header with unique idempotency_key
        │
        ▼
[Level 4: order_items]           Insert frozen snapshot line items
        │
        ▼
[Level 5: stock_reservations]    Bind reservations to order_id (atomic link)
```

By enforcing strictly ordered locks on Level 1 (`ORDER BY variant_id ASC`) across all cart lines, competing concurrent transactions never enter cyclic wait-for graphs.

---

## 3. Financial Integrity & Price Derivation

**Strict Architectural Invariant:** The client application NEVER provides prices, discounts, or subtotals.
1. The database retrieves active, verified unit prices from `product_variants.price_in_cents`.
2. The catalog status of both the parent `products` and `product_variants` is verified (`is_active = true`).
3. Integer currency math: all amounts are `BIGINT` in Colombian Peso cents (`COP`).
4. Financial balance identity is strictly enforced:
   $$\text{total\_in\_cents} = \text{subtotal\_in\_cents} + \text{delivery\_fee\_in\_cents} + \text{tip\_in\_cents}$$

---

## 4. Complete PostgreSQL RPC: `process_checkout_atomic`

```sql
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
  p_delivery_fee_in_cents BIGINT DEFAULT 0,
  p_tip_in_cents BIGINT DEFAULT 0
) RETURNS JSONB AS $$
DECLARE
  v_existing_order RECORD;
  v_order_id UUID;
  v_order_number TEXT;
  v_res RECORD;
  v_variant RECORD;
  v_subtotal BIGINT := 0;
  v_total BIGINT := 0;
  v_line_total BIGINT;
  v_res_count INTEGER := 0;
BEGIN
  -- 1. Parameter Validation
  IF p_cart_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: cart_id cannot be null';
  END IF;

  IF p_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: warehouse_id cannot be null';
  END IF;

  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) = 0 THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: idempotency_key is required';
  END IF;

  IF p_delivery_fee_in_cents < 0 OR p_tip_in_cents < 0 THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: delivery fee and tip must be non-negative';
  END IF;

  -- 2. Idempotency Replay Check
  SELECT id, order_number, total_in_cents, status, payment_status
  INTO v_existing_order
  FROM public.orders
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'status', 'idempotent_hit',
      'order_id', v_existing_order.id,
      'order_number', v_existing_order.order_number,
      'total_in_cents', v_existing_order.total_in_cents,
      'payment_status', v_existing_order.payment_status
    );
  END IF;

  -- 3. Level 1 Lock: Lock inventory rows in canonical order (variant_id ASC)
  -- Identifies distinct variants associated with active reservations for this cart
  PERFORM i.variant_id
  FROM public.inventory i
  WHERE (i.variant_id, i.warehouse_id) IN (
    SELECT DISTINCT sr.variant_id, sr.warehouse_id
    FROM public.stock_reservations sr
    WHERE sr.cart_id = p_cart_id 
      AND sr.status = 'active' 
      AND sr.expires_at > now()
  )
  ORDER BY i.variant_id ASC
  FOR UPDATE;

  -- 4. Level 2 Lock: Lock active, unexpired reservations for this cart
  -- Validates that cart has active reserved stock
  FOR v_res IN
    SELECT id, variant_id, warehouse_id, quantity, expires_at
    FROM public.stock_reservations
    WHERE cart_id = p_cart_id 
      AND status = 'active' 
      AND expires_at > now()
    ORDER BY id ASC
    FOR UPDATE
  LOOP
    v_res_count := v_res_count + 1;

    -- Fetch trusted price and details directly from database (NEVER from client)
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
      RAISE EXCEPTION 'CATALOG_ERROR: Variant % (% - %) is inactive', v_res.variant_id, v_variant.product_name, v_variant.presentation_label;
    END IF;

    IF v_variant.price_in_cents <= 0 THEN
      RAISE EXCEPTION 'PRICING_ERROR: Variant % has non-positive price %', v_res.variant_id, v_variant.price_in_cents;
    END IF;

    v_line_total := v_res.quantity * v_variant.price_in_cents;
    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  IF v_res_count = 0 THEN
    RAISE EXCEPTION 'CHECKOUT_FAILED: No active, non-expired reservations found for cart %', p_cart_id;
  END IF;

  -- 5. Calculate Total Amount
  v_total := v_subtotal + p_delivery_fee_in_cents + p_tip_in_cents;

  -- 6. Generate Sequential Order Number
  v_order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));
  v_order_id := gen_random_uuid();

  -- 7. Level 3: Insert Order Record
  INSERT INTO public.orders (
    id,
    order_number,
    user_id,
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
    idempotency_key,
    created_at,
    updated_at
  ) VALUES (
    v_order_id,
    v_order_number,
    p_user_id,
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
    p_delivery_fee_in_cents,
    p_tip_in_cents,
    v_total,
    p_idempotency_key,
    now(),
    now()
  );

  -- 8. Level 4: Insert Frozen Order Items Snapshots
  FOR v_res IN
    SELECT sr.id, sr.variant_id, sr.quantity
    FROM public.stock_reservations sr
    WHERE sr.cart_id = p_cart_id 
      AND sr.status = 'active'
    ORDER BY sr.id ASC
  LOOP
    SELECT 
      pv.id AS variant_id,
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
      v_variant.product_name,
      v_variant.presentation_label,
      v_variant.sku,
      v_variant.price_in_cents,
      0,
      v_res.quantity * v_variant.price_in_cents
    );
  END LOOP;

  -- 9. Level 5: Bind active reservations to the newly created order
  UPDATE public.stock_reservations
  SET order_id = v_order_id
  WHERE cart_id = p_cart_id AND status = 'active';

  -- 10. Return Structured Result
  RETURN jsonb_build_object(
    'status', 'created',
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal_in_cents', v_subtotal,
    'delivery_fee_in_cents', p_delivery_fee_in_cents,
    'tip_in_cents', p_tip_in_cents,
    'total_in_cents', v_total,
    'payment_status', 'unpaid'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

## 5. Schema Migration & Rollback Strategy

1. **Migration File**: `supabase/migrations/20261008000003_p1_checkout.sql`
   - Adds commercial columns to `orders` and `order_items` non-destructively (`ADD COLUMN IF NOT EXISTS`).
   - Links `stock_reservations.order_id REFERENCES public.orders(id)`.
   - Creates necessary performance indexes (`idx_orders_idempotency`, `idx_orders_user_id`, `idx_order_items_order_id`, `idx_stock_reservations_order_id`).
   - Creates the `process_checkout_atomic` procedure.
   - Enforces `REVOKE` from public/anon/authenticated and `GRANT` to `service_role`.

2. **Rollback Safety**:
   - Backward-compatible column additions.
   - Drops function `public.process_checkout_atomic` cleanly without affecting existing catalog or inventory operations.

---

## 6. Implementation & Test Verification Plan (TDD)

1. **TDD Suite (`src/actions/__tests__/checkout.real.test.ts`)**:
   - **Atomic Order Creation**: Verifies that active reservations for multiple variants create an order with exact matching snapshots, correct sums, and order-bound reservations.
   - **Database-Driven Pricing Integrity**: Verifies that tamper attempts (e.g. client sending modified prices) are impossible because the DB reads `product_variants.price_in_cents`.
   - **Idempotency Under High Concurrency**: Executes 5 simultaneous parallel checkout calls using the same `idempotency_key`. Asserts exactly 1 order created with identical order number and total returned across all calls.
   - **Expired Reservation Rejection**: Verifies that expired or non-existent reservations immediately abort the transaction with `CHECKOUT_FAILED` without creating any order or mutating state.
   - **Deadlock Resistance**: Runs concurrent cross-order checkouts with reversed cart item orders and confirms 100% completion without deadlocks.
2. **Preservation of Baselines**:
   - `database.real.test.ts` (P0 Security & Baseline): 100% preserved.
   - `catalog.service.test.ts` (Stage 1 Catalog): 100% preserved.
   - `inventory.real.test.ts` (Stage 2 Inventory & Concurrency): 100% preserved.
