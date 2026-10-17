import { useRef } from 'react';
import { X, Printer, CheckCircle, ShieldCheck } from 'lucide-react';
import type { SalesOrder } from '../../types/database';

export interface PrintableOrderItem {
  productName: string;
  sku: string;
  packageSize: string;
  batchNumber?: string;
  quantity: number;
  unitPriceRwf: number;
  discountRwf: number;
  lineTotalRwf: number;
}

export interface PrintablePayment {
  method: string;
  amountRwf: number;
  paymentDate: string;
  reference?: string;
  status: string;
}

export interface PrintableOrder extends SalesOrder {
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: PrintableOrderItem[];
  payments: PrintablePayment[];
  staffName?: string;
}

interface OrderReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PrintableOrder | null;
}

export default function OrderReceiptModal({ isOpen, onClose, order }: OrderReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const totalPaidRwf = order.payments?.reduce((sum, p) => sum + p.amountRwf, 0) || 0;
  const balanceDueRwf = Math.max(0, order.total - totalPaidRwf);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-gray-100 my-8 overflow-hidden">
        {/* Top toolbar */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3 bg-gray-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Official Sales Receipt</span>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-[#2E7D32]">
              {order.status.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2E7D32] px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800 transition shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div ref={printRef} className="p-8 space-y-6 text-gray-800 bg-white">
          {/* Header */}
          <div className="border-b border-gray-200 pb-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2E7D32] text-xs font-black text-white">
                TF
              </div>
              <h1 className="text-xl font-black tracking-tight text-gray-900">
                TURASHOBOYE FEEDS
              </h1>
            </div>
            <p className="text-xs font-medium text-gray-600">
              Quality Animal Feeds & Nutrition
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Mahama Refugee Camp & Kirehe District, Eastern Province, Rwanda
            </p>
            <p className="text-[11px] text-gray-500">
              Phone: +250 788 000 000 | Email: sales@turashoboye.rw
            </p>
          </div>

          {/* Receipt Info Meta */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">
                Customer / Buyer
              </p>
              <p className="font-bold text-gray-900 text-sm mt-0.5">{order.customerName}</p>
              {order.customerPhone && (
                <p className="text-gray-600">{order.customerPhone}</p>
              )}
              {order.customerAddress && (
                <p className="text-gray-500">{order.customerAddress}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">
                Order Details
              </p>
              <p className="font-mono font-bold text-gray-900 mt-0.5">{order.orderNumber}</p>
              <p className="text-gray-600">Date: {new Date(order.orderDate).toLocaleDateString()}</p>
              <p className="text-gray-500">
                Served by: {order.staffName || 'Staff Member'}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border rounded-lg border-gray-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2">Item & Package</th>
                  <th className="px-3 py-2">Batch / Lot</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Price (RWF)</th>
                  <th className="px-3 py-2 text-right">Total (RWF)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-gray-900">{item.productName}</div>
                      <div className="text-[10px] text-gray-500">
                        {item.packageSize} ({item.sku})
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {item.batchNumber ? (
                        <span className="font-mono text-[10px] font-medium bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">
                          {item.batchNumber}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">Standard</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600">
                      {item.unitPriceRwf.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                      {item.lineTotalRwf.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals and Payment Summary */}
          <div className="grid grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <p className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] mb-1.5">
                Payments Logged
              </p>
              {order.payments && order.payments.length > 0 ? (
                <div className="space-y-1">
                  {order.payments.map((p, pIdx) => (
                    <div
                      key={pIdx}
                      className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-100"
                    >
                      <div>
                        <span className="font-semibold uppercase text-gray-800">
                          {p.method.replace('_', ' ')}
                        </span>
                        {p.reference && (
                          <span className="text-[10px] text-gray-500 block">
                            Ref: {p.reference}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-gray-900">
                        RWF {p.amountRwf.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic">No payments recorded yet.</p>
              )}
            </div>

            <div className="space-y-1.5 text-right">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>RWF {order.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-gray-900 border-t border-gray-200 pt-1.5">
                <span>Order Total:</span>
                <span>RWF {order.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-green-700 font-semibold">
                <span>Amount Paid:</span>
                <span>RWF {totalPaidRwf.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-gray-900 border-t border-dashed border-gray-300 pt-1.5">
                <span>Balance Due:</span>
                <span className={balanceDueRwf > 0 ? 'text-red-600' : 'text-[#2E7D32]'}>
                  RWF {balanceDueRwf.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Traceability and Assurance Footer */}
          <div className="border-t border-gray-200 pt-4 text-[10px] text-gray-500 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#2E7D32]" />
              <span>Full batch traceability recorded. Keep this receipt for feed records.</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Turashoboye Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
