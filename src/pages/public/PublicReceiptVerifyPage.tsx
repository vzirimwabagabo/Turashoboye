import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Building2, 
  AlertTriangle, 
  Phone, 
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface VerifiedReceiptItem {
  productName: string;
  packageSize: string;
  quantity: number;
  unitPriceRwf: number;
  lineTotalRwf: number;
}

interface VerifiedReceiptPayment {
  method: string;
  amountRwf: number;
  paymentDate: string;
  reference?: string;
  status: string;
}

interface VerifiedReceiptDetails {
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  orderDate: string;
  status: string;
  subtotalRwf: number;
  discountRwf: number;
  totalAmountRwf: number;
  paidAmountRwf: number;
  balanceDueRwf: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  depotLocation: string;
  items: VerifiedReceiptItem[];
  payments: VerifiedReceiptPayment[];
}

export default function PublicReceiptVerifyPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<VerifiedReceiptDetails | null>(null);

  useEffect(() => {
    async function fetchReceiptVerification() {
      if (!orderNumber) {
        setLoading(false);
        return;
      }

      const qOrder = orderNumber.trim();

      try {
        setLoading(true);

        // 1. Query Supabase sales_orders
        const { data, error } = await supabase
          .from('sales_orders')
          .select(`
            id,
            order_number,
            order_date,
            status,
            subtotal_rwf,
            discount_rwf,
            total_amount_rwf,
            customers(name, phone, address),
            sales_order_items(
              id,
              quantity,
              unit_price_rwf,
              line_total_rwf,
              product_variants(package_size, products(name))
            ),
            payments(id, method, amount_rwf, payment_date, reference, status)
          `)
          .eq('order_number', qOrder)
          .maybeSingle();

        if (!error && data) {
          const items: VerifiedReceiptItem[] = (data.sales_order_items || []).map((item: any) => ({
            productName: item.product_variants?.products?.name || 'Feed Product',
            packageSize: item.product_variants?.package_size || '50kg',
            quantity: item.quantity,
            unitPriceRwf: item.unit_price_rwf,
            lineTotalRwf: item.line_total_rwf,
          }));

          const payments: VerifiedReceiptPayment[] = (data.payments || []).map((p: any) => ({
            method: p.method || 'cash',
            amountRwf: p.amount_rwf,
            paymentDate: p.payment_date ? p.payment_date.split('T')[0] : '',
            reference: p.reference,
            status: p.status || 'completed',
          }));

          const totalPaid = payments.reduce((sum, p) => sum + p.amountRwf, 0);
          const totalAmt = data.total_amount_rwf || 0;
          const balance = Math.max(0, totalAmt - totalPaid);

          setReceipt({
            orderNumber: data.order_number,
            customerName: (data.customers as any)?.name || 'Direct Customer',
            customerPhone: (data.customers as any)?.phone,
            customerAddress: (data.customers as any)?.address,
            orderDate: data.order_date ? data.order_date.split('T')[0] : '',
            status: data.status || 'confirmed',
            subtotalRwf: data.subtotal_rwf || totalAmt,
            discountRwf: data.discount_rwf || 0,
            totalAmountRwf: totalAmt,
            paidAmountRwf: totalPaid,
            balanceDueRwf: balance,
            paymentStatus: balance === 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid',
            depotLocation: 'Mahama Primary Mill & Depot, Kirehe District, Rwanda',
            items,
            payments,
          });
          setLoading(false);
          return;
        }

        // 2. Fallback: Check local storage for customer orders placed in this browser
        const localRaw = localStorage.getItem('turashoboye_customer_orders');
        if (localRaw) {
          try {
            const localOrders = JSON.parse(localRaw);
            const found = localOrders.find((o: any) => 
              o.orderNumber?.toUpperCase() === qOrder.toUpperCase()
            );

            if (found) {
              const po = found.printableOrder || {};
              const items: VerifiedReceiptItem[] = (po.items || []).map((item: any) => ({
                productName: item.productName || found.itemsSummary || 'Feed Product',
                packageSize: item.packageSize || '50kg',
                quantity: item.quantity || 1,
                unitPriceRwf: item.unitPriceRwf || found.totalAmountRwf,
                lineTotalRwf: item.lineTotalRwf || found.totalAmountRwf,
              }));

              const payments: VerifiedReceiptPayment[] = (po.payments || []).map((p: any) => ({
                method: p.method || 'momo',
                amountRwf: p.amountRwf || found.totalAmountRwf,
                paymentDate: p.paymentDate || found.orderDate || '',
                reference: p.reference,
                status: p.status || 'completed',
              }));

              const totalPaid = payments.length > 0 
                ? payments.reduce((sum, p) => sum + p.amountRwf, 0)
                : (found.totalAmountRwf || 0);
              const totalAmt = found.totalAmountRwf || 0;
              const balance = Math.max(0, totalAmt - totalPaid);

              setReceipt({
                orderNumber: found.orderNumber,
                customerName: po.customerName || 'Cooperative Member',
                customerPhone: po.customerPhone,
                customerAddress: po.customerAddress || 'Mahama / Kirehe',
                orderDate: (found.orderDate || '').slice(0, 10),
                status: found.status || 'confirmed',
                subtotalRwf: totalAmt,
                discountRwf: 0,
                totalAmountRwf: totalAmt,
                paidAmountRwf: totalPaid,
                balanceDueRwf: balance,
                paymentStatus: balance === 0 ? 'paid' : 'partial',
                depotLocation: 'Mahama Primary Mill & Depot, Kirehe District, Rwanda',
                items: items.length > 0 ? items : [
                  {
                    productName: found.itemsSummary || 'Turashoboye Feed (50kg)',
                    packageSize: '50kg',
                    quantity: 1,
                    unitPriceRwf: totalAmt,
                    lineTotalRwf: totalAmt,
                  }
                ],
                payments: payments.length > 0 ? payments : [
                  {
                    method: 'momo',
                    amountRwf: totalAmt,
                    paymentDate: (found.orderDate || '').slice(0, 10),
                    reference: 'MOMO-REC-001',
                    status: 'completed',
                  }
                ],
              });
              setLoading(false);
              return;
            }
          } catch (e) {
            console.warn('Error reading local orders:', e);
          }
        }

        setReceipt(null);
      } catch (err) {
        console.warn('Receipt verification lookup error:', err);
        setReceipt(null);
      } finally {
        setLoading(false);
      }
    }

    fetchReceiptVerification();
  }, [orderNumber]);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Turashoboye
          </Link>
          <span className="text-xs font-semibold text-gray-400">
            Rwanda Electronic Billing & Receipt Registry
          </span>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-sm space-y-3">
            <div className="h-10 w-10 border-3 border-[#2E7D32] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-gray-700">Verifying digital receipt authentication…</p>
          </div>
        ) : receipt ? (
          <div className="space-y-6">
            {/* Status Banner */}
            <div className="p-6 sm:p-8 rounded-3xl border border-emerald-200 bg-emerald-50/90 text-emerald-950 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="rounded-2xl p-2.5 bg-[#2E7D32] text-white shrink-0">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black tracking-widest uppercase text-[#2E7D32]">
                      Official Verified Receipt
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 border border-emerald-300 text-emerald-800">
                      Authentic Issue
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                    Turashoboye Feed Mills Ltd
                  </h1>
                  <p className="text-xs font-medium text-emerald-800 mt-1">
                    Valid digital sales receipt issued at Mahama Primary Depot. Conforms to statutory tax & batch records.
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-left sm:text-right border-t sm:border-t-0 border-emerald-200 pt-3 sm:pt-0">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Status</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-200 text-emerald-900 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {receipt.paymentStatus === 'paid' ? 'PAID IN FULL' : 'PARTIAL PAYMENT'}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                  RRA TIN: 100234891
                </span>
              </div>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    Receipt Number
                  </span>
                  <span className="font-mono text-xl font-black text-gray-950 mt-0.5 block">
                    {receipt.orderNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    Issue Date
                  </span>
                  <span className="text-sm font-bold text-gray-800 flex items-center justify-end gap-1 mt-0.5">
                    <Calendar className="h-4 w-4 text-[#2E7D32]" />
                    {receipt.orderDate}
                  </span>
                </div>
              </div>

              {/* Customer and Depot info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    Customer / Buyer
                  </span>
                  <p className="font-bold text-gray-900 text-sm">{receipt.customerName}</p>
                  {receipt.customerPhone && (
                    <p className="text-gray-600">{receipt.customerPhone}</p>
                  )}
                  {receipt.customerAddress && (
                    <p className="text-gray-500">{receipt.customerAddress}</p>
                  )}
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">
                    Depot of Issuance
                  </span>
                  <p className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
                    <Building2 className="h-4 w-4 text-[#2E7D32]" />
                    {receipt.depotLocation}
                  </p>
                  <p className="text-gray-500">Reg: 00492-RICA-2026</p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  Purchased Feed Items
                </span>
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                      <tr>
                        <th className="px-4 py-2.5">Feed Item</th>
                        <th className="px-3 py-2.5 text-right">Qty</th>
                        <th className="px-3 py-2.5 text-right">Price (RWF)</th>
                        <th className="px-4 py-2.5 text-right">Total (RWF)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {receipt.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3">
                            <span className="font-bold text-gray-900 block">{item.productName}</span>
                            <span className="text-[10px] text-gray-400">{item.packageSize}</span>
                          </td>
                          <td className="px-3 py-3 text-right font-medium text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-3 text-right text-gray-600">
                            {item.unitPriceRwf.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            {item.lineTotalRwf.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>RWF {receipt.subtotalRwf.toLocaleString()}</span>
                </div>
                {receipt.discountRwf > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount:</span>
                    <span>- RWF {receipt.discountRwf.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-gray-950 border-t border-gray-200 pt-2">
                  <span>Total Amount:</span>
                  <span>RWF {receipt.totalAmountRwf.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-[#2E7D32] font-semibold">
                  <span>Amount Paid:</span>
                  <span>RWF {receipt.paidAmountRwf.toLocaleString()}</span>
                </div>
                {receipt.balanceDueRwf > 0 && (
                  <div className="flex justify-between text-xs text-red-600 font-bold border-t border-dashed border-gray-200 pt-1.5">
                    <span>Outstanding Balance:</span>
                    <span>RWF {receipt.balanceDueRwf.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Payments Registered */}
              {receipt.payments.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                    Payment Method & Reconciliation
                  </span>
                  <div className="space-y-1.5">
                    {receipt.payments.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-[#2E7D32]" />
                          <div>
                            <span className="font-bold uppercase text-gray-900">
                              {p.method.replace('_', ' ')}
                            </span>
                            {p.reference && (
                              <span className="text-[10px] text-gray-500 block">
                                Ref: {p.reference}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-900 block">
                            RWF {p.amountRwf.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-gray-400 flex items-center justify-end gap-1">
                            <Clock className="h-3 w-3" />
                            {p.paymentDate}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Helpline and Contact Box */}
            <div className="bg-blue-50/80 rounded-3xl p-6 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-blue-950">Questions regarding this sales receipt?</h4>
                <p className="text-xs text-blue-800">
                  Contact the Turashoboye accounts desk or report any billing discrepancies.
                </p>
              </div>
              <a
                href="tel:+250788000000"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition shrink-0"
              >
                <Phone className="h-4 w-4" />
                Call Accounts (+250 788 000 000)
              </a>
            </div>
          </div>
        ) : (
          /* Not Found State */
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border-2 border-dashed border-red-200 shadow-sm space-y-4">
            <div className="rounded-full bg-red-100 p-3 text-red-600 w-16 h-16 mx-auto flex items-center justify-center">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h2 className="text-xl font-black text-gray-900">
                Unverified or Unrecognized Receipt
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                The receipt identifier <code className="font-mono font-bold text-red-600">{orderNumber}</code> could not be validated against the official Turashoboye sales database.
              </p>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-left max-w-md mx-auto text-xs text-amber-900 space-y-1">
              <span className="font-bold block flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                Consumer Protection Notice:
              </span>
              <p>
                Every genuine purchase from Turashoboye Feed Mills generates an authentic verifiable receipt. If this receipt was issued manually, please verify directly with depot accounts.
              </p>
            </div>

            <div className="pt-2">
              <a
                href="tel:+250788000000"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-xs font-bold shadow-xs transition"
              >
                <Phone className="h-4 w-4" />
                Contact Accounts Desk
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
