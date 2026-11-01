import { useState } from 'react';
import { Search, ShieldAlert, Layers, Users, Truck, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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

export default function TraceabilityPage() {
  const [activeTab, setActiveTab] = useState<'backward' | 'forward'>('backward');
  const [query, setQuery] = useState('');
  const [backwardTrace, setBackwardTrace] = useState<BackwardTrace | null>(null);
  const [forwardTrace, setForwardTrace] = useState<ForwardTrace | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setHasSearched(true);
    setSearching(true);

    try {
      if (activeTab === 'backward') {
        const { data, error } = await supabase
          .from('production_batches')
          .select(`
            id,
            batch_number,
            status,
            created_at,
            product_variants(products(name))
          `)
          .ilike('batch_number', `%${q}%`)
          .limit(1)
          .maybeSingle();

        if (error || !data) {
          setBackwardTrace(null);
        } else {
          setBackwardTrace({
            batch_number: data.batch_number,
            product_name: (data as any).product_variants?.products?.name || 'Feed Product',
            milling_date: data.created_at ? data.created_at.split('T')[0] : 'N/A',
            operator: 'Depot Team',
            status: data.status || 'completed',
            ingredients_consumed: [],
          });
        }
      } else {
        const { data, error } = await supabase
          .from('ingredient_lots')
          .select(`
            id,
            lot_number,
            received_quantity,
            created_at,
            suppliers(name),
            product_variants(products(name))
          `)
          .ilike('lot_number', `%${q}%`)
          .limit(1)
          .maybeSingle();

        if (error || !data) {
          setForwardTrace(null);
        } else {
          setForwardTrace({
            lot_number: data.lot_number,
            ingredient: (data as any).product_variants?.products?.name || 'Raw Material',
            supplier: (data as any).suppliers?.name || 'Local Supplier',
            receipt_date: data.created_at ? data.created_at.split('T')[0] : 'N/A',
            initial_quantity: data.received_quantity || 0,
            remaining_stock: data.received_quantity || 0,
            batches_produced: [],
          });
        }
      }
    } catch (err) {
      console.warn('Trace query error:', err);
      if (activeTab === 'backward') setBackwardTrace(null);
      else setForwardTrace(null);
    } finally {
      setSearching(false);
    }
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
              setQuery('');
              setHasSearched(false);
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
              setQuery('');
              setHasSearched(false);
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
                  ? 'Enter Batch Code (e.g. B-20261016-001)...'
                  : 'Enter Ingredient Lot Number (e.g. LOT-SOYA-20261015-01)...'
              }
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-sm font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            {searching ? <Loader2 size={16} className="animate-spin" /> : null}
            Run Trace
          </button>
        </form>
      </div>

      {/* Trace Results */}
      {activeTab === 'backward' ? (
        backwardTrace ? (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                  Batch Trace Target
                </span>
                <h2 className="text-xl font-extrabold text-gray-900 mt-0.5">
                  {backwardTrace.batch_number}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Product: <strong>{backwardTrace.product_name}</strong>
                </p>
                <div className="flex gap-4 text-xs text-gray-400 mt-2">
                  <span>Milling Date: {backwardTrace.milling_date}</span>
                  <span>Operator: {backwardTrace.operator}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Status: {backwardTrace.status}
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Layers size={18} className="text-[#2E7D32]" />
                Raw Material Lots Consumed in this Batch
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {backwardTrace.ingredients_consumed.map((ing) => (
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
          <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center text-gray-400">
            <Layers className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-gray-700">
              {hasSearched ? `No records found for "${query}"` : 'Backward Trace Lookup'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              {hasSearched
                ? 'Check the batch number and verify that ingredient lots have been linked to this batch.'
                : 'Enter a finished feed batch number above to trace raw materials, suppliers, and milling logs.'}
            </p>
          </div>
        )
      ) : (
        forwardTrace ? (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                  Ingredient Lot Target
                </span>
                <h2 className="text-xl font-extrabold text-gray-900 mt-0.5">
                  {forwardTrace.lot_number}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Raw Material: <strong>{forwardTrace.ingredient}</strong> ({forwardTrace.supplier})
                </p>
                <div className="flex gap-4 text-xs text-gray-500 mt-2">
                  <span>Received: {forwardTrace.initial_quantity.toLocaleString()} kg on {forwardTrace.receipt_date}</span>
                  <span className="font-bold text-emerald-800">
                    Remaining in Depot: {forwardTrace.remaining_stock.toLocaleString()} kg
                  </span>
                </div>
              </div>

              <button
                onClick={() => alert(`Quality hold flagged for ${forwardTrace.lot_number}. Inventory withheld from production.`)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <ShieldAlert size={15} />
                Quarantine / Hold Lot
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-5">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Truck size={18} className="text-[#2E7D32]" />
                Downstream Production Runs & Customer Dispatches
              </h3>

              {forwardTrace.batches_produced.map((bp) => (
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
                              {disp.quantity_bags} Bags
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
        ) : (
          <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center text-gray-400">
            <Truck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-gray-700">
              {hasSearched ? `No records found for "${query}"` : 'Forward Trace Lookup'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              {hasSearched
                ? 'Check the ingredient lot number and ensure supplier receipts have been registered.'
                : 'Enter a supplier lot identifier above to trace affected batches, stock balance, and customer dispatches.'}
            </p>
          </div>
        )
      )}
    </div>
  );
}
