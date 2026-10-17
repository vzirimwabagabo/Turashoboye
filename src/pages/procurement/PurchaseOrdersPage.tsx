import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, ClipboardList, CheckCircle, PackageCheck, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface PurchaseOrderItem {
  id: string;
  po_number: string;
  supplier_name: string;
  status: 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
  order_date: string;
  expected_delivery?: string;
  item_name: string;
  ordered_quantity: number;
  received_quantity: number;
  unit_price_rwf: number;
  total_amount_rwf: number;
}

const SAMPLE_POS: PurchaseOrderItem[] = [
  {
    id: 'po-1',
    po_number: 'PO-20261014-001',
    supplier_name: 'Eastern Agribusiness Co-operative Ltd',
    status: 'received',
    order_date: '2026-10-14',
    expected_delivery: '2026-10-15',
    item_name: 'Raw Soya Beans (Grain Grade)',
    ordered_quantity: 5000,
    received_quantity: 5000,
    unit_price_rwf: 750,
    total_amount_rwf: 3750000,
  },
  {
    id: 'po-2',
    po_number: 'PO-20261016-002',
    supplier_name: 'Kirehe Grain Aggregators Ltd',
    status: 'ordered',
    order_date: '2026-10-16',
    expected_delivery: '2026-10-18',
    item_name: 'Yellow Feed Maize (Cleaned)',
    ordered_quantity: 8000,
    received_quantity: 0,
    unit_price_rwf: 420,
    total_amount_rwf: 3360000,
  },
  {
    id: 'po-3',
    po_number: 'PO-20261017-003',
    supplier_name: 'Kigali Veterinary & Feed Supplements Ltd',
    status: 'draft',
    order_date: '2026-10-17',
    expected_delivery: '2026-10-22',
    item_name: 'Broiler Starter Vitamin Premix',
    ordered_quantity: 300,
    received_quantity: 0,
    unit_price_rwf: 3500,
    total_amount_rwf: 1050000,
  },
];

export default function PurchaseOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrderItem[]>(SAMPLE_POS);
  const [filterStatus, setFilterStatus] = useState('all');

  // Create PO Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('Eastern Agribusiness Co-operative Ltd');
  const [itemName, setItemName] = useState('Yellow Feed Maize');
  const [quantity, setQuantity] = useState<number>(2000);
  const [unitPrice, setUnitPrice] = useState<number>(450);

  // Goods Receipt Modal state
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderItem | null>(null);
  const [receivedQty, setReceivedQty] = useState<number>(0);
  const [supplierLot, setSupplierLot] = useState('');
  const [expiryDate, setExpiryDate] = useState('2027-10-17');
  const [receiving, setReceiving] = useState(false);

  const canManage = ['inventory', 'manager', 'owner'].includes(user?.profile?.role || '');

  const handleCreatePO = (e: FormEvent) => {
    e.preventDefault();
    const newPO: PurchaseOrderItem = {
      id: `po-${Date.now()}`,
      po_number: `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      supplier_name: supplierName,
      status: 'ordered',
      order_date: new Date().toISOString().slice(0, 10),
      item_name: itemName,
      ordered_quantity: quantity,
      received_quantity: 0,
      unit_price_rwf: unitPrice,
      total_amount_rwf: quantity * unitPrice,
    };
    setOrders((prev) => [newPO, ...prev]);
    setCreateModalOpen(false);
  };

  const handleOpenReceipt = (po: PurchaseOrderItem) => {
    setSelectedPO(po);
    setReceivedQty(po.ordered_quantity - po.received_quantity);
    setSupplierLot(`SUP-${po.po_number.slice(-3)}-LOT1`);
    setReceiptModalOpen(true);
  };

  const handleConfirmReceipt = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;
    setReceiving(true);

    setTimeout(() => {
      setOrders((prev) =>
        prev.map((po) =>
          po.id === selectedPO.id
            ? {
                ...po,
                received_quantity: po.received_quantity + receivedQty,
                status: po.received_quantity + receivedQty >= po.ordered_quantity ? 'received' : 'partially_received',
              }
            : po
        )
      );
      setReceiving(false);
      setReceiptModalOpen(false);
    }, 400);
  };

  const filtered = orders.filter((o) => filterStatus === 'all' || o.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Procurement & Purchase Orders
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Issue supplier purchase orders, track deliveries, and log validated goods receipts into the stock ledger.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#2E7D32] hover:bg-[#256b29] text-white text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus size={18} />
            Create Purchase Order
          </button>
        )}
      </div>

      {/* Filter / Status Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3 text-sm">
        {['all', 'ordered', 'partially_received', 'received', 'draft'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3.5 py-1.5 rounded-lg font-medium capitalize text-xs transition-colors ${
              filterStatus === st
                ? 'bg-[#2E7D32] text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">PO Number</th>
                <th className="px-5 py-3.5">Supplier</th>
                <th className="px-5 py-3.5">Raw Material</th>
                <th className="px-5 py-3.5">Ordered / Received</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-gray-900 text-xs">
                    <div>
                      <span>{po.po_number}</span>
                      <span className="block text-[11px] text-gray-400 font-normal">
                        Date: {po.order_date}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-gray-900 text-xs">
                    {po.supplier_name}
                  </td>
                  <td className="px-5 py-4 text-gray-800 text-xs font-semibold">
                    {po.item_name}
                  </td>
                  <td className="px-5 py-4 text-xs font-medium text-gray-700">
                    <span className="font-bold text-gray-900">
                      {po.received_quantity.toLocaleString()} kg
                    </span>{' '}
                    / {po.ordered_quantity.toLocaleString()} kg
                  </td>
                  <td className="px-5 py-4 font-extrabold text-[#2E7D32] text-xs">
                    {po.total_amount_rwf.toLocaleString()} RWF
                  </td>
                  <td className="px-5 py-4">
                    {po.status === 'ordered' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        Ordered (Awaiting)
                      </span>
                    )}
                    {po.status === 'partially_received' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        Partial Receipt
                      </span>
                    )}
                    {po.status === 'received' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle size={12} /> Received
                      </span>
                    )}
                    {po.status === 'draft' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {canManage && po.status !== 'received' && po.status !== 'cancelled' ? (
                      <button
                        onClick={() => handleOpenReceipt(po)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#2E7D32] bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                      >
                        <PackageCheck size={13} />
                        Receive Goods
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create PO Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Create Purchase Order</h2>
              <button onClick={() => setCreateModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreatePO} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Supplier / Vendor *
                </label>
                <select
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                >
                  <option value="Eastern Agribusiness Co-operative Ltd">Eastern Agribusiness Co-operative Ltd</option>
                  <option value="Kirehe Grain Aggregators Ltd">Kirehe Grain Aggregators Ltd</option>
                  <option value="Kigali Veterinary & Feed Supplements Ltd">Kigali Veterinary & Feed Supplements Ltd</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Raw Material Item *
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Cleaned Yellow Feed Maize"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Ordered Quantity (kg) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Unit Purchase Price (RWF/kg) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">Estimated PO Total:</span>
                <span className="font-extrabold text-[#2E7D32] text-base">
                  {(quantity * unitPrice).toLocaleString()} RWF
                </span>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-sm font-semibold shadow-xs"
                >
                  Confirm & Issue PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Goods Receipt Modal */}
      {receiptModalOpen && selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Record Physical Goods Receipt</h2>
                <p className="text-xs text-gray-500">Posting a receipt allocates an ingredient lot and increases warehouse inventory.</p>
              </div>
              <button onClick={() => setReceiptModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleConfirmReceipt} className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 space-y-1">
                <p className="font-bold">Purchase Order: {selectedPO.po_number}</p>
                <p>Material: {selectedPO.item_name} from {selectedPO.supplier_name}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Actual Quantity Received (kg) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={receivedQty}
                    onChange={(e) => setReceivedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Supplier Lot / Batch Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierLot}
                    onChange={(e) => setSupplierLot(e.target.value)}
                    placeholder="e.g. SUP-LOT-889"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
                <ClipboardList size={16} className="text-[#2E7D32] flex-shrink-0 mt-0.5" />
                <span>
                  This receipt will automatically generate internal lot code <strong>LOT-{selectedPO.item_name.slice(0, 4).toUpperCase()}-AUTO</strong> and atomically record a stock movement at Mahama Primary Feed Depot.
                </span>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReceiptModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={receiving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-sm font-semibold shadow-xs disabled:opacity-50"
                >
                  {receiving ? <Loader2 className="animate-spin w-4 h-4" /> : null}
                  Confirm & Log Inventory Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
