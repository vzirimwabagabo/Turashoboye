// src/components/layout/Sidebar.tsx
/**
 * Collapsible sidebar navigation component for Turashoboye Feeds.
 */
import { NavLink } from "react-router-dom";
import {
  X,
  Home,
  Box,
  Truck,
  Factory,
  Beaker,
  Compass,
  ShoppingCart,
  Users,
  Building2,
  ClipboardList,
  Shield,
  BarChart2,
  Settings,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { UserRole } from "../../types/database";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Home, roles: [UserRole.PUBLIC, UserRole.SALES_STAFF, UserRole.INVENTORY, UserRole.MANAGER, UserRole.OWNER] },
  { to: "/trends", label: "Trends & Command", icon: TrendingUp, roles: [UserRole.MANAGER, UserRole.OWNER] },
  { to: "/products", label: "Products & SKUs", icon: Box, roles: [UserRole.MANAGER, UserRole.OWNER] },
  { to: "/inventory", label: "Stock Ledger", icon: Truck, roles: [UserRole.INVENTORY, UserRole.MANAGER, UserRole.OWNER] },
  { to: "/procurement/orders", label: "Purchase Orders", icon: ClipboardList, roles: [UserRole.INVENTORY, UserRole.MANAGER, UserRole.OWNER] },
  { to: "/procurement/suppliers", label: "Suppliers", icon: Building2, roles: [UserRole.INVENTORY, UserRole.MANAGER, UserRole.OWNER] },
  { to: "/production", label: "Production Runs", icon: Factory, roles: [UserRole.MANAGER, UserRole.OWNER] },
  { to: "/production/formulas", label: "Feed Formulations", icon: Beaker, roles: [UserRole.MANAGER, UserRole.OWNER] },
  { to: "/production/traceability", label: "Batch Traceability", icon: Compass, roles: [UserRole.MANAGER, UserRole.OWNER] },
  { to: "/sales", label: "Sales & Orders", icon: ShoppingCart, roles: [UserRole.SALES_STAFF, UserRole.MANAGER, UserRole.OWNER] },
  { to: "/customers", label: "Customers", icon: Users, roles: [UserRole.SALES_STAFF, UserRole.MANAGER, UserRole.OWNER] },
  { to: "/compliance", label: "Compliance & RSB", icon: Shield, roles: [UserRole.MANAGER, UserRole.OWNER] },
  { to: "/reports", label: "Reports", icon: BarChart2, roles: [UserRole.MANAGER, UserRole.OWNER] },
  { to: "/users", label: "User Control", icon: UserCheck, roles: [UserRole.OWNER] },
  { to: "/settings", label: "Settings", icon: Settings, roles: [UserRole.OWNER] },
];

export const Sidebar = ({ open, onClose }: SidebarProps) => {
  const { user, signOut } = useAuth();

  const role = user?.profile?.role ?? UserRole.PUBLIC;

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-30 transition-opacity lg:hidden ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transform transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 flex flex-col`}
      >
        {/* Header with close button on mobile */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2E7D32] text-sm font-bold text-white">
              TF
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Turashoboye</h2>
              <p className="text-xs text-gray-400">Animal Feeds Platform</p>
            </div>
          </div>
          <button className="lg:hidden p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white" onClick={onClose} aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems
            .filter((item) => (item.roles as readonly UserRole[]).includes(role))
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-[#2E7D32] text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </NavLink>
              );
            })}
        </nav>

        {/* Bottom user info and sign‑out */}
        <div className="p-4 border-t border-gray-800 bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            {user?.profile?.avatarUrl ? (
              <img src={user.profile.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-semibold text-gray-200">
                {(user?.profile?.displayName ?? user?.email ?? "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-xs text-white truncate">
                {user?.profile?.displayName ?? user?.email ?? "Guest"}
              </span>
              <span className="text-[10px] text-gray-400 capitalize">
                {user?.profile?.role ? user.profile.role.replace("_", " ") : "public"}
              </span>
            </div>
          </div>
          <button
            onClick={async () => await signOut()}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium bg-gray-800 hover:bg-red-700 text-gray-200 hover:text-white rounded-md transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
};
