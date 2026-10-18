import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Phone,
  MessageSquare,
  Printer,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import OrderReceiptModal from '../../components/sales/OrderReceiptModal';
import type { PrintableOrder } from '../../components/sales/OrderReceiptModal';

interface CustomerOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: 'confirmed' | 'fulfilled' | 'cancelled';
  totalAmountRwf: number;
  paidAmountRwf: number;
  balanceDueRwf: number;
  itemsSummary: string;
  printableOrder: PrintableOrder;
}

const SAMPLE_CUSTOMER_ORDERS: CustomerOrder[] = [
  {
    id: 'ord-c1',
    orderNumber: 'ORD-20261017-001',
    orderDate: '2026-10-17T09:15:00Z',
    status: 'fulfilled',
    totalAmountRwf: 48000,
    paidAmountRwf: 48000,
    balanceDueRwf: 0,
    itemsSummary: '2x Turashoboye Broiler Starter Mash (50kg Bag) [Batch: B-20261017-001]',
    printableOrder: {
      id: 'ord-c1',
      orderNumber: 'ORD-20261017-001',
      customerId: 'c1',
      customerName: 'Jean-Paul Habimana',
      customerPhone: '+250 788 123 456',
      customerAddress: 'Mahama Camp, Village 4',
      status: 'fulfilled',
      orderDate: '2026-10-17T09:15:00Z',
      total: 48000,
      currencyCode: 'RWF',
      createdAt: '2026-10-17T09:15:00Z',
      staffName: 'Sales Staff',
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
          reference: 'Cash at counter',
          status: 'confirmed',
        },
      ],
    },
  },
  {
    id: 'ord-c2',
    orderNumber: 'ORD-20261008-005',
    orderDate: '2026-10-08T14:20:00Z',
    status: 'fulfilled',
    totalAmountRwf: 24000,
    paidAmountRwf: 24000,
    balanceDueRwf: 0,
    itemsSummary: '1x Turashoboye Broiler Starter Mash (50kg Bag) [Batch: B-20261007-002]',
    printableOrder: {
      id: 'ord-c2',
      orderNumber: 'ORD-20261008-005',
      customerId: 'c1',
      customerName: 'Jean-Paul Habimana',
      customerPhone: '+250 788 123 456',
      customerAddress: 'Mahama Camp, Village 4',
      status: 'fulfilled',
      orderDate: '2026-10-08T14:20:00Z',
      total: 24000,
      currencyCode: 'RWF',
      createdAt: '2026-10-08T14:20:00Z',
      staffName: 'Sales Staff',
      items: [
        {
          productName: 'Turashoboye Broiler Starter Mash',
          sku: 'BSM-50KG',
          packageSize: '50kg Bag',
          batchNumber: 'B-20261007-002',
          quantity: 1,
          unitPriceRwf: 24000,
          discountRwf: 0,
          lineTotalRwf: 24000,
        },
      ],
      payments: [
        {
          method: 'momo',
          amountRwf: 24000,
          paymentDate: '2026-10-08',
          reference: 'MTN MP261008.112',
          status: 'confirmed',
        },
      ],
    },
  },
];

export default function CustomerPortalPage() {
  const { user } = useAuth();
  const [orders] = useState<CustomerOrder[]>(SAMPLE_CUSTOMER_ORDERS);
  const [selectedReceipt, setSelectedReceipt] = useState<PrintableOrder | null>(null);

  // Simple feed calculator state for farmers
  const [birdCount, setBirdCount] = useState<number>(200);
  const [feedType, setFeedType] = useState<'broiler' | 'layer'>('broiler');

  // Calculation: Broiler approx 4.5kg total feed to market weight (approx 1 bag of 50kg per 11 broilers)
  const estimatedBagsNeeded = Math.ceil(
    feedType === 'broiler' ? (birdCount * 4.5) / 50 : (birdCount * 0.12 * 30) / 50
  );

  const customerName = user?.profile?.displayName || user?.email?.split('@')[0] || 'Farmer';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="rounded-2xl bg-gradient-to-r from-[#2E7D32] to-[#1B5E20] text-white p-6 sm:p-8 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white mb-2">
                <MapPin className="h-3.5 w-3.5" /> Mahama Camp Customer Account
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Welcome back, {customerName}!
              </h1>
              <p className="mt-1 text-sm text-green-100 max-w-xl">
                Track your animal feed orders, view official batch receipts, and request fresh feeds directly from the Mahama Depot.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
              <Link
                to="/catalogue"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#2E7D32] hover:bg-green-50 shadow-xs transition"
              >
                <ShoppingBag className="h-4 w-4" />
                Browse Feed Catalogue
              </Link>
              <a
                href="https://wa.me/250788000000?text=Hello%20Turashoboye%20Feeds,%20I%20would%20like%20to%20order%20feed."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-800/80 px-4 py-2.5 text-xs font-bold text-white hover:bg-green-900 shadow-xs transition"
              >
                <MessageSquare className="h-4 w-4" />
                WhatsApp Order Desk
              </a>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Total Feed Ordered
            </span>
            <span className="text-2xl font-black text-gray-900 mt-1 block">3 Bags (150 kg)</span>
            <span className="text-xs text-gray-400 mt-0.5 block">Broiler Starter Mash</span>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Lifetime Spend
            </span>
            <span className="text-2xl font-bold text-[#2E7D32] mt-1 block">RWF 72,000</span>
            <span className="text-xs text-gray-400 mt-0.5 block">Fully settled via Cash & MoMo</span>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Account Balance
            </span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">RWF 0 Due</span>
            <span className="text-xs text-green-700 font-semibold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Account in good standing
            </span>
          </div>
        </div>

        {/* Feed History Section */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-[#2E7D32]" />
              <h2 className="text-base font-bold text-gray-900">Your Feed Purchase History</h2>
            </div>
            <span className="text-xs text-gray-400">{orders.length} completed orders</span>
          </div>

          <div className="divide-y divide-gray-100">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-gray-50/60 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-gray-900">
                      {order.orderNumber}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Fulfilled
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">{order.itemsSummary}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(order.orderDate).toLocaleDateString()}
                    </span>
                    <span>Depot: Mahama Primary Depot</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-base font-black text-gray-900 block">
                      RWF {order.totalAmountRwf.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-green-700 font-semibold block">
                      Paid in Full
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedReceipt(order.printableOrder)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-xs transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Receipt
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Farmer Feed Planning & Usage Estimator */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#2E7D32]" />
                Feed Planning & Bag Estimator
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Estimate how many 50kg bags you will need for your flock in Mahama Camp.
              </p>
            </div>
            <span className="rounded-md bg-green-50 px-2 py-1 text-[11px] font-bold text-[#2E7D32]">
              Farmer Tool
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Flock Type
              </label>
              <select
                value={feedType}
                onChange={(e) => setFeedType(e.target.value as 'broiler' | 'layer')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-[#2E7D32] focus:outline-none"
              >
                <option value="broiler">Broiler Chickens (Meat)</option>
                <option value="layer">Layer Chickens (Egg production)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Number of Birds
              </label>
              <input
                type="number"
                min={10}
                max={5000}
                value={birdCount}
                onChange={(e) => setBirdCount(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold focus:border-[#2E7D32] focus:outline-none"
              />
            </div>

            <div className="rounded-lg bg-green-50 p-4 border border-green-200 flex flex-col justify-center">
              <span className="text-[11px] font-semibold text-green-800 uppercase tracking-wider">
                Recommended Requirement
              </span>
              <span className="text-xl font-black text-[#2E7D32] mt-0.5">
                {estimatedBagsNeeded} Bags (50kg each)
              </span>
              <span className="text-[10px] text-green-700 mt-0.5">
                Approx {estimatedBagsNeeded * 50} kg feed yield
              </span>
            </div>
          </div>
        </div>

        {/* Direct Contact Support Box */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2 text-blue-700">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-950">Need assistance or delivery?</h3>
              <p className="text-xs text-blue-800">
                Contact the Mahama Depot team directly via phone or WhatsApp: +250 788 000 000
              </p>
            </div>
          </div>

          <a
            href="tel:+250788000000"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 shadow-xs transition"
          >
            Call Depot Sales Desk
          </a>
        </div>
      </div>

      {/* Official Receipt Modal */}
      <OrderReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        order={selectedReceipt}
      />
    </div>
  );
}
