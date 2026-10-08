import { SupabaseClient } from '@supabase/supabase-js';
import { Result, ok, fail } from '@/types/result';
import { 
  ProcessCheckoutDTO, 
  CheckoutResponse, 
  CheckoutError 
} from '@/types/checkout.types';

export interface ICheckoutService {
  processCheckout(dto: ProcessCheckoutDTO): Promise<Result<CheckoutResponse, CheckoutError>>;
  getDeliveryFee(subtotalInCents: number, city: string): Promise<number>;
}

export class CheckoutService implements ICheckoutService {
  constructor(private readonly client: SupabaseClient) {}

  private async validateCartOwnership(dto: ProcessCheckoutDTO): Promise<Result<void, CheckoutError>> {
    const { data: cart, error: cartErr } = await this.client
      .from('carts')
      .select('id, user_id, session_token, status')
      .eq('id', dto.cartId)
      .single();

    if (cartErr || !cart) {
      return fail({ code: 'CART_NOT_FOUND', message: `Cart ${dto.cartId} not found` });
    }

    if (cart.status === 'checked_out') {
      return fail({ code: 'CART_ALREADY_PROCESSED', message: 'Cart has already been checked out' });
    }

    if (cart.user_id && cart.user_id !== dto.userId) {
      return fail({ code: 'FORBIDDEN_CART_ACCESS', message: 'User does not own this cart' });
    }

    if (!cart.user_id && dto.sessionToken && cart.session_token !== dto.sessionToken) {
      return fail({ code: 'FORBIDDEN_CART_ACCESS', message: 'Invalid guest session token for cart' });
    }

    return ok(undefined);
  }

  private isTransientError(msg: string): boolean {
    const lower = msg.toLowerCase();
    return lower.includes('concurrency_conflict') ||
      lower.includes('deadlock') ||
      lower.includes('serialization failure') ||
      lower.includes('40p01') ||
      lower.includes('40001');
  }

  private async invokeRpcWithRetry(dto: ProcessCheckoutDTO): Promise<Result<CheckoutResponse, CheckoutError>> {
    let lastErr = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, 20 * Math.pow(2, attempt)));
      }
      const { data, error } = await this.client.rpc('process_checkout_atomic', {
        p_cart_id: dto.cartId,
        p_warehouse_id: dto.warehouseId,
        p_idempotency_key: dto.idempotencyKey,
        p_user_id: dto.userId || null,
        p_customer_name: dto.customerName,
        p_customer_phone: dto.customerPhone,
        p_customer_email: dto.customerEmail,
        p_delivery_address: dto.deliveryAddress,
        p_delivery_city: dto.deliveryCity || 'Bogotá D.C.',
        p_delivery_lat: dto.deliveryLat || null,
        p_delivery_lng: dto.deliveryLng || null,
        p_delivery_notes: dto.deliveryNotes || null,
        p_tip_in_cents: dto.tipInCents || 0,
      });

      if (!error && data) {
        const resp = data as CheckoutResponse;
        return ok(resp);
      }
      lastErr = error?.message || 'Unknown database error';
      if (!this.isTransientError(lastErr)) break;
    }
    return fail({ code: 'CHECKOUT_RPC_ERROR', message: lastErr });
  }

  async processCheckout(dto: ProcessCheckoutDTO): Promise<Result<CheckoutResponse, CheckoutError>> {
    const ownership = await this.validateCartOwnership(dto);
    if (!ownership.success) {
      return fail(ownership.error);
    }
    return this.invokeRpcWithRetry(dto);
  }

  async getDeliveryFee(subtotalInCents: number, city: string): Promise<number> {
    const { data, error } = await this.client.rpc('calculate_delivery_fee', {
      p_subtotal_in_cents: subtotalInCents,
      p_city: city,
    });
    if (error || data === null) {
      return 500000;
    }
    return Number(data);
  }
}
