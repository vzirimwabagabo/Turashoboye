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
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import OrderReceiptModal from '../../components/sales/OrderReceiptModal';
import type { PrintableOrder } from '../../components/sales/OrderReceiptModal';
import OrderPlacementModal from '../../components/sales/OrderPlacementModal';
import type { FeedOrderTarget } from '../../components/sales/OrderPlacementModal';
import { getLocalCustomerOrders } from '../../lib/orderService';

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

interface AvailableFeed {
  id: string;
  name: string;
  category: string;
  tag: string;
  bagSize: string;
  priceRwf: number;
  image: string;
  description: string;
}

export default function CustomerPortalPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [availableFeeds, setAvailableFeeds] = useState<AvailableFeed[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<PrintableOrder | null>(null);

  // New OrderPlacementModal state
  const [orderTarget, setOrderTarget] = useState<FeedOrderTarget | null>(null);
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
  const isPending = user?.profile?.status === 'pending' && !['super_admin', 'owner', 'manager'].includes(user?.profile?.role || '');

  const customerName =
    user?.profile?.displayName ||
    (isSuperAdminReal ? 'Super Administrator' : user?.email?.split('@')[0]) ||
    'Customer';

  useEffect(() => {
    window.scrollTo(0, 0);

    // Fetch published products from Supabase
    const fetchFeeds = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            target_animal,
            description,
            categories(name),
            product_variants(id, sku, package_size, price_rwf, is_active),
            product_images(image_url, is_primary)
          `)
          .eq('published', true);

        if (!error && data && data.length > 0) {
          const feeds: AvailableFeed[] = data.flatMap((p: any) => {
            const primaryImg = p.product_images?.find((img: any) => img.is_primary) || p.product_images?.[0];
            const activeVariants = (p.product_variants || []).filter((v: any) => v.is_active);
            if (activeVariants.length === 0) return [];
            const mainVariant = activeVariants[0];
            return [{
              id: mainVariant.id,
              name: p.name,
              category: p.categories?.name || 'Animal Feed',
              tag: (p.target_animal || 'Feed').split(' ')[0],
              bagSize: mainVariant.package_size,
              priceRwf: mainVariant.price_rwf,
              image: primaryImg?.image_url || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
              description: p.description || 'Quality feed formulated for your livestock.',
            }];
          });
          setAvailableFeeds(feeds);
        }
      } catch (err) {
        console.warn('Could not load feeds from catalogue:', err);
      }
    };

    fetchFeeds();

    const syncOrders = () => {
      const local = getLocalCustomerOrders();
      if (local && local.length > 0) {
        const mappedLocal: CustomerOrder[] = local.map((loc: any) => ({
          id: loc.id,
          orderNumber: loc.orderNumber,
          orderDate: loc.orderDate,
          status: loc.status || 'confirmed',
          totalAmountRwf: loc.totalAmountRwf,
          paidAmountRwf: loc.paidAmountRwf || loc.totalAmountRwf,
          balanceDueRwf: loc.balanceDueRwf || 0,
          itemsSummary: loc.itemsSummary || (loc.printableOrder?.items || []).map((i: any) => `${i.quantity}x ${i.productName}`).join(', '),
          printableOrder: loc.printableOrder,
        }));

        setOrders((prev) => {
          const localNums = new Set(mappedLocal.map((l) => l.orderNumber));
          const uniquePrev = prev.filter((p) => !localNums.has(p.orderNumber));
          return [...mappedLocal, ...uniquePrev];
        });
      }
    };

    syncOrders();

    const handleOrderPlaced = () => {
      syncOrders();
    };
    window.addEventListener('turashoboye_order_placed', handleOrderPlaced);
    window.addEventListener('storage', handleOrderPlaced);

    return () => {
      window.removeEventListener('turashoboye_order_placed', handleOrderPlaced);
      window.removeEventListener('storage', handleOrderPlaced);
    };
  }, []);

  const handleOpenOrder = (feed: AvailableFeed) => {
    const target: FeedOrderTarget = {
      id: feed.id,
      name: feed.name,
      sku: feed.tag.toUpperCase() + '-50KG',
      package_size: feed.bagSize,
      price_rwf: feed.priceRwf,
      image_url: feed.image,
      category: feed.category,
    };
    setOrderTarget(target);
  };

  const handleOrderCompleted = (order: PrintableOrder) => {
    const newCustomerOrder: CustomerOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      status: 'confirmed',
      totalAmountRwf: order.total,
      paidAmountRwf: order.total,
      balanceDueRwf: 0,
      itemsSummary: order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', '),
      printableOrder: order,
    };
    setOrders((prev) => [newCustomerOrder, ...prev]);
    setOrderNotice(`🎉 Order ${order.orderNumber} placed successfully!`);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
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

        {/* Pending Account Banner */}
        {isPending && (
          <div className="rounded-2xl bg-amber-50 border-2 border-amber-400 p-5 shadow-md flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
              <AlertTriangle size={24} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-extrabold text-amber-900">Account Awaiting Admin Approval</h3>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Your customer account has been registered successfully and is currently under review by the Turashoboye Feeds team.
                You will be notified once your account is approved and ordering is enabled.
                In the meantime, you can browse the full product catalogue.
              </p>
            </div>
            <a
              href="https://wa.me/250788000000?text=Hello%20Turashoboye%20Feeds,%20I%20just%20registered%20and%20need%20my%20account%20approved."
              target="_blank"
              rel="noreferrer"
              className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-2 transition"
            >
              <MessageSquare size={14} /> Contact Admin
            </a>
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
            {availableFeeds.length === 0 ? (
              <div className="col-span-4 py-8 text-center text-gray-400 text-sm">
                No feeds currently available for ordering.
              </div>
            ) : (
              availableFeeds.map((feed) => (
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
                      onClick={() => handleOpenOrder(feed)}
                      disabled={isPending}
                      title={isPending ? 'Account awaiting approval — ordering not yet enabled' : 'Place order'}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-xs font-bold shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus size={13} />
                      Order
                    </button>
                  </div>
                </div>
              ))
            )}
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
            {orders.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No previous orders recorded yet. Place an order from the available feeds above to get started.
              </div>
            ) : (
              orders.map((order) => (
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
              ))
            )}
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

      {/* Order Placement Modal */}
      <OrderPlacementModal
        feed={orderTarget}
        isOpen={Boolean(orderTarget)}
        onClose={() => setOrderTarget(null)}
        onOrderCompleted={handleOrderCompleted}
      />

      {/* Official Receipt Modal */}
      <OrderReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        order={selectedReceipt}
      />
    </div>
  );
}
