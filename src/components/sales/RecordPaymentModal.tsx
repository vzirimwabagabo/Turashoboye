import { useState } from 'react';
import { X, DollarSign, AlertCircle, CreditCard, Banknote } from 'lucide-react';
import type { PaymentMethod } from '../../types/database';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  customerName: string;
  orderTotalRwf: number;
  alreadyPaidRwf: number;
  balanceDueRwf: number;
  onSavePayment: (payment: {
    method: PaymentMethod;
    amountRwf: number;
    reference?: string;
  }) => Promise<void> | void;
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  orderNumber,
  customerName,
  orderTotalRwf,
  alreadyPaidRwf,
  balanceDueRwf,
  onSavePayment,
}: RecordPaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [amountRwf, setAmountRwf] = useState<number>(balanceDueRwf);
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amountRwf <= 0) {
      setError('Payment amount must be greater than RWF 0.');
      return;
    }

    if (amountRwf > balanceDueRwf) {
      setError(`Payment cannot exceed outstanding balance of RWF ${balanceDueRwf.toLocaleString()}.`);
      return;
    }

    try {
      setSubmitting(true);
      await onSavePayment({
        method,
        amountRwf,
        reference: reference.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl border border-gray-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-[#2E7D32]">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Record Payment</h2>
              <p className="text-xs text-gray-500">Order #{orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Balance info box */}
          <div className="rounded-lg bg-gray-50 p-3 border border-gray-200 text-xs space-y-1">
            <div className="flex justify-between text-gray-600">
              <span>Customer:</span>
              <span className="font-semibold text-gray-800">{customerName}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Order Total:</span>
              <span>RWF {orderTotalRwf.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Already Settled:</span>
              <span>RWF {alreadyPaidRwf.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1">
              <span>Balance Due:</span>
              <span className="text-red-600 font-black">
                RWF {balanceDueRwf.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Payment Method *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('cash')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition ${
                  method === 'cash'
                    ? 'border-[#2E7D32] bg-green-50 text-[#2E7D32]'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Banknote className="h-4 w-4" />
                Cash Collected
              </button>
              <button
                type="button"
                onClick={() => setMethod('momo')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition ${
                  method === 'momo'
                    ? 'border-[#2E7D32] bg-green-50 text-[#2E7D32]'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Mobile Money
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Amount to Receive (Whole RWF) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-gray-500">
                RWF
              </span>
              <input
                type="number"
                min={1}
                max={balanceDueRwf}
                step={1}
                required
                value={amountRwf}
                onChange={(e) => setAmountRwf(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-gray-300 pl-14 pr-3 py-2 text-sm font-semibold focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              {method === 'momo' ? 'MoMo Reference / TxID *' : 'Receipt / Notes (Optional)'}
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={method === 'momo' ? 'e.g. MTN MP261017.001' : 'e.g. Cash collected at counter'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#2E7D32] px-5 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50 transition shadow-xs"
            >
              {submitting ? 'Recording...' : `Record RWF ${amountRwf.toLocaleString()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
