import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Layers, ShieldCheck, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LotRow {
  id: string;
  lot_number: string;
  supplier_name: string;
  ingredient_name: string;
  received_quantity: number;
  unit_name: string;
  expiry_date?: string;
  status: 'available' | 'depleted' | 'held' | 'rejected';
  created_at: string;
}

const SAMPLE_LOTS: LotRow[] = [
  {
    id: 'lot-1',
    lot_number: 'LOT-SOYA-20261015-01',
    supplier_name: 'Eastern Agribusiness Co-operative Ltd',
    ingredient_name: 'Raw Soya Beans (Grain Grade)',
    received_quantity: 5000,
    unit_name: 'kg',
    expiry_date: '2027-04-15',
    status: 'available',
    created_at: '2026-10-15',
  },
  {
    id: 'lot-2',
    lot_number: 'LOT-MAIZE-20261016-02',
    supplier_name: 'Kirehe Grain Aggregators Ltd',
    ingredient_name: 'Yellow Feed Maize (Cleaned)',
    received_quantity: 8000,
    unit_name: 'kg',
    expiry_date: '2027-01-16',
    status: 'available',
    created_at: '2026-10-16',
  },
  {
    id: 'lot-3',
    lot_number: 'LOT-PREMIX-20261010-01',
    supplier_name: 'Kigali Veterinary & Feed Supplements Ltd',
    ingredient_name: 'Layer Vitamin-Mineral Premix 2.5%',
    received_quantity: 250,
    unit_name: 'kg',
    expiry_date: '2027-10-10',
    status: 'held', // Quality hold pending lab CoA verification
    created_at: '2026-10-10',
  },
];

export default function LotsPage() {
  const [lots, setLots] = useState<LotRow[]>(SAMPLE_LOTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLots = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('ingredient_lots')
          .select(`
            id,
            lot_number,
            received_quantity,
            expiry_date,
            status,
            created_at,
            suppliers(name),
            product_variants(products(name)),
            units_of_measure(name)
          `);

        if (!error && data && data.length > 0) {
          const formatted: LotRow[] = data.map((d: any) => ({
            id: d.id,
            lot_number: d.lot_number,
            supplier_name: d.suppliers?.name || 'Local Supplier',
            ingredient_name: d.product_variants?.products?.name || 'Raw Material',
            received_quantity: d.received_quantity,
            unit_name: d.units_of_measure?.name || 'kg',
            expiry_date: d.expiry_date,
            status: d.status,
            created_at: d.created_at ? d.created_at.split('T')[0] : '',
          }));
          setLots(formatted);
        }
      } catch (err) {
        console.warn('Using baseline lots data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLots();
  }, []);

  const filteredLots = lots.filter(
    (l) =>
      l.lot_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ingredient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/inventory"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#2E7D32] mb-1 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Stock Ledger
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Ingredient Lots & Raw Materials
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Source-to-mill traceability records for incoming supplier lots and raw ingredients.
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search lot number, ingredient, or supplier..."
            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
          />
        </div>
      </div>

      {/* Lots Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Lot Identifier</th>
                <th className="px-5 py-3.5">Raw Ingredient</th>
                <th className="px-5 py-3.5">Supplier Name</th>
                <th className="px-5 py-3.5">Received Qty</th>
                <th className="px-5 py-3.5">Expiry Date</th>
                <th className="px-5 py-3.5">Quality Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    Loading lots...
                  </td>
                </tr>
              ) : filteredLots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    <Layers className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    No ingredient lots found.
                  </td>
                </tr>
              ) : (
                filteredLots.map((lot) => (
                  <tr key={lot.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-gray-900 text-xs">
                      {lot.lot_number}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-800">
                      {lot.ingredient_name}
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs">
                      {lot.supplier_name}
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-900">
                      {lot.received_quantity.toLocaleString()} {lot.unit_name}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {lot.expiry_date ? (
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-gray-400" />
                          {lot.expiry_date}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {lot.status === 'available' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <ShieldCheck size={12} /> Available
                        </span>
                      )}
                      {lot.status === 'held' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          <AlertCircle size={12} /> Quality Hold
                        </span>
                      )}
                      {lot.status === 'depleted' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Depleted
                        </span>
                      )}
                      {lot.status === 'rejected' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          Rejected
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
