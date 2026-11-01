import { supabase } from './supabase';
import type { PrintableOrder } from '../components/sales/OrderReceiptModal';

export interface OrderItemInput {
  productId: string;
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
  const orderNumber = `ORD-${dateStr}-${randomSuffix}`;
  const orderId = crypto.randomUUID();
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

  // 1. Resilient local storage
  saveLocalCustomerOrder(storedRecord);

  // 2. Database integration (Supabase)
  try {
    await supabase.from('sales_orders').insert({
      id: orderId,
      order_number: orderNumber,
      customer_id: params.customerId.startsWith('p-') || params.customerId.length !== 36 ? undefined : params.customerId,
      status: 'confirmed',
      order_date: now.toISOString().split('T')[0],
      subtotal_rwf: calculation.subtotalRwf,
      discount_rwf: calculation.discountRwf,
      total_amount_rwf: calculation.totalAmountRwf,
      currency_code: 'RWF',
      notes: `${params.fulfillmentType.toUpperCase()} - ${params.deliveryAddress}. ${params.notes || ''}`.trim(),
    });
  } catch (err) {
    console.warn('Supabase sales_orders insert note (saved to resilient local store):', err);
  }

  return {
    success: true,
    orderNumber,
    printableOrder,
  };
}
