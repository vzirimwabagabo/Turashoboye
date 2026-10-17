import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  ShoppingCart,
  DollarSign,
  AlertCircle,
  MessageSquare,
  Edit2,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Customer } from '../../types/database';
import CustomerModal from '../../components/sales/CustomerModal';

interface CustomerSummary extends Customer {
  totalOrdersCount: number;
  totalSpentRwf: number;
  outstandingBalanceRwf: number;
}

const SAMPLE_CUSTOMERS: CustomerSummary[] = [
  {
    id: 'c1',
    name: 'Jean-Paul Habimana',
    phone: '+250 788 123 456',
    email: 'habimana.jp@example.com',
    address: 'Mahama Camp, Village 4',
    preferredContact: 'phone',
    createdAt: '2026-09-15T08:30:00Z',
    totalOrdersCount: 6,
    totalSpentRwf: 288000,
    outstandingBalanceRwf: 0,
  },
  {
    id: 'c2',
    name: 'Duterimbere Poultry Cooperative',
    phone: '+250 782 987 654',
    email: 'duterimbere.coop@example.com',
    address: 'Paysannat L, Mahama Host Community',
    preferredContact: 'whatsapp',
    createdAt: '2026-09-20T10:15:00Z',
    totalOrdersCount: 14,
    totalSpentRwf: 1150000,
    outstandingBalanceRwf: 120000,
  },
  {
    id: 'c3',
    name: 'Amina Mukeshimana',
    phone: '+250 785 456 789',
    address: 'Mahama Camp, Village 12',
    preferredContact: 'sms',
    createdAt: '2026-10-01T14:00:00Z',
    totalOrdersCount: 3,
    totalSpentRwf: 144000,
    outstandingBalanceRwf: 0,
  },
  {
    id: 'c4',
    name: 'Kirehe Livestock Union',
    phone: '+250 788 777 888',
    email: 'livestock@kirehe.org',
    address: 'Nyakarambi Commercial Centre, Kirehe',
    preferredContact: 'phone',
    createdAt: '2026-09-01T09:00:00Z',
    totalOrdersCount: 9,
    totalSpentRwf: 864000,
    outstandingBalanceRwf: 48000,
  },
  {
    id: 'c5',
    name: 'Emmanuel Nshimiyimana',
    phone: '+250 722 345 678',
    address: 'Mahama Camp, Village 7',
    preferredContact: 'in_person',
    createdAt: '2026-10-10T11:20:00Z',
    totalOrdersCount: 1,
    totalSpentRwf: 48000,
    outstandingBalanceRwf: 0,
  },
];

export default function CustomersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<CustomerSummary[]>(SAMPLE_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'with_balance' | 'settled'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  const canManage = ['sales_staff', 'manager', 'owner'].includes(user?.profile?.role || '');

  useEffect(() => {
    let isCancelled = false;
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('name', { ascending: true });

        if (!isCancelled && !error && data && data.length > 0) {
          const enriched: CustomerSummary[] = data.map((c) => ({
            ...c,
            totalOrdersCount: 0,
            totalSpentRwf: 0,
            outstandingBalanceRwf: 0,
          }));
          setCustomers(enriched);
        }
      } catch (err) {
        console.warn('Using offline/cached customer records:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchCustomers();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleSaveCustomer = async (customerData: Partial<Customer>) => {
    if (customerData.id) {
      // Update
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerData.id ? { ...c, ...customerData } as CustomerSummary : c))
      );
      try {
        await supabase
          .from('customers')
          .update({
            name: customerData.name,
            phone: customerData.phone,
            email: customerData.email,
            address: customerData.address,
            preferred_contact: customerData.preferredContact,
          })
          .eq('id', customerData.id);
      } catch (err) {
        console.warn('Saved customer locally (offline mode):', err);
      }
    } else {
      // Create new
      const newCustomer: CustomerSummary = {
        id: `c-local-${Date.now()}`,
        name: customerData.name || 'Unnamed Customer',
        phone: customerData.phone,
        email: customerData.email,
        address: customerData.address,
        preferredContact: customerData.preferredContact || 'phone',
        createdAt: new Date().toISOString(),
        totalOrdersCount: 0,
        totalSpentRwf: 0,
        outstandingBalanceRwf: 0,
      };
      setCustomers((prev) => [newCustomer, ...prev]);

      try {
        await supabase.from('customers').insert({
          id: newCustomer.id,
          name: newCustomer.name,
          phone: newCustomer.phone,
          email: newCustomer.email,
          address: newCustomer.address,
          preferred_contact: newCustomer.preferredContact,
        });
      } catch (err) {
        console.warn('Saved customer to local queue (offline mode):', err);
      }
    }
  };

  // Filtered customer list
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery)) ||
      (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (balanceFilter === 'with_balance') {
      return c.outstandingBalanceRwf > 0;
    }
    if (balanceFilter === 'settled') {
      return c.outstandingBalanceRwf === 0;
    }
    return true;
  });

  // Calculate aggregates
  const totalCustomers = customers.length;
  const totalReceivablesRwf = customers.reduce((sum, c) => sum + c.outstandingBalanceRwf, 0);
  const customersWithDebt = customers.filter((c) => c.outstandingBalanceRwf > 0).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-[#2E7D32]" />
            Customer Directory
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Farmers, poultry cooperatives, and retail feed buyers in Mahama Camp & Kirehe District
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setSelectedCustomer(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-green-800 transition"
          >
            <Plus className="h-4 w-4" />
            Register Customer
          </button>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Customers
            </p>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{totalCustomers}</p>
          <p className="mt-1 text-xs text-gray-500">Farmers & cooperatives registered</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Outstanding Receivables
            </p>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            RWF {totalReceivablesRwf.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">Pending customer invoice balances</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Accounts with Balance
            </p>
            <div className="rounded-lg bg-red-50 p-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{customersWithDebt}</p>
          <p className="mt-1 text-xs text-gray-500">Customers with unpaid balances</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer name, phone number, village or cooperative..."
            className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-sm focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32] bg-white shadow-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={balanceFilter}
            onChange={(e) => setBalanceFilter(e.target.value as 'all' | 'with_balance' | 'settled')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32] shadow-xs"
          >
            <option value="all">All Accounts</option>
            <option value="with_balance">Has Balance Due</option>
            <option value="settled">Fully Settled</option>
          </select>
        </div>
      </div>

      {/* Customer List Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50/75 text-xs uppercase tracking-wider text-gray-600 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-3 font-semibold">
                  Customer / Cooperative
                </th>
                <th scope="col" className="px-6 py-3 font-semibold">
                  Contact & Channel
                </th>
                <th scope="col" className="px-6 py-3 font-semibold">
                  Location / Zone
                </th>
                <th scope="col" className="px-6 py-3 font-semibold text-right">
                  Total Orders
                </th>
                <th scope="col" className="px-6 py-3 font-semibold text-right">
                  Outstanding Balance
                </th>
                <th scope="col" className="px-6 py-3 font-semibold text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    {loading ? 'Loading customer records...' : 'No customers match your criteria.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const initials = customer.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={customer.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-[#2E7D32]">
                            {initials}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{customer.name}</div>
                            {customer.email && (
                              <div className="text-xs text-gray-400">{customer.email}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-gray-700">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            {customer.phone || 'No phone'}
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 capitalize">
                            <MessageSquare className="h-2.5 w-2.5" />
                            {customer.preferredContact || 'phone'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="truncate max-w-[200px]">
                            {customer.address || 'Mahama Area'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="font-semibold text-gray-900">
                          {customer.totalOrdersCount}
                        </div>
                        <div className="text-xs text-gray-400">
                          RWF {customer.totalSpentRwf.toLocaleString()}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {customer.outstandingBalanceRwf > 0 ? (
                          <div>
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                              RWF {customer.outstandingBalanceRwf.toLocaleString()}
                            </span>
                            <div className="text-[10px] text-red-500 mt-0.5">Payment Due</div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Settled
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              navigate('/sales', { state: { selectedCustomerId: customer.id } });
                            }}
                            className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-[#2E7D32] hover:bg-green-100 transition"
                            title="Create Sale for Customer"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            Sale
                          </button>
                          {canManage && (
                            <button
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setIsModalOpen(true);
                              }}
                              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                              title="Edit Customer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Registration/Edit Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomer}
        customerToEdit={selectedCustomer}
      />
    </div>
  );
}
