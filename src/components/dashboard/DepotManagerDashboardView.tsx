import { Link } from 'react-router-dom';
import {
  Factory,
  Truck,
  ArrowRight,
  Play,
  RotateCw,
  Scale,
  QrCode,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';


interface SiloData {
  id: string;
  name: string;
  material: string;
  currentKg: number;
  capacityKg: number;
  status: 'optimal' | 'adequate' | 'low';
}

const SILOS: SiloData[] = [
  {
    id: 'silo-01',
    name: 'Silo Alpha (Grain)',
    material: 'Whole Grain Maize',
    currentKg: 18400,
    capacityKg: 25000,
    status: 'adequate',
  },
  {
    id: 'silo-02',
    name: 'Silo Bravo (Protein)',
    material: 'Soya Bean Meal (Extruded)',
    currentKg: 6200,
    capacityKg: 10000,
    status: 'optimal',
  },
  {
    id: 'silo-03',
    name: 'Silo Charlie (Fibre)',
    material: 'Wheat Bran',
    currentKg: 8800,
    capacityKg: 12000,
    status: 'adequate',
  },
  {
    id: 'silo-04',
    name: 'Premix Hopper 1',
    material: 'Mineral Premix & Amino Acids',
    currentKg: 450,
    capacityKg: 2000,
    status: 'low',
  },
];

export default function DepotManagerDashboardView() {
  const { user } = useAuth();
  const managerName = user?.profile?.displayName || 'Vedaste Zirimwabagabo';

  return (
    <div className="space-y-6">
      {/* Operations Floor Header */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-green-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-2">
              <Factory size={14} className="text-emerald-400" />
              DEPOT OPERATIONS & FACTORY FLOOR CONTROL
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Mahama Milling Depot — {managerName}
            </h1>
            <p className="mt-1 text-sm text-emerald-100 max-w-xl">
              Live floor operations: raw ingredient silos, feed batch milling, bagging lines, and stock dispatches.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Mill Line 1: Active (2.5 MT/hr)
            </span>
          </div>
        </div>
      </div>

      {/* Silo Storage Visual Meters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Factory className="w-5 h-5 text-[#2E7D32]" />
            Raw Ingredient Silo & Hopper Capacities
          </h2>
          <span className="text-xs text-gray-500 font-medium">Mahama Bulk Storage</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SILOS.map((silo) => {
            const pct = Math.round((silo.currentKg / silo.capacityKg) * 100);
            return (
              <div key={silo.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                      {silo.name}
                    </span>
                    <h3 className="text-sm font-black text-gray-900 mt-0.5">{silo.material}</h3>
                  </div>
                  {silo.status === 'low' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                      ⚠️ Low
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">
                      OK
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-baseline justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-gray-900">
                      {(silo.currentKg / 1000).toFixed(1)} MT
                    </span>
                    <span className="text-gray-400">Cap: {(silo.capacityKg / 1000).toFixed(1)} MT ({pct}%)</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        silo.status === 'low'
                          ? 'bg-red-500'
                          : pct > 70
                          ? 'bg-emerald-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Milling Queue & Floor Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Batches */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Today&apos;s Milling Run Schedule</h2>
              <p className="text-xs text-gray-500">Milling orders in progress at Mahama production unit.</p>
            </div>
            <Link
              to="/production"
              className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1"
            >
              All Batches <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            {/* Batch 1 */}
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Batch B-20261019-001
                </span>
                <span className="font-bold text-emerald-800 flex items-center gap-1">
                  <RotateCw size={13} className="animate-spin" /> In Mixing Stage (75%)
                </span>
              </div>
              <div className="flex items-center justify-between font-semibold text-gray-800">
                <span>Turashoboye Broiler Starter Mash (20 bags / 1,000 kg)</span>
                <span className="text-emerald-700">Formula V2.1</span>
              </div>
              <div className="w-full h-2 bg-emerald-200/60 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: '75%' }} />
              </div>
            </div>

            {/* Batch 2 */}
            <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-gray-900 bg-gray-200 px-2 py-0.5 rounded-md">
                  Batch B-20261019-002
                </span>
                <span className="font-bold text-gray-500">Queued for Grinding</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-gray-800">
                <span>Turashoboye Layer Complete Mash (30 bags / 1,500 kg)</span>
                <span className="text-gray-500">Formula V3.0</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Link
              to="/production"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-xs font-bold shadow-xs transition"
            >
              <Play size={13} />
              Start New Milling Run
            </Link>
            <Link
              to="/inventory"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition"
            >
              <Truck size={13} />
              Receive Grain Truck
            </Link>
          </div>
        </div>

        {/* Right: Finished Warehouse Stock & Quick Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-900">Finished Bags in Depot (Ready for Pickup)</h2>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="font-medium text-gray-800">Broiler Starter Mash (50kg)</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  45 Bags (2,250 kg)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="font-medium text-gray-800">Layer Complete Mash (50kg)</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  60 Bags (3,000 kg)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="font-medium text-gray-800">Pig Starter Ration (50kg)</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  35 Bags (1,750 kg)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-50 border border-red-200">
                <span className="font-bold text-red-900">Broiler Finisher (25kg)</span>
                <span className="font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
                  0 Bags (Milling Required)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Depot Field Tools */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/production/traceability"
              className="p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-[#2E7D32] shadow-xs text-center transition group flex flex-col items-center"
            >
              <QrCode className="w-5 h-5 text-[#2E7D32] mb-1.5" />
              <span className="text-xs font-bold text-gray-900">Print Bag Labels</span>
              <span className="text-[10px] text-gray-400">Batch traceability</span>
            </Link>

            <Link
              to="/compliance"
              className="p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-[#2E7D32] shadow-xs text-center transition group flex flex-col items-center"
            >
              <Scale className="w-5 h-5 text-indigo-600 mb-1.5" />
              <span className="text-xs font-bold text-gray-900">RSB Compliance</span>
              <span className="text-[10px] text-gray-400">Scale calibration</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
