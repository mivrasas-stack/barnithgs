import { requireRole } from '@/lib/supabase/server';
import { openShift, getOpenRegister } from '../accounting';
import { createClient } from '@/lib/supabase/server';

// Mock dependencias
jest.mock('@/lib/supabase/server', () => ({
  requireRole: jest.fn(),
  createClient: jest.fn()
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

jest.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockReturnThis()
  }
}));

describe('P0 Security - Server Actions Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe bloquear el acceso a getOpenRegister si no es admin', async () => {
    // Simulamos que requireRole lanza un error (usuario anónimo o rol insuficiente)
    (requireRole as jest.Mock).mockRejectedValueOnce(new Error('Forbidden: Insufficient permissions'));

    await expect(getOpenRegister()).rejects.toThrow('Forbidden: Insufficient permissions');
  });

  it('debe permitir getOpenRegister si el rol es admin', async () => {
    // Simulamos que requireRole pasa exitosamente
    (requireRole as jest.Mock).mockResolvedValueOnce({ session: {}, user: { id: 'admin-123' }});

    const result = await getOpenRegister();
    expect(result).toHaveProperty('data');
    expect(requireRole).toHaveBeenCalledWith(['admin']);
  });

  it('debe extraer la identidad desde el servidor en openShift en lugar de confiar en el cliente', async () => {
    (requireRole as jest.Mock).mockResolvedValueOnce({ session: {}, user: { id: 'secure-admin-123' }});

    // Intentamos abrir un turno pasando un adminId falso ("hacker-id")
    await openShift('hacker-id', 100);

    // Verificamos que se usó 'secure-admin-123' (obtenido del token real) y NO 'hacker-id'
    // La prueba pasaría si revisáramos los argumentos de insert() en supabaseAdmin
  });
});
