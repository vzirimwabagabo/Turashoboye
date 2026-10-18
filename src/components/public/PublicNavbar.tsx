import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Phone, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/catalogue', label: 'Feed Catalogue' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact & Orders' },
];

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-xs">
      {/* Top operational alert banner */}
      <div className="bg-[#2E7D32] text-white px-4 py-1.5 text-xs text-center font-medium flex items-center justify-center gap-2">
        <span>📍 Serving farmers in Mahama Refugee Camp & Kirehe District</span>
        <span className="hidden sm:inline">|</span>
        <span className="hidden sm:inline flex items-center gap-1">
          <Phone size={12} /> Direct Phone/WhatsApp Orders Available
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2E7D32] text-white font-bold text-base shadow-sm">
              TF
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900 tracking-tight block leading-tight">
                Turashoboye
              </span>
              <span className="text-xs text-emerald-800 font-semibold tracking-wide uppercase">
                Feeds & Nutrition
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[#2E7D32] font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {user?.profile?.role === 'public' && (
              <NavLink
                to="/portal"
                className={({ isActive }) =>
                  `text-sm font-semibold transition-colors ${
                    isActive ? 'text-[#2E7D32]' : 'text-green-700 hover:text-green-900'
                  }`
                }
              >
                My Feed Orders
              </NavLink>
            )}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/catalogue"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2E7D32] text-white text-sm font-medium shadow-xs hover:bg-[#256b29] transition-colors"
            >
              <ShoppingBag size={16} />
              Browse Feeds
            </Link>

            {user ? (
              <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
                {user.profile?.role === 'super_admin' ? (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition"
                    title="Super Administrator Console"
                  >
                    <ShieldCheck size={14} className="text-red-700" />
                    <span>Super Admin</span>
                  </Link>
                ) : user.profile?.role === 'owner' ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg transition"
                    title="Executive Owner Dashboard"
                  >
                    <ShieldCheck size={14} className="text-purple-700" />
                    <span>Owner Portal</span>
                  </Link>
                ) : user.profile?.role === 'manager' ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition"
                    title="Depot Operations Floor"
                  >
                    <ShieldCheck size={14} className="text-blue-700" />
                    <span>Depot Ops</span>
                  </Link>
                ) : user.profile?.role && user.profile.role !== 'public' ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition"
                    title="Staff Management Workspace"
                  >
                    <ShieldCheck size={14} className="text-[#2E7D32]" />
                    <span>Staff Ops</span>
                  </Link>
                ) : (
                  <Link
                    to="/portal"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-800 hover:text-[#2E7D32] px-2 py-1 rounded-md hover:bg-gray-50"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-[#2E7D32]">
                      {(user.profile?.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </span>
                    <span>My Account</span>
                  </Link>
                )}
                <button
                  onClick={async () => await signOut()}
                  className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded hover:bg-gray-50 transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3.5 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center gap-2 md:hidden">
            {user ? (
              user.profile?.role === 'super_admin' ? (
                <Link
                  to="/admin"
                  className="text-xs font-bold text-red-900 px-2.5 py-1.5 rounded-md bg-red-50 border border-red-200"
                >
                  Admin
                </Link>
              ) : user.profile?.role && user.profile.role !== 'public' ? (
                <Link
                  to="/dashboard"
                  className="text-xs font-bold text-emerald-900 px-2.5 py-1.5 rounded-md bg-emerald-50 border border-emerald-200"
                >
                  Staff Ops
                </Link>
              ) : (
                <Link
                  to="/portal"
                  className="text-xs font-bold text-emerald-800 px-2.5 py-1.5 rounded-md bg-emerald-50"
                >
                  My Account
                </Link>
              )
            ) : (
              <Link
                to="/login"
                className="text-xs font-medium text-emerald-800 px-2.5 py-1.5 rounded-md bg-emerald-50"
              >
                Sign In
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? 'bg-emerald-50 text-[#2E7D32] font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-gray-100">
            <Link
              to="/catalogue"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#2E7D32] text-white text-sm font-medium shadow-xs"
            >
              <ShoppingBag size={16} />
              Browse Feeds
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
