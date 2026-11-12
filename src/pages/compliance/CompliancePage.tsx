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
  FileText,
  Eye,
  ExternalLink,
  Printer,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { uploadMediaFile } from '../../lib/cloudinary';
import { PAYMENT_CONFIG } from '../../config/paymentConfig';

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
    documentUrl: 'https://res.cloudinary.com/dipwvs0z/image/upload/v1793561369/turashoboye/compliance/h1vy5doqavomvsasb6xr.svg',
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

const COMPLIANCE_STORAGE_KEY = 'turashoboye_compliance_records';

function getStoredComplianceRecords(): RegulatoryItem[] {
  try {
    const raw = localStorage.getItem(COMPLIANCE_STORAGE_KEY);
    if (!raw) return INITIAL_REGULATORY_RECORDS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_REGULATORY_RECORDS;
  } catch {
    return INITIAL_REGULATORY_RECORDS;
  }
}

function saveStoredComplianceRecords(records: RegulatoryItem[]) {
  try {
    localStorage.setItem(COMPLIANCE_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Failed to save compliance records to local storage:', err);
  }
}

// ─── Supplier Provenance Table (static) ──────────────────────────────────────
const SUPPLIER_PROVENANCE = [
  { commodity: 'Maize (Yellow)', region: 'Kirehe / Nyagatare, Eastern Province', supplier: 'Local Farmer Cooperatives', annualVolume: '~120 MT', notes: 'Rwanda-sourced; aflatoxin-tested on intake' },
  { commodity: 'Soya Bean Meal (SBM)', region: 'Kampala, Uganda / Kigali depot', supplier: 'Rwanda Extrusion Centre / EA importers', annualVolume: '~55 MT', notes: 'Defatted, heat-treated; protein ≥ 44%' },
  { commodity: 'Limestone (Calcium)', region: 'Musanze, Northern Province', supplier: 'Volcan Minerals Ltd', annualVolume: '~12 MT', notes: 'Ground limestone; Ca ≥ 36%' },
  { commodity: 'Vitamin & Mineral Premix', region: 'Nairobi, Kenya (via certified EA import)', supplier: 'EA Premix Distributors Ltd', annualVolume: '~2.5 MT', notes: 'KEBS / EAC certified, documented COA per lot' },
  { commodity: 'Dicalcium Phosphate (DCP)', region: 'Dar es Salaam, Tanzania / Kigali depot', supplier: 'EA Agricultural Chemicals Ltd', annualVolume: '~4 MT', notes: 'P ≥ 18%, Ca ≤ 22%; COA on file' },
  { commodity: 'Salt (NaCl)', region: 'Kigali, Rwanda', supplier: 'Inyange Industries / local trade', annualVolume: '~1 MT', notes: 'Food-grade iodised salt; Na ≥ 39%' },
];

// ─── RSB Certificate of Analysis (CoA) products ──────────────────────────────
const RSB_COA_PRODUCTS = [
  { code: 'BSM', name: 'Broiler Starter Mash', standard: 'RS EAS 287', protein: '≥ 22%', moisture: '≤ 12%', aflatoxin: '< 10 ppb', batchRef: 'BM-2026-BSM-0041' },
  { code: 'BFM', name: 'Broiler Finisher Mash', standard: 'RS EAS 287', protein: '≥ 19%', moisture: '≤ 12%', aflatoxin: '< 10 ppb', batchRef: 'BM-2026-BFM-0038' },
  { code: 'LCM', name: 'Layer Complete Mash', standard: 'RS EAS 287', protein: '≥ 17%', moisture: '≤ 12%', aflatoxin: '< 10 ppb', batchRef: 'BM-2026-LCM-0029' },
  { code: 'DMC', name: 'Dairy Meal Concentrate', standard: 'RS EAS 160', protein: '≥ 20%', moisture: '≤ 13%', aflatoxin: '< 10 ppb', batchRef: 'BM-2026-DMC-0017' },
];

interface DossierSections {
  company: boolean;
  rica: boolean;
  rsb: boolean;
  suppliers: boolean;
  retention: boolean;
}

function statusLabel(s: RegulatoryItem['status']) {
  switch (s) {
    case 'verified': return 'VERIFIED';
    case 'pending_verification': return 'PENDING';
    case 'not_entered': return 'NOT ENTERED';
    case 'expired': return 'EXPIRED';
    case 'not_applicable': return 'N/A';
    default: return s;
  }
}

function DossierModal({
  records,
  onClose,
}: {
  records: RegulatoryItem[];
  onClose: () => void;
}) {
  const [sections, setSections] = useState<DossierSections>({
    company: true,
    rica: true,
    rsb: true,
    suppliers: true,
    retention: true,
  });
  const [rsbProduct, setRsbProduct] = useState<string>('all');
  const [requestingAuthority, setRequestingAuthority] = useState('');
  const [inspectionRef, setInspectionRef] = useState('');

  const today = new Date().toLocaleDateString('en-RW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const companyRecords = records.filter((r) => r.category === 'company');
  const ricaRecords = records.filter((r) => r.category === 'premises' || r.category === 'product_registration');
  const rsbRecords = records.filter((r) => r.category === 'standard_certification');
  const coaProducts = rsbProduct === 'all' ? RSB_COA_PRODUCTS : RSB_COA_PRODUCTS.filter((p) => p.code === rsbProduct);

  const toggle = (key: keyof DossierSections) =>
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-y-auto">
      {/* Toolbar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-[#2E7D32] text-white px-6 py-3 flex flex-wrap items-center gap-4 shadow-lg">
        <button onClick={onClose} className="flex items-center gap-1 text-green-200 hover:text-white transition text-sm">
          <X className="h-4 w-4" />
          Close
        </button>
        <span className="text-green-300 text-xs hidden sm:inline">|</span>
        <span className="font-bold text-sm">Audit Dossier — Section Selector</span>

        {/* Section toggles */}
        <div className="flex flex-wrap gap-3 ml-auto text-xs font-semibold">
          {(
            [
              ['company', 'Company / Tax'],
              ['rica', 'RICA / Premises'],
              ['rsb', 'RSB Standards'],
              ['suppliers', 'Supplier Provenance'],
              ['retention', 'Retention Declaration'],
            ] as [keyof DossierSections, string][]
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={sections[key]}
                onChange={() => toggle(key)}
                className="accent-white h-3.5 w-3.5"
              />
              {label}
            </label>
          ))}
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-lg bg-white text-[#2E7D32] px-4 py-1.5 text-sm font-bold hover:bg-green-50 transition shadow"
        >
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </button>
      </div>

      {/* Dossier document */}
      <div className="max-w-4xl mx-auto w-full px-8 py-10 space-y-10 print:px-4 print:py-6 print:space-y-8">

        {/* ── COVER PAGE ─────────────────────────────────────────────────────── */}
        <div className="border-2 border-gray-900 rounded-xl p-8 print:rounded-none print:border-black">
          <div className="text-center space-y-2 border-b-2 border-gray-900 print:border-black pb-6 mb-6">
            <div className="text-xs font-bold tracking-widest text-gray-500 uppercase">Republic of Rwanda</div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">TURASHOBOYE FEED MILLS LTD</h1>
            <p className="text-sm text-gray-600">Sector Mahama, Kirehe District, Eastern Province, Rwanda</p>
            <p className="text-xs text-gray-500">P.O. Box — Kirehe | info@turashoboye.rw | +250 7XX XXX XXX</p>
          </div>

          <div className="text-center mb-8">
            <div className="inline-block border-2 border-gray-900 print:border-black px-8 py-3 rounded-lg">
              <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Official Regulatory Compliance Audit Dossier</p>
              <p className="text-lg font-black text-gray-900 mt-1">RSB · RICA · RRA — Joint Inspection Package</p>
            </div>
          </div>

          {/* Meta fields — editable in screen, static in print */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm print:hidden">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Requesting Authority / Inspector</label>
              <input
                type="text"
                value={requestingAuthority}
                onChange={(e) => setRequestingAuthority(e.target.value)}
                placeholder="e.g. RSB District Officer — Kirehe"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Inspection / Visit Reference</label>
              <input
                type="text"
                value={inspectionRef}
                onChange={(e) => setInspectionRef(e.target.value)}
                placeholder="e.g. RSB-INS-2026-KHE-004"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-[#2E7D32] focus:outline-none"
              />
            </div>
          </div>

          {/* Print version of meta */}
          <div className="hidden print:block space-y-1 text-sm">
            <p><strong>Requesting Authority:</strong> {requestingAuthority || '___________________________________'}</p>
            <p><strong>Inspection Reference:</strong> {inspectionRef || '___________________________________'}</p>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg bg-gray-50 print:bg-transparent print:border print:border-gray-300 p-3">
              <p className="text-gray-500 font-semibold">Dossier Date</p>
              <p className="font-bold text-gray-900 mt-1">{today}</p>
            </div>
            <div className="rounded-lg bg-gray-50 print:bg-transparent print:border print:border-gray-300 p-3">
              <p className="text-gray-500 font-semibold">RRA TIN</p>
              <p className="font-bold font-mono text-gray-900 mt-1">{PAYMENT_CONFIG.rraTinNumber}</p>
            </div>
            <div className="rounded-lg bg-gray-50 print:bg-transparent print:border print:border-gray-300 p-3">
              <p className="text-gray-500 font-semibold">RICA Permit</p>
              <p className="font-bold font-mono text-gray-900 mt-1">{PAYMENT_CONFIG.ricaPermitNumber}</p>
            </div>
            <div className="rounded-lg bg-gray-50 print:bg-transparent print:border print:border-gray-300 p-3">
              <p className="text-gray-500 font-semibold">Legal Status</p>
              <p className="font-bold text-green-700 mt-1">Active — Private Ltd</p>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: Company Registration & Tax ──────────────────────────── */}
        {sections.company && (
          <section>
            <SectionHeader number="1" title="Company Registration & Tax Status (RRA / RDB)" />
            <p className="text-xs text-gray-600 mb-4">
              Turashoboye Feed Mills Ltd is a registered domestic commercial entity under Rwanda Development Board (RDB)
              with an active taxpayer status under Rwanda Revenue Authority (RRA). Tax Identification Number:{' '}
              <strong className="font-mono">{PAYMENT_CONFIG.rraTinNumber}</strong>. All sales, payroll, and VAT
              obligations are filed quarterly. A statutory 10-year record retention baseline is active.
            </p>
            <DossierTable
              headers={['Title', 'Authority', 'Reference #', 'Issued', 'Expires', 'Status']}
              rows={companyRecords.map((r) => [
                r.title,
                r.authority,
                r.referenceNumber || '—',
                r.issueDate || '—',
                r.expiryDate || '—',
                statusLabel(r.status),
              ])}
            />
          </section>
        )}

        {/* ── SECTION 2: RICA Premises & Product Registration ───────────────── */}
        {sections.rica && (
          <section>
            <SectionHeader number="2" title="RICA Premises Inspection & Product Registration" />
            <p className="text-xs text-gray-600 mb-4">
              The milling and feed processing facility at Sector Mahama, Kirehe District has undergone formal premises
              inspection by the Rwanda Inspectorate, Competition and Consumer Protection (RICA). RICA Facility Permit:{' '}
              <strong className="font-mono">{PAYMENT_CONFIG.ricaPermitNumber}</strong>. The facility maintains
              ingredient segregation, pest-control records, and milling dust management logs in compliance with RICA
              regulatory guidelines for animal feed manufacturers.
            </p>
            <DossierTable
              headers={['Title', 'Authority', 'Reference #', 'Issued', 'Expires', 'Status']}
              rows={ricaRecords.map((r) => [
                r.title,
                r.authority,
                r.referenceNumber || '—',
                r.issueDate || '—',
                r.expiryDate || '—',
                statusLabel(r.status),
              ])}
            />
          </section>
        )}

        {/* ── SECTION 3: RSB Quality Standards ─────────────────────────────── */}
        {sections.rsb && (
          <section>
            <SectionHeader number="3" title="RSB Quality Standards Certification & Certificate of Analysis" />
            <p className="text-xs text-gray-600 mb-4">
              All commercially produced feed products are tested against the applicable East African Standards (EAS)
              as adopted by the Rwanda Standards Board (RSB). Aflatoxin levels are maintained below{' '}
              <strong>10 ppb</strong> across all batches. Laboratory Certificate of Analysis (CoA) records are retained
              per batch on the digital traceability system.
            </p>

            {/* RSB Certification table */}
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Certification Status</h4>
            <DossierTable
              headers={['Standard', 'Authority', 'Reference #', 'Issued', 'Expires', 'Status']}
              rows={rsbRecords.map((r) => [
                r.title,
                r.authority,
                r.referenceNumber || '—',
                r.issueDate || '—',
                r.expiryDate || '—',
                statusLabel(r.status),
              ])}
            />

            {/* CoA product selector */}
            <div className="mt-4 flex items-center gap-3 print:hidden">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Filter CoA by Product:</label>
              <select
                value={rsbProduct}
                onChange={(e) => setRsbProduct(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs bg-white focus:border-[#2E7D32] focus:outline-none"
              >
                <option value="all">All Products</option>
                {RSB_COA_PRODUCTS.map((p) => (
                  <option key={p.code} value={p.code}>{p.code} — {p.name}</option>
                ))}
              </select>
            </div>

            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mt-4 mb-2">Certificate of Analysis (Latest Batch)</h4>
            <DossierTable
              headers={['Product', 'EAS Standard', 'Crude Protein', 'Moisture', 'Aflatoxin', 'Batch Ref']}
              rows={coaProducts.map((p) => [
                `${p.code} — ${p.name}`,
                p.standard,
                p.protein,
                p.moisture,
                p.aflatoxin,
                p.batchRef,
              ])}
            />
          </section>
        )}

        {/* ── SECTION 4: Supplier Provenance ────────────────────────────────── */}
        {sections.suppliers && (
          <section>
            <SectionHeader number="4" title="Raw Material Supplier Provenance & Origin Traceability" />
            <p className="text-xs text-gray-600 mb-4">
              Turashoboye Feed Mills sources primary raw materials from certified regional suppliers. Ingredient lots
              are logged upon intake with quantity, supplier, origin region, and reference number. Aflatoxin and
              moisture tests are conducted on-intake for all maize and grain consignments.
            </p>
            <DossierTable
              headers={['Commodity', 'Origin Region', 'Supplier', 'Est. Annual Volume', 'Quality Notes']}
              rows={SUPPLIER_PROVENANCE.map((s) => [
                s.commodity,
                s.region,
                s.supplier,
                s.annualVolume,
                s.notes,
              ])}
            />
          </section>
        )}

        {/* ── SECTION 5: 10-Year Retention Declaration ──────────────────────── */}
        {sections.retention && (
          <section>
            <SectionHeader number="5" title="10-Year Statutory Record Retention Declaration" />
            <div className="border border-gray-300 rounded-xl p-6 text-xs text-gray-800 space-y-3 leading-relaxed print:rounded-none">
              <p>
                In accordance with the <strong>Law N° 32/2016 of 28/08/2016 on Tax Procedures</strong> and the
                accompanying <em>Rwanda Revenue Authority Tax Administration Regulations</em>, Turashoboye Feed Mills Ltd
                hereby declares that all business transaction records — including sales invoices, stock movement ledgers,
                production batch records, ingredient purchase orders, payroll records, and financial statements — are
                retained for a mandatory minimum period of <strong>ten (10) years</strong> from the date of each
                transaction.
              </p>
              <p>
                The company's digital management system enforces this policy through <strong>append-only database ledger tables</strong>.
                No production record may be hard-deleted by any system user. All historical data is accessible to
                authorised auditors and regulatory inspectors upon request with appropriate written notice.
              </p>
              <p>
                Physical copies of permits, certificates, laboratory analyses, and supplier delivery notes are archived
                in binder format at the Mahama Milling Site office, cross-referenced with digital records by batch
                reference number.
              </p>
              <p className="font-semibold">
                This declaration is accurate and complete as of <strong>{today}</strong>.
              </p>
            </div>
          </section>
        )}

        {/* ── SIGNATURE BLOCK ───────────────────────────────────────────────── */}
        <div className="border-t-2 border-gray-900 print:border-black pt-8 mt-10">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-6 text-center">
            Authorised Signatures — Turashoboye Feed Mills Ltd
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { role: 'Managing Director', name: '______________________________' },
              { role: 'Quality Assurance Officer', name: '______________________________' },
              { role: 'Company Stamp', name: '' },
            ].map((sig) => (
              <div key={sig.role} className="text-center space-y-6">
                <div className="border-b border-gray-400 mx-4 h-12" />
                <div>
                  <p className="text-xs font-bold text-gray-900">{sig.role}</p>
                  <p className="text-xs text-gray-500 mt-1">Date: _______________</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-8">
            Turashoboye Feed Mills Ltd · Sector Mahama, Kirehe District · RRA TIN {PAYMENT_CONFIG.rraTinNumber} · RICA Permit {PAYMENT_CONFIG.ricaPermitNumber}
          </p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-2 border-b-2 border-gray-900 print:border-black">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 print:bg-black text-white text-xs font-black shrink-0">
        {number}
      </div>
      <h3 className="font-black text-gray-900 text-sm uppercase tracking-wide">{title}</h3>
    </div>
  );
}

function DossierTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-300 print:rounded-none">
      <table className="min-w-full text-xs">
        <thead className="bg-gray-100 print:bg-gray-200">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-3 py-4 text-center text-gray-400 italic">
                No records in this category.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2 text-gray-800 font-mono whitespace-normal break-words">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function CompliancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<RegulatoryItem[]>(getStoredComplianceRecords);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RegulatoryItem | null>(null);
  const [auditDossierOpen, setAuditDossierOpen] = useState(false);

  const canEdit = ['manager', 'owner', 'super_admin'].includes(user?.profile?.role || '');

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
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              <button
                onClick={() => setAuditDossierOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#2E7D32] bg-white px-4 py-2 text-sm font-medium text-[#2E7D32] shadow-xs hover:bg-green-50 transition"
              >
                <Printer className="h-4 w-4" />
                Generate Audit Dossier
              </button>
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
            </>
          )}
        </div>
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

                {item.documentUrl ? (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50/70 border border-emerald-200/80 p-2.5 text-xs">
                    <div className="flex items-center gap-1.5 text-[#2E7D32] font-semibold min-w-0">
                      <FileText size={15} className="shrink-0" />
                      <span className="truncate">Certificate Attached</span>
                    </div>
                    <a
                      href={item.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#2E7D32] hover:bg-green-800 text-white font-bold text-xs shadow-xs transition shrink-0 cursor-pointer"
                    >
                      <Eye size={13} />
                      View File
                    </a>
                  </div>
                ) : (
                  <div className="rounded-lg bg-gray-50 p-2 text-[11px] text-gray-400 italic">
                    No digital document attached yet.
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
                    className="inline-flex items-center gap-1 text-[#2E7D32] hover:text-green-800 font-semibold cursor-pointer"
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
            setRecords((prev) => {
              const exists = prev.some((r) => r.id === updatedRecord.id);
              const next = exists
                ? prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
                : [updatedRecord, ...prev];
              saveStoredComplianceRecords(next);
              return next;
            });
            setIsUploadModalOpen(false);
          }}
        />
      )}

      {/* Audit Dossier Modal */}
      {auditDossierOpen && (
        <DossierModal
          records={records}
          onClose={() => setAuditDossierOpen(false)}
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
            {record?.documentUrl && (
              <div className="mb-2 flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                <span className="text-emerald-900 font-semibold flex items-center gap-1.5">
                  <FileText size={14} className="text-[#2E7D32]" />
                  Current Certificate Attached
                </span>
                <a
                  href={record.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#2E7D32] hover:underline font-bold text-xs"
                >
                  <ExternalLink size={12} />
                  Open Document
                </a>
              </div>
            )}
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
