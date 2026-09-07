import type {
  OrderFulfillmentStatus,
  OrderPaymentStatus,
  ShopOrder,
  ShopOrderItem,
} from "./types";

type OrderRow = {
  id: string;
  club_id: string;
  order_number: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone: string | null;
  fulfillment_method: string;
  pickup_info: string | null;
  shipping_address: Record<string, string> | null;
  currency: string;
  subtotal_cents: number;
  total_cents: number;
  payment_status: string;
  fulfillment_status: string;
  payment_provider: string;
  paid_at: string | null;
  created_at: string;
};

type ItemRow = {
  id: string;
  order_id?: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_label: string | null;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
};

export function mapOrderItem(row: ItemRow): ShopOrderItem {
  return {
    id: row.id,
    productId: row.product_id,
    variantId: row.variant_id,
    productName: row.product_name,
    variantLabel: row.variant_label,
    quantity: row.quantity,
    unitPriceCents: row.unit_price_cents,
    lineTotalCents: row.line_total_cents,
  };
}

export function mapOrder(row: OrderRow, items: ItemRow[] = []): ShopOrder {
  return {
    id: row.id,
    clubId: row.club_id,
    orderNumber: row.order_number,
    customerFirstName: row.customer_first_name,
    customerLastName: row.customer_last_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    fulfillmentMethod: row.fulfillment_method as ShopOrder["fulfillmentMethod"],
    pickupInfo: row.pickup_info,
    shippingAddress: row.shipping_address,
    currency: "CHF",
    subtotalCents: row.subtotal_cents,
    totalCents: row.total_cents,
    paymentStatus: row.payment_status as OrderPaymentStatus,
    fulfillmentStatus: row.fulfillment_status as OrderFulfillmentStatus,
    paymentProvider: "stripe",
    paidAt: row.paid_at,
    createdAt: row.created_at,
    items: items.map(mapOrderItem),
  };
}

export function paymentStatusLabel(status: OrderPaymentStatus): string {
  switch (status) {
    case "pending":
      return "Paiement en attente";
    case "paid":
      return "Payée";
    case "failed":
      return "Paiement échoué";
    case "cancelled":
      return "Annulée";
    case "expired":
      return "Expirée";
    case "refunded":
      return "Remboursée";
    default:
      return status;
  }
}

export function fulfillmentStatusLabel(status: OrderFulfillmentStatus): string {
  switch (status) {
    case "none":
      return "—";
    case "to_prepare":
      return "À préparer";
    case "ready":
      return "Prête";
    case "handed_over":
      return "Remise au client";
    case "cancelled":
      return "Annulée";
    default:
      return status;
  }
}

export function displayOrderStatus(order: {
  paymentStatus: OrderPaymentStatus;
  fulfillmentStatus: OrderFulfillmentStatus;
}): string {
  if (order.paymentStatus === "pending") return "Paiement en attente";
  if (order.paymentStatus === "failed") return "Paiement échoué";
  if (order.paymentStatus === "cancelled" || order.paymentStatus === "expired") {
    return "Annulée";
  }
  if (order.paymentStatus === "refunded") return "Remboursée";
  if (order.fulfillmentStatus === "to_prepare") return "À préparer";
  if (order.fulfillmentStatus === "ready") return "Prête";
  if (order.fulfillmentStatus === "handed_over") return "Remise au client";
  return "Payée";
}

export const NEXT_FULFILLMENT: Partial<
  Record<OrderFulfillmentStatus, OrderFulfillmentStatus>
> = {
  to_prepare: "ready",
  ready: "handed_over",
};

export const ORDER_SELECT =
  "id, club_id, order_number, customer_first_name, customer_last_name, customer_email, customer_phone, fulfillment_method, pickup_info, shipping_address, currency, subtotal_cents, total_cents, payment_status, fulfillment_status, payment_provider, paid_at, created_at";

export const ORDER_ITEM_SELECT =
  "id, order_id, product_id, variant_id, product_name, variant_label, quantity, unit_price_cents, line_total_cents";

export type { OrderRow, ItemRow };
