// src/components/layout/Sidebar.tsx
/**
 * Collapsible sidebar navigation component for Turashoboye Feeds.
 * Organizes menu items with category section headers and nested sub-item indentation.
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
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { UserRole } from "../../types/database";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItemConfig {
  to: string;
  label: string;
  icon: any;
  roles: readonly UserRole[];
  indent?: boolean;
  sectionHeader?: string;
}

const getNavItems = (role: UserRole): NavItemConfig[] => [
  // SECTION: GOVERNANCE
  {
    to: "/admin",
    label: "Platform Admin",
    icon: Shield,
    roles: [UserRole.SUPER_ADMIN, UserRole.OWNER],
    sectionHeader: "Governance",
  },
  {
    to: "/users",
    label: "User Management",
    icon: Users,
    roles: [UserRole.SUPER_ADMIN, UserRole.OWNER],
    indent: true,
  },

  // SECTION: OPERATIONS
  {
    to: "/dashboard",
    label:
      role === UserRole.OWNER
        ? "Executive Overview"
        : role === UserRole.MANAGER
        ? "Depot Operations"
        : "Operations Dashboard",
    icon: Home,
    roles: [UserRole.SALES_STAFF, UserRole.INVENTORY, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
    sectionHeader: "Operations",
  },
  {
    to: "/trends",
    label: "Trends & Command",
    icon: TrendingUp,
    roles: [UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
  },
  {
    to: "/products",
    label: "Products & SKUs",
    icon: Box,
    roles: [UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
  },

  // SECTION: PRODUCTION & FORMULATIONS
  {
    to: "/production",
    label: "Milling Batches",
    icon: Factory,
    roles: [UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
    sectionHeader: "Milling & Formulas",
  },
  {
    to: "/production/formulas",
    label: "Feed Formulations & LCF",
    icon: Beaker,
    roles: [UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
    indent: true,
  },
  {
    to: "/production/traceability",
    label: "Batch Traceability",
    icon: Compass,
    roles: [UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
    indent: true,
  },

  // SECTION: INVENTORY & PROCUREMENT
  {
    to: "/inventory",
    label: "Stock Ledger",
    icon: Truck,
    roles: [UserRole.INVENTORY, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
    sectionHeader: "Inventory & Supply",
  },
  {
    to: "/procurement/orders",
    label: "Purchase Orders",
    icon: ClipboardList,
    roles: [UserRole.INVENTORY, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
  },
  {
    to: "/procurement/suppliers",
    label: "Grain Suppliers",
    icon: Building2,
    roles: [UserRole.INVENTORY, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
    indent: true,
  },

  // SECTION: SALES & CREDIT (Specifically nested as requested by user)
  {
    to: "/sales",
    label: "Sales & Orders",
    icon: ShoppingCart,
    roles: [UserRole.SALES_STAFF, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
    sectionHeader: "Sales & Co-op Credit",
  },
  {
    to: "/sales/credit-ledger",
    label: "Co-op Credit & Layaway",
    icon: Wallet,
    roles: [UserRole.SALES_STAFF, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
    indent: true,
  },
  {
    to: "/customers",
    label: "Customer Directory",
    icon: Users,
    roles: [UserRole.SALES_STAFF, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
    indent: true,
  },

  // SECTION: COMPLIANCE & INTELLIGENCE
  {
    to: "/compliance",
    label: "Compliance & RSB",
    icon: Shield,
    roles: [UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
    sectionHeader: "Intelligence & Audit",
  },
  {
    to: "/reports",
    label: "Reports & P&L",
    icon: BarChart2,
    roles: [UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
    roles: [UserRole.OWNER, UserRole.SUPER_ADMIN],
  },
  {
    to: "/portal",
    label: "Customer Storefront",
    icon: ShoppingBag,
    roles: [UserRole.OWNER, UserRole.SUPER_ADMIN],
  },
];

export const Sidebar = ({ open, onClose }: SidebarProps) => {
  const { user, signOut } = useAuth();
  const role = user?.profile?.role ?? UserRole.PUBLIC;

  const accessibleNavItems = getNavItems(role).filter((item) => {
    if (role === UserRole.SUPER_ADMIN || role === UserRole.OWNER) {
      return true;
    }
    return (item.roles as readonly UserRole[]).includes(role);
  });

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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2E7D32] text-sm font-bold text-white shadow-xs">
              TF
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Turashoboye</h2>
              <p className="text-xs text-gray-400">Animal Feeds Platform</p>
            </div>
          </div>
          <button
            className="lg:hidden p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {accessibleNavItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={item.to}>
                {/* Optional Section Header */}
                {item.sectionHeader && (
                  <div
                    className={`px-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 ${
                      idx === 0 ? "pb-1" : "pt-4 pb-1"
                    }`}
                  >
                    {item.sectionHeader}
                  </div>
                )}

                <NavLink
                  to={item.to}
                  onClick={() => onClose()}
                  className={({ isActive }) => {
                    if (item.indent) {
                      // Sub-item styling: indented with left connector line
                      return `group flex items-center gap-2.5 py-1.5 pl-7 pr-3 rounded-lg text-xs font-medium transition-colors ml-2 border-l border-gray-800 ${
                        isActive
                          ? "bg-emerald-950/70 text-emerald-300 font-bold border-l-2 border-[#2E7D32]"
                          : "text-gray-400 hover:bg-gray-800/60 hover:text-white"
                      }`;
                    }

                    // Top-level item styling
                    return `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-[#2E7D32] text-white font-bold shadow-xs"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`;
                  }}
                >
                  <Icon
                    className={`flex-shrink-0 ${
                      item.indent ? "w-3.5 h-3.5 text-gray-400 group-hover:text-white" : "w-4 h-4"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </div>
            );
          })}
        </nav>

        {/* Bottom user info and sign‑out */}
        <div className="p-4 border-t border-gray-800 bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            {user?.profile?.avatarUrl ? (
              <img
                src={user.profile.avatarUrl}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
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
