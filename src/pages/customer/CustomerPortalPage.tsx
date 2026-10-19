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
  Plus,
  X,
  Sparkles,
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

const AVAILABLE_FEEDS = [
  {
    id: 'feed-01',
    name: 'Turashoboye Broiler Starter Mash',
    category: 'Poultry Feed',
    tag: 'Broiler',
    bagSize: '50kg Bag',
    priceRwf: 24000,
    image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
    description: 'High-protein initial ration with crude protein ≥20% for rapid chick weight gain in Kirehe.',
  },
  {
    id: 'feed-02',
    name: 'Turashoboye Layer Complete Mash',
    category: 'Poultry Feed',
    tag: 'Layer',
    bagSize: '50kg Bag',
    priceRwf: 22000,
    image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80',
    description: 'Calcium-fortified feed for egg-shell strength and sustained 80%+ laying rate.',
  },
  {
    id: 'feed-03',
    name: 'Turashoboye Pig Starter Mash',
    category: 'Swine Feed',
    tag: 'Pigs',
    bagSize: '50kg Bag',
    priceRwf: 21500,
    image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80',
    description: 'Digestible energy-dense formula formulated with amino acids for healthy piglet growth.',
  },
  {
    id: 'feed-04',
    name: 'Turashoboye Dairy Meal Concentrate',
    category: 'Cattle Feed',
    tag: 'Cattle',
    bagSize: '50kg Bag',
    priceRwf: 20000,
    image: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=600&q=80',
    description: 'Balanced protein concentrate supporting daily milk production in local and crossbred dairy cows.',
  },
];

const INITIAL_CUSTOMER_ORDERS: CustomerOrder[] = [
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
      staffName: 'Vedaste Zirimwabagabo',
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
      staffName: 'Vedaste Zirimwabagabo',
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
  const [orders, setOrders] = useState<CustomerOrder[]>(INITIAL_CUSTOMER_ORDERS);
  const [selectedReceipt, setSelectedReceipt] = useState<PrintableOrder | null>(null);

  // Quick Order Modal
  const [orderModalFeed, setOrderModalFeed] = useState<typeof AVAILABLE_FEEDS[0] | null>(null);
  const [quantity, setQuantity] = useState(2);
  const [orderNotice, setOrderNotice] = useState<string | null>(null);

  // Simple feed calculator state for farmers
  const [birdCount, setBirdCount] = useState<number>(200);
  const [feedType, setFeedType] = useState<'broiler' | 'layer'>('broiler');

  const estimatedBagsNeeded = Math.ceil(
    feedType === 'broiler' ? (birdCount * 4.5) / 50 : (birdCount * 0.12 * 30) / 50
  );

  const isSuperAdminReal = user?.profile?.role === 'super_admin';
  const isOwnerReal = user?.profile?.role === 'owner';
  const isManagerReal = user?.profile?.role === 'manager';

  const customerName =
    user?.profile?.displayName ||
    (isSuperAdminReal ? 'Super Administrator' : user?.email?.split('@')[0]) ||
    'Jean-Paul Habimana';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePlaceOrder = () => {
    if (!orderModalFeed) return;
    const totalAmount = orderModalFeed.priceRwf * quantity;
    const newOrdNum = `ORD-20261019-${String(orders.length + 1).padStart(3, '0')}`;
    const newOrder: CustomerOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: newOrdNum,
      orderDate: new Date().toISOString(),
      status: 'confirmed',
      totalAmountRwf: totalAmount,
      paidAmountRwf: totalAmount,
      balanceDueRwf: 0,
      itemsSummary: `${quantity}x ${orderModalFeed.name} (${orderModalFeed.bagSize})`,
      printableOrder: {
        id: `ord-${Date.now()}`,
        orderNumber: newOrdNum,
        customerId: user?.id || 'c-new',
        customerName: customerName,
        customerPhone: user?.phone || '+250 788 123 456',
        customerAddress: 'Mahama Camp, Village 4',
        status: 'confirmed',
        orderDate: new Date().toISOString(),
        total: totalAmount,
        currencyCode: 'RWF',
        createdAt: new Date().toISOString(),
        staffName: 'Depot Sales Counter',
        items: [
          {
            productName: orderModalFeed.name,
            sku: orderModalFeed.tag.toUpperCase(),
            packageSize: orderModalFeed.bagSize,
            batchNumber: 'B-20261019-001',
            quantity: quantity,
            unitPriceRwf: orderModalFeed.priceRwf,
            discountRwf: 0,
            lineTotalRwf: totalAmount,
          },
        ],
        payments: [
          {
            method: 'cash',
            amountRwf: totalAmount,
            paymentDate: new Date().toISOString().split('T')[0],
            reference: 'Pickup at Mahama Depot Counter',
            status: 'confirmed',
          },
        ],
      },
    };

    setOrders([newOrder, ...orders]);
    setOrderNotice(`🎉 Order ${newOrdNum} placed successfully for ${quantity} bags of ${orderModalFeed.name}!`);
    setOrderModalFeed(null);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Super Admin / Staff Notice if viewing portal directly */}
        {isSuperAdminReal && (
          <div className="rounded-3xl bg-gradient-to-r from-red-950 via-slate-900 to-purple-950 text-white p-5 border-2 border-red-500 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md animate-pulse">
                <Sparkles size={22} />
              </div>
              <div>
                <span className="font-black text-red-300 text-xs uppercase tracking-wider block">
                  🛡️ Super Administrator Console Available
                </span>
                <p className="text-sm font-bold text-white mt-0.5">
                  You are currently previewing the Customer / Farmer view. Your master command dashboard with platform graphs, user privileges, and governance controls is at <code className="bg-black/40 px-1.5 py-0.5 rounded text-red-200">/admin</code>.
                </p>
              </div>
            </div>
            <Link
              to="/admin"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-lg transition shrink-0"
            >
              Open Super Admin Dashboard →
            </Link>
          </div>
        )}

        {(isOwnerReal || isManagerReal) && (
          <div className="rounded-2xl bg-slate-900 text-white p-4 border border-slate-700 shadow-md flex items-center justify-between">
            <div className="text-xs">
              <span className="font-bold text-emerald-400 block">Staff Account Detected</span>
              <span className="text-gray-300">You are viewing the customer-facing portal. Return to your staff operations workspace.</span>
            </div>
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
            >
              Go to Dashboard →
            </Link>
          </div>
        )}

        {/* Welcome Header */}
        <div className="rounded-3xl bg-gradient-to-r from-[#2E7D32] via-emerald-800 to-[#1B5E20] text-white p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white mb-2">
                <MapPin className="h-3.5 w-3.5" />
                {isSuperAdminReal
                  ? 'Customer Portal (Super Admin Preview)'
                  : 'Mahama Farmer Account'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Welcome, {customerName}!
              </h1>
              <p className="mt-1 text-sm text-green-100 max-w-xl">
                Track your animal feed orders, request fresh batches directly from the Mahama Depot, and view official RSB-compliant receipts.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
              <Link
                to="/catalogue"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#2E7D32] hover:bg-green-50 shadow-xs transition"
              >
                <ShoppingBag className="h-4 w-4" />
                Full Feed Catalogue
              </Link>
              <a
                href="https://wa.me/250788000000?text=Hello%20Turashoboye%20Feeds,%20I%20would%20like%20to%20order%20feed."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-900/80 px-4 py-2.5 text-xs font-bold text-white hover:bg-green-950 shadow-xs transition border border-green-700/50"
              >
                <MessageSquare className="h-4 w-4" />
                WhatsApp Order Desk
              </a>
            </div>
          </div>
        </div>

        {orderNotice && (
          <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-sm font-bold flex items-center justify-between">
            <span>{orderNotice}</span>
            <button onClick={() => setOrderNotice(null)} className="text-emerald-700 hover:text-emerald-900 text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Total Feed Ordered
            </span>
            <span className="text-2xl font-black text-gray-900 mt-1 block">
              {orders.length * 2 + 1} Bags
            </span>
            <span className="text-xs text-gray-400 mt-0.5 block">Broiler, Layer & Swine mashes</span>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Total Spent (RWF)
            </span>
            <span className="text-2xl font-bold text-[#2E7D32] mt-1 block">
              RWF {orders.reduce((acc, curr) => acc + curr.totalAmountRwf, 0).toLocaleString()}
            </span>
            <span className="text-xs text-gray-400 mt-0.5 block">Settled via Cash & MoMo at Depot</span>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Account Status
            </span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">RWF 0 Due</span>
            <span className="text-xs text-green-700 font-semibold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> In Good Standing
            </span>
          </div>
        </div>

        {/* Available Feeds for Quick Ordering with Real Animal Photos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#2E7D32]" />
                Order Fresh Feeds for Your Livestock
              </h2>
              <p className="text-xs text-gray-500">
                Milled daily at our Mahama primary agro-processing unit.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AVAILABLE_FEEDS.map((feed) => (
              <div
                key={feed.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:border-[#2E7D32] hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="h-36 w-full overflow-hidden relative">
                    <img
                      src={feed.image}
                      alt={feed.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs">
                      {feed.tag}
                    </span>
                  </div>

                  <div className="p-4 space-y-1">
                    <h3 className="font-bold text-sm text-gray-900 leading-snug">{feed.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{feed.description}</p>
                    <span className="text-xs font-semibold text-gray-400 block pt-1">{feed.bagSize}</span>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-gray-100 flex items-center justify-between mt-2">
                  <span className="text-sm font-black text-[#2E7D32]">
                    RWF {feed.priceRwf.toLocaleString()}
                  </span>
                  <button
                    onClick={() => {
                      setOrderModalFeed(feed);
                      setQuantity(2);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-xs font-bold shadow-xs transition"
                  >
                    <Plus size={13} />
                    Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feed History Section */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-[#2E7D32]" />
              <h2 className="text-base font-bold text-gray-900">Your Feed Purchase History</h2>
            </div>
            <span className="text-xs text-gray-400">{orders.length} orders recorded</span>
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
                      {order.status === 'confirmed' ? 'Ready for Pickup' : 'Fulfilled'}
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

      {/* Place Order Modal */}
      {orderModalFeed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-gray-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-50 text-[#2E7D32] flex items-center justify-center">
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Confirm Feed Order</h3>
                  <p className="text-xs text-gray-500">Mahama Primary Depot pickup</p>
                </div>
              </div>
              <button
                onClick={() => setOrderModalFeed(null)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                <img
                  src={orderModalFeed.image}
                  alt={orderModalFeed.name}
                  className="w-14 h-14 rounded-xl object-cover"
                />
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{orderModalFeed.name}</h4>
                  <span className="text-gray-500 block">{orderModalFeed.bagSize}</span>
                  <span className="font-bold text-[#2E7D32] block">
                    RWF {orderModalFeed.priceRwf.toLocaleString()} per bag
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Number of Bags</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              <div className="p-4 bg-green-50 rounded-2xl border border-green-200 flex items-center justify-between">
                <div>
                  <span className="text-green-800 font-semibold block">Total Amount to Pay</span>
                  <span className="text-[11px] text-green-700">Payable via MoMo or Cash at Depot</span>
                </div>
                <span className="text-xl font-black text-[#2E7D32]">
                  RWF {(orderModalFeed.priceRwf * quantity).toLocaleString()}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOrderModalFeed(null)}
                  className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  className="px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white font-bold shadow-md transition"
                >
                  Place Order Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      <OrderReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        order={selectedReceipt}
      />
    </div>
  );
}
