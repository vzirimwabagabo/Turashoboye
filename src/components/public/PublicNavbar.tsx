import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Phone, ShoppingBag } from 'lucide-react';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/catalogue', label: 'Feed Catalogue' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact & Orders' },
];

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <Link
              to="/login"
              className="px-3.5 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Staff Login
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              to="/login"
              className="text-xs font-medium text-emerald-800 px-2.5 py-1.5 rounded-md bg-emerald-50"
            >
              Staff
            </Link>
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
