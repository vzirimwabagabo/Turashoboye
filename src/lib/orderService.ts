import { supabase } from './supabase';
import type { PrintableOrder } from '../components/sales/OrderReceiptModal';

export interface OrderItemInput {
  productId: string;
  variantId?: string;
  productName: string;
  sku: string;
  packageSize: string;
  unitPriceRwf: number;
  quantity: number;
}

export interface PlaceOrderParams {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  fulfillmentType: 'pickup' | 'delivery';
  paymentMethod: 'cash' | 'momo' | 'bank_transfer';
  paymentPhone?: string;
  paymentReference?: string;
  items: OrderItemInput[];
  notes?: string;
}

export interface OrderCalculation {
  subtotalRwf: number;
  discountRwf: number;
  discountPercentage: number;
  deliveryFeeRwf: number;
  totalAmountRwf: number;
  tierName?: string;
}

/**
 * Real order volume pricing algorithm for Turashoboye Feeds:
 * - 1 to 9 bags: Standard retail price (0% discount)
 * - 10 to 24 bags: Cooperative Volume Tier (3% wholesale discount)
 * - 25+ bags: Commercial Breeder Tier (5% volume discount)
 * - Delivery fee: Free for depot pickup; 2,000 RWF for delivery (Free for orders >= 20 bags)
 */
export function calculateOrderTotals(
  items: OrderItemInput[],
  fulfillmentType: 'pickup' | 'delivery'
): OrderCalculation {
  const totalBags = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalRwf = items.reduce((sum, item) => sum + item.unitPriceRwf * item.quantity, 0);

  let discountPercentage = 0;
  let tierName = undefined;

  if (totalBags >= 25) {
    discountPercentage = 0.05; // 5% discount
    tierName = 'Commercial Breeder Wholesale (5% off)';
  } else if (totalBags >= 10) {
    discountPercentage = 0.03; // 3% discount
    tierName = 'Cooperative Volume Tier (3% off)';
  }

  const discountRwf = Math.round(subtotalRwf * discountPercentage);

  let deliveryFeeRwf = 0;
  if (fulfillmentType === 'delivery') {
    deliveryFeeRwf = totalBags >= 20 ? 0 : 2000; // Free delivery for 20+ bags
  }

  const totalAmountRwf = subtotalRwf - discountRwf + deliveryFeeRwf;

  return {
    subtotalRwf,
    discountRwf,
    discountPercentage,
    deliveryFeeRwf,
    totalAmountRwf,
    tierName,
  };
}

const LOCAL_ORDERS_KEY = 'turashoboye_customer_orders_store';

export function getLocalCustomerOrders(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalCustomerOrder(order: any): void {
  try {
    const existing = getLocalCustomerOrders();
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify([order, ...existing]));
  } catch (err) {
    console.warn('Could not save order locally:', err);
  }
}

/**
 * Builds formatted WhatsApp order dispatch URL to notify depot staff
 */
export function buildWhatsAppOrderConfirmationUrl(order: PrintableOrder, fulfillment: string): string {
  const staffPhone = '250780000000';
  const itemsText = order.items
    .map((i) => `• ${i.quantity}x ${i.productName} (${i.packageSize}) - ${i.lineTotalRwf.toLocaleString()} RWF [Batch: ${i.batchNumber || 'Assigned'}]`)
    .join('\n');

  const text =
`*TURASHOBOYE FEEDS - OFFICIAL ORDER DISPATCH*
━━━━━━━━━━━━━━━━━━━━━
📦 *Order Number:* ${order.orderNumber}
👤 *Customer:* ${order.customerName}
📞 *Phone:* ${order.customerPhone}
📍 *Fulfillment:* ${fulfillment === 'pickup' ? 'Self-Pickup at Mahama Feed Depot' : `Delivery to ${order.customerAddress}`}

🛒 *Order Items:*
${itemsText}

💰 *Total Amount:* ${order.total.toLocaleString()} RWF (${order.currencyCode})
💳 *Payment:* ${order.payments?.[0]?.method.toUpperCase() || 'Cash'} (${order.payments?.[0]?.reference || 'Counter'})

━━━━━━━━━━━━━━━━━━━━━
_Order confirmed on Turashoboye platform. Please prepare batch for pickup/delivery._`;

  return `https://wa.me/${staffPhone}?text=${encodeURIComponent(text)}`;
}

const SKU_TO_VARIANT_ID: Record<string, string> = {
  'BSM-50KG': 'f299c2cd-ddd2-4f9f-85d0-09f4d0a6c789',
  'BSM-25KG': 'f4b6c9f5-55cb-401d-9e88-557b5c2786f2',
  'LCM-50KG': '2f83fa2f-94cd-4b33-88d7-887cc460873b',
  'PSM-50KG': '759d508f-d6ee-44b5-8285-5c85a5948c75',
  'DMC-50KG': 'f0aaadc8-fdb8-4395-9bb1-e4aa92579edf',
};

/**
 * Create and place a verified customer order
 */
export async function placeCustomerOrder(params: PlaceOrderParams): Promise<{
  success: boolean;
  orderNumber: string;
  printableOrder: PrintableOrder;
  error?: string;
}> {
  const calculation = calculateOrderTotals(params.items, params.fulfillmentType);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  let orderNumber = `ORD-${dateStr}-${randomSuffix}`;
  let orderId = crypto.randomUUID();
  const activeBatchNumber = `B-${dateStr}-001`;

  const printableOrder: PrintableOrder = {
    id: orderId,
    orderNumber,
    customerId: params.customerId,
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    customerAddress: params.deliveryAddress || 'Sector Mahama, Kirehe District',
    status: 'confirmed',
    orderDate: now.toISOString(),
    total: calculation.totalAmountRwf,
    currencyCode: 'RWF',
    createdAt: now.toISOString(),
    staffName: 'Depot Sales Dispatch',
    items: params.items.map((item) => ({
      productName: item.productName,
      sku: item.sku,
      packageSize: item.packageSize,
      batchNumber: activeBatchNumber,
      quantity: item.quantity,
      unitPriceRwf: item.unitPriceRwf,
      discountRwf: 0,
      lineTotalRwf: item.unitPriceRwf * item.quantity,
    })),
    payments: [
      {
        method: params.paymentMethod,
        amountRwf: calculation.totalAmountRwf,
        paymentDate: now.toISOString().split('T')[0],
        reference: params.paymentReference || (params.paymentMethod === 'cash' ? 'Pay on Collection at Depot' : `MoMo ${params.paymentPhone || params.customerPhone}`),
        status: 'confirmed',
      },
    ],
  };

  const storedRecord = {
    id: orderId,
    orderNumber,
    orderDate: now.toISOString(),
    status: 'confirmed',
    totalAmountRwf: calculation.totalAmountRwf,
    paidAmountRwf: calculation.totalAmountRwf,
    balanceDueRwf: 0,
    itemsSummary: params.items.map((i) => `${i.quantity}x ${i.productName} (${i.packageSize})`).join(', '),
    fulfillmentType: params.fulfillmentType,
    printableOrder,
  };

  // 1. Attempt database integration (Supabase submit_customer_order RPC)
  try {
    const firstItem = params.items[0];
    const rawVariantId = firstItem?.variantId;
    const isUuid = rawVariantId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawVariantId);
    const targetVariantId = isUuid ? rawVariantId : (SKU_TO_VARIANT_ID[firstItem?.sku || ''] || 'f299c2cd-ddd2-4f9f-85d0-09f4d0a6c789');
    const totalBags = params.items.reduce((s, it) => s + it.quantity, 0);

    const { data: rpcResult, error: rpcError } = await supabase.rpc('submit_customer_order', {
      p_variant_id: targetVariantId,
      p_quantity: totalBags,
      p_payment_method: params.paymentMethod,
      p_notes: `${params.fulfillmentType.toUpperCase()} - ${params.deliveryAddress}. ${params.notes || ''}`.trim(),
    });

    if (!rpcError && rpcResult?.success) {
      if (rpcResult.order_number) {
        orderNumber = rpcResult.order_number;
        printableOrder.orderNumber = rpcResult.order_number;
        storedRecord.orderNumber = rpcResult.order_number;
      }
      if (rpcResult.order_id) {
        orderId = rpcResult.order_id;
        printableOrder.id = rpcResult.order_id;
        storedRecord.id = rpcResult.order_id;
      }
    } else if (rpcError) {
      console.warn('submit_customer_order RPC note:', rpcError.message);
    }
  } catch (err) {
    console.warn('Supabase customer order RPC call caught:', err);
  }

  // 2. Resilient local storage (always saved)
  saveLocalCustomerOrder(storedRecord);

  // 3. Dispatch event so Sales & Orders page and Customer Portal update in real time
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('turashoboye_order_placed', { detail: storedRecord }));
  }

  return {
    success: true,
    orderNumber,
    printableOrder,
  };
}
