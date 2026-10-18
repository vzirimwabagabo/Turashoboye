import { useState } from 'react';
import {
  TrendingUp,
  Activity,
  DollarSign,
  Users,
  Factory,
  ShieldCheck,
  Download,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShoppingCart,
  Truck,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'sale' | 'production' | 'inventory' | 'user' | 'compliance';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  meta?: string;
  status: 'completed' | 'pending' | 'in_progress';
}

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'sale',
    title: 'Commercial Feed Order #ORD-20261018-09',
    description: '10x 50kg Broiler Starter Mash sold to Jean-Paul Habimana',
    timestamp: '2026-10-18T19:45:00Z',
    user: 'Vedaste Zirimwabagabo',
    meta: '380,000 RWF',
    status: 'completed',
  },
  {
    id: 'act-2',
    type: 'production',
    title: 'Batch Milling #BATCH-20261018-02 Completed',
    description: 'Milled 1,000 kg Turashoboye Layer Complete Mash with 1.8% milling loss',
    timestamp: '2026-10-18T16:20:00Z',
    user: 'Vedaste Zirimwabagabo',
    meta: 'Yield: 98.2%',
    status: 'completed',
  },
  {
    id: 'act-3',
    type: 'user',
    title: 'New Farmer Account Registered',
    description: 'farmer.kirehe@gmail.com verified and assigned Farmer/Customer role',
    timestamp: '2026-10-18T15:10:00Z',
    user: 'Self-Registered',
    meta: 'Mahama Sector',
    status: 'completed',
  },
  {
    id: 'act-4',
    type: 'inventory',
    title: 'Raw Soya Lot Receipt Registered',
    description: '5,000 kg toasted soya bean received from Kirehe Grain Cooperative',
    timestamp: '2026-10-18T11:00:00Z',
    user: 'Vedaste Zirimwabagabo',
    meta: 'LOT-SOYA-20261018',
    status: 'completed',
  },
  {
    id: 'act-5',
    type: 'compliance',
    title: 'RSB Laboratory Assay Recorded',
    description: 'Broiler Starter Mash protein test: 21.4% (Passed RS EAS 287 specs)',
    timestamp: '2026-10-17T14:30:00Z',
    user: 'Aline Mugisha',
    meta: 'Cert: RSB-PL-4412',
    status: 'completed',
  },
  {
    id: 'act-6',
    type: 'sale',
    title: 'Farmer Group Feed Collection',
    description: '25x 50kg Pig Grower Feed dispatched to Mahama Livelihood Cooperative',
    timestamp: '2026-10-17T09:15:00Z',
    user: 'Aline Mugisha',
    meta: '800,000 RWF',
    status: 'completed',
  },
];

const MONTHLY_REVENUE_TREND = [
  { month: 'May 2026', revenue: 7200000, tons: 22.5, orders: 48 },
  { month: 'Jun 2026', revenue: 8900000, tons: 28.0, orders: 62 },
  { month: 'Jul 2026', revenue: 10400000, tons: 33.2, orders: 74 },
  { month: 'Aug 2026', revenue: 11800000, tons: 38.6, orders: 86 },
  { month: 'Sep 2026', revenue: 13200000, tons: 43.0, orders: 98 },
  { month: 'Oct 2026 (MTD)', revenue: 15400000, tons: 49.5, orders: 114 },
];

const FEED_CATEGORY_MIX = [
  { name: 'Poultry Feed (Broilers & Layers)', tons: 28.2, pct: 57, color: 'bg-emerald-600', text: 'text-emerald-700' },
  { name: 'Swine / Pig Feed (Grower & Sow)', tons: 11.4, pct: 23, color: 'bg-blue-600', text: 'text-blue-700' },
  { name: 'Dairy & Cattle Concentrates', tons: 5.9, pct: 12, color: 'bg-amber-600', text: 'text-amber-700' },
  { name: 'Raw Ingredients (Milled Soya / Bran)', tons: 4.0, pct: 8, color: 'bg-purple-600', text: 'text-purple-700' },
];

export default function TrendsPage() {
  const [activities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const maxRevenue = Math.max(...MONTHLY_REVENUE_TREND.map((m) => m.revenue));

  const filteredActivities = activities.filter((a) => {
    if (activeFilter === 'all') return true;
    return a.type === activeFilter;
  });

  const exportActivityAuditCSV = () => {
    const headers = ['Activity ID', 'Type', 'Title', 'Description', 'User', 'Meta Details', 'Timestamp'];
    const rows = filteredActivities.map((a) => [
      a.id,
      a.type,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.description.replace(/"/g, '""')}"`,
      `"${a.user.replace(/"/g, '""')}"`,
      `"${(a.meta || '').replace(/"/g, '""')}"`,
      a.timestamp,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `turashoboye_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#2E7D32]" />
            Operations Command & Trends Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time multi-department activity audit log, production yield trends, and commercial feed statistics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportActivityAuditCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs transition"
          >
            <Download size={15} />
            Export Audit Trail (CSV)
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Monthly Revenue (RWF)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#2E7D32] flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900">15,400,000</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <ArrowUpRight size={14} /> +16.7%
            </span>
          </div>
          <span className="text-xs text-gray-400 mt-1 block">October whole RWF turnover</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Milled Output
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Factory size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900">49.5 MT</span>
            <span className="text-xs font-bold text-blue-600 flex items-center">
              <ArrowUpRight size={14} /> +15.1%
            </span>
          </div>
          <span className="text-xs text-gray-400 mt-1 block">990x 50kg equivalent bags</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Avg Milling Yield
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900">98.4%</span>
            <span className="text-xs font-bold text-emerald-600">
              Loss: 1.6%
            </span>
          </div>
          <span className="text-xs text-gray-400 mt-1 block">Below 5% statutory loss limit</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Active Farmer Reach
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-gray-900">114 Orders</span>
            <span className="text-xs font-bold text-amber-600">
              Mahama Zone
            </span>
          </div>
          <span className="text-xs text-gray-400 mt-1 block">Repeat order rate: 74%</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Revenue & Milling Trends */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Monthly Turnover & Production Growth
              </h2>
              <p className="text-xs text-gray-500">Gross revenue trend in whole RWF across last 6 operational periods.</p>
            </div>
            <span className="text-xs font-bold text-[#2E7D32] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Steady Growth
            </span>
          </div>

          {/* Custom Visual Bar Chart */}
          <div className="space-y-4 pt-2">
            {MONTHLY_REVENUE_TREND.map((item, idx) => {
              const heightPct = Math.round((item.revenue / maxRevenue) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">{item.month}</span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-gray-500">{item.tons} MT</span>
                      <span className="font-bold text-gray-900">{item.revenue.toLocaleString()} RWF</span>
                    </div>
                  </div>
                  <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-[#2E7D32] rounded-full transition-all duration-500"
                      style={{ width: `${heightPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-500 block">Avg Order Basket</span>
              <span className="font-extrabold text-gray-900 mt-0.5 block">135,000 RWF</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-500 block">Peak Delivery Day</span>
              <span className="font-extrabold text-[#2E7D32] mt-0.5 block">Thursday & Friday</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-500 block">Cash Realization</span>
              <span className="font-extrabold text-gray-900 mt-0.5 block">99.2% via MoMo</span>
            </div>
          </div>
        </div>

        {/* Right Column: Feed Formulation Category Distribution */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Feed Output by Livestock Species
            </h2>
            <p className="text-xs text-gray-500">Distribution of 49.5 metric tons produced at Mahama Depot.</p>

            <div className="space-y-4 mt-6">
              {FEED_CATEGORY_MIX.map((cat, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-800">{cat.name}</span>
                    <span className={cat.text}>{cat.tons} MT ({cat.pct}%)</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cat.color} rounded-full`}
                      style={{ width: `${cat.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warehouse Ingredient Runway Alert */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Clock size={15} />
              Raw Ingredient Runway Forecast
            </div>
            <p className="text-amber-800 leading-relaxed">
              At current milling rates, raw soya meal inventory has <strong>14 days buffer</strong>. Maize grain buffer stands at <strong>22 days</strong>. Recommended re-order trigger: by 25 October.
            </p>
          </div>
        </div>
      </div>

      {/* Live Operations Activity Audit Trail ("Place to manage all activities") */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#2E7D32]" />
              Live Operations Activity Feed
            </h2>
            <p className="text-xs text-gray-500">
              Audit log of real-time movements, orders, batch milling, and system actions.
            </p>
          </div>

          {/* Activity Category Filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'all', label: 'All Activities' },
              { id: 'sale', label: 'Sales & Orders' },
              { id: 'production', label: 'Batch Milling' },
              { id: 'inventory', label: 'Stock Receipts' },
              { id: 'user', label: 'User Logins/Signups' },
              { id: 'compliance', label: 'Quality & RSB' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-1 rounded-full font-semibold transition ${
                  activeFilter === f.id
                    ? 'bg-[#2E7D32] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Timeline List */}
        <div className="divide-y divide-gray-100 pt-2">
          {filteredActivities.map((act) => (
            <div key={act.id} className="py-3.5 flex items-start justify-between gap-4 hover:bg-gray-50/50 rounded-xl px-2 transition">
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    act.type === 'sale'
                      ? 'bg-emerald-100 text-[#2E7D32]'
                      : act.type === 'production'
                      ? 'bg-blue-100 text-blue-700'
                      : act.type === 'inventory'
                      ? 'bg-amber-100 text-amber-700'
                      : act.type === 'compliance'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {act.type === 'sale' && <ShoppingCart size={17} />}
                  {act.type === 'production' && <Factory size={17} />}
                  {act.type === 'inventory' && <Truck size={17} />}
                  {act.type === 'compliance' && <ShieldCheck size={17} />}
                  {act.type === 'user' && <Users size={17} />}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 leading-snug">
                    {act.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {act.description}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
                    <span>Initiated by: <strong className="text-gray-700">{act.user}</strong></span>
                    <span>•</span>
                    <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(act.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              </div>

              {act.meta && (
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    {act.meta}
                  </span>
                  <span className="text-[10px] text-gray-400 block mt-1 flex items-center justify-end gap-1">
                    <CheckCircle2 size={10} className="text-[#2E7D32]" /> Logged & Signed
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
