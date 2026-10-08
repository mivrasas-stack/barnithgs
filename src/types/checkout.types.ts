export interface ProcessCheckoutDTO {
  cartId: string;
  warehouseId: string;
  idempotencyKey: string;
  userId?: string | null;
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

export interface CheckoutResponse {
  status: 'created' | 'idempotent_hit';
  orderId: string;
  orderNumber: string;
  subtotalInCents: number;
  deliveryFeeInCents: number;
  tipInCents: number;
  totalInCents: number;
  paymentStatus: string;
}

export interface CheckoutError {
  code: string;
  message: string;
}
