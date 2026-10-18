import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, UserCheck, LogIn } from 'lucide-react';
import { UserRole } from '../../types/database';

/**
 * Login and Registration form component.
 * Allows staff/managers to sign in or create an initial account.
 */
export default function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.MANAGER);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { signIn, signUp, error, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage(null);

    if (isSignUp) {
      const res = await signUp({
        email,
        password,
        displayName: displayName.trim() || email.split('@')[0],
        role,
      });
      setSubmitting(false);
      if (res.success) {
        setSuccessMessage('Account registered successfully! Signing you in...');
        setTimeout(() => {
          if (role === UserRole.PUBLIC) {
            navigate('/portal');
          } else {
            navigate('/dashboard');
          }
        }, 1200);
      }
    } else {
      const res = await signIn(email, password);
      setSubmitting(false);
      if (res.success) {
        const clean = email.toLowerCase();
        if (res.role === UserRole.SUPER_ADMIN || clean.includes('superadmin')) {
          navigate('/admin');
        } else if (res.role === UserRole.PUBLIC || clean.includes('farmer') || clean.includes('customer')) {
          navigate('/portal');
        } else {
          navigate('/dashboard');
        }
      }
    }

  };

  const selectPersona = (pEmail: string) => {
    setIsSignUp(false);
    setEmail(pEmail);
    setPassword('turashoboye2026');
    setSuccessMessage(null);
  };

  return (
    <div className="space-y-5">
      {/* 1-Click Evaluation Personas */}
      <div className="rounded-xl bg-gray-50 p-3 border border-gray-200 space-y-2">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
          Select Test Persona:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => selectPersona('superadmin@turashoboye.rw')}
            className="px-2 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-800 text-[11px] font-bold transition text-center"
          >
            🛡️ Super Admin
          </button>
          <button
            type="button"
            onClick={() => selectPersona('owner@turashoboye.rw')}
            className="px-2 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-bold transition text-center"
          >
            🏢 Business Owner
          </button>
          <button
            type="button"
            onClick={() => selectPersona('manager@turashoboye.rw')}
            className="px-2 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-bold transition text-center"
          >
            📦 Depot Manager
          </button>
          <button
            type="button"
            onClick={() => selectPersona('farmer@turashoboye.rw')}
            className="px-2 py-1.5 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 text-[#2E7D32] text-[11px] font-bold transition text-center"
          >
            🌾 Farmer / Customer
          </button>
        </div>
      </div>

      {/* Tab toggle */}
      <div className="flex rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(false);
            setSuccessMessage(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition ${
            !isSignUp
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <LogIn className="h-3.5 w-3.5" />
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setIsSignUp(true);
            setSuccessMessage(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition ${
            isSignUp
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <UserCheck className="h-3.5 w-3.5" />
          Create Account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div>
            <label htmlFor="displayName" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Full Name / Display Name *
            </label>
            <input
              type="text"
              id="displayName"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Jean Habimana"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-xs focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] sm:text-sm"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Email address *
          </label>
          <input
            type="email"
            id="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="staff@turashoboye.rw"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-xs focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Password *
          </label>
          <input
            type="password"
            id="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-xs focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] sm:text-sm"
          />
        </div>

        {isSignUp && (
          <div>
            <label htmlFor="role" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Operational Role *
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-xs focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] sm:text-sm bg-white"
            >
              <option value={UserRole.OWNER}>Business Owner (Full Access)</option>
              <option value={UserRole.MANAGER}>Depot Manager / QA Supervisor</option>
              <option value={UserRole.SALES_STAFF}>Sales Staff / Cashier</option>
              <option value={UserRole.INVENTORY}>Inventory & Warehouse Operator</option>
            </select>
          </div>
        )}

        {error && (
          <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md" role="alert">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3 text-xs text-green-800 bg-green-50 border border-green-200 rounded-md" role="alert">
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || loading}
          className="w-full inline-flex justify-center items-center rounded-md border border-transparent bg-[#2E7D32] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#256b29] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] disabled:opacity-50 transition-colors cursor-pointer"
        >
          {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
          {isSignUp ? 'Create Staff Account' : 'Sign In to Dashboard'}
        </button>
      </form>
    </div>
  );
}
