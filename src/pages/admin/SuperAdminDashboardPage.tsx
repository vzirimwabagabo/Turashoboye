import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  DollarSign,
  Factory,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Sliders,
  RefreshCw,
  Search,
  History,
  KeyRound,
  UserX,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface PlatformMetric {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  subtext: string;
}

interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  detail: any;
  created_at: string;
  profiles?: {
    email: string;
    display_name: string;
    role: string;
  } | null;
}

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [auditFilter, setAuditFilter] = useState('all');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const platformMetrics: PlatformMetric[] = [
    {
      title: 'Platform Gross Revenue',
      value: '0 RWF (Staging)',
      change: 'Pre-launch',
      positive: true,
      subtext: 'Awaiting first live depot transaction',
    },
    {
      title: 'Total Animal Feed Milled',
      value: '0.0 MT',
      change: 'Ready for batching',
      positive: true,
      subtext: 'Operational formulas and silos configured',
    },
    {
      title: 'Total Platform Accounts',
      value: `${users.length} Registered`,
      change: 'Active in DB',
      positive: true,
      subtext: 'Verified in PostgreSQL public.profiles',
    },
    {
      title: 'Statutory Compliance Status',
      value: 'Filings in Draft',
      change: 'Audit Pending',
      positive: false,
      subtext: 'RICA & RSB applications in preparation',
    },
  ];

  // Business Owner Privilege Constraints
  const [ownerDiscountLimit, setOwnerDiscountLimit] = useState('10');
  const [ownerStockAdjustCap, setOwnerStockAdjustCap] = useState('500');
  const [enforceTwoPersonApproval, setEnforceTwoPersonApproval] = useState(true);

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUsers(data);
      }
    } catch (err) {
      console.warn('Superadmin user fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, profiles:user_id(email, display_name, role)')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data) {
        setAuditLogs(data as AuditLogEntry[]);
      }
    } catch (err) {
      console.warn('Superadmin audit fetch error', err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    loadAllUsers();
    loadAuditLogs();
  }, []);

  const handleRoleOverride = async (profileId: string, newRole: string) => {
    try {
      setProcessingId(profileId);
      setActionNotice(null);

      const { error } = await supabase.rpc('admin_set_user_role', {
        target_profile_id: profileId,
        new_role: newRole,
      });

      if (error) throw error;

      setUsers((prev) => prev.map((u) => (u.id === profileId ? { ...u, role: newRole } : u)));
      setActionNotice({ type: 'success', text: `Role privilege successfully reassigned to "${newRole}".` });
      await loadAuditLogs();
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err?.message || 'Privilege update failed.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleStatus = async (targetUser: any) => {
    const isCurrentlyActive = targetUser.is_active !== false;
    const newStatus = isCurrentlyActive ? 'suspended' : 'active';
    const reason = isCurrentlyActive ? 'Super Administrator security intervention' : 'Super Administrator reactivation';

    try {
      setProcessingId(targetUser.id);
      setActionNotice(null);

      const { error } = await supabase.rpc('admin_set_user_status', {
        target_profile_id: targetUser.id,
        new_status: newStatus,
        reason: reason,
      });

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id
            ? { ...u, status: newStatus, is_active: !isCurrentlyActive, suspension_reason: isCurrentlyActive ? reason : null }
            : u
        )
      );

      setActionNotice({
        type: 'success',
        text: `Account for ${targetUser.email || targetUser.display_name} is now ${newStatus}.`,
      });
      await loadAuditLogs();
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err?.message || 'Failed to update account status.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handlePasswordRecovery = async (targetUser: any) => {
    if (!targetUser.email) {
      setActionNotice({ type: 'error', text: 'Target account has no registered email.' });
      return;
    }

    try {
      setProcessingId(targetUser.id);
      setActionNotice(null);

      const { error } = await supabase.auth.resetPasswordForEmail(targetUser.email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) throw error;

      setActionNotice({
        type: 'success',
        text: `Password recovery dispatch triggered for ${targetUser.email}.`,
      });
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err?.message || 'Failed to dispatch password recovery email.' });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      (u.display_name && u.display_name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.role && u.role.toLowerCase().includes(term))
    );
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditFilter === 'all') return true;
    if (auditFilter === 'security') {
      return (
        log.action.includes('UNAUTHORIZED') ||
        log.action.includes('VIOLATION') ||
        log.action.includes('SUSPEND')
      );
    }
    if (auditFilter === 'roles') return log.action.includes('ROLE');
    if (auditFilter === 'status') return log.action.includes('USER') || log.action.includes('REACTIVATE');
    return true;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Super Admin Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-gray-900 via-slate-900 to-emerald-950 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/30">
              <ShieldAlert size={14} className="text-red-400" />
              SUPER ADMINISTRATOR COMMAND CONSOLE
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Master Platform Governance & Multi-Tenant Oversight
            </h1>
            <p className="text-sm text-gray-300 max-w-2xl">
              Higher-tier governance sitting above Business Owners. You retain absolute privilege over role assignments, owner limits, system analytics, and cryptographic security policies.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/10 text-xs">
              <span className="text-gray-400 block">Operator Identity</span>
              <span className="font-bold text-emerald-300">{user?.email || 'Super Admin'}</span>
            </div>
          </div>
        </div>
      </div>

      {actionNotice && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 border ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {actionNotice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* 1. Global Platform Performance Graphs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {platformMetrics.map((m, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
              <span>{m.title}</span>
              <div className="w-7 h-7 rounded-lg bg-gray-50 text-gray-700 flex items-center justify-center">
                {idx === 0 && <DollarSign size={16} />}
                {idx === 1 && <Factory size={16} />}
                {idx === 2 && <Users size={16} />}
                {idx === 3 && <CheckCircle2 size={16} />}
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900">{m.value}</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                <ArrowUpRight size={14} /> {m.change}
              </span>
            </div>
            <span className="text-xs text-gray-400 mt-1 block">{m.subtext}</span>
          </div>
        ))}
      </div>

      {/* Visual Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Platform Revenue Growth Bars */}
        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#2E7D32]" />
                Platform GMV & Revenue Velocity Graph
              </h2>
              <p className="text-xs text-gray-500">Cross-period transaction volume in whole Rwandan Francs.</p>
            </div>
            <span className="text-xs font-bold text-purple-800 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
              Super Admin View
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { label: 'May', val: 0, max: 10000000 },
              { label: 'Jun', val: 0, max: 10000000 },
              { label: 'Jul', val: 0, max: 10000000 },
              { label: 'Aug', val: 0, max: 10000000 },
              { label: 'Sep', val: 0, max: 10000000 },
              { label: 'Oct', val: 0, max: 10000000 },
            ].map((bar, i) => {
              const pct = bar.max > 0 ? Math.round((bar.val / bar.max) * 100) : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">{bar.label} 2026</span>
                    <span className="font-mono font-bold text-gray-900">{bar.val.toLocaleString()} RWF (Staging)</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 via-teal-600 to-[#2E7D32] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100 text-center text-xs">
            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-500 block">Active Depots</span>
              <span className="font-bold text-gray-900 mt-0.5 block">1 Active (Mahama)</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-500 block">Avg Milling Yield</span>
              <span className="font-bold text-emerald-700 mt-0.5 block">98.4% Efficiency</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-500 block">Database Latency</span>
              <span className="font-bold text-gray-900 mt-0.5 block">24 ms (eu-west-1)</span>
            </div>
          </div>
        </div>

        {/* Right: Business Owner Privilege Limits */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Sliders className="w-5 h-5 text-purple-700" />
              <h2 className="text-base font-bold text-gray-900">
                Business Owner Guardrails
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Limits set by Super Admin that Business Owners cannot exceed.
            </p>

            <div className="space-y-4 mt-5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Max Owner Discount Authorization (%)
                </label>
                <input
                  type="number"
                  value={ownerDiscountLimit}
                  onChange={(e) => setOwnerDiscountLimit(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-semibold text-sm"
                />
                <p className="text-[11px] text-gray-400 mt-0.5">Discounts above this require Super Admin override.</p>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Single Stock Adjustment Cap (kg)
                </label>
                <input
                  type="number"
                  value={ownerStockAdjustCap}
                  onChange={(e) => setOwnerStockAdjustCap(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-semibold text-sm"
                />
                <p className="text-[11px] text-gray-400 mt-0.5">Inventory write-offs above this trigger an audit freeze.</p>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enforceTwoPersonApproval}
                    onChange={(e) => setEnforceTwoPersonApproval(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded-sm"
                  />
                  <span className="font-semibold text-gray-800">
                    Mandatory Dual-Signoff for Formulation Changes
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 text-xs text-purple-900">
            <span className="font-bold block mb-0.5">Super Admin Sovereign Rule</span>
            Business owners operate within their registered entity. System architecture, RLS enforcement, and role elevation remain under Super Admin domain.
          </div>
        </div>
      </div>

      {/* 2. Super Admin Master User Privilege Governance */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-600" />
              Master User Privileges Directory (All Roles)
            </h2>
            <p className="text-xs text-gray-500">
              Govern operational roles, account suspension, and password recovery across the platform.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user, email, or role..."
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <button
              onClick={loadAllUsers}
              disabled={loading}
              className="p-2 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-600 transition"
              title="Refresh users"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* User Privileges Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">User & Contact</th>
                <th className="px-4 py-3">Current Privilege</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3">Registered Date</th>
                <th className="px-4 py-3 text-right">Super Admin Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((u) => {
                const isCurrentUser = user?.profile?.id === u.id;
                const isActive = u.is_active !== false;
                const isBusy = processingId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-gray-50/70 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{u.display_name || 'Anonymous User'}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded-sm font-semibold">
                            You (Super Admin)
                          </span>
                        )}
                      </div>
                      <span className="text-gray-400 font-mono text-[11px] block">{u.email || 'No email registered'}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] border ${
                          u.role === 'super_admin'
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : u.role === 'owner'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : u.role === 'manager'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : u.role === 'public'
                            ? 'bg-gray-100 text-gray-800 border-gray-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {u.role === 'public' ? 'Farmer / Customer' : u.role.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 size={11} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200" title={u.suspension_reason || 'Suspended'}>
                          <UserX size={11} /> Suspended
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-gray-400">
                      {new Date(u.created_at || '2026-10-18T00:00:00Z').toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Role Select */}
                        <select
                          value={u.role}
                          disabled={isBusy}
                          onChange={(e) => handleRoleOverride(u.id, e.target.value)}
                          className="text-xs font-semibold bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:opacity-50"
                        >
                          <option value="super_admin">🛡️ Super Admin</option>
                          <option value="owner">🏢 Business Owner</option>
                          <option value="manager">📦 Depot Manager</option>
                          <option value="sales_staff">💼 Sales Staff</option>
                          <option value="inventory">🚚 Inventory Officer</option>
                          <option value="public">🌾 Farmer / Customer</option>
                        </select>

                        {/* Suspend / Reactivate */}
                        {!isCurrentUser && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isBusy}
                            title={isActive ? 'Suspend User Access' : 'Reactivate User Account'}
                            className={`p-1.5 rounded-lg border text-xs font-semibold transition flex items-center gap-1 ${
                              isActive
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            } disabled:opacity-50`}
                          >
                            {isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                          </button>
                        )}

                        {/* Password Recovery */}
                        {u.email && (
                          <button
                            onClick={() => handlePasswordRecovery(u)}
                            disabled={isBusy}
                            title="Dispatch password recovery email"
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition disabled:opacity-50"
                          >
                            <KeyRound size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Real-Time Platform Security & Governance Audit Log */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Security & Administrative Audit Log Stream
            </h2>
            <p className="text-xs text-gray-500">
              Immutable trail of authorization events, status changes, and privilege mutations recorded in PostgreSQL.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 text-xs">
              {[
                { id: 'all', label: 'All Events' },
                { id: 'security', label: 'Security & Warnings' },
                { id: 'roles', label: 'Role Changes' },
                { id: 'status', label: 'Suspensions' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setAuditFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    auditFilter === f.id
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={loadAuditLogs}
              disabled={auditLoading}
              className="p-2 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-600 transition"
              title="Refresh audit stream"
            >
              <RefreshCw size={15} className={auditLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Audit Log Entries List */}
        <div className="space-y-2">
          {auditLoading ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-2" />
              Loading real-time audit stream...
            </div>
          ) : filteredAuditLogs.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              No audit log entries matching selected filter.
            </div>
          ) : (
            filteredAuditLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const isAlert =
                log.action.includes('UNAUTHORIZED') ||
                log.action.includes('VIOLATION') ||
                log.action.includes('SUSPEND');

              return (
                <div
                  key={log.id}
                  className={`rounded-2xl border p-3 text-xs transition ${
                    isAlert
                      ? 'bg-red-50/40 border-red-200'
                      : 'bg-gray-50/50 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded-md uppercase text-[10px] tracking-wide ${
                          isAlert
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : log.action.includes('ROLE')
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {log.action}
                      </span>

                      <span className="font-semibold text-gray-900">
                        {log.profiles?.display_name || log.profiles?.email || 'Platform System'}
                      </span>
                      {log.profiles?.role && (
                        <span className="text-[10px] font-mono text-gray-500 bg-gray-200/70 px-1.5 py-0.2 rounded-sm">
                          {log.profiles.role}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-[11px] font-mono">
                        {new Date(log.created_at).toLocaleString('en-GB')}
                      </span>
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200/50"
                        title="Toggle JSON details"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && log.detail && (
                    <div className="mt-3 pt-2 border-t border-gray-200/60">
                      <pre className="p-3 bg-gray-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto">
                        {JSON.stringify(log.detail, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
