import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  ShoppingBag,
  CheckCircle2,
  Truck,
  MapPin,
  Clock,
  ShieldCheck,
  Lock,
  MessageSquare,
  Sparkles,
  Printer,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  calculateOrderTotals,
  placeCustomerOrder,
  buildWhatsAppOrderConfirmationUrl,
  type OrderItemInput,
} from '../../lib/orderService';
import OrderReceiptModal, { type PrintableOrder } from './OrderReceiptModal';
import RwandanMoMoModal, { type MoMoPaymentResult } from './RwandanMoMoModal';

export interface FeedOrderTarget {
  id: string;
  name: string;
  sku: string;
  package_size: string;
  price_rwf: number;
  image_url?: string;
  category?: string;
  variants?: {
    id: string;
    sku: string;
    package_size: string;
    price_rwf: number;
  }[];
}

interface Props {
  feed: FeedOrderTarget | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderCompleted?: (order: PrintableOrder) => void;
}

export default function OrderPlacementModal({
  feed,
  isOpen,
  onClose,
  onOrderCompleted,
}: Props) {
  const { user } = useAuth();

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [quantity, setQuantity] = useState(2);
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('Mahama Sector, Kirehe District');
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'cash' | 'bank_transfer'>('momo');
  const [paymentPhone, setPaymentPhone] = useState(user?.phone || user?.profile?.phone || '');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<PrintableOrder | null>(null);
  const [momoModalOpen, setMomoModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Sync state when feed changes
  useEffect(() => {
    setSelectedVariantIndex(0);
    setQuantity(2);
    setConfirmedOrder(null);
    setReceiptModalOpen(false);
    setMomoModalOpen(false);
    if (user?.profile?.phone) {
      setPaymentPhone(user.profile.phone);
    }
  }, [feed, user]);

  if (!isOpen || !feed) return null;

  const variants = feed.variants && feed.variants.length > 0 ? feed.variants : [
    {
      id: feed.id,
      sku: feed.sku || 'FEED-50KG',
      package_size: feed.package_size || '50kg Bag',
      price_rwf: feed.price_rwf,
    },
  ];

  const currentVariant = variants[selectedVariantIndex] || variants[0];

  const currentItem: OrderItemInput = {
    productId: feed.id,
    variantId: currentVariant.id,
    productName: feed.name,
    sku: currentVariant.sku,
    packageSize: currentVariant.package_size,
    unitPriceRwf: currentVariant.price_rwf,
    quantity,
  };

  const calculation = calculateOrderTotals([currentItem], fulfillmentType);

  const isGuest = !user;
  const isPendingApproval = user?.profile?.status === 'pending';

  const handleConfirmOrder = async () => {
    if (isGuest || isPendingApproval) return;

    // If customer selected MoMo, launch the interactive Rwandan MoMo USSD prompt flow
    if (paymentMethod === 'momo') {
      setMomoModalOpen(true);
      return;
    }

    setSubmitting(true);

    const res = await placeCustomerOrder({
      customerId: user.profile?.id || user.id,
      customerName: user.profile?.displayName || user.profile?.fullName || user.email?.split('@')[0] || 'Customer',
      customerPhone: paymentPhone || user.profile?.phone || '+250 788 000 000',
      customerEmail: user.email || undefined,
      deliveryAddress,
      fulfillmentType,
      paymentMethod,
      paymentPhone,
      items: [currentItem],
      notes: orderNotes,
    });

    setSubmitting(false);

    if (res.success) {
      setConfirmedOrder(res.printableOrder);
      if (onOrderCompleted) {
        onOrderCompleted(res.printableOrder);
      }
    }
  };

  const handleMoMoPaymentCompleted = async (result: MoMoPaymentResult) => {
    setMomoModalOpen(false);
    if (!user) return;
    setSubmitting(true);

    const res = await placeCustomerOrder({
      customerId: user.profile?.id || user.id,
      customerName: user.profile?.displayName || user.profile?.fullName || user.email?.split('@')[0] || 'Customer',
      customerPhone: result.phoneNumber || paymentPhone || user.profile?.phone || '+250 788 000 000',
      customerEmail: user.email || undefined,
      deliveryAddress,
      fulfillmentType,
      paymentMethod: 'momo',
      paymentPhone: result.phoneNumber,
      paymentReference: result.transactionReference,
      items: [currentItem],
      notes: `${orderNotes ? orderNotes + '. ' : ''}Paid via MoMo TxID: ${result.transactionReference}`,
    });

    setSubmitting(false);

    if (res.success) {
      setConfirmedOrder(res.printableOrder);
      if (onOrderCompleted) {
        onOrderCompleted(res.printableOrder);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2E7D32] text-white flex items-center justify-center font-bold">
              <ShoppingBag size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm">
                Place Animal Feed Order
              </h3>
              <p className="text-[11px] text-gray-500">
                Turashoboye Primary Feed Depot • Mahama
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Guest Guard: Must sign in or register first */}
        {isGuest ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#2E7D32] border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
              <Lock size={30} />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h4 className="text-xl font-black text-gray-900">
                Customer Account Required
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                To guarantee verifiable batch traceability, honest weights, and depot collection scheduling, feed orders on our platform require an authorized customer account.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-700 max-w-md mx-auto text-left space-y-2">
              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#2E7D32]" />
                Selected Product:
              </div>
              <p className="font-semibold text-emerald-950">
                {feed.name} — {currentVariant.package_size} ({currentVariant.price_rwf.toLocaleString()} RWF)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto pt-2">
              <Link
                to={`/login?tab=login&redirect=${encodeURIComponent(window.location.pathname)}`}
                onClick={onClose}
                className="py-3 px-4 rounded-xl border-2 border-[#2E7D32] text-[#2E7D32] font-bold text-xs hover:bg-emerald-50 transition text-center"
              >
                Sign In to Your Account
              </Link>
              <Link
                to={`/login?tab=register&redirect=${encodeURIComponent(window.location.pathname)}`}
                onClick={onClose}
                className="py-3 px-4 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white font-bold text-xs shadow-xs transition text-center"
              >
                Register Customer Account
              </Link>
            </div>

            <p className="text-[11px] text-gray-400">
              Registration takes less than a minute. New customer accounts require quick admin verification before placing orders.
            </p>
          </div>
        ) : isPendingApproval ? (
          /* Pending Approval Guard */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
              <Clock size={32} />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wide">
                Account Awaiting Verification
              </span>
              <h4 className="text-xl font-black text-gray-900 pt-1">
                Admin Approval in Progress
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Your customer account has been created and is currently undergoing review by the Turashoboye administration in Mahama. Online ordering will be unlocked once approved.
              </p>
            </div>

            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 text-xs text-amber-900 max-w-md mx-auto text-left space-y-2">
              <span className="font-bold block">Need Urgent Animal Feed Today?</span>
              <p>
                You can contact our Mahama depot staff directly via phone or WhatsApp to place an immediate walk-in order.
              </p>
            </div>

            <div className="flex justify-center gap-3 max-w-md mx-auto">
              <a
                href={`https://wa.me/250780000000?text=${encodeURIComponent(
                  `Hello Turashoboye administration, my customer account (${user.email}) is pending approval and I would like to place an order for ${feed.name}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-xs transition flex items-center gap-2"
              >
                <MessageSquare size={15} />
                Contact Staff on WhatsApp
              </a>
              <button
                onClick={onClose}
                className="py-3 px-5 rounded-xl border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        ) : confirmedOrder ? (
          /* Order Confirmed View */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#2E7D32] flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1">
              <h4 className="text-2xl font-black text-gray-900">
                Order Confirmed!
              </h4>
              <p className="text-xs font-mono font-bold text-[#2E7D32]">
                {confirmedOrder.orderNumber}
              </p>
              <p className="text-xs text-gray-500 pt-1">
                Your order has been recorded in the Turashoboye depot ledger with batch traceability allocation.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between font-semibold text-gray-800">
                <span>Total Amount:</span>
                <span className="font-bold text-gray-900">{confirmedOrder.total.toLocaleString()} RWF</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Fulfillment:</span>
                <span>{fulfillmentType === 'pickup' ? 'Depot Pickup (Mahama)' : 'Local Delivery'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Batch Code:</span>
                <span className="font-mono text-emerald-800 font-bold">{confirmedOrder.items[0]?.batchNumber}</span>
              </div>
            </div>

            <div className="space-y-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setReceiptModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white font-bold text-xs shadow-xs transition"
              >
                <Printer size={16} />
                View & Print Official Receipt (QR)
              </button>

              <a
                href={buildWhatsAppOrderConfirmationUrl(confirmedOrder, fulfillmentType)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-xs transition"
              >
                <MessageSquare size={16} />
                Send Confirmation to Depot WhatsApp
              </a>

              <Link
                to="/portal"
                onClick={onClose}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition"
              >
                View My Feed Orders & Receipts
              </Link>
            </div>
          </div>
        ) : (
          /* Active User Ordering Form */
          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Feed Summary */}
            <div className="flex items-center gap-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-xs font-bold text-[#2E7D32] shrink-0">
                {currentVariant.package_size.replace(' Bag', '')}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{feed.name}</h4>
                <p className="text-xs text-gray-600">
                  Unit Price: <strong>{currentVariant.price_rwf.toLocaleString()} RWF</strong> ({currentVariant.package_size})
                </p>
              </div>
            </div>

            {/* Package Size Selector if multiple exist */}
            {variants.length > 1 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase">Package Size:</label>
                <div className="grid grid-cols-3 gap-2">
                  {variants.map((v, idx) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantIndex(idx)}
                      className={`p-2.5 rounded-xl border text-center text-xs transition ${
                        selectedVariantIndex === idx
                          ? 'border-[#2E7D32] bg-emerald-50 text-[#2E7D32] font-bold ring-1 ring-[#2E7D32]'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="block font-bold">{v.package_size}</span>
                      <span className="text-[11px] text-gray-500">{v.price_rwf.toLocaleString()} RWF</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector with Volume Pricing */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase">Quantity (Bags):</label>
                {calculation.tierName && (
                  <span className="text-[11px] font-bold text-[#2E7D32] bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Sparkles size={11} /> {calculation.tierName}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-100 flex items-center justify-center text-base"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 text-center py-2 bg-gray-50 border border-gray-300 rounded-xl font-bold text-sm"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-100 flex items-center justify-center text-base"
                >
                  +
                </button>

                <div className="flex gap-1.5 ml-auto">
                  {[5, 10, 25].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuantity(q)}
                      className={`px-2.5 py-1 text-xs rounded-lg border font-semibold ${
                        quantity === q
                          ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {q} bags
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fulfillment Method */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase">Collection & Fulfillment:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFulfillmentType('pickup')}
                  className={`p-3 rounded-xl border text-left text-xs transition ${
                    fulfillmentType === 'pickup'
                      ? 'border-[#2E7D32] bg-emerald-50 text-[#2E7D32] font-bold ring-1 ring-[#2E7D32]'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <MapPin size={14} /> Self-Pickup at Depot
                  </div>
                  <span className="text-[11px] text-gray-500 block mt-1">Mahama Depot Counter (Free)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentType('delivery')}
                  className={`p-3 rounded-xl border text-left text-xs transition ${
                    fulfillmentType === 'delivery'
                      ? 'border-[#2E7D32] bg-emerald-50 text-[#2E7D32] font-bold ring-1 ring-[#2E7D32]'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <Truck size={14} /> Local Farm Delivery
                  </div>
                  <span className="text-[11px] text-gray-500 block mt-1">
                    {calculation.deliveryFeeRwf === 0 ? 'Free (20+ bags)' : '2,000 RWF (Kirehe / Camp)'}
                  </span>
                </button>
              </div>

              {fulfillmentType === 'delivery' && (
                <div className="pt-1">
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    Delivery Address / Village in Mahama / Kirehe:
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. Mahama Camp Village 4, or Nyakarambi Sector"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase">Payment Method:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('momo')}
                  className={`p-2.5 rounded-xl border text-center text-xs transition ${
                    paymentMethod === 'momo'
                      ? 'border-[#2E7D32] bg-emerald-50 text-[#2E7D32] font-bold ring-1 ring-[#2E7D32]'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📱 MTN MoMo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-2.5 rounded-xl border text-center text-xs transition ${
                    paymentMethod === 'cash'
                      ? 'border-[#2E7D32] bg-emerald-50 text-[#2E7D32] font-bold ring-1 ring-[#2E7D32]'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  💵 Cash at Depot
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-2.5 rounded-xl border text-center text-xs transition ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-[#2E7D32] bg-emerald-50 text-[#2E7D32] font-bold ring-1 ring-[#2E7D32]'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  🏦 Bank / Co-op
                </button>
              </div>

              {paymentMethod === 'momo' && (
                <div className="pt-1">
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    MoMo Contact Number:
                  </label>
                  <input
                    type="tel"
                    required
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    placeholder="078XXXXXXX"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
              )}
            </div>

            {/* Price Calculation Summary */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({quantity} bags):</span>
                <span className="font-semibold text-gray-900">{calculation.subtotalRwf.toLocaleString()} RWF</span>
              </div>
              {calculation.discountRwf > 0 && (
                <div className="flex justify-between text-[#2E7D32] font-semibold">
                  <span>Volume Tier Savings:</span>
                  <span>- {calculation.discountRwf.toLocaleString()} RWF</span>
                </div>
              )}
              {fulfillmentType === 'delivery' && (
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Transport:</span>
                  <span>{calculation.deliveryFeeRwf === 0 ? 'FREE' : `${calculation.deliveryFeeRwf.toLocaleString()} RWF`}</span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-extrabold text-gray-900">
                <span>Total Amount:</span>
                <span className="text-[#2E7D32] text-base">{calculation.totalAmountRwf.toLocaleString()} RWF</span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-600 block">
                Order Notes (optional):
              </label>
              <textarea
                rows={2}
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="E.g. delivery time preference, special instructions…"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmOrder}
                className="w-2/3 py-3 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  'Processing...'
                ) : paymentMethod === 'momo' ? (
                  <>
                    <Smartphone size={15} />
                    {`Pay with MoMo (${calculation.totalAmountRwf.toLocaleString()} RWF)`}
                  </>
                ) : (
                  `Confirm Order (${calculation.totalAmountRwf.toLocaleString()} RWF)`
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Rwandan MoMo Payment USSD Prompt Modal */}
      <RwandanMoMoModal
        isOpen={momoModalOpen}
        onClose={() => setMomoModalOpen(false)}
        orderNumber={`ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`}
        customerName={user?.profile?.displayName || user?.profile?.fullName || 'Customer'}
        amountRwf={calculation.totalAmountRwf}
        initialPhone={paymentPhone}
        onPaymentSuccess={handleMoMoPaymentCompleted}
      />

      {/* Official Receipt Modal with QR */}
      <OrderReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        order={confirmedOrder}
      />
    </div>
  );
}
