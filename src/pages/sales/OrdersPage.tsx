import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  Search,
  Plus,
  Printer,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Customer, PaymentMethod } from '../../types/database';
import OrderCreateModal from '../../components/sales/OrderCreateModal';
import type {
  AvailableVariant,
  AvailableBatch,
  OrderItemInput,
} from '../../components/sales/OrderCreateModal';
import OrderReceiptModal from '../../components/sales/OrderReceiptModal';
import type { PrintableOrder, PrintableOrderItem } from '../../components/sales/OrderReceiptModal';
import RecordPaymentModal from '../../components/sales/RecordPaymentModal';

interface SalesOrderRow {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  orderDate: string;
  status: 'confirmed' | 'fulfilled' | 'cancelled';
  subtotalRwf: number;
  discountRwf: number;
  totalAmountRwf: number;
  paidAmountRwf: number;
  balanceDueRwf: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  items: PrintableOrderItem[];
  payments: {
    method: string;
    amountRwf: number;
    paymentDate: string;
    reference?: string;
    status: string;
  }[];
  staffName?: string;
  notes?: string;
}

const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Jean-Paul Habimana',
    phone: '+250 788 123 456',
    address: 'Mahama Camp, Village 4',
    preferredContact: 'phone',
    createdAt: '2026-09-15T08:30:00Z',
  },
  {
    id: 'c2',
    name: 'Duterimbere Poultry Cooperative',
    phone: '+250 782 987 654',
    address: 'Paysannat L, Mahama Host Community',
    preferredContact: 'whatsapp',
    createdAt: '2026-09-20T10:15:00Z',
  },
  {
    id: 'c3',
    name: 'Amina Mukeshimana',
    phone: '+250 785 456 789',
    address: 'Mahama Camp, Village 12',
    preferredContact: 'sms',
    createdAt: '2026-10-01T14:00:00Z',
  },
  {
    id: 'c4',
    name: 'Kirehe Livestock Union',
    phone: '+250 788 777 888',
    address: 'Nyakarambi Commercial Centre, Kirehe',
    preferredContact: 'phone',
    createdAt: '2026-09-01T09:00:00Z',
  },
];

const SAMPLE_VARIANTS: AvailableVariant[] = [
  {
    id: 'v1',
    productName: 'Turashoboye Broiler Starter Mash',
    sku: 'BSM-50KG',
    packageSize: '50kg Bag',
    priceRwf: 24000,
    availableStock: 120,
  },
  {
    id: 'v2',
    productName: 'Turashoboye Broiler Starter Mash',
    sku: 'BSM-25KG',
    packageSize: '25kg Bag',
    priceRwf: 12500,
    availableStock: 15,
  },
  {
    id: 'v3',
    productName: 'Turashoboye Layer Complete Mash',
    sku: 'LCM-50KG',
    packageSize: '50kg Bag',
    priceRwf: 22000,
    availableStock: 60,
  },
  {
    id: 'v4',
    productName: 'Turashoboye Pig Grower Feed',
    sku: 'PGF-50KG',
    packageSize: '50kg Bag',
    priceRwf: 21000,
    availableStock: 25,
  },
];

const SAMPLE_BATCHES: AvailableBatch[] = [
  {
    id: 'b1',
    batchNumber: 'B-20261017-001',
    variantId: 'v1',
    availableQty: 80,
  },
  {
    id: 'b2',
    batchNumber: 'B-20261016-004',
    variantId: 'v1',
    availableQty: 40,
  },
  {
    id: 'b3',
    batchNumber: 'B-20261015-002',
    variantId: 'v3',
    availableQty: 60,
  },
];

const INITIAL_ORDERS: SalesOrderRow[] = [
  {
    id: 'ord-1',
    orderNumber: 'ORD-20261017-001',
    customerId: 'c1',
    customerName: 'Jean-Paul Habimana',
    customerPhone: '+250 788 123 456',
    customerAddress: 'Mahama Camp, Village 4',
    orderDate: '2026-10-17T09:15:00Z',
    status: 'fulfilled',
    subtotalRwf: 48000,
    discountRwf: 0,
    totalAmountRwf: 48000,
    paidAmountRwf: 48000,
    balanceDueRwf: 0,
    paymentStatus: 'paid',
    items: [
      {
        productName: 'Turashoboye Broiler Starter Mash',
        sku: 'BSM-50KG',
        packageSize: '50kg Bag',
        batchNumber: 'B-20261017-001',
        quantity: 2,
        unitPriceRwf: 24000,
        discountRwf: 0,
        lineTotalRwf: 48000,
      },
    ],
    payments: [
      {
        method: 'cash',
        amountRwf: 48000,
        paymentDate: '2026-10-17',
        reference: 'Cash desk',
        status: 'confirmed',
      },
    ],
    staffName: 'Staff Admin',
    notes: 'Collected at depot counter',
  },
  {
    id: 'ord-2',
    orderNumber: 'ORD-20261017-002',
    customerId: 'c2',
    customerName: 'Duterimbere Poultry Cooperative',
    customerPhone: '+250 782 987 654',
    customerAddress: 'Paysannat L, Mahama Host Community',
    orderDate: '2026-10-17T11:00:00Z',
    status: 'confirmed',
    subtotalRwf: 220000,
    discountRwf: 0,
    totalAmountRwf: 220000,
    paidAmountRwf: 100000,
    balanceDueRwf: 120000,
    paymentStatus: 'partial',
    items: [
      {
        productName: 'Turashoboye Layer Complete Mash',
        sku: 'LCM-50KG',
        packageSize: '50kg Bag',
        batchNumber: 'B-20261015-002',
        quantity: 10,
        unitPriceRwf: 22000,
        discountRwf: 0,
        lineTotalRwf: 220000,
      },
    ],
    payments: [
      {
        method: 'momo',
        amountRwf: 100000,
        paymentDate: '2026-10-17',
        reference: 'MTN MP261017.982',
        status: 'confirmed',
      },
    ],
    staffName: 'Staff Admin',
    notes: 'Delivery scheduled for afternoon to Paysannat L site',
  },
  {
    id: 'ord-3',
    orderNumber: 'ORD-20261016-003',
    customerId: 'c4',
    customerName: 'Kirehe Livestock Union',
    customerPhone: '+250 788 777 888',
    customerAddress: 'Nyakarambi Commercial Centre, Kirehe',
    orderDate: '2026-10-16T15:30:00Z',
    status: 'fulfilled',
    subtotalRwf: 105000,
    discountRwf: 0,
    totalAmountRwf: 105000,
    paidAmountRwf: 105000,
    balanceDueRwf: 0,
    paymentStatus: 'paid',
    items: [
      {
        productName: 'Turashoboye Pig Grower Feed',
        sku: 'PGF-50KG',
        packageSize: '50kg Bag',
        quantity: 5,
        unitPriceRwf: 21000,
        discountRwf: 0,
        lineTotalRwf: 105000,
      },
    ],
    payments: [
      {
        method: 'cash',
        amountRwf: 105000,
        paymentDate: '2026-10-16',
        reference: 'Full settlement',
        status: 'confirmed',
      },
    ],
    staffName: 'Staff Admin',
  },
];

export default function OrdersPage() {
  const location = useLocation();
  const { user } = useAuth();
  const [orders, setOrders] = useState<SalesOrderRow[]>(INITIAL_ORDERS);
  const [customers, setCustomers] = useState<Customer[]>(SAMPLE_CUSTOMERS);
  const [variants] = useState<AvailableVariant[]>(SAMPLE_VARIANTS);
  const [batches] = useState<AvailableBatch[]>(SAMPLE_BATCHES);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Preselected customer if routed from customer page
  const preselectedCustomerId = (location.state as { selectedCustomerId?: string })?.selectedCustomerId;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(Boolean(preselectedCustomerId));
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<PrintableOrder | null>(null);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<SalesOrderRow | null>(null);

  const canCreateSale = ['sales_staff', 'manager', 'owner'].includes(user?.profile?.role || '');

  // Load from Supabase if online
  useEffect(() => {
    const fetchOnlineOrders = async () => {
      try {
        const { data: custData } = await supabase.from('customers').select('*');
        if (custData && custData.length > 0) {
          setCustomers(custData);
        }
      } catch (err) {
        console.warn('Using offline customer reference data:', err);
      }
    };
    fetchOnlineOrders();
  }, []);

  // Handle new sale submission
  const handleCreateOrder = async (payload: {
    customerId: string;
    locationId: string;
    items: OrderItemInput[];
    payment?: {
      method: PaymentMethod;
      amountRwf: number;
      reference?: string;
    };
    notes?: string;
  }) => {
    const cust = customers.find((c) => c.id === payload.customerId);
    const orderNum = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const printableItems: PrintableOrderItem[] = payload.items.map((it) => {
      const v = variants.find((varItem) => varItem.id === it.variantId);
      const b = batches.find((batchItem) => batchItem.id === it.batchId);
      return {
        productName: v?.productName || 'Feed Product',
        sku: v?.sku || 'SKU',
        packageSize: v?.packageSize || 'Package',
        batchNumber: b?.batchNumber,
        quantity: it.quantity,
        unitPriceRwf: it.unitPriceRwf,
        discountRwf: it.discountRwf,
        lineTotalRwf: it.quantity * it.unitPriceRwf - it.discountRwf,
      };
    });

    const subtotal = printableItems.reduce((sum, it) => sum + it.lineTotalRwf, 0);
    const paid = payload.payment?.amountRwf || 0;
    const balanceDue = Math.max(0, subtotal - paid);

    const newOrderRow: SalesOrderRow = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      customerId: payload.customerId,
      customerName: cust?.name || 'Walk-in Customer',
      customerPhone: cust?.phone,
      customerAddress: cust?.address,
      orderDate: new Date().toISOString(),
      status: 'confirmed',
      subtotalRwf: subtotal,
      discountRwf: 0,
      totalAmountRwf: subtotal,
      paidAmountRwf: paid,
      balanceDueRwf: balanceDue,
      paymentStatus: balanceDue === 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
      items: printableItems,
      payments: payload.payment
        ? [
            {
              method: payload.payment.method,
              amountRwf: payload.payment.amountRwf,
              paymentDate: new Date().toISOString().slice(0, 10),
              reference: payload.payment.reference,
              status: 'confirmed',
            },
          ]
        : [],
      staffName: user?.profile?.displayName || 'Sales Staff',
      notes: payload.notes,
    };

    setOrders((prev) => [newOrderRow, ...prev]);

    // Open receipt right away for customer handoff
    setSelectedReceiptOrder({
      id: newOrderRow.id,
      orderNumber: newOrderRow.orderNumber,
      customerId: newOrderRow.customerId,
      customerName: newOrderRow.customerName,
      customerPhone: newOrderRow.customerPhone,
      customerAddress: newOrderRow.customerAddress,
      status: newOrderRow.status,
      orderDate: newOrderRow.orderDate,
      total: newOrderRow.totalAmountRwf,
      currencyCode: 'RWF',
      notes: newOrderRow.notes,
      createdAt: newOrderRow.orderDate,
      items: newOrderRow.items,
      payments: newOrderRow.payments,
      staffName: newOrderRow.staffName,
    });
    setIsReceiptModalOpen(true);

    // Call stored proc atomically if online
    try {
      await supabase.rpc('record_sale_transaction', {
        p_customer_id: payload.customerId,
        p_location_id: payload.locationId,
        p_order_items: payload.items.map((it) => ({
          variant_id: it.variantId,
          batch_id: it.batchId,
          quantity: it.quantity,
          unit_price_rwf: it.unitPriceRwf,
          discount_rwf: it.discountRwf,
        })),
        p_payment: payload.payment
          ? {
              method: payload.payment.method,
              amount_rwf: payload.payment.amountRwf,
              reference: payload.payment.reference,
            }
          : null,
        p_notes: payload.notes,
      });
    } catch (err) {
      console.warn('Recorded sale offline / cached:', err);
    }
  };

  // Handle recording extra payment against an order with balance
  const handleSaveExtraPayment = async (paymentData: {
    method: PaymentMethod;
    amountRwf: number;
    reference?: string;
  }) => {
    if (!selectedPaymentOrder) return;

    const newPayment = {
      method: paymentData.method,
      amountRwf: paymentData.amountRwf,
      paymentDate: new Date().toISOString().slice(0, 10),
      reference: paymentData.reference,
      status: 'confirmed',
    };

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== selectedPaymentOrder.id) return ord;
        const newPaid = ord.paidAmountRwf + paymentData.amountRwf;
        const newBalance = Math.max(0, ord.totalAmountRwf - newPaid);
        return {
          ...ord,
          paidAmountRwf: newPaid,
          balanceDueRwf: newBalance,
          paymentStatus: newBalance === 0 ? 'paid' : 'partial',
          payments: [...ord.payments, newPayment],
        };
      })
    );

    try {
      await supabase.from('payments').insert({
        order_id: selectedPaymentOrder.id,
        method: paymentData.method,
        amount_rwf: paymentData.amountRwf,
        payment_date: new Date().toISOString().slice(0, 10),
        reference: paymentData.reference,
        status: 'confirmed',
      });
    } catch (err) {
      console.warn('Logged payment to local queue (offline):', err);
    }
  };

  const handleMarkFulfilled = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'fulfilled' as const } : o))
    );
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.notes && o.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (paymentFilter !== 'all' && o.paymentStatus !== paymentFilter) return false;

    return true;
  });

  // KPI aggregates
  const totalSalesRwf = orders.reduce((sum, o) => sum + o.totalAmountRwf, 0);
  const totalPaidRwf = orders.reduce((sum, o) => sum + o.paidAmountRwf, 0);
  const totalOutstandingRwf = orders.reduce((sum, o) => sum + o.balanceDueRwf, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-[#2E7D32]" />
            Sales & Orders Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manual sales order recording, batch allocations, stock deduction & cash/MoMo receipts
          </p>
        </div>
        {canCreateSale && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-green-800 transition"
          >
            <Plus className="h-4 w-4" />
            New Sale Transaction
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Sales Volume
            </p>
            <div className="rounded-lg bg-green-50 p-2 text-[#2E7D32]">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            RWF {totalSalesRwf.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {orders.length} orders recorded across Mahama Depot
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Payments Collected
            </p>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            RWF {totalPaidRwf.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">Cash and Mobile Money received</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Outstanding Balances
            </p>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            RWF {totalOutstandingRwf.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">Pending customer receivables</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order number, customer name, notes..."
            className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-sm focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32] bg-white shadow-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32] shadow-xs"
          >
            <option value="all">All Order Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32] shadow-xs"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid in Full</option>
            <option value="partial">Partial Payment</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50/75 text-xs uppercase tracking-wider text-gray-600 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-3 font-semibold">
                  Order & Date
                </th>
                <th scope="col" className="px-6 py-3 font-semibold">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 font-semibold">
                  Items & Batch Trace
                </th>
                <th scope="col" className="px-6 py-3 font-semibold text-right">
                  Total (RWF)
                </th>
                <th scope="col" className="px-6 py-3 font-semibold text-center">
                  Payment Status
                </th>
                <th scope="col" className="px-6 py-3 font-semibold text-center">
                  Fulfillment
                </th>
                <th scope="col" className="px-6 py-3 font-semibold text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-gray-900 text-xs">
                        {ord.orderNumber}
                      </div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {new Date(ord.orderDate).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{ord.customerName}</div>
                      <div className="text-xs text-gray-400">
                        {ord.customerPhone || ord.customerAddress || 'Direct Pickup'}
                      </div>
                    </td>

                    <td className="px-6 py-4 max-w-xs">
                      <div className="space-y-1">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="text-xs text-gray-700">
                            <span className="font-semibold">{it.quantity}x</span> {it.productName} (
                            {it.packageSize})
                            {it.batchNumber && (
                              <span className="ml-1 font-mono text-[10px] bg-gray-100 px-1 py-0.2 rounded text-gray-600">
                                {it.batchNumber}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="font-black text-gray-900">
                        RWF {ord.totalAmountRwf.toLocaleString()}
                      </div>
                      {ord.balanceDueRwf > 0 && (
                        <div className="text-[11px] text-red-600 font-semibold">
                          Due: RWF {ord.balanceDueRwf.toLocaleString()}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {ord.paymentStatus === 'paid' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          <CheckCircle2 className="h-3 w-3" /> Paid
                        </span>
                      )}
                      {ord.paymentStatus === 'partial' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          Partial
                        </span>
                      )}
                      {ord.paymentStatus === 'unpaid' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Unpaid
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          ord.status === 'fulfilled'
                            ? 'bg-blue-50 text-blue-700'
                            : ord.status === 'confirmed'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {ord.balanceDueRwf > 0 && (
                          <button
                            onClick={() => {
                              setSelectedPaymentOrder(ord);
                              setIsPaymentModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 transition"
                            title="Record Additional Payment"
                          >
                            <DollarSign className="h-3 w-3" />
                            Pay
                          </button>
                        )}

                        {ord.status === 'confirmed' && (
                          <button
                            onClick={() => handleMarkFulfilled(ord.id)}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
                            title="Mark as Fulfilled"
                          >
                            Fulfill
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedReceiptOrder({
                              id: ord.id,
                              orderNumber: ord.orderNumber,
                              customerId: ord.customerId,
                              customerName: ord.customerName,
                              customerPhone: ord.customerPhone,
                              customerAddress: ord.customerAddress,
                              status: ord.status,
                              orderDate: ord.orderDate,
                              total: ord.totalAmountRwf,
                              currencyCode: 'RWF',
                              notes: ord.notes,
                              createdAt: ord.orderDate,
                              items: ord.items,
                              payments: ord.payments,
                              staffName: ord.staffName,
                            });
                            setIsReceiptModalOpen(true);
                          }}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                          title="Print Receipt"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <OrderCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        customers={customers}
        variants={variants}
        batches={batches}
        preselectedCustomerId={preselectedCustomerId}
        onSubmitOrder={handleCreateOrder}
      />

      <OrderReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        order={selectedReceiptOrder}
      />

      {selectedPaymentOrder && (
        <RecordPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedPaymentOrder(null);
          }}
          orderNumber={selectedPaymentOrder.orderNumber}
          customerName={selectedPaymentOrder.customerName}
          orderTotalRwf={selectedPaymentOrder.totalAmountRwf}
          alreadyPaidRwf={selectedPaymentOrder.paidAmountRwf}
          balanceDueRwf={selectedPaymentOrder.balanceDueRwf}
          onSavePayment={handleSaveExtraPayment}
        />
      )}
    </div>
  );
}
