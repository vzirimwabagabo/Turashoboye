import { useState, useEffect } from 'react';
import { Plus, Search, Building2, Phone, Mail, MapPin, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface SupplierItem {
  id: string;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  tin_number?: string;
  gln?: string;
  is_active: boolean;
}

const SAMPLE_SUPPLIERS: SupplierItem[] = [
  {
    id: 'sup-1',
    name: 'Eastern Agribusiness Co-operative Ltd',
    contact_name: 'Emmanuel Habimana',
    phone: '+250 788 111 222',
    email: 'sales@easternagri.rw',
    address: 'Kirehe Town, Eastern Province',
    tin_number: '102938475',
    gln: '6001234567890',
    is_active: true,
  },
  {
    id: 'sup-2',
    name: 'Kirehe Grain Aggregators Ltd',
    contact_name: 'Beata Mukamana',
    phone: '+250 788 333 444',
    email: 'info@kirehegrains.rw',
    address: 'Gatore Sector, Kirehe District',
    tin_number: '109847362',
    is_active: true,
  },
  {
    id: 'sup-3',
    name: 'Kigali Veterinary & Feed Supplements Ltd',
    contact_name: 'Dr. Alexis Nshuti',
    phone: '+250 788 555 666',
    email: 'alexis@kigalivet.rw',
    address: 'Kicukiro, Kigali, Rwanda',
    tin_number: '100293847',
    is_active: true,
  },
];

export default function SuppliersPage() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<SupplierItem[]>(SAMPLE_SUPPLIERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // New supplier form state
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const canManage = ['inventory', 'manager', 'owner'].includes(user?.profile?.role || '');

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('suppliers').select('*');
        if (!error && data && data.length > 0) {
          setSuppliers(data as SupplierItem[]);
        }
      } catch (err) {
        console.warn('Using baseline suppliers', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const newSupplier = {
      name,
      contact_name: contactName,
      phone,
      email,
      address,
      tin_number: tinNumber,
      is_active: true,
    };

    try {
      const { data, error } = await supabase.from('suppliers').insert([newSupplier]).select().single();
      if (!error && data) {
        setSuppliers((prev) => [data as SupplierItem, ...prev]);
      } else {
        setSuppliers((prev) => [{ id: `sup-${Date.now()}`, ...newSupplier }, ...prev]);
      }
    } catch {
      setSuppliers((prev) => [{ id: `sup-${Date.now()}`, ...newSupplier }, ...prev]);
    } finally {
      setSaving(false);
      setModalOpen(false);
      setName('');
      setContactName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setTinNumber('');
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.contact_name && s.contact_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.tin_number && s.tin_number.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Raw Material Suppliers
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Registered grain cooperatives, soya aggregators, and mineral premix vendors.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#2E7D32] hover:bg-[#256b29] text-white text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus size={18} />
            Add Supplier
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by supplier name, contact, or TIN..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Supplier Name</th>
                <th className="px-5 py-3.5">Contact Person</th>
                <th className="px-5 py-3.5">Phone & Email</th>
                <th className="px-5 py-3.5">Rwanda TIN</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    Loading suppliers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    <Building2 className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    No suppliers found matching your query.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      <div>
                        <span>{s.name}</span>
                        {s.gln && (
                          <span className="block text-[11px] text-gray-400 font-mono">
                            GLN: {s.gln}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-800 font-medium">
                      {s.contact_name || '—'}
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {s.phone && (
                        <div className="flex items-center gap-1.5 text-gray-800">
                          <Phone size={12} className="text-gray-400" />
                          <span>{s.phone}</span>
                        </div>
                      )}
                      {s.email && (
                        <div className="flex items-center gap-1.5 text-gray-500 mt-0.5">
                          <Mail size={12} className="text-gray-400" />
                          <span>{s.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-800">
                      {s.tin_number ? (
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-900 font-semibold">
                          TIN: {s.tin_number}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-gray-400" />
                        <span>{s.address || 'Kirehe District'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {s.is_active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Add Supplier Record</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Supplier / Co-operative Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eastern Grain Aggregators Ltd"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Emmanuel Habimana"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Rwanda TIN (Tax ID)
                  </label>
                  <input
                    type="text"
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    placeholder="e.g. 102938475"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 078XXXXXXX"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vendor@company.rw"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Location / Physical Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Kirehe Town, Eastern Province"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-sm font-semibold shadow-xs disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin w-4 h-4" /> : null}
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
