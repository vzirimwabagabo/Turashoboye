import { useState } from 'react';
import {
  X,
  ShoppingCart,
  Plus,
  Trash2,
  AlertTriangle,
  CreditCard,
  Banknote,
  AlertCircle,
} from 'lucide-react';
import type { Customer, PaymentMethod } from '../../types/database';

export interface AvailableVariant {
  id: string;
  productName: string;
  sku: string;
  packageSize: string;
  priceRwf: number;
  availableStock: number;
}

export interface AvailableBatch {
  id: string;
  batchNumber: string;
  variantId: string;
  availableQty: number;
}

export interface OrderItemInput {
  variantId: string;
  batchId?: string;
  quantity: number;
  unitPriceRwf: number;
  discountRwf: number;
}

interface OrderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  variants: AvailableVariant[];
  batches: AvailableBatch[];
  preselectedCustomerId?: string;
  onSubmitOrder: (orderPayload: {
    customerId: string;
    locationId: string;
    items: OrderItemInput[];
    payment?: {
      method: PaymentMethod;
      amountRwf: number;
      reference?: string;
    };
    notes?: string;
  }) => Promise<void> | void;
}

export default function OrderCreateModal({
  isOpen,
  onClose,
  customers,
  variants,
  batches,
  preselectedCustomerId,
  onSubmitOrder,
}: OrderCreateModalProps) {
  const [customerId, setCustomerId] = useState<string>(
    preselectedCustomerId || (customers[0]?.id ?? '')
  );
  const locationId = 'd0000000-0000-0000-0000-000000000001'; // Mahama Primary Feed Depot
  const [items, setItems] = useState<OrderItemInput[]>([
    {
      variantId: variants[0]?.id ?? '',
      quantity: 1,
      unitPriceRwf: variants[0]?.priceRwf ?? 24000,
      discountRwf: 0,
    },
  ]);

  const [recordPaymentNow, setRecordPaymentNow] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentAmountRwf, setPaymentAmountRwf] = useState<number | ''>('');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Calculate order totals
  const subtotalRwf = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceRwf,
    0
  );
  const totalDiscountRwf = items.reduce(
    (sum, item) => sum + item.discountRwf,
    0
  );
  const grandTotalRwf = Math.max(0, subtotalRwf - totalDiscountRwf);

  const effectivePaymentAmount =
    paymentAmountRwf === '' ? grandTotalRwf : Number(paymentAmountRwf);

  const handleAddItem = () => {
    const firstVar = variants[0];
    setItems((prev) => [
      ...prev,
      {
        variantId: firstVar?.id ?? '',
        quantity: 1,
        unitPriceRwf: firstVar?.priceRwf ?? 24000,
        discountRwf: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, variantId: string) => {
    const selectedVar = variants.find((v) => v.id === variantId);
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          variantId,
          batchId: undefined, // Reset batch when variant changes
          unitPriceRwf: selectedVar?.priceRwf ?? item.unitPriceRwf,
        };
      })
    );
  };

  const handleItemFieldChange = (
    index: number,
    field: keyof OrderItemInput,
    value: unknown
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Please select a customer or cooperative.');
      return;
    }

    if (items.length === 0) {
      setError('Order must have at least one product item.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.quantity <= 0) {
        setError(`Quantity for item #${i + 1} must be greater than zero.`);
        return;
      }
      const v = variants.find((varItem) => varItem.id === it.variantId);
      if (v && it.quantity > v.availableStock) {
        setError(
          `Requested quantity for ${v.productName} (${it.quantity}) exceeds available stock (${v.availableStock}).`
        );
        return;
      }
    }

    try {
      setSubmitting(true);
      await onSubmitOrder({
        customerId,
        locationId,
        items,
        payment: recordPaymentNow
          ? {
              method: paymentMethod,
              amountRwf: effectivePaymentAmount,
              reference: paymentReference.trim() || undefined,
            }
          : undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record sale transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-gray-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-[#2E7D32]">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Record Manual Sale</h2>
              <p className="text-xs text-gray-500">
                Staff-assisted order entry with atomic inventory deduction & batch stamp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Selection & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Customer / Cooperative *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32] bg-white font-medium text-gray-900"
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.address ? `(${c.address})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Fulfillment Depot
              </label>
              <input
                type="text"
                disabled
                value="Mahama Primary Feed Depot (DEPOT-01)"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Order Items & Feed Batches
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E7D32] hover:text-green-800"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const selectedVar = variants.find((v) => v.id === item.variantId);
                const matchingBatches = batches.filter(
                  (b) => b.variantId === item.variantId
                );
                const isOutOfStock =
                  selectedVar && item.quantity > selectedVar.availableStock;

                return (
                  <div
                    key={index}
                    className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 space-y-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                      {/* Variant Selection */}
                      <div className="md:col-span-5">
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">
                          Product & Package
                        </label>
                        <select
                          value={item.variantId}
                          onChange={(e) => handleVariantChange(index, e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs bg-white text-gray-900 focus:border-[#2E7D32] focus:outline-none"
                        >
                          {variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.productName} ({v.packageSize}) - RWF {v.priceRwf.toLocaleString()}
                            </option>
                          ))}
                        </select>
                        <div className="mt-1 flex items-center justify-between text-[11px]">
                          <span className="text-gray-500">
                            Stock on hand:{' '}
                            <strong className="text-gray-800">
                              {selectedVar?.availableStock ?? 0}
                            </strong>
                          </span>
                          {isOutOfStock && (
                            <span className="text-red-600 font-semibold flex items-center gap-0.5">
                              <AlertTriangle className="h-3 w-3" /> Insufficient stock!
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Batch Selection for Traceability */}
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">
                          Batch Lot (Trace)
                        </label>
                        <select
                          value={item.batchId || ''}
                          onChange={(e) =>
                            handleItemFieldChange(index, 'batchId', e.target.value || undefined)
                          }
                          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs bg-white text-gray-900 focus:border-[#2E7D32] focus:outline-none"
                        >
                          <option value="">Any Available Batch</option>
                          {matchingBatches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.batchNumber} ({b.availableQty} avail)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemFieldChange(
                              index,
                              'quantity',
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs font-semibold text-gray-900 focus:border-[#2E7D32] focus:outline-none"
                        />
                      </div>

                      {/* Price & Delete */}
                      <div className="md:col-span-2 flex items-end justify-between gap-1">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-600 mb-1">
                            Unit RWF
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={item.unitPriceRwf}
                            onChange={(e) =>
                              handleItemFieldChange(
                                index,
                                'unitPriceRwf',
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-900 focus:border-[#2E7D32] focus:outline-none"
                          />
                        </div>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition mb-0.5"
                            title="Remove Item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary & Live Total */}
          <div className="rounded-lg bg-green-50/70 p-4 border border-green-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-green-900 uppercase tracking-wider block">
                Grand Total (Whole RWF)
              </span>
              <span className="text-xs text-green-700">
                {items.length} item(s) to be deducted atomically from stock ledger
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-[#2E7D32]">
                RWF {grandTotalRwf.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment Section */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recordPaymentCheck"
                checked={recordPaymentNow}
                onChange={(e) => setRecordPaymentNow(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#2E7D32] focus:ring-[#2E7D32]"
              />
              <label
                htmlFor="recordPaymentCheck"
                className="text-xs font-semibold text-gray-800 cursor-pointer"
              >
                Record immediate cash / MoMo payment for this sale
              </label>
            </div>

            {recordPaymentNow && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    Method
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded border text-xs font-medium transition ${
                        paymentMethod === 'cash'
                          ? 'border-[#2E7D32] bg-white text-[#2E7D32] shadow-xs'
                          : 'border-gray-300 bg-white text-gray-600'
                      }`}
                    >
                      <Banknote className="h-3 w-3" /> Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('momo')}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded border text-xs font-medium transition ${
                        paymentMethod === 'momo'
                          ? 'border-[#2E7D32] bg-white text-[#2E7D32] shadow-xs'
                          : 'border-gray-300 bg-white text-gray-600'
                      }`}
                    >
                      <CreditCard className="h-3 w-3" /> MoMo
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    Amount Received (RWF)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={grandTotalRwf}
                    placeholder={`e.g. ${grandTotalRwf}`}
                    value={paymentAmountRwf}
                    onChange={(e) =>
                      setPaymentAmountRwf(
                        e.target.value === '' ? '' : parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs font-semibold text-gray-900 bg-white focus:border-[#2E7D32] focus:outline-none"
                  />
                  {effectivePaymentAmount < grandTotalRwf && (
                    <div className="text-[10px] text-amber-600 mt-0.5">
                      Pending balance: RWF{' '}
                      {(grandTotalRwf - effectivePaymentAmount).toLocaleString()}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    Reference / Notes
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder={paymentMethod === 'momo' ? 'TxID' : 'Counter cash'}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs text-gray-900 bg-white focus:border-[#2E7D32] focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
              Internal Order Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Scheduled for delivery to Village 4 or customer picked up in person"
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-[#2E7D32] focus:outline-none"
            />
          </div>

          {/* Modal Footer */}
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
              className="rounded-lg bg-[#2E7D32] px-6 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50 transition shadow-xs flex items-center gap-1.5"
            >
              {submitting ? 'Confirming Sale...' : 'Confirm Sale & Deduct Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
