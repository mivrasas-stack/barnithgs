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
    it('debe impedir sobreventas cuando múltiples peticiones reservan simultáneamente', async () => {
      const productId = '10000000-0000-0000-0000-000000000001';
      const cartId = '20000000-0000-0000-0000-000000000002';
      
      // 1. Setup de producto y stock físico único (1 unidad)
      await (adminClient.from('products') as any).upsert({ id: productId, name: 'Atomic Test Product', price: 100 });
      await (adminClient.from('inventory') as any).upsert({ product_id: productId, physical_quantity: 1 });
      await (adminClient.from('stock_reservations') as any).delete().eq('product_id', productId);

      // 2. Ejecutar 3 reservas concurrentes de 1 unidad cada una
      const attempts = await Promise.all([
        (adminClient as any).rpc('reserve_stock', { p_product_id: productId, p_cart_id: cartId, p_quantity: 1 }),
        (adminClient as any).rpc('reserve_stock', { p_product_id: productId, p_cart_id: cartId, p_quantity: 1 }),
        (adminClient as any).rpc('reserve_stock', { p_product_id: productId, p_cart_id: cartId, p_quantity: 1 })
      ]);

      const successes = attempts.filter(a => a.data === true);
      // Gracias al bloqueo FOR UPDATE a nivel de fila en PostgreSQL, exactamente 1 debe tener éxito
      expect(successes.length).toBe(1);

      // 3. Limpieza garantizada
      await (adminClient.from('stock_reservations') as any).delete().eq('product_id', productId);
      await (adminClient.from('products') as any).delete().eq('id', productId);
    });
  });

  describe('Control de Roles y Permisos End-to-End (RLS)', () => {
    const createdUserIds: string[] = [];

    afterAll(async () => {
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

      await (adminClient.from('profiles') as any).insert({
        id: data.user.id,
        full_name: `Test ${role}`,
        name: `Test ${role}`,
        role,
        email
      });

      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false }
      });
      const { error: signInErr } = await userClient.auth.signInWithPassword({
        email,
        password: 'SecurePassword123!'
      });
      if (signInErr) throw new Error(`Fallo en login de ${role}: ${signInErr.message}`);

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
