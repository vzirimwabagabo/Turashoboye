// src/components/layout/Sidebar.tsx
/**
 * Collapsible sidebar navigation component for Turashoboye Feeds.
 * Features foldable/collapsible menu folders with expand/collapse chevron toggles
 * and indented sub-item routing.
 */
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { UserRole } from "../../types/database";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavSubItem {
  to: string;
  label: string;
  icon: any;
  roles: readonly UserRole[];
}

interface NavItemConfig {
  id?: string;
  to?: string;
  label: string;
  icon: any;
  roles: readonly UserRole[];
  sectionHeader?: string;
  children?: NavSubItem[];
}

const getNavItems = (role: UserRole): NavItemConfig[] => [
  // SECTION: GOVERNANCE
  {
    id: "admin",
    label: "Platform Admin & Users",
    icon: Shield,
    roles: [UserRole.SUPER_ADMIN, UserRole.OWNER],
    sectionHeader: "Governance",
    children: [
      {
        to: "/admin",
        label: "Platform Admin",
        icon: Shield,
        roles: [UserRole.SUPER_ADMIN, UserRole.OWNER],
      },
      {
        to: "/users",
        label: "User Management",
        icon: Users,
        roles: [UserRole.SUPER_ADMIN, UserRole.OWNER],
      },
    ],
  },

  // SECTION: CORE OPERATIONS (Direct links)
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

  // SECTION: PRODUCTION & FORMULATIONS (Foldable parent)
  {
    id: "production",
    label: "Milling & Formulas",
    icon: Factory,
    roles: [UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
    sectionHeader: "Milling & Formulas",
    children: [
      {
        to: "/production",
        label: "Milling Batches",
        icon: Factory,
        roles: [UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
      },
      {
        to: "/production/formulas",
        label: "Feed Formulations & LCF",
        icon: Beaker,
        roles: [UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
      },
      {
        to: "/production/traceability",
        label: "Batch Traceability",
        icon: Compass,
        roles: [UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
      },
    ],
  },

  // SECTION: INVENTORY & SUPPLY (Foldable parent)
  {
    id: "inventory",
    label: "Inventory & Sourcing",
    icon: Truck,
    roles: [UserRole.INVENTORY, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
    sectionHeader: "Inventory & Supply",
    children: [
      {
        to: "/inventory",
        label: "Stock Ledger",
        icon: Truck,
        roles: [UserRole.INVENTORY, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
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
      },
    ],
  },

  // SECTION: SALES & CO-OP CREDIT (Foldable parent)
  {
    id: "sales",
    label: "Sales & Co-op Credit",
    icon: ShoppingCart,
    roles: [UserRole.SALES_STAFF, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
    sectionHeader: "Sales & Co-op Credit",
    children: [
      {
        to: "/sales",
        label: "Sales & Orders",
        icon: ShoppingCart,
        roles: [UserRole.SALES_STAFF, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
      },
      {
        to: "/sales/credit-ledger",
        label: "Co-op Credit & Layaway",
        icon: Wallet,
        roles: [UserRole.SALES_STAFF, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
      },
      {
        to: "/customers",
        label: "Customer Directory",
        icon: Users,
        roles: [UserRole.SALES_STAFF, UserRole.MANAGER, UserRole.OWNER, UserRole.SUPER_ADMIN],
      },
    ],
  },

  // SECTION: COMPLIANCE & INTELLIGENCE (Direct links)
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
  const location = useLocation();
  const { user, signOut } = useAuth();
  const role = user?.profile?.role ?? UserRole.PUBLIC;

  // Track fold/unfold state for each group
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    sales: true, // Default open for quick access
    production: true,
    inventory: false,
    admin: false,
  });

  // Automatically unfold the folder if user is currently on any child path
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/sales") || path.startsWith("/customers")) {
      setOpenGroups((prev) => ({ ...prev, sales: true }));
    }
    if (path.startsWith("/production")) {
      setOpenGroups((prev) => ({ ...prev, production: true }));
    }
    if (path.startsWith("/inventory") || path.startsWith("/procurement")) {
      setOpenGroups((prev) => ({ ...prev, inventory: true }));
    }
    if (path.startsWith("/admin") || path.startsWith("/users")) {
      setOpenGroups((prev) => ({ ...prev, admin: true }));
    }
  }, [location.pathname]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

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
        {/* Header with logo */}
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

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {accessibleNavItems.map((item, idx) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isGroupOpen = item.id ? openGroups[item.id] ?? false : false;

            // Check if any child of this folder is currently active
            const isAnyChildActive = hasChildren
              ? item.children!.some((sub) => location.pathname === sub.to)
              : false;

            return (
              <div key={item.id || item.to || idx}>
                {/* Section Header */}
                {item.sectionHeader && (
                  <div
                    className={`px-3 text-[10px] font-bold uppercase tracking-wider text-gray-500 ${
                      idx === 0 ? "pb-1" : "pt-4 pb-1"
                    }`}
                  >
                    {item.sectionHeader}
                  </div>
                )}

                {/* Case A: Foldable Parent with Sub-items */}
                {hasChildren ? (
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => toggleGroup(item.id!)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isAnyChildActive
                          ? "bg-gray-800/90 text-white"
                          : "text-gray-300 hover:bg-gray-800/60 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                          isGroupOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Unfolded Sub-Items List */}
                    {isGroupOpen && (
                      <div className="space-y-0.5 ml-2.5 pl-3 border-l border-gray-800 my-0.5">
                        {item.children!.map((sub) => {
                          const SubIcon = sub.icon;
                          return (
                            <NavLink
                              key={sub.to}
                              to={sub.to}
                              onClick={() => onClose()}
                              className={({ isActive }) =>
                                `flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-xs transition-colors ${
                                  isActive
                                    ? "bg-emerald-950/80 text-emerald-300 font-bold border-l-2 border-[#2E7D32]"
                                    : "text-gray-400 hover:bg-gray-800/60 hover:text-white font-medium"
                                }`
                              }
                            >
                              <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{sub.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Case B: Standalone Direct NavLink */
                  <NavLink
                    to={item.to!}
                    onClick={() => onClose()}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-[#2E7D32] text-white font-bold shadow-xs"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                )}
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
