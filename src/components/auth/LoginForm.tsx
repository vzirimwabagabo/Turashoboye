import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, UserCheck, LogIn, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../../types/database';

/**
 * Login and Registration form component.
 * Self-registration is strictly for new Customers / Farmers (role: 'public').
 * Staff and managerial accounts (Owner, Manager, Sales Staff) must be provisioned
 * by Super Administrators via internal management tools.
 * New customer accounts require administrator approval before ordering is enabled.
 */
export default function LoginForm() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('tab') === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { signIn, signUp, error, loading } = useAuth();
  const navigate = useNavigate();

  const redirectUrl = searchParams.get('redirect');

  useEffect(() => {
    if (searchParams.get('tab') === 'register') {
      setIsSignUp(true);
    } else if (searchParams.get('tab') === 'login') {
      setIsSignUp(false);
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage(null);

    if (isSignUp) {
      // Self-registration is strictly locked to Customer / Farmer (UserRole.PUBLIC)
      const res = await signUp({
        email,
        password,
        displayName: displayName.trim() || email.split('@')[0],
        phone: phone.trim() || undefined,
        role: UserRole.PUBLIC,
      });
      setSubmitting(false);
      if (res.success) {
        setSuccessMessage(
          'Customer account created successfully! Your account is awaiting administrative approval by our Mahama depot staff before feed ordering is enabled.'
        );
        setTimeout(() => {
          navigate(redirectUrl || '/portal');
        }, 2200);
      }
    } else {
      const res = await signIn(email, password);
      setSubmitting(false);
      if (res.success) {
        if (redirectUrl) {
          navigate(redirectUrl);
          return;
        }
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
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
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set('tab', 'login');
              return next;
            });
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
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set('tab', 'register');
              return next;
            });
            setSuccessMessage(null);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition ${
            isSignUp
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <UserCheck className="h-3.5 w-3.5" />
          Register Customer
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <CheckCircle2 size={13} className="text-[#2E7D32]" />
                Farmer & Customer Account Registration
              </span>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Staff & managerial accounts cannot self-register; they are provisioned internally by administrators. All new customer accounts require admin verification before ordering is enabled.
              </p>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Full Name / Farm Name *
              </label>
              <input
                type="text"
                id="displayName"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Jean-Paul Habimana"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-xs focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Phone Number (WhatsApp Preferred) *
              </label>
              <input
                type="tel"
                id="phone"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +250 788 000 000"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-xs focus:outline-none focus:ring-1 focus:ring-[#2E7D32] focus:border-[#2E7D32] sm:text-sm"
              />
            </div>
          </>
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
            placeholder={isSignUp ? 'farmer@example.com' : 'user@turashoboye.rw'}
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
          {isSignUp ? 'Create Customer Account (Pending Approval)' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
