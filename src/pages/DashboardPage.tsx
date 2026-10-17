import { Link } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  ClipboardList,
  DollarSign,
  ShoppingCart,
  Truck,
  Factory,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/** Stat card data shape */
interface StatCard {
  label: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
}

/** Quick action button data shape */
interface QuickAction {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const STAT_CARDS: StatCard[] = [
  {
    label: 'Total Products',
    value: 0,
    icon: <Package size={24} />,
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    label: 'Stock Alerts',
    value: 0,
    icon: <AlertTriangle size={24} />,
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    label: 'Pending Orders',
    value: 0,
    icon: <ClipboardList size={24} />,
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    label: "Today's Sales",
    value: 0,
    icon: <DollarSign size={24} />,
    bgColor: 'bg-green-50',
    iconColor: 'text-[#2E7D32]',
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'New Sale',
    path: '/sales/new',
    icon: <ShoppingCart size={20} />,
  },
  {
    label: 'Record Receipt',
    path: '/inventory/receive',
    icon: <Truck size={20} />,
  },
  {
    label: 'Start Production',
    path: '/production/new',
    icon: <Factory size={20} />,
  },
  {
    label: 'Compliance Status',
    path: '/compliance',
    icon: <ShieldCheck size={20} />,
  },
];

/**
 * Dashboard page — landing page after login.
 * Shows operational overview stats, stock alerts, and quick action buttons.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const profile = user?.profile;

  const firstName =
    profile?.displayName?.split(' ')[0] ??
    profile?.fullName?.split(' ')[0] ??
    user?.email?.split('@')[0] ??
    'there';

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Welcome back, {firstName}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Turashoboye Feeds — Mahama Operations & Quality Management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            System Online (Mahama Single Location)
          </span>
        </div>
      </div>

      {/* Stat cards — 1 col mobile, 2x2 tablet, 4 desktop */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {card.label === "Today's Sales"
                    ? `${card.value.toLocaleString()} RWF`
                    : card.value}
                </p>
              </div>
              <div className={`rounded-lg p-3 ${card.bgColor}`}>
                <span className={card.iconColor}>{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-gray-900">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2E7D32] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#256b29] active:bg-[#1b5e20]"
            >
              {action.icon}
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
