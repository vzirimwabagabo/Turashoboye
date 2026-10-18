import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  CheckCircle2,
  XCircle,
  FileText,
  Building,
  Users,
  ShieldCheck,
  AlertCircle,
  PieChart,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';


interface PendingApproval {
  id: string;
  reference: string;
  title: string;
  category: 'purchase_order' | 'operational_expense';
  amountRwf: number;
  requestedBy: string;
  date: string;
  details: string;
  status: 'pending' | 'approved' | 'rejected';
}

const INITIAL_APPROVALS: PendingApproval[] = [
  {
    id: 'app-01',
    reference: 'PO-2026-004',
    title: 'Whole Grain Maize Procurement (15 Metric Tonnes)',
    category: 'purchase_order',
    amountRwf: 4800000,
    requestedBy: 'Vedaste Zirimwabagabo (Depot Manager)',
    date: '2026-10-18',
    details: 'Bulk raw grain for next week broiler & layer mash production batches.',
    status: 'pending',
  },
  {
    id: 'app-02',
    reference: 'EXP-2026-019',
    title: 'Hammermill Motor Rewinding & Screen Replacement',
    category: 'operational_expense',
    amountRwf: 350000,
    requestedBy: 'Vedaste Zirimwabagabo (Depot Manager)',
    date: '2026-10-17',
    details: 'Emergency maintenance on primary grinder to prevent milling downtime.',
    status: 'pending',
  },
];

export default function OwnerDashboardView() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<PendingApproval[]>(INITIAL_APPROVALS);
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);

  const ownerName = user?.profile?.displayName || 'Aline Mugisha';

  const handleDecision = (id: string, decision: 'approved' | 'rejected') => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: decision } : item))
    );
    const item = approvals.find((a) => a.id === id);
    if (decision === 'approved') {
      setApprovalNotice(`✅ Authorized: ${item?.reference} (${item?.amountRwf.toLocaleString()} RWF) approved by ${ownerName}.`);
    } else {
      setApprovalNotice(`❌ Declined: ${item?.reference} has been rejected.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Welcome Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 mb-2">
              <Building size={14} className="text-purple-300" />
              EXECUTIVE BUSINESS OWNER CONSOLE
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome, {ownerName}
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              High-level strategic oversight of Turashoboye Feeds Rwanda: financial performance, gross margins, expenditure sign-offs, and enterprise growth.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
            <Link
              to="/reports"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition"
            >
              <FileText size={15} />
              Full Financial P&L
            </Link>
            <Link
              to="/users"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition"
            >
              <Users size={15} />
              Manage Staff & Farmers
            </Link>
          </div>
        </div>
      </div>

      {approvalNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center justify-between">
          <span>{approvalNotice}</span>
          <button onClick={() => setApprovalNotice(null)} className="text-emerald-700 hover:text-emerald-900 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Gross Sales (Month)
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#2E7D32]">
              <DollarSign size={18} />
            </div>
          </div>
          <span className="text-2xl font-black text-gray-900 mt-2 block">RWF 14,850,000</span>
          <span className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp size={13} /> +18.4% vs previous month
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Gross Margin
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <PieChart size={18} />
            </div>
          </div>
          <span className="text-2xl font-black text-purple-900 mt-2 block">28.6%</span>
          <span className="text-xs text-gray-500 mt-1 block">Net Profit: RWF 4,247,000</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Working Capital / Cash
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <ShieldCheck size={18} />
            </div>
          </div>
          <span className="text-2xl font-black text-blue-900 mt-2 block">RWF 5,620,000</span>
          <span className="text-xs text-gray-500 mt-1 block">MTN MoMo + Bank Accounts</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <AlertCircle size={18} />
            </div>
          </div>
          <span className="text-2xl font-black text-amber-700 mt-2 block">
            {approvals.filter((a) => a.status === 'pending').length} Action Items
          </span>
          <span className="text-xs text-amber-800 font-medium mt-1 block">Awaiting your executive sign-off</span>
        </div>
      </div>

      {/* Main Row: High-Value Approval Queue & Revenue by Product Line */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Approval Queue */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                Executive Expense & PO Approval Queue
              </h2>
              <p className="text-xs text-gray-500">
                Expenditures and large grain orders requiring Business Owner authorization.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Owner Sign-off
            </span>
          </div>

          <div className="space-y-4">
            {approvals.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-gray-200 bg-gray-50/60 hover:bg-gray-50 transition space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-900 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                        {item.reference}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">{item.date}</span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mt-1">{item.title}</h3>
                    <p className="text-xs text-gray-600 mt-0.5">{item.details}</p>
                    <span className="text-[11px] text-gray-400 mt-1 block">Requested by: {item.requestedBy}</span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-gray-900 block">
                      RWF {item.amountRwf.toLocaleString()}
                    </span>
                    {item.status === 'pending' && (
                      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-1">
                        Pending
                      </span>
                    )}
                    {item.status === 'approved' && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                        Approved
                      </span>
                    )}
                    {item.status === 'rejected' && (
                      <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full inline-block mt-1">
                        Rejected
                      </span>
                    )}
                  </div>
                </div>

                {item.status === 'pending' && (
                  <div className="pt-2 border-t border-gray-200/80 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleDecision(item.id, 'rejected')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                    >
                      <XCircle size={14} className="text-red-500" />
                      Decline
                    </button>
                    <button
                      onClick={() => handleDecision(item.id, 'approved')}
                      className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-xs font-bold shadow-xs transition"
                    >
                      <CheckCircle2 size={14} />
                      Authorize & Sign
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Revenue Breakdown & Super Admin Constraints */}
        <div className="lg:col-span-5 space-y-6">
          {/* Revenue Breakdown by Category */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-gray-900">Revenue by Product Line (October)</h2>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-gray-700 mb-1">
                  <span>Poultry Feeds (Broiler & Layer)</span>
                  <span className="font-bold text-gray-900">RWF 9,120,000 (61.4%)</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: '61.4%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-gray-700 mb-1">
                  <span>Pig Feeds (Starter & Grower)</span>
                  <span className="font-bold text-gray-900">RWF 3,840,000 (25.8%)</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{ width: '25.8%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-gray-700 mb-1">
                  <span>Dairy Cattle Concentrates</span>
                  <span className="font-bold text-gray-900">RWF 1,890,000 (12.8%)</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '12.8%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Super Admin Guardrails Notice */}
          <div className="bg-purple-50/60 rounded-3xl border border-purple-200 p-6 shadow-xs space-y-3 text-xs">
            <div className="flex items-center gap-2 text-purple-900 font-bold">
              <ShieldCheck size={16} />
              <span>Super Admin Platform Governance Guardrails</span>
            </div>
            <p className="text-purple-800">
              Your business operations are protected by platform-level limits established by the Super Administrator:
            </p>
            <ul className="space-y-1.5 text-purple-900 list-disc list-inside font-medium">
              <li>Max discretionary customer discount: <span className="font-bold">10%</span> (Overridden only by Super Admin)</li>
              <li>Single inventory adjustment ceiling: <span className="font-bold">500 kg</span> per incident</li>
              <li>Dual-signoff enabled for feed formula modifications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
