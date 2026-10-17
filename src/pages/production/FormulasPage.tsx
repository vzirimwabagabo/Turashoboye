import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Beaker, CheckCircle2, History, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface FormulaItem {
  id: string;
  name: string;
  current_version: number;
  output_feed: string;
  expected_output_qty: number;
  is_approved: boolean;
  approved_by?: string;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
    percentage: number;
  }[];
}

const SAMPLE_FORMULAS: FormulaItem[] = [
  {
    id: 'f1',
    name: 'Turashoboye Standard Broiler Starter',
    current_version: 2,
    output_feed: 'Broiler Starter Mash (50kg)',
    expected_output_qty: 1000, // 1 Ton batch
    is_approved: true,
    approved_by: 'Agronomist Lead',
    ingredients: [
      { name: 'Cleaned Yellow Feed Maize', quantity: 560, unit: 'kg', percentage: 56 },
      { name: 'Toasted Soya Bean Meal (44% CP)', quantity: 340, unit: 'kg', percentage: 34 },
      { name: 'Wheat Pollard / Fine Bran', quantity: 75, unit: 'kg', percentage: 7.5 },
      { name: 'Broiler Starter Vitamin-Mineral Premix 2.5%', quantity: 25, unit: 'kg', percentage: 2.5 },
    ],
  },
  {
    id: 'f2',
    name: 'Turashoboye Complete Layer Mash (Peak Lay)',
    current_version: 1,
    output_feed: 'Layer Complete Mash (50kg)',
    expected_output_qty: 1000,
    is_approved: true,
    approved_by: 'Agronomist Lead',
    ingredients: [
      { name: 'Cleaned Yellow Feed Maize', quantity: 520, unit: 'kg', percentage: 52 },
      { name: 'Toasted Soya Bean Meal', quantity: 240, unit: 'kg', percentage: 24 },
      { name: 'Wheat Bran', quantity: 140, unit: 'kg', percentage: 14 },
      { name: 'Feed-Grade Limestone / Calcium Grit', quantity: 75, unit: 'kg', percentage: 7.5 },
      { name: 'Layer Vitamin-Mineral Premix 2.5%', quantity: 25, unit: 'kg', percentage: 2.5 },
    ],
  },
  {
    id: 'f3',
    name: 'Turashoboye Pig Grower Mash',
    current_version: 1,
    output_feed: 'Pig Grower Feed (50kg)',
    expected_output_qty: 1000,
    is_approved: false,
    ingredients: [
      { name: 'Cleaned Yellow Feed Maize', quantity: 580, unit: 'kg', percentage: 58 },
      { name: 'Toasted Soya Bean Meal', quantity: 220, unit: 'kg', percentage: 22 },
      { name: 'Fine Wheat Bran', quantity: 175, unit: 'kg', percentage: 17.5 },
      { name: 'Swine Premix & Salt', quantity: 25, unit: 'kg', percentage: 2.5 },
    ],
  },
];

export default function FormulasPage() {
  const { user } = useAuth();
  const [formulas, setFormulas] = useState<FormulaItem[]>(SAMPLE_FORMULAS);
  const [modalOpen, setModalOpen] = useState(false);

  // New formula form
  const [name, setName] = useState('');
  const [outputFeed, setOutputFeed] = useState('Broiler Finisher Mash');
  const [expectedQty, setExpectedQty] = useState<number>(1000);

  const isManagement = ['manager', 'owner'].includes(user?.profile?.role || '');

  const handleApprove = (id: string) => {
    setFormulas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, is_approved: true, approved_by: user?.email || 'Manager' } : f))
    );
  };

  const handleCreateFormula = (e: FormEvent) => {
    e.preventDefault();
    const newFormula: FormulaItem = {
      id: `f-${Date.now()}`,
      name,
      current_version: 1,
      output_feed: outputFeed,
      expected_output_qty: expectedQty,
      is_approved: true,
      approved_by: user?.email || 'Manager',
      ingredients: [
        { name: 'Cleaned Yellow Feed Maize', quantity: Math.round(expectedQty * 0.55), unit: 'kg', percentage: 55 },
        { name: 'Toasted Soya Bean Meal', quantity: Math.round(expectedQty * 0.35), unit: 'kg', percentage: 35 },
        { name: 'Mineral-Vitamin Premix', quantity: Math.round(expectedQty * 0.10), unit: 'kg', percentage: 10 },
      ],
    };
    setFormulas((prev) => [newFormula, ...prev]);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Feed Formulations & Recipes
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Version-controlled recipes with immutable historical versions once used in production runs.
          </p>
        </div>

        {isManagement && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#2E7D32] hover:bg-[#256b29] text-white text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus size={18} />
            Create Formulation
          </button>
        )}
      </div>

      {/* Formulas Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {formulas.map((formula) => (
          <div
            key={formula.id}
            className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-[#2E7D32] text-xs font-bold border border-emerald-100">
                  <Beaker size={14} /> Version {formula.current_version}
                </span>

                {formula.is_approved ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 size={12} /> Approved for Production
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    Draft (Pending Approval)
                  </span>
                )}
              </div>

              <h2 className="text-lg font-bold text-gray-900 leading-snug">
                {formula.name}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Target Output: <strong>{formula.output_feed}</strong> (Base Batch: {formula.expected_output_qty.toLocaleString()} kg)
              </p>

              {/* Ingredients Table */}
              <div className="mt-4 border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="px-3.5 py-2">Ingredient</th>
                      <th className="px-3.5 py-2 text-right">Quantity</th>
                      <th className="px-3.5 py-2 text-right">Proportion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {formula.ingredients.map((ing, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-3.5 py-2 font-medium text-gray-800">{ing.name}</td>
                        <td className="px-3.5 py-2 text-right font-bold text-gray-900">
                          {ing.quantity} {ing.unit}
                        </td>
                        <td className="px-3.5 py-2 text-right text-emerald-800 font-semibold">
                          {ing.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <History size={13} />
                {formula.approved_by ? `Approved by ${formula.approved_by}` : 'Pending supervisor sign-off'}
              </span>

              {!formula.is_approved && isManagement && (
                <button
                  onClick={() => handleApprove(formula.id)}
                  className="px-3 py-1.5 bg-[#2E7D32] hover:bg-[#256b29] text-white font-semibold rounded-lg shadow-xs"
                >
                  Approve Recipe
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Formula Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">New Feed Formulation Recipe</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateFormula} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Formula Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Turashoboye Broiler Finisher Mash v1"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Output Feed Product *
                  </label>
                  <input
                    type="text"
                    required
                    value={outputFeed}
                    onChange={(e) => setOutputFeed(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Standard Batch Size (kg) *
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={expectedQty}
                    onChange={(e) => setExpectedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-sm font-semibold shadow-xs"
                >
                  Save Formula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
