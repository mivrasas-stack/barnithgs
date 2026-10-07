import { createClient } from '@supabase/supabase-js';

// Estas pruebas se ejecutan contra Supabase físico (Docker/CI) o un entorno de pruebas.
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
    it('debe impedir sobreventas cuando multiples peticiones reservan simultaneamente', async () => {
      // Configuramos stock inicial
      const productId = '10000000-0000-0000-0000-000000000001';
      const cartId = '20000000-0000-0000-0000-000000000002';
      
      // Aseguramos insercion del producto de prueba y 1 unidad en stock
      await adminClient.from('products').upsert({ id: productId, name: 'Test Product', price: 100 } as any);
      await adminClient.from('inventory').upsert({ product_id: productId, physical_quantity: 1 } as any);
      // Limpiamos reservaciones
      await adminClient.from('stock_reservations').delete().eq('product_id', productId);

      // Lanzamos 3 intentos concurrentes
      const attempts = await Promise.all([
        adminClient.rpc('reserve_stock' as any, { p_product_id: productId, p_cart_id: cartId, p_quantity: 1 } as any),
        adminClient.rpc('reserve_stock' as any, { p_product_id: productId, p_cart_id: cartId, p_quantity: 1 } as any),
        adminClient.rpc('reserve_stock' as any, { p_product_id: productId, p_cart_id: cartId, p_quantity: 1 } as any)
      ]);

      const successes = attempts.filter(a => a.data === true);
      // Solo 1 debe triunfar gracias al FOR UPDATE de PostgreSQL
      expect(successes.length).toBe(1);

      // Limpieza
      await adminClient.from('products').delete().eq('id', productId);
    });
  });

  describe('Control de Roles y Permisos (End-to-End)', () => {
    let testUser: any;
    let authClient: ReturnType<typeof createClient>;

    beforeAll(async () => {
      const email = `test-role-${Date.now()}@partyflow.app`;
      const { data: { user } } = await adminClient.auth.admin.createUser({
        email, password: 'SecurePassword123!', email_confirm: true
      });
      if (!user) throw new Error("Fallo al crear usuario de prueba");
      testUser = user;

      // Asignamos perfil
      await adminClient.from('profiles').insert({
        id: testUser.id, full_name: 'Test', role: 'client', email
      } as any);

      authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false }
      });
      await authClient.auth.signInWithPassword({ email, password: 'SecurePassword123!' });
    });

    afterAll(async () => {
      if (testUser) await adminClient.auth.admin.deleteUser(testUser.id);
    });

    it('un usuario sin sesion no puede ejecutar acciones privilegiadas ni rpc', async () => {
      const { data, error } = await anonClient.rpc('reserve_stock' as any, {
        p_product_id: '00000000-0000-0000-0000-000000000000',
        p_cart_id: '00000000-0000-0000-0000-000000000000',
        p_quantity: 1
      } as any);
      expect(error?.message).toMatch(/permission denied for function reserve_stock|Could not find the function/);
    });

    it('un cliente autenticado no puede leer tablas internas de stock', async () => {
      const { error } = await authClient.from('stock_reservations').select('*');
      expect(error).not.toBeNull();
      expect(error?.code).toBe('42501'); // insufficient_privilege
    });

    it('un cliente autenticado no puede elevar su propio rol', async () => {
      const { error } = await authClient.from('profiles').update({ role: 'admin' } as any).eq('id', testUser.id);
      expect(error).not.toBeNull();
      expect(error?.code).toBe('42501');
    });
  });
});
