import { CheckoutService } from '../checkout.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { ProcessCheckoutDTO } from '@/types/checkout.types';

describe('CheckoutService (Unit Tests)', () => {
  let mockSupabase: { from: jest.Mock; rpc: jest.Mock };
  let service: CheckoutService;

  const validDTO: ProcessCheckoutDTO = {
    cartId: 'c0000000-0000-0000-0000-000000000001',
    warehouseId: '00000000-0000-0000-0000-000000000001',
    idempotencyKey: 'idemp-123456',
    userId: 'u0000000-0000-0000-0000-000000000001',
    customerName: 'Santiago Botero',
    customerPhone: '+573001234567',
    customerEmail: 'santiago@partyflow.app',
    deliveryAddress: 'Calle 93 # 12-45',
    deliveryCity: 'Bogotá D.C.',
    deliveryLat: 4.675,
    deliveryLng: -74.055,
    tipInCents: 50000,
  };

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn(),
      rpc: jest.fn(),
    };
    service = new CheckoutService(mockSupabase as unknown as SupabaseClient);
  });

  describe('Validación de Titularidad de Carrito', () => {
    it('falla con CART_NOT_FOUND si el carrito no existe en la base de datos', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Row not found' } }),
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await service.processCheckout(validDTO);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CART_NOT_FOUND');
      }
    });

    it('falla con CART_ALREADY_PROCESSED si el carrito ya fue procesado con otra clave', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'carts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: validDTO.cartId, status: 'checked_out', user_id: validDTO.userId },
              error: null,
            }),
          };
        }
        if (table === 'orders') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'o1', idempotency_key: 'diff-key' },
              error: null,
            }),
          };
        }
        return {};
      });

      const result = await service.processCheckout(validDTO);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CART_ALREADY_PROCESSED');
      }
    });

    it('permite reintento idempotente en carrito checked_out si la clave de idempotencia coincide', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'carts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: validDTO.cartId, status: 'checked_out', user_id: validDTO.userId },
              error: null,
            }),
          };
        }
        if (table === 'orders') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'o1', idempotency_key: validDTO.idempotencyKey },
              error: null,
            }),
          };
        }
        return {};
      });

      mockSupabase.rpc.mockResolvedValue({
        data: {
          status: 'idempotent_hit',
          order_id: 'o0000000-0000-0000-0000-000000000001',
          order_number: 'ORD-20261008-ABC123',
          total_in_cents: 5550000,
          payment_status: 'unpaid',
        },
        error: null,
      });

      const result = await service.processCheckout(validDTO);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('idempotent_hit');
        expect(result.data.orderId).toBe('o0000000-0000-0000-0000-000000000001');
      }
    });

    it('falla con FORBIDDEN_CART_ACCESS si el usuario autenticado intenta comprar un carrito ajeno', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: validDTO.cartId, status: 'active', user_id: 'other-user-999' },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await service.processCheckout(validDTO);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FORBIDDEN_CART_ACCESS');
      }
    });

    it('falla con FORBIDDEN_CART_ACCESS si el token de sesion de invitado no coincide', async () => {
      const guestDTO: ProcessCheckoutDTO = {
        ...validDTO,
        userId: null,
        sessionToken: 'token-guest-wrong',
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: guestDTO.cartId, status: 'active', user_id: null, session_token: 'token-guest-real' },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await service.processCheckout(guestDTO);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FORBIDDEN_CART_ACCESS');
      }
    });

    it('falla con FORBIDDEN_CART_ACCESS si el checkout de invitado no proporciona sessionToken', async () => {
      const guestNoTokenDTO: ProcessCheckoutDTO = {
        ...validDTO,
        userId: null,
        sessionToken: undefined,
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: guestNoTokenDTO.cartId, status: 'active', user_id: null, session_token: 'token-guest-real' },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await service.processCheckout(guestNoTokenDTO);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FORBIDDEN_CART_ACCESS');
        expect(result.error.message).toContain('Guest session token is required');
      }
    });
  });

  describe('Ejecución de RPC Transaccional', () => {
    it('retorna CheckoutResponse exitosa cuando el carrito es propio y la RPC responde con status created', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: validDTO.cartId, status: 'active', user_id: validDTO.userId },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      mockSupabase.rpc.mockResolvedValue({
        data: {
          status: 'created',
          orderId: 'o0000000-0000-0000-0000-000000000001',
          orderNumber: 'ORD-20261008-ABC123',
          subtotalInCents: 5000000,
          deliveryFeeInCents: 500000,
          tipInCents: 50000,
          totalInCents: 5550000,
          paymentStatus: 'unpaid',
        },
        error: null,
      });

      const result = await service.processCheckout(validDTO);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('created');
        expect(result.data.orderNumber).toBe('ORD-20261008-ABC123');
        expect(result.data.totalInCents).toBe(5550000);
      }
    });

    it('maneja respuestas idempotentes status idempotent_hit', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: validDTO.cartId, status: 'active', user_id: validDTO.userId },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      mockSupabase.rpc.mockResolvedValue({
        data: {
          status: 'idempotent_hit',
          orderId: 'o0000000-0000-0000-0000-000000000001',
          orderNumber: 'ORD-20261008-ABC123',
          totalInCents: 5550000,
          paymentStatus: 'unpaid',
        },
        error: null,
      });

      const result = await service.processCheckout(validDTO);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('idempotent_hit');
      }
    });

    it('extrae el código de error domain de excepciones levantadas por la RPC', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: validDTO.cartId, status: 'active', user_id: validDTO.userId },
          error: null,
        }),
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'CART_ALREADY_PROCESSED: Cart c0000000-0000-0000-0000-000000000001 has already been checked out' },
      });

      const result = await service.processCheckout(validDTO);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CART_ALREADY_PROCESSED');
      }
    });
  });

  describe('Cálculo de Tarifas de Entrega', () => {
    it('retorna tarifa calculada por la función de base de datos', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: 500000, error: null });
      const fee = await service.getDeliveryFee(2500000, 'Bogotá D.C.');
      expect(fee).toBe(500000);
    });
  });
});
