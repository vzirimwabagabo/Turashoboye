import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  RefreshCw,
  KeyRound,
  UserX,
  UserCheck,
  Filter,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Profile } from '../../types/database';

interface UserRecord {
  id: string;
  auth_user_id: string;
  email?: string;
  display_name: string;
  full_name?: string;
  role: Profile['role'];
  phone?: string;
  mfa_enabled?: boolean;
  status: 'active' | 'suspended' | 'deactivated';
  is_active: boolean;
  suspended_at?: string | null;
  suspension_reason?: string | null;
  created_at: string;
}

const ROLE_BADGES: Record<Profile['role'], { label: string; color: string }> = {
  super_admin: { label: 'Super Administrator', color: 'bg-red-100 text-red-800 border-red-200' },
  owner: { label: 'System Admin / Owner', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  manager: { label: 'Depot Manager', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  sales_staff: { label: 'Sales Staff', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  inventory: { label: 'Inventory Officer', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  public: { label: 'Farmer / Customer', color: 'bg-gray-100 text-gray-800 border-gray-200' },
};

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [suspendModalUser, setSuspendModalUser] = useState<UserRecord | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // New user form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('turashoboye2026');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<Profile['role']>('sales_staff');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setUsers(
          data.map((p) => ({
            ...p,
            status: p.status || (p.is_active === false ? 'suspended' : 'active'),
            is_active: p.is_active !== undefined ? p.is_active : true,
          })) as UserRecord[]
        );
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setActionMessage({
        type: 'error',
        text: err?.message || 'Failed to fetch verified user directory from database.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (targetId: string, updatedRole: Profile['role']) => {
    try {
      setProcessingId(targetId);
      setActionMessage(null);

      const { error: rpcErr } = await supabase.rpc('admin_set_user_role', {
        target_profile_id: targetId,
        new_role: updatedRole,
      });

      if (rpcErr) {
        throw rpcErr;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, role: updatedRole } : u))
      );
      setActionMessage({
        type: 'success',
        text: `Role successfully updated to "${updatedRole}" and recorded in audit log.`,
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Failed to update user role.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleStatus = async (userRecord: UserRecord) => {
    if (userRecord.is_active) {
      // Open modal to specify suspension reason
      setSuspendModalUser(userRecord);
      setSuspensionReason('');
    } else {
      // Reactivate directly
      try {
        setProcessingId(userRecord.id);
        setActionMessage(null);
        const { error } = await supabase.rpc('admin_set_user_status', {
          target_profile_id: userRecord.id,
          new_status: 'active',
          reason: 'Administrative reactivation',
        });

        if (error) throw error;

        setUsers((prev) =>
          prev.map((u) =>
            u.id === userRecord.id
              ? { ...u, status: 'active', is_active: true, suspended_at: null, suspension_reason: null }
              : u
          )
        );
        setActionMessage({
          type: 'success',
          text: `Account for ${userRecord.email || userRecord.display_name} has been reactivated.`,
        });
      } catch (err: any) {
        setActionMessage({
          type: 'error',
          text: err?.message || 'Failed to reactivate account.',
        });
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleConfirmSuspend = async (e: FormEvent) => {
    e.preventDefault();
    if (!suspendModalUser) return;

    try {
      setProcessingId(suspendModalUser.id);
      setActionMessage(null);

      const reason = suspensionReason.trim() || 'Administrative suspension';
      const { error } = await supabase.rpc('admin_set_user_status', {
        target_profile_id: suspendModalUser.id,
        new_status: 'suspended',
        reason: reason,
      });

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === suspendModalUser.id
            ? {
                ...u,
                status: 'suspended',
                is_active: false,
                suspended_at: new Date().toISOString(),
                suspension_reason: reason,
              }
            : u
        )
      );

      setActionMessage({
        type: 'success',
        text: `Account for ${suspendModalUser.email || suspendModalUser.display_name} has been suspended.`,
      });
      setSuspendModalUser(null);
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Failed to suspend account.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handlePasswordReset = async (userRecord: UserRecord) => {
    if (!userRecord.email) {
      setActionMessage({ type: 'error', text: 'Cannot reset password: User has no registered email.' });
      return;
    }

    try {
      setProcessingId(userRecord.id);
      setActionMessage(null);

      const { error } = await supabase.auth.resetPasswordForEmail(userRecord.email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) throw error;

      setActionMessage({
        type: 'success',
        text: `Password recovery instructions dispatched to ${userRecord.email}.`,
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Failed to dispatch password recovery email.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionMessage(null);

    try {
      const email = newEmail.trim().toLowerCase();
      const { error: signUpErr } = await supabase.auth.signUp({
        email: email,
        password: newPassword,
        options: {
          data: {
            displayName: newName.trim(),
            role: newRole,
            phone: newPhone.trim(),
          },
        },
      });

      if (signUpErr) throw signUpErr;

      setActionMessage({
        type: 'success',
        text: `Account for ${email} successfully provisioned with role "${newRole}".`,
      });

      setModalOpen(false);
      setNewEmail('');
      setNewName('');
      setNewPhone('');
      await fetchUsers();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || 'Failed to provision user account.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (u.display_name && u.display_name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.phone && u.phone.includes(term));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.is_active) ||
      (statusFilter === 'suspended' && !u.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const isOwnerOrSuperAdmin =
    user?.profile?.role === 'owner' || user?.profile?.role === 'super_admin';
  const isSuperAdmin = user?.profile?.role === 'super_admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#2E7D32]" />
            User Access & Account Control
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Control verified platform user accounts, assign operational roles, suspend access, and initiate password recovery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-600 transition"
            title="Refresh verified user list"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          {isOwnerOrSuperAdmin && (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-sm font-semibold shadow-xs transition"
            >
              <UserPlus size={16} />
              Provision New User
            </button>
          )}
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Role & Status Counts Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {[
          { label: 'Total Verified Users', count: users.length, color: 'text-gray-900' },
          { label: 'Active Accounts', count: users.filter((u) => u.is_active).length, color: 'text-emerald-700' },
          { label: 'Suspended Accounts', count: users.filter((u) => !u.is_active).length, color: 'text-red-700' },
          { label: 'Admins & Owners', count: users.filter((u) => u.role === 'owner' || u.role === 'super_admin').length, color: 'text-purple-700' },
          { label: 'Depot Managers', count: users.filter((u) => u.role === 'manager').length, color: 'text-blue-700' },
          { label: 'Operations Staff', count: users.filter((u) => u.role === 'sales_staff' || u.role === 'inventory').length, color: 'text-amber-700' },
        ].map((item, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
              {item.label}
            </span>
            <span className={`text-2xl font-extrabold mt-1 block ${item.color}`}>
              {item.count}
            </span>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 mr-2">
            <Filter size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-500">Filter:</span>
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {[
              { id: 'all', label: 'All Status' },
              { id: 'active', label: 'Active' },
              { id: 'suspended', label: 'Suspended' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                  statusFilter === s.id
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Role Filter */}
          {['all', 'super_admin', 'owner', 'manager', 'sales_staff', 'inventory', 'public'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                roleFilter === r
                  ? 'bg-[#2E7D32] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {r === 'all'
                ? 'All Roles'
                : r === 'public'
                ? 'Farmers'
                : r === 'super_admin'
                ? 'Super Admin'
                : r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">User Identity</th>
                <th className="px-5 py-3.5">Contact Details</th>
                <th className="px-5 py-3.5">Assigned Role</th>
                <th className="px-5 py-3.5">Account Status</th>
                <th className="px-5 py-3.5">Registered On</th>
                {isOwnerOrSuperAdmin && <th className="px-5 py-3.5 text-right">Administrative Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#2E7D32] mb-2" />
                    Loading verified user directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No verified platform users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const badge = ROLE_BADGES[u.role] || ROLE_BADGES.public;
                  const isCurrentUser = user?.profile?.id === u.id;
                  const isBusy = processingId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full font-bold flex items-center justify-center shrink-0 text-sm ${
                              u.is_active
                                ? 'bg-emerald-100 text-[#2E7D32]'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {(u.display_name || u.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="block text-gray-900">{u.display_name || 'Anonymous User'}</span>
                              {isCurrentUser && (
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-sm font-semibold">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="block text-xs font-normal text-gray-400 font-mono">
                              {u.email || 'No email registered'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="space-y-1 text-xs">
                          {u.phone ? (
                            <span className="flex items-center gap-1.5 text-gray-700">
                              <Phone size={12} className="text-gray-400" />
                              {u.phone}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                          {u.email && (
                            <span className="flex items-center gap-1.5 text-gray-500 truncate max-w-[200px]">
                              <Mail size={12} className="text-gray-400" />
                              {u.email}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.color}`}
                        >
                          <Shield size={12} />
                          {badge.label}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle2 size={12} /> Active
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                              <UserX size={12} /> Suspended
                            </span>
                            {u.suspension_reason && (
                              <span className="block text-[11px] text-gray-400 truncate max-w-[150px]" title={u.suspension_reason}>
                                {u.suspension_reason}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-gray-400" />
                          {new Date(u.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {isOwnerOrSuperAdmin && (
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Role Select */}
                            <select
                              value={u.role}
                              disabled={isBusy || (!isSuperAdmin && u.role === 'super_admin')}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as Profile['role'])}
                              className="text-xs font-semibold bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2E7D32] disabled:opacity-50"
                            >
                              {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                              <option value="owner">Admin / Owner</option>
                              <option value="manager">Depot Manager</option>
                              <option value="sales_staff">Sales Staff</option>
                              <option value="inventory">Inventory Officer</option>
                              <option value="public">Farmer / Customer</option>
                            </select>

                            {/* Suspend / Reactivate Button */}
                            {!isCurrentUser && (isSuperAdmin || (u.role !== 'owner' && u.role !== 'super_admin')) && (
                              <button
                                onClick={() => handleToggleStatus(u)}
                                disabled={isBusy}
                                title={u.is_active ? 'Suspend account' : 'Reactivate account'}
                                className={`p-1.5 rounded-lg border text-xs font-semibold transition flex items-center gap-1 ${
                                  u.is_active
                                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                } disabled:opacity-50`}
                              >
                                {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                              </button>
                            )}

                            {/* Password Recovery Button */}
                            {u.email && (
                              <button
                                onClick={() => handlePasswordReset(u)}
                                disabled={isBusy}
                                title="Send password reset email"
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition disabled:opacity-50"
                              >
                                <KeyRound size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Suspension Reason Modal */}
      {suspendModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-gray-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <UserX size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Suspend User Account</h3>
                  <p className="text-xs text-gray-500">Revoke system access and database privileges</p>
                </div>
              </div>
              <button
                onClick={() => setSuspendModalUser(null)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmSuspend} className="p-6 space-y-4">
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <p className="font-semibold mb-1">
                  Target Account: {suspendModalUser.display_name} ({suspendModalUser.email})
                </p>
                <p className="text-amber-800">
                  Suspending this account immediately blocks all database RLS permissions, session operations, and operational access across the platform.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for Suspension *
                </label>
                <textarea
                  required
                  rows={3}
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="e.g. Account security audit, role change, departure, or suspicious activity..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSuspendModalUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === suspendModalUser.id}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {processingId === suspendModalUser.id ? (
                    <Loader2 className="animate-spin w-3.5 h-3.5" />
                  ) : null}
                  Confirm Account Suspension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provision New User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-gray-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#2E7D32] flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Provision User Account</h3>
                  <p className="text-xs text-gray-500">Create staff or farmer account in Supabase</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name / Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Marie Claire Uwase"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. marie.uwase@turashoboye.rw"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Initial Password *
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Assign Role *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as Profile['role'])}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  >
                    <option value="sales_staff">Sales Staff</option>
                    <option value="inventory">Inventory Officer</option>
                    <option value="manager">Depot Manager</option>
                    <option value="owner">Admin / Owner</option>
                    <option value="public">Farmer / Customer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+250 78..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : null}
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
