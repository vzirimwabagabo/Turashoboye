import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import {
  Settings,
  ShieldCheck,
  Building2,
  Database,
  Cloud,
  Save,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  CreditCard,
  Lock,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { PAYMENT_CONFIG } from '../../config/paymentConfig';

export default function SettingsPage() {
  const { user } = useAuth();
  const [lossThreshold, setLossThreshold] = useState('5.0');
  const [approvalThreshold, setApprovalThreshold] = useState('100.0');
  const [retentionYears, setRetentionYears] = useState('10');
  const [depotName, setDepotName] = useState('Mahama Primary Feed Depot');
  const [depotAddress, setDepotAddress] = useState('Sector Mahama, Kirehe District, Eastern Province, Rwanda');
  const [momoMerchantCode, setMomoMerchantCode] = useState(PAYMENT_CONFIG.mtnMoMoMerchantCode);
  const [momoMerchantName, setMomoMerchantName] = useState(PAYMENT_CONFIG.mtnMoMoMerchantName);
  const [airtelMerchantCode, setAirtelMerchantCode] = useState(PAYMENT_CONFIG.airtelMoneyMerchantCode);
  const [rraTin, setRraTin] = useState(PAYMENT_CONFIG.rraTinNumber);
  const [ricaPermit, setRicaPermit] = useState(PAYMENT_CONFIG.ricaPermitNumber);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase.from('settings').select('*');
        if (!error && data) {
          data.forEach((s: any) => {
            if (s.key === 'production_loss_warning_threshold_pct' && s.value?.pct) {
              setLossThreshold(String(s.value.pct));
            }
            if (s.key === 'inventory_adjustment_approval_threshold_qty' && s.value?.qty) {
              setApprovalThreshold(String(s.value.qty));
            }
            if (s.key === 'retention_policy_years' && s.value?.financial_years) {
              setRetentionYears(String(s.value.financial_years));
            }
            if (s.key === 'payment_gateway_config' && s.value) {
              if (s.value.mtn_merchant_code) setMomoMerchantCode(s.value.mtn_merchant_code);
              if (s.value.mtn_merchant_name) setMomoMerchantName(s.value.mtn_merchant_name);
              if (s.value.airtel_merchant_code) setAirtelMerchantCode(s.value.airtel_merchant_code);
              if (s.value.rra_tin) setRraTin(s.value.rra_tin);
              if (s.value.rica_permit) setRicaPermit(s.value.rica_permit);
            }
          });
        }
      } catch (err) {
        console.warn('Using baseline configuration', err);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const updates: Array<{ key: string; value: any; description: string }> = [
        {
          key: 'production_loss_warning_threshold_pct',
          value: { pct: parseFloat(lossThreshold) || 5.0 },
          description: 'Production loss percentage warning threshold',
        },
        {
          key: 'inventory_adjustment_approval_threshold_qty',
          value: { qty: parseFloat(approvalThreshold) || 100.0 },
          description: 'Stock adjustment quantity above which Manager authorization is required',
        },
        {
          key: 'retention_policy_years',
          value: { financial_years: parseInt(retentionYears, 10) || 10, traceability_years: 10 },
          description: 'Statutory and operational record retention baseline in years',
        },
        {
          key: 'payment_gateway_config',
          value: {
            mtn_merchant_code: momoMerchantCode.trim(),
            mtn_merchant_name: momoMerchantName.trim(),
            airtel_merchant_code: airtelMerchantCode.trim(),
            rra_tin: rraTin.trim(),
            rica_permit: ricaPermit.trim(),
          },
          description: 'Verified Rwandan Mobile Money Till and Statutory Credentials',
        },
      ];

      for (const item of updates) {
        await supabase.from('settings').upsert(item, { onConflict: 'key' });
      }

      setMessage({ type: 'success', text: 'System configuration saved successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#2E7D32]" />
          Platform & Operational Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure production safety thresholds, statutory compliance parameters, and depot infrastructure.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Production & Quality Safeguards */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <ShieldCheck className="w-5 h-5 text-[#2E7D32]" />
            <h2 className="text-base font-bold text-gray-900">
              Milling & Inventory Governance Safeguards
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Batch Milling Loss Warning Threshold (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={lossThreshold}
                onChange={(e) => setLossThreshold(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Batches exceeding this loss trigger quality inspections before final packaging.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Manager Stock Adjustment Threshold (kg)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={approvalThreshold}
                onChange={(e) => setApprovalThreshold(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Stock reconciliation quantity above which Owner/Manager approval is mandatory.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Rwanda Statutory Retention Policy (Years)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  readOnly
                  disabled
                  value={retentionYears}
                  className="w-24 px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700"
                />
                <span className="text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-semibold flex items-center gap-1">
                  <Clock size={12} /> Statutory Baseline (RRA Law)
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                All receipts, lot originations, and production runs are preserved for 10 years minimum.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Base System Currency
              </label>
              <input
                type="text"
                readOnly
                disabled
                value="RWF — Rwandan Franc (Whole Integers)"
                className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Complies with National Bank of Rwanda cash accounting rules (zero minor currency decimals).
              </p>
            </div>
          </div>
        </div>

        {/* 2. Primary Operating Depot */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Building2 className="w-5 h-5 text-[#2E7D32]" />
            <h2 className="text-base font-bold text-gray-900">
              Primary Feed Milling & Depot Location
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Facility Name
              </label>
              <input
                type="text"
                value={depotName}
                onChange={(e) => setDepotName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Physical Location Address
              </label>
              <input
                type="text"
                value={depotAddress}
                onChange={(e) => setDepotAddress(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
              />
            </div>
          </div>
        </div>

        {/* 3. Secure Mobile Money Till & Statutory Credentials */}
        <div className="bg-white border-2 border-emerald-100 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#2E7D32]" />
              <h2 className="text-base font-bold text-gray-900">
                Official Mobile Money Till & Statutory Credentials
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-green-50 text-green-800 border border-green-300 uppercase tracking-wide">
              <Lock className="w-3 h-3 text-[#2E7D32]" />
              Executive Control Only
            </span>
          </div>

          {/* Anti-Tamper Security Notice */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
              Anti-Tamper & Payment Security Guarantee:
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              These merchant numbers govern where customer payments are routed. Only authenticated Platform Owners and Super Admins have permission to modify these values. Outside customers, depot staff, and unauthorized users are restricted by PostgreSQL Row-Level Security (RLS) policies.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                MTN MoMo Till / Merchant Code *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={momoMerchantCode}
                  onChange={(e) => setMomoMerchantCode(e.target.value)}
                  placeholder="e.g. 100234"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-[10px] text-amber-700 font-bold">
                  *182*8*1*CODE#
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Active MTN Rwanda merchant till code for customer USSD checkout.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                MTN MoMo Registered Merchant Name *
              </label>
              <input
                type="text"
                required
                value={momoMerchantName}
                onChange={(e) => setMomoMerchantName(e.target.value)}
                placeholder="e.g. Turashoboye Feed Mills Ltd"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Official entity name displayed to farmers on their handset prompt.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Airtel Money Merchant Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={airtelMerchantCode}
                  onChange={(e) => setAirtelMerchantCode(e.target.value)}
                  placeholder="e.g. 550123"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                />
                <span className="absolute inset-y-0 right-3 flex items-center text-[10px] text-red-700 font-bold">
                  *500*4*CODE#
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                RRA Tax Identification Number (TIN) *
              </label>
              <input
                type="text"
                required
                value={rraTin}
                onChange={(e) => setRraTin(e.target.value)}
                placeholder="e.g. 100234891"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Printed on official sales receipts, QR digital stamps, and bag tags.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                RICA Statutory Operating Permit *
              </label>
              <input
                type="text"
                required
                value={ricaPermit}
                onChange={(e) => setRicaPermit(e.target.value)}
                placeholder="e.g. 00492-RICA-2026"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Rwanda Inspectorate, Competition and Consumer Protection Authority feed manufacturer registration.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Connected Cloud Infrastructure */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Database className="w-5 h-5 text-[#2E7D32]" />
            <h2 className="text-base font-bold text-gray-900">
              Cloud Infrastructure Services
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-start justify-between">
              <div>
                <span className="font-bold text-gray-900 block text-sm mb-0.5">Cloud Database</span>
                <span className="text-gray-500 font-mono text-[11px] block">snmxdfsijmgukhwtuict.supabase.co</span>
                <span className="text-emerald-700 font-semibold mt-2 inline-flex items-center gap-1">
                  <CheckCircle2 size={13} /> Active & Synchronized
                </span>
              </div>
              <Database className="w-5 h-5 text-gray-400" />
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-start justify-between">
              <div>
                <span className="font-bold text-gray-900 block text-sm mb-0.5">Media & CDN Storage</span>
                <span className="text-gray-500 font-mono text-[11px] block">Cloudinary (turashoboye)</span>
                <span className="text-emerald-700 font-semibold mt-2 inline-flex items-center gap-1">
                  <Cloud size={13} /> WebP Auto-Compression Active
                </span>
              </div>
              <Cloud className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* 4. Signed-In User Profile */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <User className="w-5 h-5 text-[#2E7D32]" />
            <h2 className="text-base font-bold text-gray-900">
              Current Session Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-3.5 bg-gray-50 rounded-xl">
              <span className="text-xs text-gray-500 block mb-0.5">Full Name</span>
              <span className="font-bold text-gray-900">{user?.profile?.displayName || 'Turashoboye User'}</span>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl">
              <span className="text-xs text-gray-500 block mb-0.5">Email Address</span>
              <span className="font-bold text-gray-900">{user?.email || 'N/A'}</span>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-xl">
              <span className="text-xs text-gray-500 block mb-0.5">Assigned Role</span>
              <span className="font-bold text-emerald-800 capitalize">
                {user?.profile?.role || 'Staff'}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-sm font-semibold shadow-xs disabled:opacity-50 transition"
          >
            <Save size={16} />
            {saving ? 'Saving Changes...' : 'Save System Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
