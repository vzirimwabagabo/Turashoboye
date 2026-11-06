import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, ShieldCheck, Award, AlertCircle } from 'lucide-react';

export interface PrintableBatch {
  id: string;
  batch_number: string;
  product_name: string;
  formula_name: string;
  planned_output_qty: number;
  actual_output_qty?: number;
  started_at: string;
  completed_at?: string;
  operator_name: string;
  supervisor_name: string;
  quality_status: 'passed' | 'held' | 'pending';
}

interface BatchLabelModalProps {
  batch: PrintableBatch | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BatchLabelModal({ batch, isOpen, onClose }: BatchLabelModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !batch) return null;

  const verificationUrl = `${window.location.origin}/verify/batch/${encodeURIComponent(batch.batch_number)}`;

  // Calculate manufacturing and expiry dates (90 days standard shelf life)
  const mfgDate = batch.completed_at || batch.started_at || new Date().toISOString().slice(0, 10);
  const mfgDateObj = new Date(mfgDate);
  const expDateObj = new Date(mfgDateObj);
  expDateObj.setDate(expDateObj.getDate() + 90);
  const expDateStr = expDateObj.toISOString().slice(0, 10);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden my-8">
        {/* Modal Controls (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[#2E7D32]" />
            <h2 className="text-base font-bold text-gray-900">
              Official RSB 50kg Bag Tag & QR Code
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#256b29] text-white text-xs font-bold shadow-xs transition"
            >
              <Printer className="h-4 w-4" />
              Print Bag Tag
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Bag Tag Container */}
        <div className="p-6 sm:p-8 bg-gray-100/70 print:p-0 print:bg-white">
          <div
            ref={printRef}
            className="bg-white border-2 border-dashed border-gray-400 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6 print:border-2 print:border-solid print:border-black print:rounded-none print:shadow-none print:m-0"
          >
            {/* Header: Company & Certifications */}
            <div className="flex items-start justify-between border-b-2 border-black pb-4">
              <div>
                <span className="text-[10px] font-extrabold tracking-widest text-[#2E7D32] uppercase">
                  Republic of Rwanda • Animal Feed Certification
                </span>
                <h1 className="text-2xl font-black text-gray-950 uppercase tracking-tight">
                  Turashoboye Feed Mills
                </h1>
                <p className="text-xs font-medium text-gray-700">
                  Mahama Primary Depot & Milling Plant, Kirehe District, Eastern Province
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  RRA TIN: <span className="font-mono font-bold text-gray-800">100234891</span> | RICA Permit: <span className="font-mono font-bold text-gray-800">00492-RICA-2026</span>
                </p>
              </div>

              <div className="text-right flex flex-col items-end">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-green-50 border border-green-600 text-green-900 font-extrabold text-[11px] uppercase tracking-wider print:border-black print:text-black">
                  <ShieldCheck className="h-4 w-4 text-[#2E7D32] print:text-black" />
                  RSB EAS 353
                </div>
                <span className="text-[9px] text-gray-500 mt-1 uppercase">Standard Compliant</span>
              </div>
            </div>

            {/* Product Identity & Net Weight */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 print:bg-transparent print:border-black">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Finished Feed Product
              </span>
              <h2 className="text-xl font-black text-gray-950 mt-0.5">
                {batch.product_name}
              </h2>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 print:border-black">
                <span className="text-xs font-semibold text-gray-700">
                  Recipe Spec: <span className="font-bold">{batch.formula_name}</span>
                </span>
                <span className="text-lg font-black text-[#2E7D32] tracking-tight print:text-black">
                  50.0 KG NET WEIGHT
                </span>
              </div>
            </div>

            {/* Batch, Dates & QR Verification */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              {/* Batch & Date Details */}
              <div className="sm:col-span-2 space-y-3">
                <div className="border border-black p-3 rounded-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                    Official Production Batch Identifier
                  </span>
                  <span className="font-mono text-base font-black text-gray-950 block tracking-wider">
                    {batch.batch_number}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-gray-50 rounded border border-gray-200 print:border-black">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">
                      Production Date
                    </span>
                    <span className="font-semibold text-gray-900">{mfgDate}</span>
                  </div>
                  <div className="p-2 bg-gray-50 rounded border border-gray-200 print:border-black">
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">
                      Best Before (90 Days)
                    </span>
                    <span className="font-semibold text-gray-900">{expDateStr}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                  <span>Milling Operator: <strong>{batch.operator_name}</strong></span>
                  <span>QA Clearance: <strong className="text-green-700 uppercase print:text-black">{batch.quality_status}</strong></span>
                </div>
              </div>

              {/* QR Code Block */}
              <div className="flex flex-col items-center justify-center p-3 bg-white border-2 border-black rounded-xl text-center space-y-1.5">
                <QRCodeSVG
                  value={verificationUrl}
                  size={120}
                  level="M"
                  includeMargin={false}
                />
                <span className="text-[10px] font-extrabold uppercase text-gray-900 tracking-wider">
                  Scan to Verify
                </span>
                <span className="text-[8px] text-gray-500 leading-tight">
                  Instant provenance & lab test verification
                </span>
              </div>
            </div>

            {/* Guaranteed Nutritional Analysis */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                Guaranteed Nutritional Analysis (RSB Standard EAS 353:2019)
              </span>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="border border-gray-300 p-1.5 rounded print:border-black">
                  <span className="text-[9px] text-gray-500 uppercase block">Crude Protein</span>
                  <span className="font-black text-gray-900">≥ 20.0%</span>
                </div>
                <div className="border border-gray-300 p-1.5 rounded print:border-black">
                  <span className="text-[9px] text-gray-500 uppercase block">Moisture</span>
                  <span className="font-black text-gray-900">≤ 11.5%</span>
                </div>
                <div className="border border-gray-300 p-1.5 rounded print:border-black">
                  <span className="text-[9px] text-gray-500 uppercase block">Aflatoxin B1</span>
                  <span className="font-black text-emerald-700 print:text-black">&lt; 10 ppb</span>
                </div>
                <div className="border border-gray-300 p-1.5 rounded print:border-black">
                  <span className="text-[9px] text-gray-500 uppercase block">Crude Fibre</span>
                  <span className="font-black text-gray-900">≤ 5.0%</span>
                </div>
              </div>
            </div>

            {/* Mandatory Storage & Safety Notice */}
            <div className="border-t-2 border-black pt-3 flex items-start gap-2 text-[10px] text-gray-600">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 print:text-black mt-0.5" />
              <div>
                <p className="font-bold text-gray-900 uppercase">
                  Storage & Handling Instructions:
                </p>
                <p>
                  Store bags on wooden pallets at least 15cm above floor and 30cm away from walls. Store in a cool, dry, well-ventilated warehouse protected from rodents and direct sunlight.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info (Hidden in Print) */}
        <div className="print:hidden px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>QR Target: <code className="font-mono text-gray-700">{verificationUrl}</code></span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white font-medium text-gray-700 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
