'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { CheckoutService } from '@/services/checkout.service';
import { ProcessCheckoutDTO, CheckoutResponse, CheckoutError } from '@/types/checkout.types';

export interface ClientCheckoutInput {
  cartId: string;
  warehouseId: string;
  idempotencyKey: string;
  sessionToken?: string;
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

export type CheckoutActionResult =
  | { success: true; data: CheckoutResponse }
  | { success: false; error: CheckoutError };

export async function processCheckoutAction(input: ClientCheckoutInput): Promise<CheckoutActionResult> {
  // 1. Resolve identity securely on the server via auth.getUser()
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const verifiedUserId = user?.id || null;

  // 2. Build verified DTO on server (never accept userId from client parameters)
  const serverDto: ProcessCheckoutDTO = {
    cartId: input.cartId,
    warehouseId: input.warehouseId,
    idempotencyKey: input.idempotencyKey,
    userId: verifiedUserId,
    sessionToken: input.sessionToken,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    deliveryAddress: input.deliveryAddress,
    deliveryCity: input.deliveryCity,
    deliveryLat: input.deliveryLat,
    deliveryLng: input.deliveryLng,
    deliveryNotes: input.deliveryNotes,
    tipInCents: input.tipInCents,
  };

  // 3. Delegate to CheckoutService with backend service_role client
  const service = new CheckoutService(supabaseAdmin);
  const result = await service.processCheckout(serverDto);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, data: result.data };
}
