import { createClient } from '@supabase/supabase-js';

// Polyfill defensivo para entornos de ejecución donde globalThis.WebSocket no esté disponible
if (typeof (globalThis as unknown as { WebSocket: unknown }).WebSocket === 'undefined') {
  (globalThis as unknown as { WebSocket: unknown }).WebSocket = class DummyWebSocket {};
}

// Pruebas contra instancia aislada de Supabase (Docker / CI)
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321').trim();
const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fake-anon-key').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || 'fake-service-key').trim();

describe('Real Database Integration & RLS (No Mocks)', () => {
  let adminClient: ReturnType<typeof createClient>;
  let anonClient: ReturnType<typeof createClient>;

  beforeAll(() => {
    if (SUPABASE_ANON_KEY === 'fake-anon-key' || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) { 
      throw new Error('Missing real database credentials for integration test. Start Supabase locally.'); 
    }
    adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  });

  describe('Concurrencia de Inventario (reserve_stock)', () => {
    it('debe impedir sobreventas cuando 3 carritos diferentes intentan reservar la única unidad en stock simultáneamente', async () => {
      const productId = '10000000-0000-0000-0000-000000000001';
      const cartId1 = '20000000-0000-0000-0000-000000000001';
      const cartId2 = '20000000-0000-0000-0000-000000000002';
      const cartId3 = '20000000-0000-0000-0000-000000000003';

      try {
        const { error: pErr } = await (adminClient.from('products') as any).upsert({ id: productId, name: 'Atomic Beer Case', price: 150000 });
        expect(pErr).toBeNull();

        const { error: iErr } = await (adminClient.from('inventory') as any).upsert({ product_id: productId, physical_quantity: 1 });
        expect(iErr).toBeNull();

        const { error: cErr } = await (adminClient.from('stock_reservations') as any).delete().eq('product_id', productId);
        expect(cErr).toBeNull();

        const attempts = await Promise.all([
          (adminClient as any).rpc('reserve_stock', { p_product_id: productId, p_cart_id: cartId1, p_quantity: 1 }),
          (adminClient as any).rpc('reserve_stock', { p_product_id: productId, p_cart_id: cartId2, p_quantity: 1 }),
          (adminClient as any).rpc('reserve_stock', { p_product_id: productId, p_cart_id: cartId3, p_quantity: 1 })
        ]);

        for (const a of attempts) {
          expect(a.error).toBeNull();
        }

        const successes = attempts.filter(a => a.data === true);
        const failures = attempts.filter(a => a.data === false);
        expect(successes.length).toBe(1);
        expect(failures.length).toBe(2);

        const { data: res, error: rErr } = await (adminClient.from('stock_reservations') as any).select('*').eq('product_id', productId);
        expect(rErr).toBeNull();
        expect(res).toHaveLength(1);
        expect(res[0].quantity).toBe(1);
        expect([cartId1, cartId2, cartId3]).toContain(res[0].cart_id);

        const { data: inv, error: qErr } = await (adminClient.from('inventory') as any).select('physical_quantity').eq('product_id', productId).single();
        expect(qErr).toBeNull();
        expect(inv.physical_quantity).toBe(1);

        const fourthAttempt = await (adminClient as any).rpc('reserve_stock', { p_product_id: productId, p_cart_id: '20000000-0000-0000-0000-000000000004', p_quantity: 1 });
        expect(fourthAttempt.data).toBe(false);
      } finally {
        await (adminClient.from('stock_reservations') as any).delete().eq('product_id', productId);
        await (adminClient.from('inventory') as any).delete().eq('product_id', productId);
        await (adminClient.from('products') as any).delete().eq('id', productId);
      }
    });
  });

  describe('Control de Roles y Permisos End-to-End (RLS)', () => {
    const createdUserIds: string[] = [];

    afterAll(async () => {
      for (const id of createdUserIds) {
        try { await adminClient.auth.admin.deleteUser(id); } catch (_) {}
      }
    });

    async function createTestRoleUser(role: 'client' | 'driver' | 'warehouse' | 'admin') {
      const email = `test-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@partyflow.app`;
      const { data, error } = await adminClient.auth.admin.createUser({ email, password: 'SecurePassword123!', email_confirm: true });
      if (error || !data.user) throw new Error(`Fallo al crear usuario ${role}: ${error?.message}`);
      createdUserIds.push(data.user.id);

      const { error: profileError } = await (adminClient.from('profiles') as any).insert({
        id: data.user.id,
        full_name: `Test ${role}`,
        name: `Test ${role}`,
        role,
        email
      });
      expect(profileError).toBeNull();

      const { data: authData, error: signInErr } = await anonClient.auth.signInWithPassword({ email, password: 'SecurePassword123!' });
      if (signInErr || !authData.session) throw new Error(`Fallo en login de ${role}: ${signInErr?.message}`);

      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } },
        auth: { persistSession: false, autoRefreshToken: false }
      });

      return { user: data.user, client: userClient };
    }

    it('un usuario anónimo no puede ejecutar la función reserve_stock', async () => {
      const { error } = await (anonClient as any).rpc('reserve_stock', {
        p_product_id: '00000000-0000-0000-0000-000000000000',
        p_cart_id: '00000000-0000-0000-0000-000000000000',
        p_quantity: 1
      });
      expect(error).toBeDefined();
    });

    it('roles no privilegiados (client, driver, warehouse) no pueden alterar su propio rol en profiles', async () => {
      for (const r of ['client', 'driver', 'warehouse'] as const) {
        const { user, client } = await createTestRoleUser(r);
        const { error } = await (client.from('profiles') as any).update({ role: 'admin' }).eq('id', user.id);
        if (error) {
          expect(error.code).toBe('42501');
        }

        const { data: currentProfile, error: qErr } = await (adminClient.from('profiles') as any)
          .select('role')
          .eq('id', user.id)
          .single();
        expect(qErr).toBeNull();
        expect(currentProfile.role).toBe(r);
        expect(currentProfile.role).not.toBe('admin');
      }
    });

    it('roles no privilegiados (client, driver, warehouse) no pueden consultar stock_reservations directamente', async () => {
      for (const r of ['client', 'driver', 'warehouse'] as const) {
        const { client } = await createTestRoleUser(r);
        const { data, error } = await (client.from('stock_reservations') as any).select('*');
        if (error) {
          expect(error.code).toBe('42501');
        } else {
          expect(data).toHaveLength(0);
        }
      }
    });

    it('función is_admin() evalúa estrictamente true solo para administradores', async () => {
      const { client: clientUser } = await createTestRoleUser('client');
      const { data: isClientAdmin, error: clientErr } = await clientUser.rpc('is_admin' as any);
      expect(clientErr).toBeNull();
      expect(isClientAdmin).toBe(false);

      const { client: adminUser } = await createTestRoleUser('admin');
      const { data: isAdminAdmin, error: adminErr } = await adminUser.rpc('is_admin' as any);
      expect(adminErr).toBeNull();
      expect(isAdminAdmin).toBe(true);
    });
  });

  describe('P1 Etapa 1: Catálogo, Protección de Costos y RLS Jerárquico', () => {
    it('un usuario anónimo o cliente no puede consultar cost_in_cents (violación de permisos a nivel de columna)', async () => {
      const { data, error } = await (anonClient.from('product_variants') as any)
        .select('cost_in_cents');
      expect(error).toBeDefined();
      expect(error?.code).toBe('42501');
    });

    it('el administrador / service_role sí puede consultar cost_in_cents', async () => {
      const { error } = await (adminClient.from('product_variants') as any)
        .select('id, cost_in_cents');
      expect(error).toBeNull();
    });

    it('RLS jerárquico: las variantes de categorías o productos inactivos están ocultas al público', async () => {
      const testCatId = '30000000-0000-0000-0000-000000000001';
      const testProdId = '40000000-0000-0000-0000-000000000001';
      const testVarId = '50000000-0000-0000-0000-000000000001';

      try {
        // 1. Crear categoría inactiva
        await (adminClient.from('categories') as any).upsert({
          id: testCatId,
          slug: 'test-cat-inactive',
          name: 'Categoría Inactiva Test',
          is_active: false,
        });

        // 2. Crear producto activo en esa categoría inactiva
        await (adminClient.from('products') as any).upsert({
          id: testProdId,
          category_id: testCatId,
          slug: 'test-prod-in-inactive-cat',
          name: 'Producto en Categoría Inactiva',
          is_active: true,
        });

        // 3. Crear variante activa
        await (adminClient.from('product_variants') as any).upsert({
          id: testVarId,
          product_id: testProdId,
          sku: 'SKU-INACTIVE-CAT-TEST',
          presentation_label: '750ml Test',
          price_in_cents: 5000000,
          cost_in_cents: 3000000,
          is_active: true,
        });

        // Verificar que anonClient NO puede ver la variante porque la categoría es inactiva
        const { data: anonVariants } = await (anonClient.from('product_variants') as any)
          .select('id')
          .eq('id', testVarId);
        expect(anonVariants).toHaveLength(0);

        // Verificar que adminClient SÍ puede verla
        const { data: adminVariants } = await (adminClient.from('product_variants') as any)
          .select('id')
          .eq('id', testVarId);
        expect(adminVariants).toHaveLength(1);

        // Ahora activar la categoría pero inactivar el producto
        await (adminClient.from('categories') as any).update({ is_active: true }).eq('id', testCatId);
        await (adminClient.from('products') as any).update({ is_active: false }).eq('id', testProdId);

        const { data: anonVariantsAfterProdInactive } = await (anonClient.from('product_variants') as any)
          .select('id')
          .eq('id', testVarId);
        expect(anonVariantsAfterProdInactive).toHaveLength(0);

        // Activar producto también -> Ahora la variante debe ser visible para anonClient
        await (adminClient.from('products') as any).update({ is_active: true }).eq('id', testProdId);

        const { data: anonVariantsActive } = await (anonClient.from('product_variants') as any)
          .select('id')
          .eq('id', testVarId);
        expect(anonVariantsActive).toHaveLength(1);
      } finally {
        await (adminClient.from('product_variants') as any).delete().eq('id', testVarId);
        await (adminClient.from('products') as any).delete().eq('id', testProdId);
        await (adminClient.from('categories') as any).delete().eq('id', testCatId);
      }
    });
  });
});

