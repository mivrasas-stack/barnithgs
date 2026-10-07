import { getOpenRegister, openShift } from '../accounting';

const mockInsert = jest.fn().mockReturnThis();
const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });

jest.mock('@/lib/supabaseAdmin', () => {
  const mSelect = jest.fn().mockReturnThis();
  const mInsert = jest.fn().mockReturnThis();
  const mUpdate = jest.fn().mockReturnThis();
  const mEq = jest.fn().mockReturnThis();
  const mSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  const mFrom = jest.fn().mockReturnValue({
    select: mSelect,
    insert: mInsert,
    update: mUpdate,
    eq: mEq,
    single: mSingle,
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis()
  });
  return {
    supabaseAdmin: {
      from: mFrom
    },
    __mocks: { mSelect, mInsert, mUpdate, mEq, mSingle, mFrom }
  };
});

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

const mockRequireRole = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  requireRole: (...args: any[]) => mockRequireRole(...args),
  createClient: jest.fn()
}));

describe('P0 Security - Server Actions Authorization', () => {
  let adminMocks: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockReset();
    adminMocks = require('@/lib/supabaseAdmin').__mocks;
  });

  it('debe bloquear el acceso a getOpenRegister si no es admin o si el token es inválido', async () => {
    mockRequireRole.mockRejectedValueOnce(new Error('Forbidden: Insufficient permissions'));
    await expect(getOpenRegister()).rejects.toThrow('Forbidden: Insufficient permissions');
  });

  it('debe permitir getOpenRegister si el rol en tabla profiles es admin', async () => {
    mockRequireRole.mockResolvedValueOnce({ user: { id: 'admin-123' }, role: 'admin' });
    adminMocks.mSingle.mockResolvedValueOnce({ data: { status: 'open' } });
    
    const result = await getOpenRegister();
    expect(result).toHaveProperty('data');
    expect(mockRequireRole).toHaveBeenCalledWith(['admin']);
  });

  it('debe extraer la identidad desde el servidor en openShift en lugar de confiar en el cliente', async () => {
    mockRequireRole.mockResolvedValueOnce({ user: { id: 'secure-admin-123' }, role: 'admin' });
    
    // Simulate no open register
    adminMocks.mSingle.mockResolvedValueOnce({ data: null });
    // Simulate successful insert
    adminMocks.mSingle.mockResolvedValueOnce({ data: { id: 'new-reg' } });

    // Hacker tries to open a shift with 100
    await openShift(100);

    // Verify insert was called with the actual authenticated user ID, NOT the client's payload
    expect(adminMocks.mInsert).toHaveBeenCalledWith([
      { opened_by: 'secure-admin-123', initial_balance: 100 }
    ]);
  });
});
