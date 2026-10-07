import { getOpenRegister, openShift } from '../accounting';
import { createOrUpdateStaffMember } from '../staff';

// --- Mocks ---
const mockRequireAuth = jest.fn();
const mockRequireRole = jest.fn();
const mockGetUser = jest.fn();
const mockProfilesSelect = jest.fn();
const mockProfilesInsert = jest.fn();
const mockProfilesUpdate = jest.fn();
const mockInviteUser = jest.fn();
const mockDeleteUser = jest.fn();

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  requireAuth: () => mockRequireAuth(),
  requireRole: (roles: string[]) => mockRequireRole(roles),
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser()
    },
    from: (table: string) => ({
      select: mockProfilesSelect,
      insert: mockProfilesInsert,
      update: mockProfilesUpdate
    })
  })
}));

jest.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        inviteUserByEmail: (...args: any[]) => mockInviteUser(...args),
        deleteUser: (...args: any[]) => mockDeleteUser(...args),
        updateUserById: jest.fn()
      }
    },
    from: () => ({
      insert: mockProfilesInsert,
      update: mockProfilesUpdate
    })
  }
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

describe('P0 Security - Integración y Validaciones de Rol', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Acceso por Roles (Accounting)', () => {
    it('rechaza al usuario sin sesión (o token inválido)', async () => {
      mockRequireRole.mockRejectedValue(new Error('Unauthorized'));
      await expect(getOpenRegister()).rejects.toThrow('Unauthorized');
    });

    it('rechaza al usuario cliente (Rol: client)', async () => {
      mockRequireRole.mockRejectedValue(new Error('Forbidden: Insufficient permissions'));
      await expect(getOpenRegister()).rejects.toThrow('Forbidden: Insufficient permissions');
    });

    it('rechaza al usuario repartidor (Rol: driver)', async () => {
      mockRequireRole.mockRejectedValue(new Error('Forbidden: Insufficient permissions'));
      await expect(openShift(100)).rejects.toThrow('Forbidden: Insufficient permissions');
    });

    it('rechaza al usuario de bodega (Rol: warehouse)', async () => {
      mockRequireRole.mockRejectedValue(new Error('Forbidden: Insufficient permissions'));
      await expect(openShift(100)).rejects.toThrow('Forbidden: Insufficient permissions');
    });
  });

  describe('Seguridad en Staff e Invitaciones', () => {
    beforeEach(() => {
      mockRequireRole.mockResolvedValue({ user: { id: 'admin-123' }, role: 'admin' });
    });

    it('evita crear un perfil con rol inválido (Intento de cambiar el propio rol o crear uno falsificado)', async () => {
      const res = await createOrUpdateStaffMember({ name: 'Hacker', role: 'superadmin', email: 'h@partyflow.app' });
      expect(res.error).toMatch(/Rol inválido/);
      expect(mockInviteUser).not.toHaveBeenCalled();
    });

    it('ejecuta rollback (deleteUser) si la invitación parcial falla (Profiles constraint)', async () => {
      // Supabase Auth crea el user bien
      mockInviteUser.mockResolvedValue({ data: { user: { id: 'new-uuid' } }, error: null });
      // Pero Profiles falla
      mockProfilesInsert.mockResolvedValue({ error: { message: 'Database error' } });
      
      const res = await createOrUpdateStaffMember({ id: 'staff-1', name: 'John', role: 'driver', email: 'john@partyflow.app' });
      
      expect(res.error).toMatch(/Error creando perfil/);
      expect(mockDeleteUser).toHaveBeenCalledWith('new-uuid'); // Rollback executed!
    });
  });
});
