// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

// Estas pruebas están diseñadas para ejecutarse contra una instancia local
// aislada de Supabase usando testcontainers o el emulador local de Supabase.
// NO se utilizan mocks. Todo ocurre en la red contra el motor de PostgreSQL.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fake-anon-key';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fake-service-key';

describe('Real Database Integration & RLS (No Mocks)', () => {
  let adminClient: ReturnType<typeof createClient>;
  let anonClient: ReturnType<typeof createClient>;

  beforeAll(() => {
    // Cliente privilegiado para setup
    adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    // Cliente anónimo / sin sesión
    anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  });

  it('debe impedir que un usuario anónimo invoque reserve_stock', async () => {
    const { data, error } = await anonClient.rpc('reserve_stock', {
      p_product_id: '00000000-0000-0000-0000-000000000000',
      p_cart_id: '00000000-0000-0000-0000-000000000000',
      p_quantity: 1
    });

    // Postgres will deny execution since we revoked from PUBLIC/ANON
    expect(error).toBeDefined();
    expect(error?.message).toMatch(/permission denied for function reserve_stock|Could not find the function/);
  });

  it('debe impedir que un cliente autenticado lea o escriba en stock_reservations directamente', async () => {
    // Creamos un usuario de prueba rápido usando el admin
    const email = `test-client-${Date.now()}@partyflow.app`;
    const { data: { user } } = await adminClient.auth.admin.createUser({
      email,
      password: 'SecurePassword123!',
      email_confirm: true
    });

    if (!user) throw new Error("Fallo al crear usuario de prueba");

    // Iniciar sesión como ese usuario
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });
    await authClient.auth.signInWithPassword({ email, password: 'SecurePassword123!' });

    // Intentar leer stock_reservations
    const { data, error } = await authClient.from('stock_reservations').select('*');
    
    // RLS will block it entirely
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501'); // insufficient_privilege

    // Limpieza
    await adminClient.auth.admin.deleteUser(user.id);
  });

  it('debe impedir que un usuario modifique su propia columna role en profiles', async () => {
    const email = `test-role-${Date.now()}@partyflow.app`;
    const { data: { user } } = await adminClient.auth.admin.createUser({
      email,
      password: 'SecurePassword123!',
      email_confirm: true
    });
    if (!user) throw new Error("No user");

    // Forzar creación de profile básico
    await adminClient.from('profiles').insert({
      id: user.id,
      full_name: 'Test',
      role: 'client',
      email
    });

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });
    await authClient.auth.signInWithPassword({ email, password: 'SecurePassword123!' });

    // Intentar hackear el role
    const { error } = await authClient.from('profiles').update({ role: 'admin' }).eq('id', user.id);
    
    // Como hicimos GRANT UPDATE (full_name), no tiene permiso sobre 'role'
    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');

    await adminClient.auth.admin.deleteUser(user.id);
  });
});
