import { createClient } from '@supabase/supabase-js';

// Polyfill defensivo para WebSocket en entornos node sin soporte nativo
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
  const email = `test-auth-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@partyflow.app`;
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

describe('P1 Etapa 2: Inventario por Variante, Bodega, Concurrencia y RLS', () => {
  let adminClient: ReturnType<typeof createClient>;
  let anonClient: ReturnType<typeof createClient>;
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
  });

  it('reserve_variant_stock previene sobreventas concurrentes en la misma variante', async () => {
    const prodId = '70000000-0000-0000-0000-000000000001';
    const varId = '80000000-0000-0000-0000-000000000001';
    const cart1 = '90000000-0000-0000-0000-000000000001';
    const cart2 = '90000000-0000-0000-0000-000000000002';
    const cart3 = '90000000-0000-0000-0000-000000000003';

    try {
      await (adminClient.from('products') as any).upsert({ id: prodId, name: 'Tequila Atomic', is_active: true });
      await (adminClient.from('product_variants') as any).upsert({
        id: varId, product_id: prodId, sku: 'SKU-TEQ-ATOM', presentation_label: '750ml',
        price_in_cents: 25000000, is_active: true
      });
      await (adminClient.from('inventory') as any).update({
        physical_quantity: 1, safety_stock: 0
      }).eq('variant_id', varId).eq('warehouse_id', WAREHOUSE_ID);

      const attempts = await Promise.all([
        (adminClient as any).rpc('reserve_variant_stock', { p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cart1, p_quantity: 1 }),
        (adminClient as any).rpc('reserve_variant_stock', { p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cart2, p_quantity: 1 }),
        (adminClient as any).rpc('reserve_variant_stock', { p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cart3, p_quantity: 1 }),
      ]);

      const successes = attempts.filter(a => a.data === true);
      const failures = attempts.filter(a => a.data === false);
      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(2);
    } finally {
      await (adminClient.from('stock_reservations') as any).delete().eq('variant_id', varId);
      await (adminClient.from('inventory') as any).delete().eq('variant_id', varId);
      await (adminClient.from('product_variants') as any).delete().eq('id', varId);
      await (adminClient.from('products') as any).delete().eq('id', prodId);
    }
  });

  it('respeta safety_stock y rechaza reservas cuando el stock disponible es insuficiente', async () => {
    const prodId = '70000000-0000-0000-0000-000000000002';
    const varId = '80000000-0000-0000-0000-000000000002';
    const cartId = '90000000-0000-0000-0000-000000000004';

    try {
      await (adminClient.from('products') as any).upsert({ id: prodId, name: 'Gin Safety', is_active: true });
      await (adminClient.from('product_variants') as any).upsert({
        id: varId, product_id: prodId, sku: 'SKU-GIN-SAFE', presentation_label: '1L',
        price_in_cents: 15000000, is_active: true
      });
      await (adminClient.from('inventory') as any).update({
        physical_quantity: 5, safety_stock: 2
      }).eq('variant_id', varId).eq('warehouse_id', WAREHOUSE_ID);

      const res4 = await (adminClient as any).rpc('reserve_variant_stock', {
        p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartId, p_quantity: 4
      });
      expect(res4.data).toBe(false);

      const res3 = await (adminClient as any).rpc('reserve_variant_stock', {
        p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartId, p_quantity: 3
      });
      expect(res3.data).toBe(true);

      const res1 = await (adminClient as any).rpc('reserve_variant_stock', {
        p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartId, p_quantity: 1
      });
      expect(res1.data).toBe(false);
    } finally {
      await (adminClient.from('stock_reservations') as any).delete().eq('variant_id', varId);
      await (adminClient.from('inventory') as any).delete().eq('variant_id', varId);
      await (adminClient.from('product_variants') as any).delete().eq('id', varId);
      await (adminClient.from('products') as any).delete().eq('id', prodId);
    }
  });

  it('recicla reservas expiradas en el cálculo dinámico de stock disponible', async () => {
    const prodId = '70000000-0000-0000-0000-000000000003';
    const varId = '80000000-0000-0000-0000-000000000003';
    const cartExpired = '90000000-0000-0000-0000-000000000005';
    const cartNew = '90000000-0000-0000-0000-000000000006';

    try {
      await (adminClient.from('products') as any).upsert({ id: prodId, name: 'Vodka Expired Test', is_active: true });
      await (adminClient.from('product_variants') as any).upsert({
        id: varId, product_id: prodId, sku: 'SKU-VOD-EXP', presentation_label: '750ml',
        price_in_cents: 9000000, is_active: true
      });
      await (adminClient.from('inventory') as any).update({
        physical_quantity: 1, safety_stock: 0
      }).eq('variant_id', varId).eq('warehouse_id', WAREHOUSE_ID);

      const expiredDate = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      await (adminClient.from('stock_reservations') as any).insert({
        variant_id: varId, warehouse_id: WAREHOUSE_ID, cart_id: cartExpired, quantity: 1,
        status: 'active', renewal_count: 0, expires_at: expiredDate
      });

      const newRes = await (adminClient as any).rpc('reserve_variant_stock', {
        p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartNew, p_quantity: 1
      });
      expect(newRes.data).toBe(true);
    } finally {
      await (adminClient.from('stock_reservations') as any).delete().eq('variant_id', varId);
      await (adminClient.from('inventory') as any).delete().eq('variant_id', varId);
      await (adminClient.from('product_variants') as any).delete().eq('id', varId);
      await (adminClient.from('products') as any).delete().eq('id', prodId);
    }
  });

  it('renew_reservation permite solo 1 renovación y rechaza intentos subsecuentes', async () => {
    const prodId = '70000000-0000-0000-0000-000000000004';
    const varId = '80000000-0000-0000-0000-000000000004';
    const cartId = '90000000-0000-0000-0000-000000000007';

    try {
      await (adminClient.from('products') as any).upsert({ id: prodId, name: 'Ron Renew Test', is_active: true });
      await (adminClient.from('product_variants') as any).upsert({
        id: varId, product_id: prodId, sku: 'SKU-RON-REN', presentation_label: '750ml',
        price_in_cents: 8000000, is_active: true
      });
      await (adminClient.from('inventory') as any).update({
        physical_quantity: 2, safety_stock: 0
      }).eq('variant_id', varId).eq('warehouse_id', WAREHOUSE_ID);

      await (adminClient as any).rpc('reserve_variant_stock', {
        p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartId, p_quantity: 1
      });

      const { data: resRows } = await (adminClient.from('stock_reservations') as any)
        .select('id').eq('cart_id', cartId).single();
      const resId = resRows.id;

      const firstRenew = await (adminClient as any).rpc('renew_reservation', { p_reservation_id: resId, p_extension_minutes: 15 });
      expect(firstRenew.data).toBe(true);

      const secondRenew = await (adminClient as any).rpc('renew_reservation', { p_reservation_id: resId, p_extension_minutes: 15 });
      expect(secondRenew.data).toBe(false);
    } finally {
      await (adminClient.from('stock_reservations') as any).delete().eq('variant_id', varId);
      await (adminClient.from('inventory') as any).delete().eq('variant_id', varId);
      await (adminClient.from('product_variants') as any).delete().eq('id', varId);
      await (adminClient.from('products') as any).delete().eq('id', prodId);
    }
  });

  it('consume_reservation descuenta stock físico permanentemente', async () => {
    const prodId = '70000000-0000-0000-0000-000000000005';
    const varId = '80000000-0000-0000-0000-000000000005';
    const cartId = '90000000-0000-0000-0000-000000000008';

    try {
      await (adminClient.from('products') as any).upsert({ id: prodId, name: 'Whisky Consume Test', is_active: true });
      await (adminClient.from('product_variants') as any).upsert({
        id: varId, product_id: prodId, sku: 'SKU-WH-CONS', presentation_label: '750ml',
        price_in_cents: 30000000, is_active: true
      });
      await (adminClient.from('inventory') as any).update({
        physical_quantity: 10, safety_stock: 0
      }).eq('variant_id', varId).eq('warehouse_id', WAREHOUSE_ID);

      await (adminClient as any).rpc('reserve_variant_stock', {
        p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartId, p_quantity: 4
      });

      const { data: resRow } = await (adminClient.from('stock_reservations') as any)
        .select('id').eq('cart_id', cartId).single();

      const consumeRes = await (adminClient as any).rpc('consume_reservation', { p_reservation_id: resRow.id });
      expect(consumeRes.data).toBe(true);

      const { data: invRow } = await (adminClient.from('inventory') as any)
        .select('physical_quantity').eq('variant_id', varId).single();
      expect(invRow.physical_quantity).toBe(6);
    } finally {
      await (adminClient.from('stock_reservations') as any).delete().eq('variant_id', varId);
      await (adminClient.from('inventory') as any).delete().eq('variant_id', varId);
      await (adminClient.from('product_variants') as any).delete().eq('id', varId);
      await (adminClient.from('products') as any).delete().eq('id', prodId);
    }
  });

  it('RLS impide a clientes anónimos leer inventario o reservas directamente', async () => {
    const { error: invErr } = await (anonClient.from('inventory') as any).select('physical_quantity');
    expect(invErr).toBeDefined();
    expect(invErr?.code).toBe('42501');

    const { error: resErr } = await (anonClient.from('stock_reservations') as any).select('*');
    expect(resErr).toBeDefined();
    expect(resErr?.code).toBe('42501');
  });

  it('un usuario autenticado no puede ejecutar las RPC privilegiadas de reservas (42501)', async () => {
    const { client: authClient, userId } = await createAuthUserClient(adminClient, anonClient);
    const dummyId = '00000000-0000-0000-0000-000000000099';
    try {
      const calls = [
        authClient.rpc('reserve_variant_stock', { p_variant_id: dummyId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: dummyId, p_quantity: 1 }),
        authClient.rpc('reserve_stock', { p_product_id: dummyId, p_cart_id: dummyId, p_quantity: 1 }),
        authClient.rpc('renew_reservation', { p_reservation_id: dummyId, p_extension_minutes: 15 }),
        authClient.rpc('release_reservation', { p_reservation_id: dummyId }),
        authClient.rpc('consume_reservation', { p_reservation_id: dummyId }),
      ];
      const results = await Promise.all(calls);
      for (const res of results) {
        expect(res.error).toBeDefined();
        expect(['42501', 'PGRST202']).toContain(res.error?.code);
        expect(res.data).toBeNull();
      }
    } finally {
      await adminClient.auth.admin.deleteUser(userId);
    }
  });

  it('rechaza reservas con cantidades invalidas o TTL fuera de los limites permitidos', async () => {
    const prodId = '70000000-0000-0000-0000-000000000010';
    const varId = '80000000-0000-0000-0000-000000000010';
    const cartId = '90000000-0000-0000-0000-000000000010';
    const db = adminClient as unknown as TestDbClient;
    try {
      await db.from('products').upsert({ id: prodId, name: 'Gin TTL Test', is_active: true });
      await db.from('product_variants').upsert({ id: varId, product_id: prodId, sku: 'SKU-GIN-TTL', presentation_label: '750ml', price_in_cents: 1000, is_active: true });
      await db.from('inventory').update({ physical_quantity: 50, safety_stock: 0 }).eq('variant_id', varId).eq('warehouse_id', WAREHOUSE_ID);

      const overTtl = await db.rpc('reserve_variant_stock', { p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartId, p_quantity: 1, p_ttl_minutes: 16 });
      const zeroTtl = await db.rpc('reserve_variant_stock', { p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartId, p_quantity: 1, p_ttl_minutes: 0 });
      const zeroQty = await db.rpc('reserve_variant_stock', { p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartId, p_quantity: 0, p_ttl_minutes: 15 });
      const overQty = await db.rpc('reserve_variant_stock', { p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartId, p_quantity: 100, p_ttl_minutes: 15 });

      expect(overTtl.data).toBe(false);
      expect(zeroTtl.data).toBe(false);
      expect(zeroQty.data).toBe(false);
      expect(overQty.data).toBe(false);
    } finally {
      await db.from('inventory').delete().eq('variant_id', varId);
      await db.from('product_variants').delete().eq('id', varId);
      await db.from('products').delete().eq('id', prodId);
    }
  });

  it('rechaza renovaciones con extension superior a 15m o duracion total mayor a 30m', async () => {
    const prodId = '70000000-0000-0000-0000-000000000014';
    const varId = '80000000-0000-0000-0000-000000000014';
    const cartId = '90000000-0000-0000-0000-000000000014';
    const db = adminClient as unknown as TestDbClient;
    try {
      await db.from('products').upsert({ id: prodId, name: 'Tequila 30m Test', is_active: true });
      await db.from('product_variants').upsert({ id: varId, product_id: prodId, sku: 'SKU-TEQ-30M', presentation_label: '750ml', price_in_cents: 1000, is_active: true });
      await db.from('inventory').update({ physical_quantity: 10, safety_stock: 0 }).eq('variant_id', varId).eq('warehouse_id', WAREHOUSE_ID);
      await db.rpc('reserve_variant_stock', { p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartId, p_quantity: 1, p_ttl_minutes: 15 });

      const { data: resRow } = await db.from('stock_reservations').select('id').eq('cart_id', cartId).single();
      const overExt = await db.rpc('renew_reservation', { p_reservation_id: resRow.id, p_extension_minutes: 16 });
      expect(overExt.data).toBe(false);

      const oldCreated = new Date(Date.now() - 20 * 60 * 1000).toISOString();
      await db.from('stock_reservations').update({ created_at: oldCreated }).eq('id', resRow.id);
      const over30m = await db.rpc('renew_reservation', { p_reservation_id: resRow.id, p_extension_minutes: 15 });
      expect(over30m.data).toBe(false);
    } finally {
      await db.from('stock_reservations').delete().eq('variant_id', varId);
      await db.from('inventory').delete().eq('variant_id', varId);
      await db.from('product_variants').delete().eq('id', varId);
      await db.from('products').delete().eq('id', prodId);
    }
  });

  it('no se pueden consumir cantidades superiores al stock fisico y no descuenta inventario', async () => {
    const prodId = '70000000-0000-0000-0000-000000000011';
    const varId = '80000000-0000-0000-0000-000000000011';
    const cartId = '90000000-0000-0000-0000-000000000011';
    const db = adminClient as unknown as TestDbClient;
    try {
      await db.from('products').upsert({ id: prodId, name: 'Whisky Underflow Test', is_active: true });
      await db.from('product_variants').upsert({ id: varId, product_id: prodId, sku: 'SKU-WH-UND', presentation_label: '750ml', price_in_cents: 2000, is_active: true });
      await db.from('inventory').update({ physical_quantity: 10, safety_stock: 0 }).eq('variant_id', varId).eq('warehouse_id', WAREHOUSE_ID);
      await db.rpc('reserve_variant_stock', { p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartId, p_quantity: 5 });

      const { data: resRow } = await db.from('stock_reservations').select('id').eq('cart_id', cartId).single();
      await db.from('inventory').update({ physical_quantity: 2 }).eq('variant_id', varId).eq('warehouse_id', WAREHOUSE_ID);

      const consumeRes = await db.rpc('consume_reservation', { p_reservation_id: resRow.id });
      expect(consumeRes.data).toBe(false);

      const { data: invRow } = await db.from('inventory').select('physical_quantity').eq('variant_id', varId).single();
      expect(invRow.physical_quantity).toBe(2);
      const { data: resAfter } = await db.from('stock_reservations').select('status').eq('id', resRow.id).single();
      expect(resAfter.status).toBe('active');
    } finally {
      await db.from('stock_reservations').delete().eq('variant_id', varId);
      await db.from('inventory').delete().eq('variant_id', varId);
      await db.from('product_variants').delete().eq('id', varId);
      await db.from('products').delete().eq('id', prodId);
    }
  });

  it('un segundo consumo de la misma reserva no descuenta inventario dos veces', async () => {
    const prodId = '70000000-0000-0000-0000-000000000012';
    const varId = '80000000-0000-0000-0000-000000000012';
    const cartId = '90000000-0000-0000-0000-000000000012';
    const db = adminClient as unknown as TestDbClient;
    try {
      await db.from('products').upsert({ id: prodId, name: 'Double Consume Test', is_active: true });
      await db.from('product_variants').upsert({ id: varId, product_id: prodId, sku: 'SKU-DBL-CONS', presentation_label: '750ml', price_in_cents: 1200, is_active: true });
      await db.from('inventory').update({ physical_quantity: 10, safety_stock: 0 }).eq('variant_id', varId).eq('warehouse_id', WAREHOUSE_ID);
      await db.rpc('reserve_variant_stock', { p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartId, p_quantity: 3 });

      const { data: resRow } = await db.from('stock_reservations').select('id').eq('cart_id', cartId).single();
      const firstConsume = await db.rpc('consume_reservation', { p_reservation_id: resRow.id });
      expect(firstConsume.data).toBe(true);

      const secondConsume = await db.rpc('consume_reservation', { p_reservation_id: resRow.id });
      expect(secondConsume.data).toBe(false);

      const { data: invRow } = await db.from('inventory').select('physical_quantity').eq('variant_id', varId).single();
      expect(invRow.physical_quantity).toBe(7);
    } finally {
      await db.from('stock_reservations').delete().eq('variant_id', varId);
      await db.from('inventory').delete().eq('variant_id', varId);
      await db.from('product_variants').delete().eq('id', varId);
      await db.from('products').delete().eq('id', prodId);
    }
  });

  it('rechaza combinaciones incompatibles de product_id y variant_id en inventory y reservations', async () => {
    const prodA = '70000000-0000-0000-0000-000000000021';
    const prodB = '70000000-0000-0000-0000-000000000022';
    const varA = '80000000-0000-0000-0000-000000000021';
    const varB = '80000000-0000-0000-0000-000000000022';
    const cartId = '90000000-0000-0000-0000-000000000021';
    const db = adminClient as unknown as TestDbClient;
    try {
      await db.from('products').upsert([{ id: prodA, name: 'Product Alpha', is_active: true }, { id: prodB, name: 'Product Beta', is_active: true }]);
      await db.from('product_variants').upsert([
        { id: varA, product_id: prodA, sku: 'SKU-ALPHA', presentation_label: 'A', price_in_cents: 1000, is_active: true },
        { id: varB, product_id: prodB, sku: 'SKU-BETA', presentation_label: 'B', price_in_cents: 2000, is_active: true }
      ]);

      const { error: invErr } = await db.from('inventory').insert({ variant_id: varA, product_id: prodB, warehouse_id: WAREHOUSE_ID, physical_quantity: 5 });
      expect(invErr).toBeDefined();
      expect(invErr?.message).toContain('INCONSISTENT_PRODUCT_VARIANT');

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const { error: resErr } = await db.from('stock_reservations').insert({ variant_id: varA, product_id: prodB, warehouse_id: WAREHOUSE_ID, cart_id: cartId, quantity: 1, expires_at: expiresAt });
      expect(resErr).toBeDefined();
      expect(resErr?.message).toContain('INCONSISTENT_PRODUCT_VARIANT');
    } finally {
      await db.from('stock_reservations').delete().in('variant_id', [varA, varB]);
      await db.from('inventory').delete().in('variant_id', [varA, varB]);
      await db.from('product_variants').delete().in('id', [varA, varB]);
      await db.from('products').delete().in('id', [prodA, prodB]);
    }
  });

  it('preserva stock fisico integro y enlaza variante generada automaticamente para productos legados', async () => {
    const legacyProdId = '70000000-0000-0000-0000-000000000030';
    let createdVarId: string | null = null;
    const db = adminClient as unknown as TestDbClient;
    try {
      await db.from('products').upsert({ id: legacyProdId, name: 'Legacy Brandy', is_active: true });
      const { error: invErr } = await db.from('inventory').insert({ product_id: legacyProdId, warehouse_id: WAREHOUSE_ID, physical_quantity: 42 });
      expect(invErr).toBeNull();

      const { data: variants } = await db.from('product_variants').select('*').eq('product_id', legacyProdId);
      expect(variants).toHaveLength(1);
      createdVarId = String(variants[0].id);

      const { data: invRow } = await db.from('inventory').select('*').eq('variant_id', createdVarId).eq('warehouse_id', WAREHOUSE_ID).single();
      expect(invRow.physical_quantity).toBe(42);
      expect(invRow.product_id).toBe(legacyProdId);
    } finally {
      if (createdVarId) {
        await db.from('inventory').delete().eq('variant_id', createdVarId);
        await db.from('product_variants').delete().eq('id', createdVarId);
      }
      await db.from('products').delete().eq('id', legacyProdId);
    }
  });

  it('fuerza un error en la fase final del consumo y verifica rollback completo de inventario', async () => {
    const prodId = '70000000-0000-0000-0000-000000000050';
    const varId = '80000000-0000-0000-0000-000000000050';
    const faultCart = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    const db = adminClient as unknown as TestDbClient;
    try {
      await db.from('products').upsert({ id: prodId, name: 'Rollback Whisky', is_active: true });
      await db.from('product_variants').upsert({ id: varId, product_id: prodId, sku: 'SKU-ROLL-WH', presentation_label: '750ml', price_in_cents: 5000, is_active: true });
      await db.from('inventory').update({ physical_quantity: 10, safety_stock: 0 }).eq('variant_id', varId).eq('warehouse_id', WAREHOUSE_ID);

      await db.rpc('reserve_variant_stock', { p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: faultCart, p_quantity: 4 });
      const { data: resRow } = await db.from('stock_reservations').select('id').eq('cart_id', faultCart).single();

      const consumeRes = await db.rpc('consume_reservation', { p_reservation_id: resRow.id });
      expect(consumeRes.error).toBeDefined();
      expect(consumeRes.error?.message).toContain('SIMULATED_FINAL_PHASE_FAILURE');

      const { data: invRow } = await db.from('inventory').select('physical_quantity').eq('variant_id', varId).single();
      expect(Number(invRow.physical_quantity)).toBe(10);
      const { data: resAfter } = await db.from('stock_reservations').select('status').eq('id', resRow.id).single();
      expect(resAfter.status).toBe('active');
    } finally {
      await db.from('stock_reservations').delete().eq('variant_id', varId);
      await db.from('inventory').delete().eq('variant_id', varId);
      await db.from('product_variants').delete().eq('id', varId);
      await db.from('products').delete().eq('id', prodId);
    }
  });

  it('concurrencia mixta: combina reservas nuevas, consumos simultaneos y liberaciones sin dobles descuentos ni stock negativo', async () => {
    const prodId = '70000000-0000-0000-0000-000000000060';
    const varId = '80000000-0000-0000-0000-000000000060';
    const [cartA, cartB, cartC, cartD] = ['90000000-0000-0000-0000-000000000061', '90000000-0000-0000-0000-000000000062', '90000000-0000-0000-0000-000000000063', '90000000-0000-0000-0000-000000000064'];
    const db = adminClient as unknown as TestDbClient;
    try {
      await db.from('products').upsert({ id: prodId, name: 'Mixed Concurrency Tequila', is_active: true });
      await db.from('product_variants').upsert({ id: varId, product_id: prodId, sku: 'SKU-MIX-CONC', presentation_label: '750ml', price_in_cents: 8000, is_active: true });
      await db.from('inventory').update({ physical_quantity: 10, safety_stock: 0 }).eq('variant_id', varId).eq('warehouse_id', WAREHOUSE_ID);
      await db.rpc('reserve_variant_stock', { p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartA, p_quantity: 3 });
      await db.rpc('reserve_variant_stock', { p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartB, p_quantity: 4 });

      const { data: resA } = await db.from('stock_reservations').select('id').eq('cart_id', cartA).single();
      const { data: resB } = await db.from('stock_reservations').select('id').eq('cart_id', cartB).single();

      const ops = await Promise.all([
        db.rpc('consume_reservation', { p_reservation_id: resA.id }),
        db.rpc('consume_reservation', { p_reservation_id: resA.id }),
        db.rpc('release_reservation', { p_reservation_id: resB.id }),
        db.rpc('reserve_variant_stock', { p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartC, p_quantity: 5 }),
        db.rpc('reserve_variant_stock', { p_variant_id: varId, p_warehouse_id: WAREHOUSE_ID, p_cart_id: cartD, p_quantity: 2 }),
      ]);

      // 1. Verificación individual del resultado de cada operación
      expect(ops[0].error).toBeNull();
      expect(ops[1].error).toBeNull();
      const consumeWins = [ops[0], ops[1]].filter(o => o.data === true);
      const consumeLosses = [ops[0], ops[1]].filter(o => o.data === false);
      expect(consumeWins).toHaveLength(1);
      expect(consumeLosses).toHaveLength(1);

      expect(ops[2].error).toBeNull();
      expect(ops[2].data).toBe(true);

      expect(ops[3].error).toBeNull();
      expect(ops[4].error).toBeNull();
      expect(typeof ops[3].data).toBe('boolean');
      expect(typeof ops[4].data).toBe('boolean');

      // 2. Verificación exhaustiva de los estados finales de las reservas
      const { data: finalResA } = await db.from('stock_reservations').select('id, status, quantity').eq('id', resA.id).single();
      expect(finalResA.status).toBe('consumed');
      expect(Number(finalResA.quantity)).toBe(3);

      const { data: finalResB } = await db.from('stock_reservations').select('id, status, quantity').eq('id', resB.id).single();
      expect(finalResB.status).toBe('released');
      expect(Number(finalResB.quantity)).toBe(4);

      const { data: resCList } = await db.from('stock_reservations').select('id, status, quantity').eq('cart_id', cartC);
      if (ops[3].data === true) {
        expect(resCList).toHaveLength(1);
        expect(resCList[0].status).toBe('active');
        expect(Number(resCList[0].quantity)).toBe(5);
      } else {
        const activeC = (resCList || []).filter(r => r.status === 'active');
        expect(activeC).toHaveLength(0);
      }

      const { data: resDList } = await db.from('stock_reservations').select('id, status, quantity').eq('cart_id', cartD);
      if (ops[4].data === true) {
        expect(resDList).toHaveLength(1);
        expect(resDList[0].status).toBe('active');
        expect(Number(resDList[0].quantity)).toBe(2);
      } else {
        const activeD = (resDList || []).filter(r => r.status === 'active');
        expect(activeD).toHaveLength(0);
      }

      // 3. Verificación de la suma de reservas activas
      const { data: allActiveReservations } = await db
        .from('stock_reservations')
        .select('id, quantity, status')
        .eq('variant_id', varId)
        .eq('status', 'active');

      const totalActiveReserved = (allActiveReservations || []).reduce(
        (acc: number, r: Record<string, unknown>) => acc + Number(r.quantity ?? 0),
        0
      );

      let expectedActiveSum = 0;
      if (ops[3].data === true) expectedActiveSum += 5;
      if (ops[4].data === true) expectedActiveSum += 2;
      expect(totalActiveReserved).toBe(expectedActiveSum);

      // 4. Verificación de que el inventario disponible nunca sea negativo
      const { data: finalInv } = await db
        .from('inventory')
        .select('physical_quantity, safety_stock')
        .eq('variant_id', varId)
        .eq('warehouse_id', WAREHOUSE_ID)
        .single();

      const physicalQuantity = Number(finalInv?.physical_quantity ?? 0);
      const safetyStock = Number(finalInv?.safety_stock ?? 0);
      const availableInventory = physicalQuantity - safetyStock - totalActiveReserved;

      expect(physicalQuantity).toBe(7);
      expect(physicalQuantity).toBeGreaterThanOrEqual(0);
      expect(availableInventory).toBeGreaterThanOrEqual(0);
    } finally {
      await db.from('stock_reservations').delete().eq('variant_id', varId);
      await db.from('inventory').delete().eq('variant_id', varId);
      await db.from('product_variants').delete().eq('id', varId);
      await db.from('products').delete().eq('id', prodId);
    }
  });

  afterAll(async () => {
    if (adminClient) {
      try {
        await (adminClient as unknown as TestDbClient).rpc('teardown_test_fault_injection');
      } catch {
        // Ignored if test fixture was already torn down or not present
      }
    }
  });
});

