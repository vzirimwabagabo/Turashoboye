import { Link, Navigate } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  ClipboardList,
  DollarSign,
  ShoppingCart,
  Truck,
  Factory,
  ShieldCheck,
  Compass,
  BarChart2,
  Users,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import OwnerDashboardView from '../components/dashboard/OwnerDashboardView';
import DepotManagerDashboardView from '../components/dashboard/DepotManagerDashboardView';

export default function DashboardPage() {
  const { user } = useAuth();
  const profile = user?.profile;

  // 1. Super Admin is redirected to the Master Admin Console
  if (profile?.role === 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  // 2. Customers / Farmers should see their customer portal
  if (profile?.role === 'public') {
    return <Navigate to="/portal" replace />;
  }

  // 3. Business Owner gets the executive P&L, margins, and approval queue
  if (profile?.role === 'owner') {
    return <OwnerDashboardView />;
  }

  // 4. Depot / Operations Manager gets live silo gauges, milling batches, and stock
  if (profile?.role === 'manager') {
    return <DepotManagerDashboardView />;
  }

  const firstName =
    profile?.displayName?.split(' ')[0] ??
    profile?.fullName?.split(' ')[0] ??
    user?.email?.split('@')[0] ??
    'Team';

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Welcome back, {firstName}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Turashoboye Feeds — Mahama Operations, Milling Batches & Quality Management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Mahama Primary Depot (DEPOT-01)
          </span>
        </div>
      </div>

      {/* Primary KPI Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/sales"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs hover:border-[#2E7D32] transition group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Today&apos;s Sales
              </p>
              <p className="mt-1.5 text-2xl font-black text-[#2E7D32]">RWF 268,000</p>
              <p className="text-[11px] text-gray-400 mt-0.5">2 sales transactions</p>
            </div>
            <div className="rounded-lg p-3 bg-green-50 text-[#2E7D32] group-hover:bg-[#2E7D32] group-hover:text-white transition">
              <DollarSign size={24} />
            </div>
          </div>
        </Link>

        <Link
          to="/inventory"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs hover:border-amber-500 transition group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Low Stock Warning
              </p>
              <p className="mt-1.5 text-2xl font-bold text-amber-600">1 Item</p>
              <p className="text-[11px] text-gray-400 mt-0.5">BSM-25KG below reorder</p>
            </div>
            <div className="rounded-lg p-3 bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
              <AlertTriangle size={24} />
            </div>
          </div>
        </Link>

        <Link
          to="/production"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs hover:border-blue-500 transition group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Production Runs
              </p>
              <p className="mt-1.5 text-2xl font-bold text-blue-600">4 Batches</p>
              <p className="text-[11px] text-gray-400 mt-0.5">3 completed, 1 in progress</p>
            </div>
            <div className="rounded-lg p-3 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
              <Factory size={24} />
            </div>
          </div>
        </Link>

        <Link
          to="/compliance"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs hover:border-purple-500 transition group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                RSB / RICA Compliance
              </p>
              <p className="mt-1.5 text-2xl font-bold text-purple-700">4 Active</p>
              <p className="text-[11px] text-gray-400 mt-0.5">1 pending review</p>
            </div>
            <div className="rounded-lg p-3 bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
              <ShieldCheck size={24} />
            </div>
          </div>
        </Link>
      </div>

      {/* Operational Quick Actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-gray-900 mb-4">Operations & Field Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/sales"
            className="flex flex-col items-center justify-center p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-green-50 hover:border-green-300 text-gray-700 hover:text-[#2E7D32] transition text-center group"
          >
            <ShoppingCart className="h-6 w-6 mb-2 text-[#2E7D32]" />
            <span className="text-xs font-semibold">Record Sale</span>
          </Link>

          <Link
            to="/customers"
            className="flex flex-col items-center justify-center p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-green-50 hover:border-green-300 text-gray-700 hover:text-[#2E7D32] transition text-center group"
          >
            <Users className="h-6 w-6 mb-2 text-[#2E7D32]" />
            <span className="text-xs font-semibold">Customers</span>
          </Link>

          <Link
            to="/inventory"
            className="flex flex-col items-center justify-center p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-green-50 hover:border-green-300 text-gray-700 hover:text-[#2E7D32] transition text-center group"
          >
            <Truck className="h-6 w-6 mb-2 text-blue-600" />
            <span className="text-xs font-semibold">Stock Ledger</span>
          </Link>

          <Link
            to="/production"
            className="flex flex-col items-center justify-center p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-green-50 hover:border-green-300 text-gray-700 hover:text-[#2E7D32] transition text-center group"
          >
            <Factory className="h-6 w-6 mb-2 text-amber-600" />
            <span className="text-xs font-semibold">Milling Batches</span>
          </Link>

          <Link
            to="/production/traceability"
            className="flex flex-col items-center justify-center p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-green-50 hover:border-green-300 text-gray-700 hover:text-[#2E7D32] transition text-center group"
          >
            <Compass className="h-6 w-6 mb-2 text-indigo-600" />
            <span className="text-xs font-semibold">Traceability</span>
          </Link>

          <Link
            to="/reports"
            className="flex flex-col items-center justify-center p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-green-50 hover:border-green-300 text-gray-700 hover:text-[#2E7D32] transition text-center group"
          >
            <BarChart2 className="h-6 w-6 mb-2 text-emerald-700" />
            <span className="text-xs font-semibold">Reports & CSV</span>
          </Link>
        </div>
      </div>

      {/* Live Operational Alerts & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Alerts */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Operational & Quality Alerts
            </h3>
            <span className="text-[11px] font-semibold text-gray-400">Live Status</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-900 block">
                  Batch B-20261015-002 Variance Notice
                </span>
                <span className="text-amber-800">
                  Layer Complete Mash milling loss was 5.4% (exceeded 5.0% operational threshold). Quality check passed; monitor next run.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50/70 border border-red-200/80 text-xs">
              <Package className="h-4 w-4 text-red-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-red-900 block">
                  Low Stock Reorder Alert: Broiler Starter 25kg
                </span>
                <span className="text-red-800">
                  Current stock is 15 bags against reorder threshold of 25 bags. New production run required.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Audit & Transaction Stream */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[#2E7D32]" />
              Recent Field Transactions (Mahama Depot)
            </h3>
            <Link to="/sales" className="text-xs text-[#2E7D32] hover:underline font-semibold">
              View all
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <div>
                <span className="font-bold text-gray-900 block">Sale ORD-20261017-002</span>
                <span className="text-gray-500">
                  Duterimbere Poultry Cooperative — 10x Layer Mash (50kg)
                </span>
              </div>
              <span className="font-black text-gray-900">RWF 220,000</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <div>
                <span className="font-bold text-gray-900 block">Milling Batch B-20261017-001</span>
                <span className="text-gray-500">
                  Completed 978 kg yield (20 bags of Broiler Starter)
                </span>
              </div>
              <span className="font-bold text-green-700">97.8% Yield</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
              <div>
                <span className="font-bold text-gray-900 block">Sale ORD-20261017-001</span>
                <span className="text-gray-500">
                  Jean-Paul Habimana — 2x Broiler Starter (50kg)
                </span>
              </div>
              <span className="font-black text-gray-900">RWF 48,000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
