import { createClient } from '@supabase/supabase-js';

// Polyfill defensivo para WebSocket en entornos node sin soporte nativo
if (typeof (globalThis as unknown as { WebSocket: unknown }).WebSocket === 'undefined') {
  (globalThis as unknown as { WebSocket: unknown }).WebSocket = class DummyWebSocket {};
}

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321').trim();
const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fake-anon-key').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'fake-service-key').trim();

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
      await (adminClient.from('inventory') as any).upsert({
        variant_id: varId, warehouse_id: WAREHOUSE_ID, physical_quantity: 1, safety_stock: 0
      });

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
      await (adminClient.from('inventory') as any).upsert({
        variant_id: varId, warehouse_id: WAREHOUSE_ID, physical_quantity: 5, safety_stock: 2
      });

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
      await (adminClient.from('inventory') as any).upsert({
        variant_id: varId, warehouse_id: WAREHOUSE_ID, physical_quantity: 1, safety_stock: 0
      });

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
      await (adminClient.from('inventory') as any).upsert({
        variant_id: varId, warehouse_id: WAREHOUSE_ID, physical_quantity: 2, safety_stock: 0
      });

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
      await (adminClient.from('inventory') as any).upsert({
        variant_id: varId, warehouse_id: WAREHOUSE_ID, physical_quantity: 10, safety_stock: 0
      });

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
});
