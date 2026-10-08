'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { CheckoutService } from '@/services/checkout.service';
import { CheckoutResponse, CheckoutError } from '@/types/checkout.types';
import { Result, fail } from '@/types/result';

export interface CheckoutActionInput {
  cartId: string;
  warehouseId: string;
  idempotencyKey: string;
  sessionToken?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryCity?: string;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  deliveryNotes?: string | null;
  tipInCents?: number;
}

function buildCheckoutDTO(input: CheckoutActionInput, verifiedUserId: string | null) {
  return {
    cartId: input.cartId,
    warehouseId: input.warehouseId,
    idempotencyKey: input.idempotencyKey,
    userId: verifiedUserId,
    sessionToken: input.sessionToken ?? null,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    deliveryAddress: input.deliveryAddress,
    deliveryCity: input.deliveryCity || 'Bogotá D.C.',
    deliveryLat: input.deliveryLat ?? null,
    deliveryLng: input.deliveryLng ?? null,
    deliveryNotes: input.deliveryNotes ?? null,
    tipInCents: input.tipInCents ?? 0,
  };
}

export async function processCheckoutAction(
  input: CheckoutActionInput
): Promise<Result<CheckoutResponse, CheckoutError>> {
  // 1. Verify user identity via secure server-side JWT validation
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Strict rule: userId is derived exclusively from server auth, NEVER trusted from client
  const verifiedUserId = user?.id ?? null;

  // 2. Validate mandatory guest session token when user is unauthenticated
  if (!verifiedUserId && (!input.sessionToken || input.sessionToken.trim().length === 0)) {
    return fail({
      code: 'UNAUTHORIZED_GUEST',
      message: 'Guest checkout requires a valid session token',
    });
  }

  // 3. Delegate to CheckoutService with trusted server-side identity
  const service = new CheckoutService(supabaseAdmin);
  return service.processCheckout(buildCheckoutDTO(input, verifiedUserId));
}
