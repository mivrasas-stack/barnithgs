import { createClient } from '@supabase/supabase-js';

// Estas pruebas se ejecutan contra una instancia aislada de Supabase (Docker / CI).
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fake-anon-key';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fake-service-key';

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
        // 1. Preparación y validación de operaciones preparatorias
        const { error: prodErr } = await (adminClient.from('products') as any).upsert({ 
          id: productId, 
          name: 'Atomic Beer Case', 
          price: 150000 
        });
        expect(prodErr).toBeNull();

        const { error: invErr } = await (adminClient.from('inventory') as any).upsert({ 
          product_id: productId, 
          physical_quantity: 1 
        });
        expect(invErr).toBeNull();

        const { error: cleanResErr } = await (adminClient.from('stock_reservations') as any).delete().eq('product_id', productId);
        expect(cleanResErr).toBeNull();

        // 2. Disparar 3 reservas simultáneas desde 3 carritos distintos
        const attempts = await Promise.all([
          (adminClient as any).rpc('reserve_stock', { p_product_id: productId, p_cart_id: cartId1, p_quantity: 1 }),
          (adminClient as any).rpc('reserve_stock', { p_product_id: productId, p_cart_id: cartId2, p_quantity: 1 }),
          (adminClient as any).rpc('reserve_stock', { p_product_id: productId, p_cart_id: cartId3, p_quantity: 1 })
        ]);

        // Verificar resultados individuales
        const successes = attempts.filter(a => a.data === true);
        const failures = attempts.filter(a => a.data === false);

        expect(successes.length).toBe(1);
        expect(failures.length).toBe(2);

        // 3. Comprobación de estado final en base de datos: inventario físico y reservas activas
        const { data: finalReservations, error: resQueryErr } = await (adminClient.from('stock_reservations') as any)
          .select('*')
          .eq('product_id', productId);
        expect(resQueryErr).toBeNull();
        expect(finalReservations).toHaveLength(1);
        expect(finalReservations[0].quantity).toBe(1);

        // El carrito ganador debe ser uno de los tres
        expect([cartId1, cartId2, cartId3]).toContain(finalReservations[0].cart_id);

        const { data: finalInventory, error: invQueryErr } = await (adminClient.from('inventory') as any)
          .select('physical_quantity')
          .eq('product_id', productId)
          .single();
        expect(invQueryErr).toBeNull();
        // El stock físico no se descuenta hasta el checkout final, se mantiene en 1
        expect(finalInventory.physical_quantity).toBe(1);

        // Un cuarto intento subsiguiente de cualquier carrito debe fallar inmediatamente
        const fourthAttempt = await (adminClient as any).rpc('reserve_stock', { 
          p_product_id: productId, 
          p_cart_id: '20000000-0000-0000-0000-000000000004', 
          p_quantity: 1 
        });
        expect(fourthAttempt.data).toBe(false);

      } finally {
        // Limpieza garantizada incluso ante fallo de aserciones
        await (adminClient.from('stock_reservations') as any).delete().eq('product_id', productId);
        await (adminClient.from('inventory') as any).delete().eq('product_id', productId);
        await (adminClient.from('products') as any).delete().eq('id', productId);
      }
    });
  });

  describe('Control de Roles y Permisos End-to-End (RLS)', () => {
    const createdUserIds: string[] = [];

    afterAll(async () => {
      // Limpieza exhaustiva de usuarios de prueba en Supabase Auth
      for (const id of createdUserIds) {
        try {
          await adminClient.auth.admin.deleteUser(id);
        } catch (_) {}
      }
    });

    async function createTestRoleUser(role: 'client' | 'driver' | 'warehouse' | 'admin') {
      const email = `test-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@partyflow.app`;
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password: 'SecurePassword123!',
        email_confirm: true
      });
      if (error || !data.user) throw new Error(`Fallo al crear usuario ${role}: ${error?.message}`);
      createdUserIds.push(data.user.id);

      // Comprobación explícita de inserción de perfil
      const { error: profileError } = await (adminClient.from('profiles') as any).insert({
        id: data.user.id,
        full_name: `Test ${role}`,
        name: `Test ${role}`,
        role,
        email
      });
      if (profileError) {
        throw new Error(`Fallo en inserción de perfil para ${role}: ${profileError.message}`);
      }

      const { data: authData, error: signInErr } = await anonClient.auth.signInWithPassword({
        email,
        password: 'SecurePassword123!'
      });
      if (signInErr || !authData.session) {
        throw new Error(`Fallo en login de ${role}: ${signInErr?.message}`);
      }

      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${authData.session.access_token}`
          }
        },
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
      expect(error?.message).toMatch(/permission denied for function reserve_stock|Could not find the function/);
    });

    it('roles no privilegiados (client, driver, warehouse) no pueden alterar su propio rol en profiles', async () => {
      for (const r of ['client', 'driver', 'warehouse'] as const) {
        const { user, client } = await createTestRoleUser(r);
        const { error } = await (client.from('profiles') as any).update({ role: 'admin' }).eq('id', user.id);
        expect(error).not.toBeNull();
        expect(error?.code).toBe('42501'); // insufficient_privilege
      }
    });

    it('roles no privilegiados (client, driver, warehouse) no pueden consultar stock_reservations directamente', async () => {
      for (const r of ['client', 'driver', 'warehouse'] as const) {
        const { client } = await createTestRoleUser(r);
        const { error } = await (client.from('stock_reservations') as any).select('*');
        expect(error).not.toBeNull();
        expect(error?.code).toBe('42501'); // insufficient_privilege
      }
    });

    it('función is_admin() evalúa estrictamente true solo para administradores', async () => {
      const { client: clientUser } = await createTestRoleUser('client');
      const { data: isClientAdmin } = await clientUser.rpc('is_admin' as any);
      expect(isClientAdmin).toBe(false);

      const { client: adminUser } = await createTestRoleUser('admin');
      const { data: isAdminAdmin } = await adminUser.rpc('is_admin' as any);
      expect(isAdminAdmin).toBe(true);
    });
  });
});
