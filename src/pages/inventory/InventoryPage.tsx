import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, AlertTriangle, Layers, ArrowUpDown, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import AdjustmentModal from '../../components/inventory/AdjustmentModal';

interface StockRow {
  variant_id: string;
  product_name: string;
  sku: string;
  package_size: string;
  unit_abbr: string;
  location_name: string;
  physical_stock_qty: number;
  available_to_sell_qty: number;
  reorder_threshold: number;
  stock_status: 'adequate' | 'low_stock' | 'out_of_stock';
}

const SAMPLE_STOCK_DATA: StockRow[] = [
  {
    variant_id: 's1',
    product_name: 'Turashoboye Broiler Starter Mash',
    sku: 'BSM-50KG',
    package_size: '50kg Bag',
    unit_abbr: 'bag_50kg',
    location_name: 'Mahama Primary Feed Depot',
    physical_stock_qty: 120,
    available_to_sell_qty: 120,
    reorder_threshold: 20,
    stock_status: 'adequate',
  },
  {
    variant_id: 's2',
    product_name: 'Turashoboye Broiler Starter Mash',
    sku: 'BSM-25KG',
    package_size: '25kg Bag',
    unit_abbr: 'bag_25kg',
    location_name: 'Mahama Primary Feed Depot',
    physical_stock_qty: 15,
    available_to_sell_qty: 15,
    reorder_threshold: 25,
    stock_status: 'low_stock',
  },
  {
    variant_id: 's3',
    product_name: 'Turashoboye Layer Complete Mash',
    sku: 'LCM-50KG',
    package_size: '50kg Bag',
    unit_abbr: 'bag_50kg',
    location_name: 'Mahama Primary Feed Depot',
    physical_stock_qty: 85,
    available_to_sell_qty: 60, // 25 bags currently held under QA inspection
    reorder_threshold: 15,
    stock_status: 'adequate',
  },
  {
    variant_id: 's4',
    product_name: 'Turashoboye Pig Grower Feed',
    sku: 'PGF-50KG',
    package_size: '50kg Bag',
    unit_abbr: 'bag_50kg',
    location_name: 'Mahama Primary Feed Depot',
    physical_stock_qty: 0,
    available_to_sell_qty: 0,
    reorder_threshold: 10,
    stock_status: 'out_of_stock',
  },
  {
    variant_id: 's5',
    product_name: 'Feed-Grade Soya Bean Meal',
    sku: 'SOYA-50KG',
    package_size: '50kg Bag',
    unit_abbr: 'bag_50kg',
    location_name: 'Mahama Primary Feed Depot',
    physical_stock_qty: 240,
    available_to_sell_qty: 240,
    reorder_threshold: 40,
    stock_status: 'adequate',
  },
];

export default function InventoryPage() {
  const { user } = useAuth();
  const [stock, setStock] = useState<StockRow[]>(SAMPLE_STOCK_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<StockRow | null>(null);
  const [loading, setLoading] = useState(false);

  const canAdjust = ['inventory', 'manager', 'owner'].includes(user?.profile?.role || '');

  useEffect(() => {
    const fetchStock = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('view_stock_on_hand').select('*');
        if (!error && data && data.length > 0) {
          setStock(data as StockRow[]);
        }
      } catch (err) {
        console.warn('Using fallback operational stock', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, []);

  const handleAdjustmentComplete = (variantId: string, newStock: number) => {
    setStock((prev) =>
      prev.map((s) =>
        s.variant_id === variantId
          ? {
              ...s,
              physical_stock_qty: newStock,
              available_to_sell_qty: newStock,
              stock_status: newStock <= 0 ? 'out_of_stock' : newStock <= s.reorder_threshold ? 'low_stock' : 'adequate',
            }
          : s
      )
    );
  };

  const filteredStock = stock.filter((row) => {
    const matchesSearch =
      row.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || row.stock_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Inventory & Stock Ledger
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time physical inventory balances and available-to-sell stock at Mahama Primary Feed Depot.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/inventory/lots"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
          >
            <Layers size={16} />
            Ingredient Lots
          </Link>
          {canAdjust && (
            <button
              onClick={() => {
                setSelectedVariant(null);
                setAdjustmentModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2E7D32] hover:bg-[#256b29] text-white text-sm font-semibold shadow-xs transition-colors"
            >
              <ArrowUpDown size={16} />
              Stock Adjustment
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Total Items Tracked</span>
            <Truck size={18} className="text-[#2E7D32]" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 mt-2">{stock.length}</p>
          <span className="text-xs text-gray-400 mt-1 block">Active SKU variants</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Low Stock Alerts</span>
            <AlertTriangle size={18} className="text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-2">
            {stock.filter((s) => s.stock_status === 'low_stock').length}
          </p>
          <span className="text-xs text-gray-400 mt-1 block">At or below reorder threshold</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Quality Holds Active</span>
            <ShieldCheck size={18} className="text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-blue-600 mt-2">
            {stock.reduce((acc, curr) => acc + (curr.physical_stock_qty - curr.available_to_sell_qty), 0)}
          </p>
          <span className="text-xs text-gray-400 mt-1 block">Units withheld from available sale</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by feed name or SKU..."
            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
          >
            <option value="all">All Stock Statuses</option>
            <option value="adequate">Adequate Stock</option>
            <option value="low_stock">Low Stock Alerts</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Feed Product & SKU</th>
                <th className="px-5 py-3.5">Package Size</th>
                <th className="px-5 py-3.5">Physical Stock</th>
                <th className="px-5 py-3.5">Available to Sell</th>
                <th className="px-5 py-3.5">Reorder Min</th>
                <th className="px-5 py-3.5">Status</th>
                {canAdjust && <th className="px-5 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    Loading inventory ledger...
                  </td>
                </tr>
              ) : filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    No matching stock items found.
                  </td>
                </tr>
              ) : (
                filteredStock.map((row) => (
                  <tr key={row.variant_id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      <div>
                        <span>{row.product_name}</span>
                        <span className="block text-xs font-mono text-gray-400">{row.sku}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800">
                      {row.package_size}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-extrabold text-gray-900 text-base">
                        {row.physical_stock_qty}
                      </span>{' '}
                      <span className="text-xs text-gray-500">{row.unit_abbr}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`font-bold text-sm ${
                          row.available_to_sell_qty < row.physical_stock_qty
                            ? 'text-amber-700'
                            : 'text-[#2E7D32]'
                        }`}
                      >
                        {row.available_to_sell_qty}
                      </span>
                      {row.available_to_sell_qty < row.physical_stock_qty && (
                        <span className="block text-[11px] text-amber-600 font-medium">
                          ({row.physical_stock_qty - row.available_to_sell_qty} held in QA)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-gray-500">
                      {row.reorder_threshold} {row.unit_abbr}
                    </td>
                    <td className="px-5 py-4">
                      {row.stock_status === 'adequate' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Adequate
                        </span>
                      )}
                      {row.stock_status === 'low_stock' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          Low Stock
                        </span>
                      )}
                      {row.stock_status === 'out_of_stock' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          Out of Stock
                        </span>
                      )}
                    </td>
                    {canAdjust && (
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedVariant(row);
                            setAdjustmentModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-[#2E7D32] hover:bg-emerald-50 rounded-md border border-emerald-200 transition-colors"
                        >
                          Adjust
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustmentModalOpen && (
        <AdjustmentModal
          initialVariant={selectedVariant}
          allVariants={stock}
          onClose={() => setAdjustmentModalOpen(false)}
          onAdjusted={handleAdjustmentComplete}
        />
      )}
    </div>
  );
}
