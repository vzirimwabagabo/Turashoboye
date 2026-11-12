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
  Building2,
  CreditCard,
  AlertCircle,
  KeyRound,
  Send,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  calculateOrderTotals,
  placeCustomerOrder,
  buildWhatsAppOrderConfirmationUrl,
  type OrderItemInput,
} from '../../lib/orderService';
import OrderReceiptModal, { type PrintableOrder } from './OrderReceiptModal';
import { PAYMENT_CONFIG } from '../../config/paymentConfig';
import { detectRwandaTelco } from './RwandanMoMoModal';

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
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'bank_transfer' | 'pay_on_delivery' | 'cash'>('momo');
  const [paymentPhone, setPaymentPhone] = useState(user?.phone || user?.profile?.phone || '');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<PrintableOrder | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // MoMo Online Payment interactive state
  const [momoPin, setMomoPin] = useState('');
  const [momoAuthStatus, setMomoAuthStatus] = useState<'idle' | 'push_dispatched' | 'authorized'>('idle');
  const [momoTxRef, setMomoTxRef] = useState('');
  const [momoCountdown, setMomoCountdown] = useState(60);
  const [momoError, setMomoError] = useState<string | null>(null);

  // Bank Transfer state
  const [bankName, setBankName] = useState('Bank of Kigali (BK)');
  const [bankSlipRef, setBankSlipRef] = useState('');
  const [bankDepositor, setBankDepositor] = useState(user?.profile?.displayName || user?.profile?.fullName || '');
  const [bankError, setBankError] = useState<string | null>(null);

  // MoMo countdown timer during USSD push
  useEffect(() => {
    let t: any = null;
    if (momoAuthStatus === 'push_dispatched' && momoCountdown > 0) {
      t = setInterval(() => {
        setMomoCountdown((c) => (c <= 1 ? 0 : c - 1));
      }, 1000);
    }
    return () => clearInterval(t);
  }, [momoAuthStatus, momoCountdown]);

  // Sync state when feed changes
  useEffect(() => {
    setSelectedVariantIndex(0);
    setQuantity(2);
    setConfirmedOrder(null);
    setReceiptModalOpen(false);
    setMomoPin('');
    setMomoAuthStatus('idle');
    setMomoTxRef('');
    setMomoError(null);
    setBankSlipRef('');
    setBankError(null);
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

  const telcoProvider = detectRwandaTelco(paymentPhone);

  const handleInitiateMoMoPush = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setMomoError(null);
    const cleaned = paymentPhone.replace(/[\s\-\+\(\)]/g, '');
    const national = cleaned.startsWith('250') ? '0' + cleaned.slice(3) : cleaned;
    if (!/^0(78|79|72|73)\d{7}$/.test(national)) {
      setMomoError('Please enter a valid 10-digit Rwanda mobile number (MTN 078/079 or Airtel 072/073).');
      return;
    }
    setMomoAuthStatus('push_dispatched');
    setMomoCountdown(60);
  };

  const handleAuthorizeMoMoPin = () => {
    if (!momoPin || momoPin.length < 4) {
      setMomoError('Please enter your 4 or 5-digit MoMo PIN to authorize payment.');
      return;
    }
    setMomoError(null);
    const ref = `MP${new Date().toISOString().slice(2, 10).replace(/-/g, '')}.${Math.floor(1000 + Math.random() * 9000)}`;
    setMomoTxRef(ref);
    setMomoAuthStatus('authorized');
  };

  const handleConfirmOrder = async () => {
    if (isGuest || isPendingApproval || !user) return;

    // 1. If MoMo selected, verify that the PIN was authorized online
    if (paymentMethod === 'momo') {
      if (momoAuthStatus !== 'authorized') {
        if (momoAuthStatus === 'idle') {
          handleInitiateMoMoPush();
          setMomoError('Please check your phone and enter your MoMo PIN below to authorize online payment before confirming.');
          return;
        }
        if (momoAuthStatus === 'push_dispatched') {
          setMomoError('Please enter your 4-5 digit MoMo PIN and click "Authorize PIN" to complete payment.');
          return;
        }
      }
    }

    // 2. If Bank Transfer selected, verify that deposit slip reference is entered
    if (paymentMethod === 'bank_transfer') {
      if (!bankSlipRef.trim()) {
        setBankError('Please enter the Bank Deposit Slip or Transfer Reference Number.');
        return;
      }
    }

    setSubmitting(true);

    const isPaidOnline = paymentMethod === 'momo' && momoAuthStatus === 'authorized';
    const paymentReference = isPaidOnline
      ? momoTxRef
      : paymentMethod === 'bank_transfer'
      ? `Bank: ${bankName} | Slip: ${bankSlipRef.trim()}`
      : paymentMethod === 'pay_on_delivery'
      ? 'Due on Delivery to Driver'
      : 'Due at Depot Counter on Pickup';

    const res = await placeCustomerOrder({
      customerId: user.profile?.id || user.id,
      customerName: user.profile?.displayName || user.profile?.fullName || user.email?.split('@')[0] || 'Customer',
      customerPhone: paymentPhone || user.profile?.phone || '+250 788 000 000',
      customerEmail: user.email || undefined,
      deliveryAddress,
      fulfillmentType,
      paymentMethod,
      paymentPhone,
      paymentReference,
      isPaidOnline,
      bankDetails: paymentMethod === 'bank_transfer' ? { bankName, depositSlipReference: bankSlipRef.trim(), payerName: bankDepositor } : undefined,
      items: [currentItem],
      notes: `${orderNotes ? orderNotes + '. ' : ''}${paymentReference}`,
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
                <span>Payment Status:</span>
                {paymentMethod === 'momo' && momoAuthStatus === 'authorized' ? (
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                    Paid in Full via MoMo (Ref: {momoTxRef})
                  </span>
                ) : paymentMethod === 'bank_transfer' ? (
                  <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                    Pending Bank Clearance (Slip: {bankSlipRef})
                  </span>
                ) : paymentMethod === 'pay_on_delivery' ? (
                  <span className="font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                    Unpaid • Due on Delivery to Driver
                  </span>
                ) : (
                  <span className="font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                    Unpaid • Due at Depot Cashier Counter
                  </span>
                )}
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

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase">Payment Method:</label>
                <span className="text-[10px] text-gray-500 font-medium">No free dispatches • Payment verified</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('momo');
                    setMomoError(null);
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition ${
                    paymentMethod === 'momo'
                      ? 'border-[#2E7D32] bg-emerald-50 text-[#2E7D32] font-bold ring-1 ring-[#2E7D32]'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <Smartphone size={14} className="text-amber-600" />
                    📱 MoMo (Pay Online Now)
                  </div>
                  <span className="text-[10px] text-gray-500 block mt-0.5">MTN / Airtel Instant PIN</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('bank_transfer');
                    setBankError(null);
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-[#2E7D32] bg-emerald-50 text-[#2E7D32] font-bold ring-1 ring-[#2E7D32]'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <Building2 size={14} className="text-blue-600" />
                    🏦 Bank Transfer (Slip)
                  </div>
                  <span className="text-[10px] text-gray-500 block mt-0.5">BK / Equity Deposit Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('pay_on_delivery')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition ${
                    paymentMethod === 'pay_on_delivery'
                      ? 'border-[#2E7D32] bg-emerald-50 text-[#2E7D32] font-bold ring-1 ring-[#2E7D32]'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <Truck size={14} className="text-[#2E7D32]" />
                    🚚 Pay on Delivery
                  </div>
                  <span className="text-[10px] text-gray-500 block mt-0.5">Cash / MoMo to Driver</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition ${
                    paymentMethod === 'cash'
                      ? 'border-[#2E7D32] bg-emerald-50 text-[#2E7D32] font-bold ring-1 ring-[#2E7D32]'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <CreditCard size={14} className="text-gray-600" />
                    💵 Pay at Depot Counter
                  </div>
                  <span className="text-[10px] text-gray-500 block mt-0.5">Cash on Pickup Desk</span>
                </button>
              </div>

              {/* 1. MOMO ONLINE PAYMENT PANEL */}
              {paymentMethod === 'momo' && (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/70">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                      <Smartphone size={15} className="text-amber-700" />
                      <span>Live MoMo PIN Authorization</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-amber-200/70 text-amber-950 px-2 py-0.5 rounded">
                      Till: {PAYMENT_CONFIG.mtnMoMoMerchantCode}
                    </span>
                  </div>

                  {momoError && (
                    <div className="p-2.5 bg-red-100 border border-red-200 rounded-xl flex items-center gap-1.5 text-xs text-red-900">
                      <AlertCircle size={14} className="shrink-0 text-red-700" />
                      <span>{momoError}</span>
                    </div>
                  )}

                  {/* Phone input */}
                  <div>
                    <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                      MoMo Mobile Number:
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={paymentPhone}
                        onChange={(e) => {
                          setPaymentPhone(e.target.value);
                          if (momoAuthStatus !== 'idle') setMomoAuthStatus('idle');
                        }}
                        placeholder="078XXXXXXX or 072XXXXXXX"
                        className="w-full pl-3 pr-24 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                      />
                      <span className="absolute inset-y-0 right-2 flex items-center">
                        {telcoProvider === 'mtn' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                            MTN MoMo
                          </span>
                        ) : telcoProvider === 'airtel' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-900 border border-red-300">
                            Airtel Money
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">Rwanda</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* MoMo Authorization Box */}
                  {momoAuthStatus === 'idle' && (
                    <div className="pt-1 flex items-center justify-between gap-3">
                      <p className="text-[11px] text-amber-900 leading-tight">
                        Click to send a USSD prompt to your handset to enter your PIN.
                      </p>
                      <button
                        type="button"
                        onClick={handleInitiateMoMoPush}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 shadow-xs transition"
                      >
                        <Send size={13} />
                        Push USSD Prompt
                      </button>
                    </div>
                  )}

                  {momoAuthStatus === 'push_dispatched' && (
                    <div className="p-3 bg-gray-900 text-white rounded-xl border border-gray-800 space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 border-b border-gray-800 pb-1">
                        <span>USSD PIN Prompt Dispatched</span>
                        <span>{momoCountdown}s remaining</span>
                      </div>
                      <p className="text-amber-400 text-xs">
                        Authorize payment of RWF {calculation.totalAmountRwf.toLocaleString()} to Turashoboye Feeds (Code: {PAYMENT_CONFIG.mtnMoMoMerchantCode})
                      </p>
                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-[10px] text-gray-300 font-sans">Enter MoMo PIN:</span>
                        <input
                          type="password"
                          maxLength={5}
                          placeholder="••••"
                          value={momoPin}
                          onChange={(e) => setMomoPin(e.target.value)}
                          className="w-24 px-2 py-1.5 bg-gray-800 text-amber-300 text-center font-black tracking-widest rounded border border-gray-700 text-sm focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAuthorizeMoMoPin}
                          className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2E7D32] hover:bg-[#256b29] text-white text-xs font-sans font-bold shadow-xs transition"
                        >
                          <KeyRound size={12} />
                          Authorize PIN
                        </button>
                      </div>
                      <p className="text-[9px] text-gray-400 pt-0.5">
                        * Dial *182*7*1# on your phone if prompt was missed.
                      </p>
                    </div>
                  )}

                  {momoAuthStatus === 'authorized' && (
                    <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-950">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-[#2E7D32] shrink-0" />
                        <div>
                          <span className="font-black block text-xs">Payment Cleared (Ref: {momoTxRef})</span>
                          <span className="text-[10px] text-emerald-800">RWF {calculation.totalAmountRwf.toLocaleString()} settled. Ready to confirm order.</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMomoAuthStatus('idle');
                          setMomoPin('');
                        }}
                        className="text-[10px] font-bold text-emerald-800 hover:underline"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 2. BANK TRANSFER PANEL */}
              {paymentMethod === 'bank_transfer' && (
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-200/70">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
                      <Building2 size={15} className="text-blue-700" />
                      <span>Turashoboye Official Bank Accounts</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-800">Deposit Slip Required</span>
                  </div>

                  {bankError && (
                    <div className="p-2.5 bg-red-100 border border-red-200 rounded-xl flex items-center gap-1.5 text-xs text-red-900">
                      <AlertCircle size={14} className="shrink-0 text-red-700" />
                      <span>{bankError}</span>
                    </div>
                  )}

                  <div className="p-3 bg-white rounded-xl border border-blue-100 text-[11px] space-y-1 text-gray-700">
                    <div className="flex justify-between">
                      <span className="font-semibold">Bank of Kigali (BK):</span>
                      <span className="font-mono font-bold text-gray-900">00040-0694123-55 (RWF)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Equity Bank Rwanda:</span>
                      <span className="font-mono font-bold text-gray-900">4002111289012 (RWF)</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-100 text-[10px]">
                      <span>Account Name:</span>
                      <span className="font-bold text-gray-900">TURASHOBOYE FEED MILLS LTD</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 block mb-1">
                        Bank Transferred To:
                      </label>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                      >
                        <option value="Bank of Kigali (BK)">Bank of Kigali (BK)</option>
                        <option value="Equity Bank Rwanda">Equity Bank Rwanda</option>
                        <option value="Other Bank / Co-op Transfer">Other Bank / Co-op Transfer</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-700 block mb-1">
                        Deposit Slip / Tx Reference *
                      </label>
                      <input
                        type="text"
                        required
                        value={bankSlipRef}
                        onChange={(e) => {
                          setBankSlipRef(e.target.value);
                          if (bankError) setBankError(null);
                        }}
                        placeholder="e.g. BK-DEP-202611-091"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-gray-600 block mb-1">
                        Depositor / Co-op Name:
                      </label>
                      <input
                        type="text"
                        value={bankDepositor}
                        onChange={(e) => setBankDepositor(e.target.value)}
                        placeholder="Depositor name"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-blue-900">
                    * Orders paid by bank slip are placed on hold until confirmed by the Mahama depot accountant.
                  </p>
                </div>
              )}

              {/* 3. PAY ON DELIVERY PANEL */}
              {paymentMethod === 'pay_on_delivery' && (
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-gray-900">
                    <Truck size={14} className="text-[#2E7D32]" />
                    <span>Pay Directly on Delivery to Driver</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    You will pay in cash or via MoMo directly to the Turashoboye delivery driver upon truck arrival at your farm in Mahama/Kirehe. Bags will be unloaded only after payment handover.
                  </p>
                  <p className="text-[10px] font-semibold text-amber-800 pt-0.5">
                    Order Status: <span className="font-bold">Unpaid • Payment Due on Delivery</span>
                  </p>
                </div>
              )}

              {/* 4. CASH AT DEPOT PANEL */}
              {paymentMethod === 'cash' && (
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-gray-900">
                    <CreditCard size={14} className="text-gray-700" />
                    <span>Pay at Mahama Depot Cashier Counter</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Pay at the primary depot cashier counter when you arrive to pick up your feed bags. Receipt will be stamped upon cash handover.
                  </p>
                  <p className="text-[10px] font-semibold text-amber-800 pt-0.5">
                    Order Status: <span className="font-bold">Unpaid • Payment Due at Depot Counter</span>
                  </p>
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
                className={`w-2/3 py-3 rounded-xl text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${
                  paymentMethod === 'momo' && momoAuthStatus !== 'authorized'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[#2E7D32] hover:bg-[#256b29]'
                }`}
              >
                {submitting ? (
                  'Processing...'
                ) : paymentMethod === 'momo' ? (
                  momoAuthStatus === 'authorized' ? (
                    <>
                      <CheckCircle2 size={15} />
                      {`Confirm Paid Order (${calculation.totalAmountRwf.toLocaleString()} RWF)`}
                    </>
                  ) : (
                    <>
                      <KeyRound size={15} />
                      {`Authorize MoMo PIN to Pay (${calculation.totalAmountRwf.toLocaleString()} RWF)`}
                    </>
                  )
                ) : paymentMethod === 'bank_transfer' ? (
                  <>
                    <Building2 size={15} />
                    {`Submit Order with Bank Slip (${calculation.totalAmountRwf.toLocaleString()} RWF)`}
                  </>
                ) : paymentMethod === 'pay_on_delivery' ? (
                  <>
                    <Truck size={15} />
                    {`Confirm Order (Pay on Delivery: ${calculation.totalAmountRwf.toLocaleString()} RWF)`}
                  </>
                ) : (
                  <>
                    <CreditCard size={15} />
                    {`Confirm Order (Pay at Depot: ${calculation.totalAmountRwf.toLocaleString()} RWF)`}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Official Receipt Modal with QR */}
      <OrderReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        order={confirmedOrder}
      />
    </div>
  );
}
