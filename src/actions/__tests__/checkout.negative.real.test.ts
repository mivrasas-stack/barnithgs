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
  const email = `neg-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@partyflow.app`;
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

describe('P1 Etapa 3: Pruebas Físicas Negativas de Seguridad y Reservas', () => {
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
      auth: { persistSession: false, autoRefreshToken: false }
    });
    anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    checkoutService = new CheckoutService(adminClient);

    // Ensure warehouse 2 exists for cross-warehouse test
    await (adminClient as unknown as TestDbClient).from('warehouses').upsert({
      id: WAREHOUSE_2,
      code: 'BOD-NORTE',
      name: 'Bodega Norte',
      address: 'Calle 170 # 15-20',
      is_active: true
    });
  });

  it('1. Checkout invitado sin token es rechazado estrictamente (FORBIDDEN_CART_ACCESS)', async () => {
    const guestCartId = '92000000-0000-0000-0000-000000000001';
    const db = adminClient as unknown as TestDbClient;

    try {
      await db.from('carts').upsert({ id: guestCartId, user_id: null, session_token: 'secret-token-xyz', status: 'active' });

      const attempt = await checkoutService.processCheckout({
        cartId: guestCartId,
        warehouseId: WAREHOUSE_1,
        idempotencyKey: `idemp-notok-${Date.now()}`,
        userId: null,
        sessionToken: undefined,
        customerName: 'Invitado',
        customerPhone: '+573001112233',
        customerEmail: 'guest@partyflow.app',
        deliveryAddress: 'Calle 123'
      });

      expect(attempt.success).toBe(false);
      if (!attempt.success) {
        expect(attempt.error.code).toBe('FORBIDDEN_CART_ACCESS');
        expect(attempt.error.message).toContain('Guest session token is required');
      }
    } finally {
      await db.from('carts').delete().eq('id', guestCartId);
    }
  });

  it('2. Checkout invitado con token incorrecto es rechazado estrictamente (FORBIDDEN_CART_ACCESS)', async () => {
    const guestCartId = '92000000-0000-0000-0000-000000000002';
    const db = adminClient as unknown as TestDbClient;

    try {
      await db.from('carts').upsert({ id: guestCartId, user_id: null, session_token: 'secret-token-real', status: 'active' });

      const attempt = await checkoutService.processCheckout({
        cartId: guestCartId,
        warehouseId: WAREHOUSE_1,
        idempotencyKey: `idemp-badtok-${Date.now()}`,
        userId: null,
        sessionToken: 'wrong-token-hacker',
        customerName: 'Impostor',
        customerPhone: '+573001112233',
        customerEmail: 'guest@partyflow.app',
        deliveryAddress: 'Calle 123'
      });

      expect(attempt.success).toBe(false);
      if (!attempt.success) {
        expect(attempt.error.code).toBe('FORBIDDEN_CART_ACCESS');
        expect(attempt.error.message).toContain('Invalid guest session token');
      }
    } finally {
      await db.from('carts').delete().eq('id', guestCartId);
    }
  });

  it('3. Usuario que intenta falsificar el userId de otro es rechazado tanto en servicio como en RPC', async () => {
    const userA = await createAuthUserClient(adminClient, anonClient);
    const userB = await createAuthUserClient(adminClient, anonClient);
    const cartOwnerA = '92000000-0000-0000-0000-000000000003';
    const db = adminClient as unknown as TestDbClient;

    try {
      await db.from('carts').upsert({ id: cartOwnerA, user_id: userA.userId, status: 'active' });

      // CheckoutService check:
      const serviceAttempt = await checkoutService.processCheckout({
        cartId: cartOwnerA,
        warehouseId: WAREHOUSE_1,
        idempotencyKey: `idemp-spoof-${Date.now()}`,
        userId: userB.userId,
        customerName: 'User B',
        customerPhone: '+573000000000',
        customerEmail: 'b@partyflow.app',
        deliveryAddress: 'Calle 50'
      });
      expect(serviceAttempt.success).toBe(false);
      if (!serviceAttempt.success) {
        expect(serviceAttempt.error.code).toBe('FORBIDDEN_CART_ACCESS');
      }

      // Direct RPC defense check:
      const rpcAttempt = await db.rpc('process_checkout_atomic', {
        p_cart_id: cartOwnerA,
        p_warehouse_id: WAREHOUSE_1,
        p_idempotency_key: `idemp-spoof-rpc-${Date.now()}`,
        p_user_id: userB.userId,
        p_customer_name: 'User B',
        p_customer_phone: '+573000000000',
        p_customer_email: 'b@partyflow.app',
        p_delivery_address: 'Calle 50'
      });
      expect(rpcAttempt.error).toBeDefined();
      expect(rpcAttempt.error?.message).toContain('FORBIDDEN_CART_ACCESS');
    } finally {
      await db.from('carts').delete().eq('id', cartOwnerA);
      await adminClient.auth.admin.deleteUser(userA.userId);
      await adminClient.auth.admin.deleteUser(userB.userId);
    }
  });

  it('4. Reserva perteneciente a otra bodega es rechazada (RESERVATION_INVALID)', async () => {
    const prodG = '72000000-0000-0000-0000-000000000001';
    const varG = '82000000-0000-0000-0000-000000000001';
    const cartG = '92000000-0000-0000-0000-000000000004';
    const db = adminClient as unknown as TestDbClient;

    try {
      await db.from('products').upsert({ id: prodG, name: 'Whisky 12 Años', is_active: true });
      await db.from('product_variants').upsert({
        id: varG, product_id: prodG, sku: 'SKU-WH-12', presentation_label: '750ml', price_in_cents: 9000000, is_active: true
      });
      await db.from('inventory').update({ physical_quantity: 10, safety_stock: 0 }).eq('variant_id', varG).eq('warehouse_id', WAREHOUSE_2);
      await db.from('carts').upsert({ id: cartG, status: 'active' });

      // Reserva en BODEGA 2
      await db.rpc('reserve_variant_stock', {
        p_variant_id: varG, p_warehouse_id: WAREHOUSE_2, p_cart_id: cartG, p_quantity: 1
      });

      // Intento de procesar checkout solicitando BODEGA 1
      const res = await db.rpc('process_checkout_atomic', {
        p_cart_id: cartG,
        p_warehouse_id: WAREHOUSE_1,
        p_idempotency_key: `idemp-warehouse-mismatch-${Date.now()}`,
        p_customer_name: 'Test Customer',
        p_customer_phone: '+573001112233'
      });

      expect(res.error).toBeDefined();
      expect(res.error?.message).toContain('RESERVATION_INVALID');
    } finally {
      await db.from('stock_reservations').delete().eq('cart_id', cartG);
      await db.from('carts').delete().eq('id', cartG);
      await db.from('inventory').delete().eq('variant_id', varG);
      await db.from('product_variants').delete().eq('id', varG);
      await db.from('products').delete().eq('id', prodG);
    }
  });

  it('5. Reserva expirada o vinculada previamente a otra orden es rechazada (RESERVATION_INVALID)', async () => {
    const prodH = '72000000-0000-0000-0000-000000000002';
    const varH = '82000000-0000-0000-0000-000000000002';
    const cartH = '92000000-0000-0000-0000-000000000005';
    const fakeOrderId = '01000000-0000-0000-0000-000000000001';
    const db = adminClient as unknown as TestDbClient;

    try {
      await db.from('products').upsert({ id: prodH, name: 'Ginebra Especial', is_active: true });
      await db.from('product_variants').upsert({
        id: varH, product_id: prodH, sku: 'SKU-GIN-ESP', presentation_label: '750ml', price_in_cents: 7000000, is_active: true
      });
      await db.from('inventory').update({ physical_quantity: 10, safety_stock: 0 }).eq('variant_id', varH).eq('warehouse_id', WAREHOUSE_1);
      await db.from('carts').upsert({ id: cartH, status: 'active' });

      // 5.A: Reserva con order_id asignado previamente
      await db.from('stock_reservations').insert({
        variant_id: varH,
        product_id: prodH,
        warehouse_id: WAREHOUSE_1,
        cart_id: cartH,
        quantity: 1,
        status: 'active',
        order_id: fakeOrderId,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });

      const resRelink = await db.rpc('process_checkout_atomic', {
        p_cart_id: cartH,
        p_warehouse_id: WAREHOUSE_1,
        p_idempotency_key: `idemp-relink-${Date.now()}`,
        p_customer_name: 'Test Customer',
        p_customer_phone: '+573001112233'
      });

      expect(resRelink.error).toBeDefined();
      expect(resRelink.error?.message).toContain('RESERVATION_INVALID');

      // Limpiar y probar 5.B: Reserva expirada
      await db.from('stock_reservations').delete().eq('cart_id', cartH);
      await db.from('stock_reservations').insert({
        variant_id: varH,
        product_id: prodH,
        warehouse_id: WAREHOUSE_1,
        cart_id: cartH,
        quantity: 1,
        status: 'active',
        expires_at: new Date(Date.now() - 60000).toISOString()
      });

      const resExpired = await db.rpc('process_checkout_atomic', {
        p_cart_id: cartH,
        p_warehouse_id: WAREHOUSE_1,
        p_idempotency_key: `idemp-expired-${Date.now()}`,
        p_customer_name: 'Test Customer',
        p_customer_phone: '+573001112233'
      });

      expect(resExpired.error).toBeDefined();
      expect(resExpired.error?.message).toContain('RESERVATION_INVALID');
    } finally {
      await db.from('stock_reservations').delete().eq('cart_id', cartH);
      await db.from('carts').delete().eq('id', cartH);
      await db.from('inventory').delete().eq('variant_id', varH);
      await db.from('product_variants').delete().eq('id', varH);
      await db.from('products').delete().eq('id', prodH);
    }
  });

  it('6. Acceso directo no autorizado a carts y RPC privilegiada es bloqueado por RLS y revocación de permisos', async () => {
    const userClientObj = await createAuthUserClient(adminClient, anonClient);
    const guestCartId = '92000000-0000-0000-0000-000000000006';
    const db = adminClient as unknown as TestDbClient;

    try {
      await db.from('carts').upsert({ id: guestCartId, session_token: 'secret-token-invisible', status: 'active' });

      // A. Cliente anónimo intentando leer carts: RLS niega acceso a tokens de sesión
      const { data: anonCarts } = await (anonClient as unknown as TestDbClient).from('carts').select('*').eq('id', guestCartId);
      expect(anonCarts).toHaveLength(0);

      // B. Cliente anónimo intentando ejecutar RPC privilegiada
      const anonRpc = await (anonClient as unknown as TestDbClient).rpc('process_checkout_atomic', {
        p_cart_id: guestCartId,
        p_warehouse_id: WAREHOUSE_1,
        p_idempotency_key: 'hacker-key',
        p_customer_name: 'Hacker',
        p_customer_phone: '+573000000000'
      });
      expect(anonRpc.error).toBeDefined();
      expect(['42501', 'PGRST202']).toContain(anonRpc.error?.code);

      // C. Cliente autenticado intentando ejecutar RPC privilegiada directamente
      const authRpc = await userClientObj.client.rpc('process_checkout_atomic', {
        p_cart_id: guestCartId,
        p_warehouse_id: WAREHOUSE_1,
        p_idempotency_key: 'auth-direct-key',
        p_customer_name: 'Auth Direct',
        p_customer_phone: '+573000000000'
      });
      expect(authRpc.error).toBeDefined();
      expect(['42501', 'PGRST202']).toContain(authRpc.error?.code);
    } finally {
      await db.from('carts').delete().eq('id', guestCartId);
      await adminClient.auth.admin.deleteUser(userClientObj.userId);
    }
  });

  it('7. Peticiones concurrentes con distintos idempotency keys sobre un mismo carrito: exactamente una gana y la otra es rechazada', async () => {
    const prodI = '72000000-0000-0000-0000-000000000003';
    const varI = '82000000-0000-0000-0000-000000000003';
    const cartI = '92000000-0000-0000-0000-000000000007';
    const keyAlpha = `idemp-diff-alpha-${Date.now()}`;
    const keyBeta = `idemp-diff-beta-${Date.now()}`;
    const db = adminClient as unknown as TestDbClient;

    try {
      await db.from('products').upsert({ id: prodI, name: 'Vino Blanco Sauvignon', is_active: true });
      await db.from('product_variants').upsert({
        id: varI, product_id: prodI, sku: 'SKU-VIN-SAUV', presentation_label: '750ml', price_in_cents: 4000000, is_active: true
      });
      await db.from('inventory').update({ physical_quantity: 10, safety_stock: 0 }).eq('variant_id', varI).eq('warehouse_id', WAREHOUSE_1);
      await db.from('carts').upsert({ id: cartI, status: 'active' });
      await db.rpc('reserve_variant_stock', { p_variant_id: varI, p_warehouse_id: WAREHOUSE_1, p_cart_id: cartI, p_quantity: 1 });

      // Ejecución concurrente con DISTINTAS claves de idempotencia sobre el mismo carrito
      const [resAlpha, resBeta] = await Promise.all([
        db.rpc('process_checkout_atomic', {
          p_cart_id: cartI,
          p_warehouse_id: WAREHOUSE_1,
          p_idempotency_key: keyAlpha,
          p_customer_name: 'Alice',
          p_customer_phone: '+573001230001'
        }),
        db.rpc('process_checkout_atomic', {
          p_cart_id: cartI,
          p_warehouse_id: WAREHOUSE_1,
          p_idempotency_key: keyBeta,
          p_customer_name: 'Bob',
          p_customer_phone: '+573001230002'
        })
      ]);

      const successes = [resAlpha, resBeta].filter(r => !r.error && (r.data as Record<string, unknown>)?.status === 'created');
      const failures = [resAlpha, resBeta].filter(r => r.error !== null);

      // Exactamente una orden debe crearse; la otra debe fallar de forma controlada
      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(1);
      expect(failures[0].error?.message).toMatch(/RESERVATION_INVALID|CHECKOUT_FAILED|CART_ALREADY_PROCESSED/);

      // En la base de datos debe haber exactamente una orden asociada a este carrito
      const { data: createdOrders } = await db.from('orders').select('id, idempotency_key').eq('cart_id', cartI);
      expect(createdOrders).toHaveLength(1);
    } finally {
      await db.from('order_items').delete().eq('variant_id', varI);
      await db.from('stock_reservations').delete().eq('cart_id', cartI);
      await db.from('orders').delete().in('idempotency_key', [keyAlpha, keyBeta]);
      await db.from('carts').delete().eq('id', cartI);
      await db.from('inventory').delete().eq('variant_id', varI);
      await db.from('product_variants').delete().eq('id', varI);
      await db.from('products').delete().eq('id', prodI);
    }
  });
});
