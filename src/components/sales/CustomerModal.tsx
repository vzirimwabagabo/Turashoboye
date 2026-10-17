import { useState } from 'react';
import { X, User, Phone, MapPin, MessageSquare, AlertCircle } from 'lucide-react';
import type { Customer } from '../../types/database';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Partial<Customer>) => Promise<void> | void;
  customerToEdit?: Customer | null;
}

export default function CustomerModal({
  isOpen,
  onClose,
  onSave,
  customerToEdit,
}: CustomerModalProps) {
  if (!isOpen) return null;

  return (
    <CustomerModalForm
      key={customerToEdit ? customerToEdit.id : 'new-customer'}
      onClose={onClose}
      onSave={onSave}
      customerToEdit={customerToEdit}
    />
  );
}

function CustomerModalForm({
  onClose,
  onSave,
  customerToEdit,
}: Omit<CustomerModalProps, 'isOpen'>) {
  const [name, setName] = useState(customerToEdit?.name || '');
  const [phone, setPhone] = useState(customerToEdit?.phone || '');
  const [email, setEmail] = useState(customerToEdit?.email || '');
  const [address, setAddress] = useState(customerToEdit?.address || 'Mahama Camp, Village ');
  const [preferredContact, setPreferredContact] = useState(customerToEdit?.preferredContact || 'phone');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Customer or cooperative name is required.');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        ...(customerToEdit ? { id: customerToEdit.id } : {}),
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        preferredContact,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl border border-gray-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-[#2E7D32]">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {customerToEdit ? 'Edit Customer Details' : 'Register New Customer'}
              </h2>
              <p className="text-xs text-gray-500">
                Farmers, cooperatives, and local feed buyers in Mahama & Kirehe
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Customer / Cooperative Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jean-Paul Habimana or Duterimbere Cooperative"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Phone Number (Rwanda)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+250 788 000 000"
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Preferred Contact Channel
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <MessageSquare className="h-4 w-4" />
                </span>
                <select
                  value={preferredContact}
                  onChange={(e) => setPreferredContact(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32] bg-white"
                >
                  <option value="phone">Phone Call</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="in_person">In-Person (Walk-in)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Location / Camp Zone / Village
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <MapPin className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Mahama Camp Village 8, Paysannat L, Kirehe"
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Email (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com (optional)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#2E7D32] px-5 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50 transition shadow-xs"
            >
              {submitting ? 'Saving...' : customerToEdit ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
