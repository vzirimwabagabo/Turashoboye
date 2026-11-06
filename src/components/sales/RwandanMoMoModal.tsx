import { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Clock, 
  ShieldCheck,
  Send,
  RefreshCw
} from 'lucide-react';

export type TelcoProvider = 'mtn' | 'airtel' | 'unknown';

export interface MoMoPaymentResult {
  success: boolean;
  provider: 'mtn' | 'airtel';
  phoneNumber: string;
  amountRwf: number;
  transactionReference: string;
  completedAt: string;
}

interface RwandanMoMoModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  customerName: string;
  amountRwf: number;
  initialPhone?: string;
  onPaymentSuccess: (result: MoMoPaymentResult) => void;
}

export function detectRwandaTelco(phone: string): TelcoProvider {
  const cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
  // Normalize +250 or 250 prefix
  const national = cleaned.startsWith('250') 
    ? '0' + cleaned.slice(3) 
    : cleaned.startsWith('0') 
    ? cleaned 
    : '0' + cleaned;

  if (/^0(78|79)\d{7}$/.test(national)) return 'mtn';
  if (/^0(72|73)\d{7}$/.test(national)) return 'airtel';
  return 'unknown';
}

export default function RwandanMoMoModal({
  isOpen,
  onClose,
  orderNumber,
  customerName,
  amountRwf,
  initialPhone = '',
  onPaymentSuccess,
}: RwandanMoMoModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [step, setStep] = useState<'input' | 'push_pending' | 'pin_demo' | 'success' | 'failed'>('input');
  const [countdown, setCountdown] = useState(60);
  const [txRef, setTxRef] = useState('');
  const [simulatedPin, setSimulatedPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const provider = detectRwandaTelco(phoneNumber);

  // Sync initial phone
  useEffect(() => {
    if (initialPhone) {
      setPhoneNumber(initialPhone);
    }
  }, [initialPhone]);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setCountdown(60);
      setSimulatedPin('');
      setErrorMsg(null);
      setTxRef(`MP${new Date().toISOString().slice(2, 10).replace(/-/g, '')}.${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [isOpen]);

  // Countdown timer during push_pending
  useEffect(() => {
    let timer: any = null;
    if (step === 'push_pending' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setStep('failed');
            setErrorMsg('Payment request timed out. The subscriber did not authorize the USSD prompt within 60 seconds.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const handleInitiatePush = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleaned = phoneNumber.replace(/[\s\-\+\(\)]/g, '');
    const national = cleaned.startsWith('250') ? '0' + cleaned.slice(3) : cleaned;

    if (!/^0(78|79|72|73)\d{7}$/.test(national)) {
      setErrorMsg('Please enter a valid 10-digit Rwanda mobile number (MTN 078/079 or Airtel 072/073).');
      return;
    }

    setStep('push_pending');
    setCountdown(60);
  };

  const handleAuthorizeSuccess = () => {
    setStep('success');
    const result: MoMoPaymentResult = {
      success: true,
      provider: provider === 'airtel' ? 'airtel' : 'mtn',
      phoneNumber,
      amountRwf,
      transactionReference: txRef,
      completedAt: new Date().toISOString(),
    };

    setTimeout(() => {
      onPaymentSuccess(result);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-8">
        
        {/* Provider Brand Banner */}
        <div className={`px-6 py-4 flex items-center justify-between text-white transition-colors ${
          provider === 'mtn' 
            ? 'bg-amber-500' 
            : provider === 'airtel' 
            ? 'bg-red-600' 
            : 'bg-[#2E7D32]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-sm">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight leading-tight">
                {provider === 'mtn' 
                  ? 'MTN Mobile Money (MoMo Rwanda)' 
                  : provider === 'airtel' 
                  ? 'Airtel Money Rwanda' 
                  : 'Rwanda Mobile Money Payment'}
              </h3>
              <p className="text-[11px] text-white/80">
                Merchant Code: <span className="font-mono font-bold">100234</span> • Turashoboye Feeds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Order & Amount Header */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Payment for Order</span>
              <span className="font-mono text-xs font-bold text-gray-900 block">{orderNumber}</span>
              <span className="text-[11px] text-gray-500">{customerName}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Total to Pay</span>
              <span className="text-lg font-black text-[#2E7D32] block">
                RWF {amountRwf.toLocaleString()}
              </span>
              <span className="text-[9px] text-gray-400">Zero Transaction Fees</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: Input Phone & Initiate */}
          {step === 'input' && (
            <form onSubmit={handleInitiatePush} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Farmer / Buyer Mobile Money Number *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="078XXXXXXX or 072XXXXXXX"
                    className="w-full pl-3 pr-24 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center">
                    {provider === 'mtn' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                        MTN MoMo
                      </span>
                    )}
                    {provider === 'airtel' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-900 border border-red-300">
                        Airtel Money
                      </span>
                    )}
                    {provider === 'unknown' && phoneNumber.length > 3 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">
                        Rwanda Telco
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Supported networks: MTN (078, 079) and Airtel-Tigo (072, 073).
                </p>
              </div>

              {/* Telco instruction notice */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="h-4 w-4 text-blue-700" />
                  Instant Direct Settlement:
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Upon clicking below, a USSD payment authorization prompt will be pushed instantly to your mobile phone. Enter your MoMo PIN to complete.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-xs font-bold shadow-xs transition"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send MoMo Prompt (RWF {amountRwf.toLocaleString()})
                </button>
              </div>
            </form>
          )}

          {/* Step 2: USSD Push Pending (Awaiting PIN) */}
          {step === 'push_pending' && (
            <div className="space-y-5 text-center py-2">
              <div className="relative mx-auto w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-black text-gray-950">
                  USSD Push Prompt Dispatched!
                </h4>
                <p className="text-xs text-gray-600 max-w-sm mx-auto">
                  A payment authorization prompt has been pushed to <span className="font-mono font-bold text-gray-900">{phoneNumber}</span>.
                </p>
              </div>

              {/* Simulated Phone Screen Mockup for Interactive Verification */}
              <div className="p-4 bg-gray-900 text-white rounded-2xl border-2 border-gray-800 text-left font-mono text-xs space-y-2 shadow-inner">
                <div className="flex items-center justify-between text-[10px] text-gray-400 border-b border-gray-800 pb-1">
                  <span>MTN-RW MoMo Push</span>
                  <span>*182#</span>
                </div>
                <p className="text-amber-400 font-bold">
                  Do you want to authorize payment of RWF {amountRwf.toLocaleString()} to Turashoboye Feeds (Code: 100234)?
                </p>
                <p className="text-[11px] text-gray-300">
                  Ref: {txRef}
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">Enter MoMo PIN:</span>
                  <input
                    type="password"
                    maxLength={5}
                    placeholder="••••"
                    value={simulatedPin}
                    onChange={(e) => setSimulatedPin(e.target.value)}
                    className="w-20 px-2 py-1 bg-gray-800 text-amber-300 text-center font-black tracking-widest rounded border border-gray-700 text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAuthorizeSuccess}
                    className="ml-auto px-3 py-1 rounded bg-[#2E7D32] hover:bg-[#256b29] text-white text-[11px] font-sans font-bold shadow-xs transition"
                  >
                    Authorize PIN
                  </button>
                </div>
              </div>

              {/* Status and Countdown */}
              <div className="flex items-center justify-between text-xs text-gray-500 px-2">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  Awaiting handset response: <strong className="font-mono text-gray-900">{countdown}s</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="text-xs font-semibold text-[#2E7D32] hover:underline"
                >
                  Change phone number
                </button>
              </div>

              <p className="text-[10px] text-gray-400">
                * Note: If prompt doesn't pop up immediately, unlock your screen or dial <code className="font-bold text-gray-600">*182*7*1#</code> on your handset to approve pending transactions.
              </p>
            </div>
          )}

          {/* Step 3: Success Screen */}
          {step === 'success' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-[#2E7D32] border border-emerald-300 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#2E7D32]">
                  Payment Reconciled
                </span>
                <h4 className="text-xl font-black text-gray-950">
                  RWF {amountRwf.toLocaleString()} Received!
                </h4>
                <p className="text-xs text-gray-600">
                  Mobile Money transaction cleared successfully. Digital receipt generated.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono text-left space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Provider:</span>
                  <span className="font-bold uppercase text-gray-900">{provider} Mobile Money</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">TxID Reference:</span>
                  <span className="font-bold text-gray-900">{txRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Timestamp:</span>
                  <span className="text-gray-700">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Failed State */}
          {step === 'failed' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-gray-900">Payment Authorization Incomplete</h4>
                <p className="text-xs text-gray-600 max-w-sm mx-auto">
                  The transaction was cancelled or timed out before PIN authorization.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E7D32] text-white text-xs font-bold hover:bg-[#256b29]"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
