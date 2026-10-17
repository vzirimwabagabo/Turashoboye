import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Factory, CheckCircle, AlertTriangle, ShieldAlert, ShieldCheck, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface ProductionBatchItem {
  id: string;
  batch_number: string;
  product_name: string;
  formula_name: string;
  planned_output_qty: number;
  actual_output_qty?: number;
  loss_qty?: number;
  loss_percentage?: number;
  status: 'planned' | 'in_progress' | 'completed' | 'held' | 'cancelled';
  started_at: string;
  completed_at?: string;
  operator_name: string;
  supervisor_name: string;
  quality_status: 'passed' | 'held' | 'pending';
}

const SAMPLE_BATCHES: ProductionBatchItem[] = [
  {
    id: 'batch-1',
    batch_number: 'BATCH-20261016-001',
    product_name: 'Turashoboye Broiler Starter Mash (50kg)',
    formula_name: 'Standard Broiler Starter v2',
    planned_output_qty: 2000,
    actual_output_qty: 1960,
    loss_qty: 40,
    loss_percentage: 2.0, // Within 5% tolerance
    status: 'completed',
    started_at: '2026-10-16 08:30',
    completed_at: '2026-10-16 11:45',
    operator_name: 'Jean Claude Ndayisaba',
    supervisor_name: 'Diane Uwase (Manager)',
    quality_status: 'passed',
  },
  {
    id: 'batch-2',
    batch_number: 'BATCH-20261016-002',
    product_name: 'Turashoboye Layer Complete Mash (50kg)',
    formula_name: 'Complete Layer Mash v1',
    planned_output_qty: 1500,
    actual_output_qty: 1410,
    loss_qty: 90,
    loss_percentage: 6.0, // Exceeds 5% warning threshold!
    status: 'held', // Placed on quality hold for investigation
    started_at: '2026-10-16 13:00',
    completed_at: '2026-10-16 15:30',
    operator_name: 'Jean Claude Ndayisaba',
    supervisor_name: 'Diane Uwase (Manager)',
    quality_status: 'held',
  },
  {
    id: 'batch-3',
    batch_number: 'BATCH-20261017-003',
    product_name: 'Turashoboye Pig Grower Feed (50kg)',
    formula_name: 'Pig Grower Mash v1',
    planned_output_qty: 1000,
    status: 'in_progress',
    started_at: '2026-10-17 09:00',
    operator_name: 'Patrick Habiyambere',
    supervisor_name: 'Diane Uwase (Manager)',
    quality_status: 'pending',
  },
];

const LOSS_WARNING_THRESHOLD = 5.0; // 5% configurable threshold

export default function BatchesPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<ProductionBatchItem[]>(SAMPLE_BATCHES);

  // Start Batch Modal state
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [productName, setProductName] = useState('Turashoboye Broiler Starter Mash (50kg)');
  const [formulaName, setFormulaName] = useState('Standard Broiler Starter v2');
  const [plannedQty, setPlannedQty] = useState<number>(1000);
  const [operator, setOperator] = useState('Jean Claude Ndayisaba');

  // Complete Batch Modal state
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [activeBatch, setActiveBatch] = useState<ProductionBatchItem | null>(null);
  const [actualQty, setActualQty] = useState<number>(970);
  const [completing, setCompleting] = useState(false);

  const canManage = ['manager', 'owner'].includes(user?.profile?.role || '');

  // Calculated metrics for completion modal
  const computedLossQty = activeBatch ? Math.max(activeBatch.planned_output_qty - actualQty, 0) : 0;
  const computedLossPct = activeBatch
    ? Number(((computedLossQty / activeBatch.planned_output_qty) * 100).toFixed(2))
    : 0;
  const isLossWarning = computedLossPct > LOSS_WARNING_THRESHOLD;

  const handleStartBatch = (e: FormEvent) => {
    e.preventDefault();
    const newBatch: ProductionBatchItem = {
      id: `b-${Date.now()}`,
      batch_number: `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      product_name: productName,
      formula_name: formulaName,
      planned_output_qty: plannedQty,
      status: 'in_progress',
      started_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
      operator_name: operator,
      supervisor_name: user?.profile?.displayName || 'Supervisor',
      quality_status: 'pending',
    };
    setBatches((prev) => [newBatch, ...prev]);
    setStartModalOpen(false);
  };

  const handleOpenComplete = (batch: ProductionBatchItem) => {
    setActiveBatch(batch);
    setActualQty(Math.round(batch.planned_output_qty * 0.98));
    setCompleteModalOpen(true);
  };

  const handleConfirmCompletion = (e: FormEvent) => {
    e.preventDefault();
    if (!activeBatch) return;
    setCompleting(true);

    setTimeout(() => {
      setBatches((prev) =>
        prev.map((b) =>
          b.id === activeBatch.id
            ? {
                ...b,
                actual_output_qty: actualQty,
                loss_qty: computedLossQty,
                loss_percentage: computedLossPct,
                status: 'completed',
                completed_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
                quality_status: 'passed',
              }
            : b
        )
      );
      setCompleting(false);
      setCompleteModalOpen(false);
    }, 400);
  };

  const handleToggleHold = (batchId: string) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === batchId) {
          const nextStatus = b.status === 'held' ? 'completed' : 'held';
          const nextQA = nextStatus === 'held' ? 'held' : 'passed';
          return { ...b, status: nextStatus, quality_status: nextQA };
        }
        return b;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Production Runs & Batch Milling
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track separate batch IDs for each grinding and mixing run, monitor process losses, and manage quality holds.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setStartModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#2E7D32] hover:bg-[#256b29] text-white text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus size={18} />
            Start Production Run
          </button>
        )}
      </div>

      {/* Batches Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Batch Code</th>
                <th className="px-5 py-3.5">Feed Product & Recipe</th>
                <th className="px-5 py-3.5">Planned vs Actual Output</th>
                <th className="px-5 py-3.5">Process Loss</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Quality Assurance</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-4 font-mono font-bold text-gray-900 text-xs">
                    <div>
                      <span>{batch.batch_number}</span>
                      <span className="block text-[11px] text-gray-400 font-normal">
                        Started: {batch.started_at}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-gray-900 block text-xs">
                      {batch.product_name}
                    </span>
                    <span className="text-[11px] text-gray-500">{batch.formula_name}</span>
                  </td>
                  <td className="px-5 py-4 text-xs font-medium">
                    {batch.actual_output_qty !== undefined ? (
                      <div>
                        <span className="font-bold text-gray-900">
                          {batch.actual_output_qty.toLocaleString()} kg
                        </span>{' '}
                        <span className="text-gray-400">
                          (Planned: {batch.planned_output_qty.toLocaleString()} kg)
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500">
                        Planned: {batch.planned_output_qty.toLocaleString()} kg
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs">
                    {batch.loss_percentage !== undefined ? (
                      <span
                        className={`font-semibold inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                          batch.loss_percentage > LOSS_WARNING_THRESHOLD
                            ? 'bg-amber-100 text-amber-800 font-bold'
                            : 'text-gray-700'
                        }`}
                      >
                        {batch.loss_percentage > LOSS_WARNING_THRESHOLD && <AlertTriangle size={12} />}
                        {batch.loss_qty} kg ({batch.loss_percentage}%)
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {batch.status === 'in_progress' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        <Factory size={12} /> Milling & Mixing
                      </span>
                    )}
                    {batch.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        <CheckCircle size={12} /> Completed
                      </span>
                    )}
                    {batch.status === 'held' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        <ShieldAlert size={12} /> Quality Held
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {batch.quality_status === 'passed' && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                        <ShieldCheck size={14} /> Available to Sell
                      </span>
                    )}
                    {batch.quality_status === 'held' && (
                      <span className="inline-flex items-center gap-1 text-xs text-red-700 font-bold">
                        <ShieldAlert size={14} /> Excluded from Sales
                      </span>
                    )}
                    {batch.quality_status === 'pending' && (
                      <span className="text-xs text-gray-400">In Production</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right space-x-2">
                    {batch.status === 'in_progress' && (
                      <button
                        onClick={() => handleOpenComplete(batch)}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#256b29] rounded-md shadow-xs transition-colors"
                      >
                        Complete Batch
                      </button>
                    )}
                    {canManage && (batch.status === 'completed' || batch.status === 'held') && (
                      <button
                        onClick={() => handleToggleHold(batch.id)}
                        className={`px-2 py-1 text-xs font-semibold rounded-md border transition-colors ${
                          batch.status === 'held'
                            ? 'bg-emerald-50 text-[#2E7D32] border-emerald-300 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                        }`}
                      >
                        {batch.status === 'held' ? 'Release Hold' : 'Place Hold'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Start Production Run Modal */}
      {startModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Start New Production Run</h2>
              <button onClick={() => setStartModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleStartBatch} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Feed Product *
                </label>
                <select
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                >
                  <option value="Turashoboye Broiler Starter Mash (50kg)">Turashoboye Broiler Starter Mash (50kg)</option>
                  <option value="Turashoboye Layer Complete Mash (50kg)">Turashoboye Layer Complete Mash (50kg)</option>
                  <option value="Turashoboye Pig Grower Feed (50kg)">Turashoboye Pig Grower Feed (50kg)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Formulation Recipe Version *
                </label>
                <select
                  value={formulaName}
                  onChange={(e) => setFormulaName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                >
                  <option value="Standard Broiler Starter v2">Standard Broiler Starter v2 (Approved)</option>
                  <option value="Complete Layer Mash v1">Complete Layer Mash v1 (Approved)</option>
                  <option value="Manual Unscheduled Batch">Manual Non-Formula Batch</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Planned Target Output (kg) *
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={plannedQty}
                    onChange={(e) => setPlannedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mill Operator Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStartModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-sm font-semibold shadow-xs"
                >
                  Initiate Production Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Batch Modal */}
      {completeModalOpen && activeBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Complete Production Batch</h2>
                <p className="text-xs text-gray-500">Record final yield, compute milling loss, and update inventory.</p>
              </div>
              <button onClick={() => setCompleteModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleConfirmCompletion} className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 space-y-1">
                <p className="font-bold text-gray-900">Batch Code: {activeBatch.batch_number}</p>
                <p>Product: {activeBatch.product_name}</p>
                <p>Planned Output: {activeBatch.planned_output_qty.toLocaleString()} kg</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Actual Measured Finished Output (kg) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={actualQty}
                  onChange={(e) => setActualQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              {/* Loss Calculation & 5% Variance Alert */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Calculated Process Loss:</span>
                  <span className="font-bold text-gray-900">
                    {computedLossQty} kg ({computedLossPct}%)
                  </span>
                </div>

                {isLossWarning && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-900">
                    <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">5% Loss Warning Exceeded!</span>
                      <span>
                        Loss is {computedLossPct}% (threshold is {LOSS_WARNING_THRESHOLD}%). Please check mill seals, cyclone screens, and ingredient moisture loss before signing off.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completing}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-sm font-semibold shadow-xs disabled:opacity-50"
                >
                  {completing ? <Loader2 className="animate-spin w-4 h-4" /> : null}
                  Complete & Post to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
