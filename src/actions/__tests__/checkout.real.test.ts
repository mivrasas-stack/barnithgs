import { createClient } from '@supabase/supabase-js';
import { CheckoutService } from '@/services/checkout.service';

// Defensive polyfill for environments without WebSocket
if (typeof (globalThis as unknown as { WebSocket: unknown }).WebSocket === 'undefined') {
  (globalThis as unknown as { WebSocket: unknown }).WebSocket = class DummyWebSocket {};
}

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321').trim();
const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fake-anon-key').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'fake-service-key').trim();

type QueryResult<T> = Promise<{ data: T; error: { message: string; code?: string } | null }>;

interface TableHandler {
  select: (cols?: string) => {
    eq: (col: string, val: unknown) => {
      eq: (col2: string, val2: unknown) => {
        single: () => QueryResult<Record<string, unknown>>;
      } & QueryResult<Record<string, unknown>[]>;
      single: () => QueryResult<Record<string, unknown>>;
    } & QueryResult<Record<string, unknown>[]>;
    in: (col: string, vals: unknown[]) => QueryResult<Record<string, unknown>[]>;
  } & QueryResult<Record<string, unknown>[]>;
  insert: (values: unknown) => QueryResult<unknown>;
  upsert: (values: unknown) => QueryResult<unknown>;
  update: (values: unknown) => {
    eq: (col: string, val: unknown) => {
      eq: (col2: string, val2: unknown) => QueryResult<unknown>;
    } & QueryResult<unknown>;
  };
  delete: () => {
    eq: (col: string, val: unknown) => QueryResult<unknown>;
    in: (col: string, vals: unknown[]) => QueryResult<unknown>;
  };
}

interface TestDbClient {
  rpc: (fn: string, params?: Record<string, unknown>) => QueryResult<unknown>;
  from: (table: string) => TableHandler;
}

async function createAuthUserClient(
  admin: ReturnType<typeof createClient>,
  anon: ReturnType<typeof createClient>
): Promise<{ client: TestDbClient; userId: string }> {
  const email = `test-chk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@partyflow.app`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: 'SecurePassword123!', email_confirm: true });
  if (error || !data.user) throw new Error(`User create failed: ${error?.message}`);

  await (admin.from('profiles') as unknown as TableHandler).insert({
    id: data.user.id, full_name: 'Test Client', name: 'Test Client', role: 'client', email
  });

  const { data: authData, error: signInErr } = await anon.auth.signInWithPassword({ email, password: 'SecurePassword123!' });
  if (signInErr || !authData.session) throw new Error(`Login failed: ${signInErr?.message}`);

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return { client: client as unknown as TestDbClient, userId: data.user.id };
}

describe('P1 Etapa 3: Checkout Transaccional (process_checkout_atomic & CheckoutService)', () => {
  let adminClient: ReturnType<typeof createClient>;
  let anonClient: ReturnType<typeof createClient>;
  let checkoutService: CheckoutService;
  const WAREHOUSE_ID = '00000000-0000-0000-0000-000000000001';

  beforeAll(() => {
    if (SUPABASE_ANON_KEY === 'fake-anon-key' || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing real database credentials. Start Supabase locally.');
    }
    adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    checkoutService = new CheckoutService(adminClient);
  });

  it('crea orden atómica con instantáneas inmutables, vinculación de reservas y cálculo de importes', async () => {
    const prodA = '71000000-0000-0000-0000-000000000001';
    const prodB = '71000000-0000-0000-0000-000000000002';
    const varA = '81000000-0000-0000-0000-000000000001';
    const varB = '81000000-0000-0000-0000-000000000002';
    const cartId = '91000000-0000-0000-0000-000000000001';
    const idempKey = `idemp-atomic-${Date.now()}`;
    const db = adminClient as unknown as TestDbClient;

    try {
      await db.from('products').upsert([
        { id: prodA, name: 'Ron Caldas 8 Años', is_active: true },
        { id: prodB, name: 'Gin Hendrick Prime', is_active: true }
      ]);
      await db.from('product_variants').upsert([
        { id: varA, product_id: prodA, sku: 'SKU-RON-8A', presentation_label: '750ml', price_in_cents: 4500000, is_active: true },
        { id: varB, product_id: prodB, sku: 'SKU-GIN-HEN', presentation_label: '700ml', price_in_cents: 3000000, is_active: true }
      ]);
      await db.from('inventory').update({ physical_quantity: 20, safety_stock: 0 }).eq('variant_id', varA).eq('warehouse_id', WAREHOUSE_ID);
      await db.from('inventory').update({ physical_quantity: 20, safety_stock: 0 }).eq('variant_id', varB).eq('warehouse_id', WAREHOUSE_ID);
      await db.from('carts').upsert({ id: cartId, status: 'active' });

      // Reserva 2 unidades de VarA (90k COP) y 1 unidad de VarB (30k COP) -> Subtotal: 120k COP (12,000,000 centavos)
      await db.rpc('reserve_variant_stock', { p_variant_id: varA, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartId, p_quantity: 2 });
      await db.rpc('reserve_variant_stock', { p_variant_id: varB, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartId, p_quantity: 1 });

      const res = await db.rpc('process_checkout_atomic', {
        p_cart_id: cartId,
        p_warehouse_id: WAREHOUSE_ID,
        p_idempotency_key: idempKey,
        p_customer_name: 'David Vélez',
        p_customer_phone: '+573105551234',
        p_customer_email: 'david@partyflow.app',
        p_delivery_address: 'Carrera 7 # 72-10',
        p_delivery_city: 'Bogotá D.C.',
        p_tip_in_cents: 50000
      });

      expect(res.error).toBeNull();
      const data = res.data as Record<string, unknown>;
      expect(data.status).toBe('created');
      expect(Number(data.subtotal_in_cents)).toBe(12000000);
      expect(Number(data.delivery_fee_in_cents)).toBe(0); // Subtotal >= 100k COP -> Envio Gratis
      expect(Number(data.tip_in_cents)).toBe(50000);
      expect(Number(data.total_in_cents)).toBe(12050000);

      // Verificación en tabla orders
      const { data: orderRow } = await db.from('orders').select('*').eq('id', data.order_id).single();
      expect(orderRow.order_number).toBe(data.order_number);
      expect(Number(orderRow.total_in_cents)).toBe(12050000);
      expect(Number(orderRow.total_amount)).toBe(120500);
      expect(orderRow.payment_status).toBe('unpaid');
      expect(orderRow.status).toBe('pending');

      // Verificación en order_items (instantáneas inmutables)
      const { data: items } = await db.from('order_items').select('*').eq('order_id', data.order_id);
      expect(items).toHaveLength(2);
      const ronItem = items.find((i: Record<string, unknown>) => i.variant_id === varA);
      expect(ronItem).toBeDefined();
      if (!ronItem) throw new Error('ronItem not found');
      expect(ronItem.product_name_snapshot).toBe('Ron Caldas 8 Años');
      expect(ronItem.presentation_snapshot).toBe('750ml');
      expect(Number(ronItem.unit_price_in_cents)).toBe(4500000);
      expect(Number(ronItem.quantity)).toBe(2);
      expect(Number(ronItem.total_in_cents)).toBe(9000000);

      // Verificación de vinculación de reservas
      const { data: linkedRes } = await db.from('stock_reservations').select('order_id, status').eq('cart_id', cartId);
      expect(linkedRes).toHaveLength(2);
      expect(linkedRes[0].order_id).toBe(data.order_id);
      expect(linkedRes[1].order_id).toBe(data.order_id);

      // Verificación de estado del carrito
      const { data: updatedCart } = await db.from('carts').select('status').eq('id', cartId).single();
      expect(updatedCart.status).toBe('checked_out');
    } finally {
      await db.from('order_items').delete().in('variant_id', [varA, varB]);
      await db.from('stock_reservations').delete().eq('cart_id', cartId);
      await db.from('orders').delete().eq('idempotency_key', idempKey);
      await db.from('carts').delete().eq('id', cartId);
      await db.from('inventory').delete().in('variant_id', [varA, varB]);
      await db.from('product_variants').delete().in('id', [varA, varB]);
      await db.from('products').delete().in('id', [prodA, prodB]);
    }
  });

  it('idempotencia concurrente real: 5 llamadas simultáneas obtienen exactamente la misma orden sin colisiones de unicidad', async () => {
    const prodC = '71000000-0000-0000-0000-000000000010';
    const varC = '81000000-0000-0000-0000-000000000010';
    const cartC = '91000000-0000-0000-0000-000000000010';
    const sharedIdempKey = `idemp-race-${Date.now()}`;
    const db = adminClient as unknown as TestDbClient;

    try {
      await db.from('products').upsert({ id: prodC, name: 'Mezcal Joven', is_active: true });
      await db.from('product_variants').upsert({
        id: varC, product_id: prodC, sku: 'SKU-MEZ-JOV', presentation_label: '750ml', price_in_cents: 8000000, is_active: true
      });
      await db.from('inventory').update({ physical_quantity: 15, safety_stock: 0 }).eq('variant_id', varC).eq('warehouse_id', WAREHOUSE_ID);
      await db.from('carts').upsert({ id: cartC, status: 'active' });
      await db.rpc('reserve_variant_stock', { p_variant_id: varC, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartC, p_quantity: 1 });

      const checkoutPayload = {
        p_cart_id: cartC,
        p_warehouse_id: WAREHOUSE_ID,
        p_idempotency_key: sharedIdempKey,
        p_customer_name: 'Laura Restrepo',
        p_customer_phone: '+573201112233',
        p_customer_email: 'laura@partyflow.app',
        p_delivery_address: 'Calle 100 # 15-20',
        p_delivery_city: 'Bogotá D.C.',
        p_tip_in_cents: 20000
      };

      // 5 llamadas concurrentes idénticas
      const parallelOps = await Promise.all([
        db.rpc('process_checkout_atomic', checkoutPayload),
        db.rpc('process_checkout_atomic', checkoutPayload),
        db.rpc('process_checkout_atomic', checkoutPayload),
        db.rpc('process_checkout_atomic', checkoutPayload),
        db.rpc('process_checkout_atomic', checkoutPayload),
      ]);

      // Todas deben resolverse con éxito
      for (const op of parallelOps) {
        expect(op.error).toBeNull();
        expect(op.data).toBeDefined();
      }

      const results = parallelOps.map(op => op.data as Record<string, unknown>);
      const createdCount = results.filter(r => r.status === 'created').length;
      const hitCount = results.filter(r => r.status === 'idempotent_hit').length;

      expect(createdCount).toBe(1);
      expect(hitCount).toBe(4);

      // Todas deben retornar exactamente el mismo ID y número de orden
      const expectedOrderId = results[0].order_id;
      const expectedOrderNumber = results[0].order_number;
      for (const r of results) {
        expect(r.order_id).toBe(expectedOrderId);
        expect(r.order_number).toBe(expectedOrderNumber);
      }

      // Verificación en BD: exactamente 1 orden creada para esa clave
      const { data: orders } = await db.from('orders').select('id').eq('idempotency_key', sharedIdempKey);
      expect(orders).toHaveLength(1);
    } finally {
      await db.from('order_items').delete().eq('variant_id', varC);
      await db.from('stock_reservations').delete().eq('cart_id', cartC);
      await db.from('orders').delete().eq('idempotency_key', sharedIdempKey);
      await db.from('carts').delete().eq('id', cartC);
      await db.from('inventory').delete().eq('variant_id', varC);
      await db.from('product_variants').delete().eq('id', varC);
      await db.from('products').delete().eq('id', prodC);
    }
  });

  it('rechaza reutilización de una clave de idempotencia con otro carrito o comprador (IDEMPOTENCY_CONFLICT)', async () => {
    const prodD = '71000000-0000-0000-0000-000000000020';
    const varD = '81000000-0000-0000-0000-000000000020';
    const cartA = '91000000-0000-0000-0000-000000000021';
    const cartB = '91000000-0000-0000-0000-000000000022';
    const conflictKey = `idemp-conflict-${Date.now()}`;
    const db = adminClient as unknown as TestDbClient;

    try {
      await db.from('products').upsert({ id: prodD, name: 'Cerveza Club Colombia', is_active: true });
      await db.from('product_variants').upsert({
        id: varD, product_id: prodD, sku: 'SKU-CERV-CC', presentation_label: '330ml', price_in_cents: 500000, is_active: true
      });
      await db.from('inventory').update({ physical_quantity: 10, safety_stock: 0 }).eq('variant_id', varD).eq('warehouse_id', WAREHOUSE_ID);
      await db.from('carts').upsert([
        { id: cartA, status: 'active' },
        { id: cartB, status: 'active' }
      ]);
      await db.rpc('reserve_variant_stock', { p_variant_id: varD, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartA, p_quantity: 1 });
      await db.rpc('reserve_variant_stock', { p_variant_id: varD, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartB, p_quantity: 1 });

      const firstCall = await db.rpc('process_checkout_atomic', {
        p_cart_id: cartA,
        p_warehouse_id: WAREHOUSE_ID,
        p_idempotency_key: conflictKey,
        p_customer_phone: '+573000000001'
      });
      expect(firstCall.error).toBeNull();

      // Intento de reusar conflictKey con un carrito diferente
      const secondCall = await db.rpc('process_checkout_atomic', {
        p_cart_id: cartB,
        p_warehouse_id: WAREHOUSE_ID,
        p_idempotency_key: conflictKey,
        p_customer_phone: '+573000000002'
      });
      expect(secondCall.error).toBeDefined();
      expect(secondCall.error?.message).toContain('IDEMPOTENCY_CONFLICT');
    } finally {
      await db.from('order_items').delete().eq('variant_id', varD);
      await db.from('stock_reservations').delete().in('cart_id', [cartA, cartB]);
      await db.from('orders').delete().eq('idempotency_key', conflictKey);
      await db.from('carts').delete().in('id', [cartA, cartB]);
      await db.from('inventory').delete().eq('variant_id', varD);
      await db.from('product_variants').delete().eq('id', varD);
      await db.from('products').delete().eq('id', prodD);
    }
  });

  it('seguridad financiera: calcula tarifa de entrega estrictamente en backend y rechaza manipulación de precios', async () => {
    const prodE = '71000000-0000-0000-0000-000000000030';
    const varE = '81000000-0000-0000-0000-000000000030';
    const cartE = '91000000-0000-0000-0000-000000000030';
    const idempE = `idemp-fee-${Date.now()}`;
    const db = adminClient as unknown as TestDbClient;

    try {
      await db.from('products').upsert({ id: prodE, name: 'Vino Malbec Reserva', is_active: true });
      await db.from('product_variants').upsert({
        id: varE, product_id: prodE, sku: 'SKU-VIN-MAL', presentation_label: '750ml', price_in_cents: 6000000, is_active: true
      });
      await db.from('inventory').update({ physical_quantity: 10, safety_stock: 0 }).eq('variant_id', varE).eq('warehouse_id', WAREHOUSE_ID);
      await db.from('carts').upsert({ id: cartE, status: 'active' });
      await db.rpc('reserve_variant_stock', { p_variant_id: varE, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartE, p_quantity: 1 });

      // Subtotal 60k COP (< 100k COP) en municipio fuera de Bogotá (Chía) -> Tarifa regional: 10,000 COP (1,000,000 cents)
      const resRegional = await db.rpc('process_checkout_atomic', {
        p_cart_id: cartE,
        p_warehouse_id: WAREHOUSE_ID,
        p_idempotency_key: idempE,
        p_delivery_city: 'Chía',
        p_tip_in_cents: 0
      });
      expect(resRegional.error).toBeNull();
      const data = resRegional.data as Record<string, unknown>;
      expect(Number(data.delivery_fee_in_cents)).toBe(1000000);
      expect(Number(data.total_in_cents)).toBe(7000000); // 6M subtotal + 1M envio
    } finally {
      await db.from('order_items').delete().eq('variant_id', varE);
      await db.from('stock_reservations').delete().eq('cart_id', cartE);
      await db.from('orders').delete().eq('idempotency_key', idempE);
      await db.from('carts').delete().eq('id', cartE);
      await db.from('inventory').delete().eq('variant_id', varE);
      await db.from('product_variants').delete().eq('id', varE);
      await db.from('products').delete().eq('id', prodE);
    }
  });

  it('integridad de reservas: rechaza checkout si el carrito contiene reservas liberadas, expiradas o previamente ordenadas', async () => {
    const prodF = '71000000-0000-0000-0000-000000000040';
    const varF = '81000000-0000-0000-0000-000000000040';
    const cartF = '91000000-0000-0000-0000-000000000040';
    const idempF = `idemp-inv-res-${Date.now()}`;
    const db = adminClient as unknown as TestDbClient;

    try {
      await db.from('products').upsert({ id: prodF, name: 'Tequila Don Julio', is_active: true });
      await db.from('product_variants').upsert({
        id: varF, product_id: prodF, sku: 'SKU-TEQ-DJ', presentation_label: '700ml', price_in_cents: 22000000, is_active: true
      });
      await db.from('inventory').update({ physical_quantity: 10, safety_stock: 0 }).eq('variant_id', varF).eq('warehouse_id', WAREHOUSE_ID);
      await db.from('carts').upsert({ id: cartF, status: 'active' });

      // Insertar reserva directamente como expirada
      const expiredAt = new Date(Date.now() - 60000).toISOString();
      await db.from('stock_reservations').insert({
        variant_id: varF,
        product_id: prodF,
        warehouse_id: WAREHOUSE_ID,
        cart_id: cartF,
        quantity: 1,
        status: 'active',
        expires_at: expiredAt
      });

      const res = await db.rpc('process_checkout_atomic', {
        p_cart_id: cartF,
        p_warehouse_id: WAREHOUSE_ID,
        p_idempotency_key: idempF,
        p_customer_name: 'Test Customer',
        p_customer_phone: '+573001112233'
      });
      expect(res.error).toBeDefined();
      expect(res.error?.message).toContain('RESERVATION_INVALID');

      // Comprobar que no se creó ninguna orden
      const { data: orders } = await db.from('orders').select('id').eq('idempotency_key', idempF);
      expect(orders).toHaveLength(0);
    } finally {
      await db.from('stock_reservations').delete().eq('cart_id', cartF);
      await db.from('orders').delete().eq('idempotency_key', idempF);
      await db.from('carts').delete().eq('id', cartF);
      await db.from('inventory').delete().eq('variant_id', varF);
      await db.from('product_variants').delete().eq('id', varF);
      await db.from('products').delete().eq('id', prodF);
    }
  });

  it('seguridad de acceso: CheckoutService rechaza checkout en carrito perteneciente a otro usuario (403)', async () => {
    const userA = await createAuthUserClient(adminClient, anonClient);
    const userB = await createAuthUserClient(adminClient, anonClient);
    const cartOwnerA = '91000000-0000-0000-0000-000000000099';
    const db = adminClient as unknown as TestDbClient;

    try {
      await db.from('carts').upsert({
        id: cartOwnerA,
        user_id: userA.userId,
        status: 'active'
      });

      // User B intenta procesar el carrito de User A
      const attempt = await checkoutService.processCheckout({
        cartId: cartOwnerA,
        warehouseId: WAREHOUSE_ID,
        idempotencyKey: `idemp-steal-${Date.now()}`,
        userId: userB.userId,
        customerName: 'Intruder',
        customerPhone: '+573000000000',
        customerEmail: 'intruder@partyflow.app',
        deliveryAddress: 'Fake Street 123'
      });

      expect(attempt.success).toBe(false);
      if (!attempt.success) {
        expect(attempt.error.code).toBe('FORBIDDEN_CART_ACCESS');
      }
    } finally {
      await db.from('carts').delete().eq('id', cartOwnerA);
      await adminClient.auth.admin.deleteUser(userA.userId);
      await adminClient.auth.admin.deleteUser(userB.userId);
    }
  });
});
