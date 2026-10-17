import { useState } from 'react';
import {
  Shield,
  FileCheck,
  AlertTriangle,
  Clock,
  Upload,
  Calendar,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { uploadMediaFile } from '../../lib/cloudinary';

export interface RegulatoryItem {
  id: string;
  category: 'company' | 'premises' | 'product_registration' | 'standard_certification' | 'inspection';
  authority: string; // "RICA" | "RSB" | "RRA" | "Kirehe District"
  title: string;
  description: string;
  referenceNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  status: 'verified' | 'pending_verification' | 'not_entered' | 'expired' | 'not_applicable';
  documentUrl?: string;
  notes?: string;
}

const INITIAL_REGULATORY_RECORDS: RegulatoryItem[] = [
  {
    id: 'reg-1',
    category: 'company',
    authority: 'RDB / RRA',
    title: 'Company Registration & Tax Identification Number (TIN)',
    description: 'Domestic commercial entity registration and active taxpayer status with Rwanda Revenue Authority.',
    referenceNumber: 'TIN-109283746',
    issueDate: '2026-01-15',
    expiryDate: '2036-01-15',
    status: 'verified',
    notes: 'Registered in Kirehe District, Eastern Province. 10-year statutory tax retention baseline active.',
  },
  {
    id: 'reg-2',
    category: 'premises',
    authority: 'RICA',
    title: 'Feed Processing & Milling Facility Inspection Certificate',
    description: 'Hygiene, pest control, ingredient storage segregation, and milling dust management in Mahama.',
    referenceNumber: 'RICA-FEED-2026-089',
    issueDate: '2026-03-10',
    expiryDate: '2027-03-10',
    status: 'verified',
    notes: 'Annual inspection passed for Mahama Primary Feed Depot & Milling Site.',
  },
  {
    id: 'reg-3',
    category: 'standard_certification',
    authority: 'RSB',
    title: 'RS EAS 287: Poultry Feeds — Specification Compliance',
    description: 'Rwanda Standards Board national adoption of East African Standard for Broiler & Layer feeds.',
    referenceNumber: 'RSB-CERT-PL-4412',
    issueDate: '2026-05-01',
    expiryDate: '2027-05-01',
    status: 'verified',
    notes: 'Broiler Starter Mash and Layer Complete Mash batch samples tested by accredited laboratory.',
  },
  {
    id: 'reg-4',
    category: 'product_registration',
    authority: 'RICA',
    title: 'Commercial Animal Feed Product Registration',
    description: 'Formal product registration dossiers filed for manufactured commercial feeds.',
    referenceNumber: 'RICA-REG-PENDING',
    issueDate: '2026-09-01',
    expiryDate: '2027-09-01',
    status: 'pending_verification',
    notes: 'Documentation submitted to RICA animal resources division; awaiting formal gazetted certificate.',
  },
  {
    id: 'reg-5',
    category: 'premises',
    authority: 'MINEMA / UNHCR',
    title: 'Mahama Refugee Camp Livelihood Operating Authorization',
    description: 'Administrative permission to conduct local agricultural value-addition within Mahama zone.',
    referenceNumber: 'MAHAMA-LIV-2026-14',
    issueDate: '2026-02-01',
    expiryDate: '2027-02-01',
    status: 'verified',
    notes: 'Approved partnership operating under refugee empowerment and host community integration framework.',
  },
  {
    id: 'reg-6',
    category: 'standard_certification',
    authority: 'RSB',
    title: 'RS EAS 353: Pig Feed — Specification Certification',
    description: 'Rwanda Standards Board standard for pig grower and sow ration feeds.',
    status: 'not_entered',
    notes: 'Formulation currently being refined; formal RSB laboratory testing scheduled for next quarter.',
  },
];

export default function CompliancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<RegulatoryItem[]>(INITIAL_REGULATORY_RECORDS);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RegulatoryItem | null>(null);

  const canEdit = ['manager', 'owner'].includes(user?.profile?.role || '');

  // Filter records
  const filteredRecords = records.filter((r) => {
    if (filterCategory !== 'all' && r.category !== filterCategory) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  const verifiedCount = records.filter((r) => r.status === 'verified').length;
  const pendingCount = records.filter((r) => r.status === 'pending_verification').length;
  const actionRequiredCount = records.filter(
    (r) => r.status === 'not_entered' || r.status === 'expired'
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#2E7D32]" />
            Regulatory Compliance & Rwanda Standards
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Official records for RICA permits, RSB quality standards, RRA tax rules, and 10-year statutory retention
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              setSelectedRecord(null);
              setIsUploadModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-green-800 transition"
          >
            <Upload className="h-4 w-4" />
            Upload Permit / Certificate
          </button>
        )}
      </div>

      {/* RRA 10-Year Statutory Baseline Notice */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
        <div className="flex items-start gap-3">
          <FileCheck className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 space-y-1">
            <span className="font-bold text-sm block">
              Rwanda Statutory Record Retention: 10-Year Baseline Active
            </span>
            <p>
              In accordance with Rwandan tax procedure legislation and quality guidelines, Turashoboye Feeds retains all
              sales records, immutable stock movements, ingredient lot originations, and production batch records for a minimum of{' '}
              <strong>10 years</strong>. Records cannot be hard-deleted from production database tables.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Verified Compliance
            </p>
            <div className="rounded-lg bg-green-50 p-2 text-[#2E7D32]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{verifiedCount}</p>
          <p className="mt-1 text-xs text-gray-500">Active permits and standards certificates</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Pending Authority Review
            </p>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-700">{pendingCount}</p>
          <p className="mt-1 text-xs text-gray-500">Dossiers submitted to RICA / RSB</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Action Required
            </p>
            <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{actionRequiredCount}</p>
          <p className="mt-1 text-xs text-gray-500">Standards not yet entered or expiring</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32] shadow-xs"
        >
          <option value="all">All Regulatory Categories</option>
          <option value="company">Company & Tax (RDB / RRA)</option>
          <option value="premises">Premises & Milling (RICA / Local)</option>
          <option value="standard_certification">Standards (RSB EAS)</option>
          <option value="product_registration">Product Registration</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32] shadow-xs"
        >
          <option value="all">All Verification Statuses</option>
          <option value="verified">Verified & Active</option>
          <option value="pending_verification">Pending Verification</option>
          <option value="not_entered">Not Yet Entered</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Records Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRecords.map((item) => {
          return (
            <div
              key={item.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-gray-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-bold text-gray-700">
                      {item.authority}
                    </span>
                    <span className="text-[11px] text-gray-500 uppercase tracking-wider">
                      {item.category.replace('_', ' ')}
                    </span>
                  </div>

                  {item.status === 'verified' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                  {item.status === 'pending_verification' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      <Clock className="h-3 w-3" />
                      In Review
                    </span>
                  )}
                  {item.status === 'not_entered' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                      Not Entered
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                </div>

                {item.referenceNumber && (
                  <div className="rounded-lg bg-gray-50 p-2 text-xs font-mono text-gray-700 flex items-center justify-between">
                    <span className="text-gray-500 text-[11px] font-sans">Reference:</span>
                    <span className="font-bold">{item.referenceNumber}</span>
                  </div>
                )}

                {item.notes && (
                  <p className="text-xs text-gray-600 italic bg-amber-50/50 p-2 rounded border border-amber-100/60">
                    &ldquo;{item.notes}&rdquo;
                  </p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span>
                    {item.expiryDate ? `Valid until ${item.expiryDate}` : 'No expiry set'}
                  </span>
                </div>

                {canEdit && (
                  <button
                    onClick={() => {
                      setSelectedRecord(item);
                      setIsUploadModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-[#2E7D32] hover:text-green-800 font-semibold"
                  >
                    <Upload className="h-3 w-3" />
                    Update
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload/Edit Modal */}
      {isUploadModalOpen && (
        <ComplianceUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setSelectedRecord(null);
          }}
          record={selectedRecord}
          onSave={(updatedRecord) => {
            setRecords((prev) =>
              prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
            );
            setIsUploadModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

interface ComplianceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: RegulatoryItem | null;
  onSave: (record: RegulatoryItem) => void;
}

function ComplianceUploadModal({
  isOpen,
  onClose,
  record,
  onSave,
}: ComplianceUploadModalProps) {
  const [authority, setAuthority] = useState(record?.authority || 'RICA');
  const [title, setTitle] = useState(record?.title || '');
  const [referenceNumber, setReferenceNumber] = useState(record?.referenceNumber || '');
  const [expiryDate, setExpiryDate] = useState(record?.expiryDate || '');
  const [status, setStatus] = useState<RegulatoryItem['status']>(
    record?.status || 'pending_verification'
  );
  const [notes, setNotes] = useState(record?.notes || '');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setUploading(true);
      let docUrl = record?.documentUrl;

      if (file) {
        const uploadResult = await uploadMediaFile(file, 'compliance');
        docUrl = uploadResult.url;
      }

      onSave({
        id: record?.id || `reg-${Date.now()}`,
        category: record?.category || 'standard_certification',
        authority,
        title,
        description: record?.description || 'Registered regulatory record',
        referenceNumber,
        expiryDate,
        status,
        notes,
        documentUrl: docUrl,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save certificate');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl border border-gray-100 my-8">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-[#2E7D32]">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {record ? 'Update Permit / Certificate' : 'Record New Compliance Document'}
              </h2>
              <p className="text-xs text-gray-500">
                Authorized regulatory records for RICA, RSB, and RRA
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Regulatory Authority *
            </label>
            <select
              value={authority}
              onChange={(e) => setAuthority(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none bg-white"
            >
              <option value="RICA">RICA (Rwanda Inspectorate, Competition and Consumer Protection)</option>
              <option value="RSB">RSB (Rwanda Standards Board)</option>
              <option value="RRA">RRA (Rwanda Revenue Authority)</option>
              <option value="MINEMA">MINEMA / Mahama Camp Administration</option>
              <option value="Kirehe District">Kirehe District Administration</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Certificate / Permit Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Official Reference #
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. RSB-CERT-PL-4412"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Verification Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RegulatoryItem['status'])}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none bg-white font-medium"
            >
              <option value="verified">Verified & Active</option>
              <option value="pending_verification">Pending Authority Verification</option>
              <option value="not_entered">Not Yet Entered</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Upload Certificate / Lab Test (PDF or JPG, max 10MB)
            </label>
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-[#2E7D32] hover:file:bg-green-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Operational Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Lab tested protein content: 20.4%, moisture: 11.2%"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="rounded-lg bg-[#2E7D32] px-5 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50 transition shadow-xs"
            >
              {uploading ? 'Uploading...' : 'Save Regulatory Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
