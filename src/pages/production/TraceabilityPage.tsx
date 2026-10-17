import { useState } from 'react';
import { Search, ShieldAlert, Layers, Users, Truck } from 'lucide-react';

interface BackwardTrace {
  batch_number: string;
  product_name: string;
  milling_date: string;
  operator: string;
  status: string;
  ingredients_consumed: {
    lot_number: string;
    ingredient: string;
    supplier: string;
    quantity_used: number;
    unit: string;
    receipt_date: string;
  }[];
}

interface ForwardTrace {
  lot_number: string;
  ingredient: string;
  supplier: string;
  receipt_date: string;
  initial_quantity: number;
  remaining_stock: number;
  batches_produced: {
    batch_number: string;
    product_name: string;
    output_quantity: number;
    milling_date: string;
    dispatches: {
      order_number: string;
      customer_name: string;
      customer_phone: string;
      quantity_bags: number;
      order_date: string;
    }[];
  }[];
}

const SAMPLE_BACKWARD: BackwardTrace = {
  batch_number: 'BATCH-20261016-001',
  product_name: 'Turashoboye Broiler Starter Mash (50kg)',
  milling_date: '2026-10-16',
  operator: 'Jean Claude Ndayisaba',
  status: 'completed',
  ingredients_consumed: [
    {
      lot_number: 'LOT-MAIZE-20261016-02',
      ingredient: 'Yellow Feed Maize (Cleaned)',
      supplier: 'Kirehe Grain Aggregators Ltd',
      quantity_used: 1120,
      unit: 'kg',
      receipt_date: '2026-10-16',
    },
    {
      lot_number: 'LOT-SOYA-20261015-01',
      ingredient: 'Raw Soya Beans (Grain Grade)',
      supplier: 'Eastern Agribusiness Co-operative Ltd',
      quantity_used: 680,
      unit: 'kg',
      receipt_date: '2026-10-15',
    },
    {
      lot_number: 'LOT-PREMIX-20261010-01',
      ingredient: 'Broiler Starter Vitamin-Mineral Premix 2.5%',
      supplier: 'Kigali Veterinary & Feed Supplements Ltd',
      quantity_used: 50,
      unit: 'kg',
      receipt_date: '2026-10-10',
    },
  ],
};

const SAMPLE_FORWARD: ForwardTrace = {
  lot_number: 'LOT-SOYA-20261015-01',
  ingredient: 'Raw Soya Beans (Grain Grade)',
  supplier: 'Eastern Agribusiness Co-operative Ltd',
  receipt_date: '2026-10-15',
  initial_quantity: 5000,
  remaining_stock: 4320,
  batches_produced: [
    {
      batch_number: 'BATCH-20261016-001',
      product_name: 'Turashoboye Broiler Starter Mash (50kg)',
      output_quantity: 1960,
      milling_date: '2026-10-16',
      dispatches: [
        {
          order_number: 'ORD-20261016-012',
          customer_name: 'Gatore Poultry Farmers Co-operative',
          customer_phone: '+250 788 999 888',
          quantity_bags: 20,
          order_date: '2026-10-16',
        },
        {
          order_number: 'ORD-20261017-004',
          customer_name: 'Alexis Mugisha (Mahama Sector)',
          customer_phone: '+250 788 777 666',
          quantity_bags: 5,
          order_date: '2026-10-17',
        },
      ],
    },
  ],
};

export default function TraceabilityPage() {
  const [activeTab, setActiveTab] = useState<'backward' | 'forward'>('backward');
  const [query, setQuery] = useState('BATCH-20261016-001');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Bidirectional Feed & Batch Traceability
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Trace finished feed backward to raw ingredient lots, or trace a suspect supplier lot forward to affected customer dispatches.
        </p>
      </div>

      {/* Mode Tabs & Search Bar */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex border-b border-gray-200 gap-4">
          <button
            onClick={() => {
              setActiveTab('backward');
              setQuery('BATCH-20261016-001');
            }}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'backward'
                ? 'border-[#2E7D32] text-[#2E7D32]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Backward Trace (Batch → Ingredients)
          </button>
          <button
            onClick={() => {
              setActiveTab('forward');
              setQuery('LOT-SOYA-20261015-01');
            }}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'forward'
                ? 'border-[#2E7D32] text-[#2E7D32]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Forward Trace (Ingredient Lot → Customers & Stock)
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeTab === 'backward'
                  ? 'Enter Batch Code (e.g. BATCH-20261016-001)...'
                  : 'Enter Ingredient Lot Number (e.g. LOT-SOYA-20261015-01)...'
              }
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-sm font-semibold shadow-xs transition-colors"
          >
            Run Trace
          </button>
        </form>
      </div>

      {/* Trace Results */}
      {activeTab === 'backward' ? (
        <div className="space-y-6">
          {/* Batch Summary Card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                Batch Trace Target
              </span>
              <h2 className="text-xl font-extrabold text-gray-900 mt-0.5">
                {SAMPLE_BACKWARD.batch_number}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Product: <strong>{SAMPLE_BACKWARD.product_name}</strong>
              </p>
              <div className="flex gap-4 text-xs text-gray-400 mt-2">
                <span>Milling Date: {SAMPLE_BACKWARD.milling_date}</span>
                <span>Operator: {SAMPLE_BACKWARD.operator}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Status: Completed
              </span>
            </div>
          </div>

          {/* Consumed Ingredient Lots Tree */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Layers size={18} className="text-[#2E7D32]" />
              Raw Material Lots Consumed in this Batch
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SAMPLE_BACKWARD.ingredients_consumed.map((ing) => (
                <div
                  key={ing.lot_number}
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-gray-900">{ing.lot_number}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#2E7D32] font-bold">
                      {ing.quantity_used} {ing.unit}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-800 text-sm">{ing.ingredient}</p>
                  <p className="text-gray-500">Supplier: {ing.supplier}</p>
                  <p className="text-gray-400">Received at Depot: {ing.receipt_date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Ingredient Lot Card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                Ingredient Lot Target
              </span>
              <h2 className="text-xl font-extrabold text-gray-900 mt-0.5">
                {SAMPLE_FORWARD.lot_number}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Raw Material: <strong>{SAMPLE_FORWARD.ingredient}</strong> ({SAMPLE_FORWARD.supplier})
              </p>
              <div className="flex gap-4 text-xs text-gray-500 mt-2">
                <span>Received: {SAMPLE_FORWARD.initial_quantity.toLocaleString()} kg on {SAMPLE_FORWARD.receipt_date}</span>
                <span className="font-bold text-emerald-800">
                  Remaining in Depot: {SAMPLE_FORWARD.remaining_stock.toLocaleString()} kg
                </span>
              </div>
            </div>

            <button
              onClick={() => alert(`Quality hold flagged for ${SAMPLE_FORWARD.lot_number}. Inventory withheld from production.`)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <ShieldAlert size={15} />
              Quarantine / Hold Lot
            </button>
          </div>

          {/* Downstream Dispatches Tree */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Truck size={18} className="text-[#2E7D32]" />
              Downstream Production Runs & Customer Dispatches
            </h3>

            {SAMPLE_FORWARD.batches_produced.map((bp) => (
              <div key={bp.batch_number} className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                  <div>
                    <span className="font-mono font-bold text-gray-900 text-sm">
                      {bp.batch_number}
                    </span>
                    <span className="text-xs text-gray-600 ml-2">
                      ({bp.product_name} — {bp.output_quantity.toLocaleString()} kg yielded)
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">Produced on {bp.milling_date}</span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} className="text-[#2E7D32]" /> Dispatched Customer Orders:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {bp.dispatches.map((disp) => (
                      <div
                        key={disp.order_number}
                        className="bg-white p-3.5 rounded-xl border border-gray-200 text-xs space-y-1 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold text-gray-900">
                            {disp.order_number}
                          </span>
                          <span className="font-bold text-[#2E7D32] bg-emerald-50 px-2 py-0.5 rounded">
                            {disp.quantity_bags} Bags (1,000 kg)
                          </span>
                        </div>
                        <p className="font-semibold text-gray-800">{disp.customer_name}</p>
                        <p className="text-gray-500">Contact: {disp.customer_phone}</p>
                        <p className="text-gray-400 text-[11px]">Dispatched: {disp.order_date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
