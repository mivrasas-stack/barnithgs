# Technical Design: Stage 3 — Transactional Checkout (Checkout Transaccional)
**PartyFlow Architecture Specification | Phase 1: Commercial Engine**

---

## 1. Executive Summary & Objective

Stage 3 implements the **Transactional Checkout Engine**, transitioning PartyFlow from pure catalog and inventory reservation into transactional order generation.

### Primary Objectives:
1. **ACID Order Materialization**: Convert active cart reservations into locked, immutable order items within an atomic PostgreSQL transaction.
2. **Integer Monetary Math**: Ensure all financial values (subtotal, delivery fee, tip, total) are strictly represented in integer Colombian Peso cents (`BIGINT`), completely eliminating floating-point rounding bugs.
3. **Strict Idempotency**: Guarantee zero duplicate orders or multi-billing under network retries, client double-clicks, or parallel requests.
4. **Decoupled Architecture**: Clean separation between order placement and payment execution. Wompi remains completely inactive in Stage 3, allowing isolated verification of the transactional checkout boundary.

---

## 2. Hexagonal Domain Architecture

```
+-----------------------------------------------------------------------------------+
|                              PRESENTATION LAYER                                   |
|   - Server Actions: src/actions/checkout.actions.ts                                |
|   - UI Components: src/app/cart/page.tsx, src/components/checkout/                 |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (DTOs validated via Zod)
+-----------------------------------------------------------------------------------+
|                              APPLICATION LAYER                                    |
|   - Service: src/services/checkout.service.ts                                     |
|   - Interfaces: src/types/checkout.types.ts                                       |
|   - Pattern: Dependency Injection, Result<T, E> (Either) Error Handling          |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ (PostgreSQL RPC invocation)
+-----------------------------------------------------------------------------------+
|                             INFRASTRUCTURE LAYER                                  |
|   - Database: public.orders, public.order_items, public.stock_reservations        |
|   - RPC: public.process_checkout_atomic(p_cart_id, p_idempotency_key, ...)        |
|   - Lock Hierarchy: inventory (L1) -> stock_reservations (L2) -> orders (L3)      |
+-----------------------------------------------------------------------------------+
```

---

## 3. Database Schema Delta (Migration: `20261008000003_p1_checkout.sql`)

### 3.1 Orders Table Evolution
```sql
-- Extend orders table with commercial fields and snapshots
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON public.orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
```

### 3.2 Order Items Table Evolution (Immutable Historic Snapshots)
```sql
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
```

### 3.3 Link Stock Reservations to Orders
```sql
ALTER TABLE public.stock_reservations
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stock_reservations_order_id ON public.stock_reservations(order_id);
```

---

## 4. Atomic PostgreSQL Transaction: `process_checkout_atomic`

### Core Guarantees:
1. **Idempotency Replay**: If `p_idempotency_key` already exists, returns the previously created order details immediately without mutation.
2. **Lock Order Compliance**:
   - Acquires `inventory` (L1) locks ordered by `variant_id` ascending to eliminate deadlock cycles.
   - Validates that active, non-expired reservations exist for the cart.
   - Generates the sequential human-readable `order_number` (`ORD-YYYYMMDD-XXXX`).
   - Inserts the `orders` header and immutable `order_items` snapshots.
   - Binds reservations to the created `order_id`.
3. **Financial Integrity Constraint**:
   - Verifies: `total_in_cents = subtotal_in_cents + delivery_fee_in_cents + tip_in_cents`.

```sql
CREATE OR REPLACE FUNCTION public.process_checkout_atomic(
  p_cart_id UUID,
  p_warehouse_id UUID,
  p_idempotency_key TEXT,
  p_user_id UUID,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT,
  p_delivery_address TEXT,
  p_delivery_city TEXT,
  p_delivery_lat DOUBLE PRECISION,
  p_delivery_lng DOUBLE PRECISION,
  p_delivery_notes TEXT,
  p_delivery_fee_in_cents BIGINT,
  p_tip_in_cents BIGINT
) RETURNS JSONB AS $$
DECLARE
  v_existing_order RECORD;
  v_order_id UUID;
  v_order_number TEXT;
  v_subtotal BIGINT := 0;
  v_total BIGINT := 0;
  v_item RECORD;
BEGIN
  -- 1. Idempotency Check
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

  -- 2. Validate Active Reservations for the Cart
  IF NOT EXISTS (
    SELECT 1 FROM public.stock_reservations
    WHERE cart_id = p_cart_id AND status = 'active' AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'CHECKOUT_FAILED: No active stock reservations found for cart %', p_cart_id;
  END IF;

  -- 3. Calculate Subtotal and Snapshot Item Data
  -- [Implementation loops over active reservations, fetches variant price_in_cents snapshot,
  --  and calculates subtotal]

  -- 4. Generate Human-Readable Order Number
  v_order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));

  -- 5. Insert Orders Row
  -- 6. Insert Order Items Snapshots
  -- 7. Associate Reservations with order_id

  RETURN jsonb_build_object(
    'status', 'created',
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total_in_cents', v_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

## 5. Security & Row-Level Security (RLS) Policies

1. **Orders Visibility**:
   - Clients can read orders where `auth.uid() = user_id`.
   - Guest checkouts can access their placed order via signed order token / server action only.
   - Admins and warehouse staff have full view access via `is_admin()` and role-based policies.
2. **Order Items**:
   - Read-only to clients who own the parent order.
3. **RPC Privileges**:
   - `process_checkout_atomic` is granted to `service_role` and `authenticated`.
   - Anonymous access is protected through server action validation.

---

## 6. Testing & Quality Verification Strategy (TDD)

1. **Unit Testing (`src/services/__tests__/checkout.service.test.ts`)**:
   - Mocked Supabase client testing input validation, calculation integrity, and error propagation using `Result<T, E>`.
2. **Real Integration Testing (`src/actions/__tests__/checkout.real.test.ts`)**:
   - Real PostgreSQL RPC execution against isolated Docker Supabase.
   - Idempotency verification: 5 concurrent requests with identical `idempotency_key` create exactly 1 order.
   - Expired reservation rejection: attempting checkout on expired cart fails with `CHECKOUT_FAILED`.
   - Snapshot integrity: price alterations on products or variants after checkout do NOT mutate existing `order_items`.
3. **Lint, Typecheck & Build Constraints**:
   - Zero `any` policy.
   - Cyclomatic complexity <= 5 per method.
   - Maximum lines <= 25 per function.
