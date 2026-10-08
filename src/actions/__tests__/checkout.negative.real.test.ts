import { createClient } from '@supabase/supabase-js';
import { CheckoutService } from '@/services/checkout.service';

// Polyfill WebSocket for isolated test environments if needed
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
  const email = `test-neg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@partyflow.app`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: 'SecurePassword123!',
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`User create failed: ${error?.message}`);

  await (admin.from('profiles') as unknown as TableHandler).insert({
    id: data.user.id,
    full_name: 'Negative Test User',
    name: 'Negative Test User',
    role: 'client',
    email,
  });

  const { data: authData, error: signInErr } = await anon.auth.signInWithPassword({
    email,
    password: 'SecurePassword123!',
  });
  if (signInErr || !authData.session) throw new Error(`Login failed: ${signInErr?.message}`);

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { client: client as unknown as TestDbClient, userId: data.user.id };
}

describe('P1 Etapa 3: Pruebas Físicas Negativas de Checkout', () => {
  let adminClient: ReturnType<typeof createClient>;
  let anonClient: ReturnType<typeof createClient>;
  let checkoutService: CheckoutService;

  const WAREHOUSE_1 = '00000000-0000-0000-0000-000000000001';
  const WAREHOUSE_2 = '00000000-0000-0000-0000-000000000002';

  beforeAll(async () => {
    if (SUPABASE_ANON_KEY === 'fake-anon-key' || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing real database credentials. Start Supabase locally.');
    }
    adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    checkoutService = new CheckoutService(adminClient);

    const db = adminClient as unknown as TestDbClient;
    await db.from('warehouses').upsert({
      id: WAREHOUSE_2,
      code: 'BOD-NORTE',
      name: 'Bodega Norte',
      address: 'Chía, Cundinamarca',
    });
  });

  // 1. Checkout invitado sin token
  it('1. rechaza checkout de invitado sin sessionToken (FORBIDDEN_CART_ACCESS)', async () => {
    const cartId = '92000000-0000-0000-0000-000000000001';
    const db = adminClient as unknown as TestDbClient;

    try {
      await db.from('carts').upsert({
        id: cartId,
        user_id: null,
        session_token: 'valid-guest-secret-111',
        status: 'active',
      });

      const res = await checkoutService.processCheckout({
        cartId,
        warehouseId: WAREHOUSE_1,
        idempotencyKey: `idemp-guest-notoken-${Date.now()}`,
        userId: null,
        sessionToken: null,
        customerName: 'Invitado Sin Token',
        customerPhone: '+573001112233',
        customerEmail: 'guest1@partyflow.app',
        deliveryAddress: 'Calle 10 # 20-30',
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('FORBIDDEN_CART_ACCESS');
        expect(res.error.message).toContain('Guest checkout requires a mandatory sessionToken');
      }
    } finally {
      await db.from('carts').delete().eq('id', cartId);
    }
  });

  // 2. Checkout invitado con token incorrecto
  it('2. rechaza checkout de invitado con sessionToken incorrecto (FORBIDDEN_CART_ACCESS)', async () => {
    const cartId = '92000000-0000-0000-0000-000000000002';
    const db = adminClient as unknown as TestDbClient;

    try {
      await db.from('carts').upsert({
        id: cartId,
        user_id: null,
        session_token: 'valid-guest-secret-222',
        status: 'active',
      });

      const res = await checkoutService.processCheckout({
        cartId,
        warehouseId: WAREHOUSE_1,
        idempotencyKey: `idemp-guest-wrongtoken-${Date.now()}`,
        userId: null,
        sessionToken: 'tampered-token-xyz',
        customerName: 'Invitado Token Falso',
        customerPhone: '+573001112233',
        customerEmail: 'guest2@partyflow.app',
        deliveryAddress: 'Calle 10 # 20-30',
      });

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('FORBIDDEN_CART_ACCESS');
        expect(res.error.message).toContain('Invalid guest session token for cart');
      }
    } finally {
      await db.from('carts').delete().eq('id', cartId);
    }
  });

  // 3. Usuario que falsifica el userId de otro
  it('3. rechaza usuario que falsifica o suprime el userId de otro a nivel de servicio y RPC', async () => {
    const userA = await createAuthUserClient(adminClient, anonClient);
    const userB = await createAuthUserClient(adminClient, anonClient);
    const cartUserA = '92000000-0000-0000-0000-000000000003';
    const db = adminClient as unknown as TestDbClient;

    try {
      await db.from('carts').upsert({
        id: cartUserA,
        user_id: userA.userId,
        status: 'active',
      });

      // Intento 1: A través de CheckoutService con identidad de User B
      const serviceRes = await checkoutService.processCheckout({
        cartId: cartUserA,
        warehouseId: WAREHOUSE_1,
        idempotencyKey: `idemp-spoof-${Date.now()}`,
        userId: userB.userId,
        customerName: 'Impostor',
        customerPhone: '+573009998877',
        customerEmail: 'impostor@partyflow.app',
        deliveryAddress: 'Fake Street 456',
      });

      expect(serviceRes.success).toBe(false);
      if (!serviceRes.success) {
        expect(serviceRes.error.code).toBe('FORBIDDEN_CART_ACCESS');
      }

      // Intento 2: Invocación directa a la RPC con user_id falso
      const rpcRes = await db.rpc('process_checkout_atomic', {
        p_cart_id: cartUserA,
        p_warehouse_id: WAREHOUSE_1,
        p_idempotency_key: `idemp-spoof-rpc-${Date.now()}`,
        p_user_id: userB.userId,
      });

      expect(rpcRes.error).toBeDefined();
      expect(rpcRes.error?.message).toContain('FORBIDDEN_CART_ACCESS');
    } finally {
      await db.from('carts').delete().eq('id', cartUserA);
      await adminClient.auth.admin.deleteUser(userA.userId);
      await adminClient.auth.admin.deleteUser(userB.userId);
    }
  });

  // 4. Reserva perteneciente a otra bodega
  it('4. rechaza checkout con reservas pertenecientes a otra bodega (RESERVATION_INVALID)', async () => {
    const prodId = '72000000-0000-0000-0000-000000000004';
    const varId = '82000000-0000-0000-0000-000000000004';
    const cartId = '92000000-0000-0000-0000-000000000004';
    const db = adminClient as unknown as TestDbClient;

    try {
      await db.from('products').upsert({ id: prodId, name: 'Ginebra Extranjera', is_active: true });
      await db.from('product_variants').upsert({
        id: varId, product_id: prodId, sku: 'SKU-GIN-EXT', presentation_label: '750ml', price_in_cents: 7000000, is_active: true,
      });
      await db.from('inventory').update({ physical_quantity: 10, safety_stock: 0 }).eq('variant_id', varId).eq('warehouse_id', WAREHOUSE_2);
      await db.from('carts').upsert({ id: cartId, status: 'active' });

      // Reserva stock en WAREHOUSE_2
      await db.rpc('reserve_variant_stock', {
        p_variant_id: varId,
        p_warehouse_id: WAREHOUSE_2,
        p_cart_id: cartId,
        p_quantity: 1,
      });

      // Intenta checkout especificando WAREHOUSE_1 (discrepancia de bodega)
      const res = await db.rpc('process_checkout_atomic', {
        p_cart_id: cartId,
        p_warehouse_id: WAREHOUSE_1,
        p_idempotency_key: `idemp-wh-mismatch-${Date.now()}`,
      });

      expect(res.error).toBeDefined();
      expect(res.error?.message).toContain('RESERVATION_INVALID');

      // No debe haberse creado ninguna orden
      const { data: orders } = await db.from('orders').select('id').eq('cart_id', cartId);
      expect(orders).toHaveLength(0);
    } finally {
      await db.from('stock_reservations').delete().eq('cart_id', cartId);
      await db.from('carts').delete().eq('id', cartId);
      await db.from('inventory').delete().eq('variant_id', varId);
      await db.from('product_variants').delete().eq('id', varId);
      await db.from('products').delete().eq('id', prodId);
    }
  });

  // 5. Reserva expirada o vinculada previamente
  it('5. rechaza checkout con reservas expiradas o previamente vinculadas (RESERVATION_INVALID)', async () => {
    const prodId = '72000000-0000-0000-0000-000000000005';
    const varId = '82000000-0000-0000-0000-000000000005';
    const cartExpired = '92000000-0000-0000-0000-000000000005';
    const cartPreBound = '92000000-0000-0000-0000-000000000055';
    const dummyOrderId = '62000000-0000-0000-0000-000000000055';
    const db = adminClient as unknown as TestDbClient;

    try {
      await db.from('products').upsert({ id: prodId, name: 'Whisky Añejo', is_active: true });
      await db.from('product_variants').upsert({
        id: varId, product_id: prodId, sku: 'SKU-WHI-ANJ', presentation_label: '750ml', price_in_cents: 9000000, is_active: true,
      });
      await db.from('inventory').update({ physical_quantity: 10, safety_stock: 0 }).eq('variant_id', varId).eq('warehouse_id', WAREHOUSE_1);
      await db.from('carts').upsert([
        { id: cartExpired, status: 'active' },
        { id: cartPreBound, status: 'active' },
      ]);

      // Subcaso A: Reserva expirada
      const pastTime = new Date(Date.now() - 120000).toISOString();
      await db.from('stock_reservations').insert({
        variant_id: varId,
        product_id: prodId,
        warehouse_id: WAREHOUSE_1,
        cart_id: cartExpired,
        quantity: 1,
        status: 'active',
        expires_at: pastTime,
      });

      const resExpired = await db.rpc('process_checkout_atomic', {
        p_cart_id: cartExpired,
        p_warehouse_id: WAREHOUSE_1,
        p_idempotency_key: `idemp-exp-${Date.now()}`,
      });
      expect(resExpired.error).toBeDefined();
      expect(resExpired.error?.message).toContain('RESERVATION_INVALID');

      // Subcaso B: Reserva ya vinculada a otra orden
      await db.from('stock_reservations').insert({
        variant_id: varId,
        product_id: prodId,
        warehouse_id: WAREHOUSE_1,
        cart_id: cartPreBound,
        quantity: 1,
        status: 'active',
        order_id: dummyOrderId,
        expires_at: new Date(Date.now() + 600000).toISOString(),
      });

      const resPreBound = await db.rpc('process_checkout_atomic', {
        p_cart_id: cartPreBound,
        p_warehouse_id: WAREHOUSE_1,
        p_idempotency_key: `idemp-bound-${Date.now()}`,
      });
      expect(resPreBound.error).toBeDefined();
      expect(resPreBound.error?.message).toContain('RESERVATION_INVALID');
    } finally {
      await db.from('stock_reservations').delete().in('cart_id', [cartExpired, cartPreBound]);
      await db.from('carts').delete().in('id', [cartExpired, cartPreBound]);
      await db.from('inventory').delete().eq('variant_id', varId);
      await db.from('product_variants').delete().eq('id', varId);
      await db.from('products').delete().eq('id', prodId);
    }
  });

  // 6. Acceso directo no autorizado a carts y RPC privilegiada
  it('6. bloquea acceso directo no autorizado a carts (RLS) y a la RPC privilegiada process_checkout_atomic', async () => {
    const userA = await createAuthUserClient(adminClient, anonClient);
    const userB = await createAuthUserClient(adminClient, anonClient);
    const cartUserB = '92000000-0000-0000-0000-000000000006';
    const db = adminClient as unknown as TestDbClient;

    try {
      await db.from('carts').upsert({
        id: cartUserB,
        user_id: userB.userId,
        session_token: 'secret-b-123',
        status: 'active',
      });

      // 6a: anonClient no puede leer carritos (RLS revoca acceso directo)
      const { data: anonData } = await (anonClient.from('carts') as unknown as TableHandler)
        .select('*')
        .eq('id', cartUserB);
      expect(anonData === null || (Array.isArray(anonData) && anonData.length === 0)).toBe(true);

      // 6b: anonClient no puede ejecutar process_checkout_atomic (permiso revocado)
      const anonRpcRes = await (anonClient as unknown as TestDbClient).rpc('process_checkout_atomic', {
        p_cart_id: cartUserB,
        p_warehouse_id: WAREHOUSE_1,
        p_idempotency_key: `idemp-anon-${Date.now()}`,
      });
      expect(anonRpcRes.error).toBeDefined();
      expect(anonRpcRes.error?.message.toLowerCase()).toContain('permission denied');

      // 6c: userAClient no puede ejecutar process_checkout_atomic (solo service_role)
      const userRpcRes = await userA.client.rpc('process_checkout_atomic', {
        p_cart_id: cartUserB,
        p_warehouse_id: WAREHOUSE_1,
        p_idempotency_key: `idemp-user-${Date.now()}`,
      });
      expect(userRpcRes.error).toBeDefined();
      expect(userRpcRes.error?.message.toLowerCase()).toContain('permission denied');

      // 6d: userAClient no puede ver el carrito de userB (aislamiento de RLS)
      const { data: userAData } = await userA.client.from('carts').select('*').eq('id', cartUserB);
      expect(userAData === null || (Array.isArray(userAData) && userAData.length === 0)).toBe(true);
    } finally {
      await db.from('carts').delete().eq('id', cartUserB);
      await adminClient.auth.admin.deleteUser(userA.userId);
      await adminClient.auth.admin.deleteUser(userB.userId);
    }
  });

  // 7. Peticiones concurrentes con distintos idempotency keys sobre un mismo carrito
  it('7. peticiones concurrentes con distintos idempotency keys sobre el mismo carrito: exactamente 1 orden creada', async () => {
    const prodId = '72000000-0000-0000-0000-000000000007';
    const varId = '82000000-0000-0000-0000-000000000007';
    const cartId = '92000000-0000-0000-0000-000000000007';
    const db = adminClient as unknown as TestDbClient;

    const idempA = `idemp-diff-A-${Date.now()}`;
    const idempB = `idemp-diff-B-${Date.now()}`;
    const idempC = `idemp-diff-C-${Date.now()}`;

    try {
      await db.from('products').upsert({ id: prodId, name: 'Brandy Solera', is_active: true });
      await db.from('product_variants').upsert({
        id: varId, product_id: prodId, sku: 'SKU-BRA-SOL', presentation_label: '750ml', price_in_cents: 5500000, is_active: true,
      });
      await db.from('inventory').update({ physical_quantity: 10, safety_stock: 0 }).eq('variant_id', varId).eq('warehouse_id', WAREHOUSE_1);
      await db.from('carts').upsert({ id: cartId, status: 'active' });

      await db.rpc('reserve_variant_stock', {
        p_variant_id: varId,
        p_warehouse_id: WAREHOUSE_1,
        p_cart_id: cartId,
        p_quantity: 1,
      });

      // 3 llamadas simultáneas con DIFERENTES claves de idempotencia sobre el mismo carrito
      const parallelCalls = await Promise.all([
        db.rpc('process_checkout_atomic', { p_cart_id: cartId, p_warehouse_id: WAREHOUSE_1, p_idempotency_key: idempA }),
        db.rpc('process_checkout_atomic', { p_cart_id: cartId, p_warehouse_id: WAREHOUSE_1, p_idempotency_key: idempB }),
        db.rpc('process_checkout_atomic', { p_cart_id: cartId, p_warehouse_id: WAREHOUSE_1, p_idempotency_key: idempC }),
      ]);

      const successfulCalls = parallelCalls.filter(r => !r.error && r.data && (r.data as Record<string, unknown>).status === 'created');
      const failedCalls = parallelCalls.filter(r => r.error !== null);

      // Exactamente una transacción debió ganar y crear la orden
      expect(successfulCalls).toHaveLength(1);
      // Las otras dos debieron fallar de forma segura (por carrito ya procesado o reservas ya vinculadas)
      expect(failedCalls).toHaveLength(2);

      for (const failed of failedCalls) {
        const msg = failed.error?.message || '';
        const isValidFailureReason = msg.includes('CART_ALREADY_PROCESSED') || msg.includes('CHECKOUT_FAILED');
        expect(isValidFailureReason).toBe(true);
      }

      // Verificación en la tabla orders: solo 1 orden existe para este carrito
      const { data: createdOrders } = await db.from('orders').select('id, idempotency_key').eq('cart_id', cartId);
      expect(createdOrders).toHaveLength(1);

      // Verificación de reservas vinculadas exclusivamente a la orden ganadora
      const winnerOrderId = (successfulCalls[0].data as Record<string, unknown>).order_id;
      const { data: boundRes } = await db.from('stock_reservations').select('order_id').eq('cart_id', cartId);
      expect(boundRes).toHaveLength(1);
      expect(boundRes[0].order_id).toBe(winnerOrderId);

      // Carrito finalizado
      const { data: finalCart } = await db.from('carts').select('status').eq('id', cartId).single();
      expect(finalCart.status).toBe('checked_out');
    } finally {
      await db.from('order_items').delete().eq('variant_id', varId);
      await db.from('stock_reservations').delete().eq('cart_id', cartId);
      await db.from('orders').delete().in('idempotency_key', [idempA, idempB, idempC]);
      await db.from('carts').delete().eq('id', cartId);
      await db.from('inventory').delete().eq('variant_id', varId);
      await db.from('product_variants').delete().eq('id', varId);
      await db.from('products').delete().eq('id', prodId);
    }
  });
});
