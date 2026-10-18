import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, UserCheck, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { Profile } from '../../types/database';

const QUICK_TARGETS: { name: string; role: Profile['role']; id: string; email: string; label: string }[] = [
  {
    id: 'u-owner-001',
    name: 'Aline Mugisha',
    role: 'owner',
    email: 'owner@turashoboye.rw',
    label: '🏢 Aline Mugisha (Business Owner)',
  },
  {
    id: 'u-manager-001',
    name: 'Vedaste Zirimwabagabo',
    role: 'manager',
    email: 'manager@turashoboye.rw',
    label: '📦 Vedaste Zirimwabagabo (Depot Manager)',
  },
  {
    id: 'u-customer-001',
    name: 'Jean-Paul Habimana',
    role: 'public',
    email: 'farmer@turashoboye.rw',
    label: '🌾 Jean-Paul Habimana (Mahama Farmer)',
  },
];

export default function ImpersonationBanner() {
  const { isImpersonating, user, actOnBehalfOf, stopImpersonation } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);


  if (!isImpersonating || !user) {
    return null;
  }

  const roleLabel =
    user.profile?.role === 'owner'
      ? 'Business Owner'
      : user.profile?.role === 'manager'
      ? 'Depot Manager'
      : user.profile?.role === 'public'
      ? 'Farmer / Customer'
      : user.profile?.role?.replace('_', ' ') || 'User';

  const handleExit = () => {
    stopImpersonation();
    navigate('/admin');
  };

  const handleSwitch = (target: typeof QUICK_TARGETS[0]) => {
    actOnBehalfOf({
      id: target.id,
      displayName: target.name,
      role: target.role,
      email: target.email,
    });
    setDropdownOpen(false);
    if (target.role === 'public') {
      navigate('/portal');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white border-b-2 border-purple-500 shadow-xl px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Identity & Status */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white shadow-xs shrink-0 animate-pulse">
            <ShieldAlert size={18} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-xs">
            <span className="font-black uppercase tracking-wider text-purple-300 flex items-center gap-1">
              Super Admin Impersonation:
            </span>
            <span className="font-bold text-white">
              Acting on behalf of <span className="underline decoration-purple-400 font-extrabold">{user.profile?.displayName || user.email}</span>
            </span>
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-900/90 text-purple-200 border border-purple-700">
              Role: {roleLabel}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Switch Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/70 hover:bg-purple-800 text-purple-100 text-xs font-semibold border border-purple-700/80 transition"
            >
              <UserCheck size={14} />
              <span>Switch User ▾</span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-gray-900 border border-purple-700/60 shadow-2xl p-2 z-50 text-xs space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1 block">
                  Switch Persona On-the-Fly:
                </span>
                {QUICK_TARGETS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSwitch(t)}
                    className="w-full text-left px-3 py-2 rounded-xl text-gray-200 hover:bg-purple-950 hover:text-white transition flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-semibold block">{t.name}</span>
                      <span className="text-[11px] text-gray-400 capitalize">{t.role}</span>
                    </div>
                    <ArrowRight size={12} className="text-purple-400 opacity-0 group-hover:opacity-100 transition" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Jump to role workspace */}
          <button
            onClick={() => {
              if (user.profile?.role === 'public') {
                navigate('/portal');
              } else {
                navigate('/dashboard');
              }
            }}
            className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
          >
            <span>Role Workspace</span>
            <ArrowRight size={13} />
          </button>

          {/* Exit Impersonation Button */}
          <button
            onClick={handleExit}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition"
          >
            <X size={14} />
            <span>Exit Impersonation</span>
          </button>
        </div>
      </div>
    </div>
  );
}
