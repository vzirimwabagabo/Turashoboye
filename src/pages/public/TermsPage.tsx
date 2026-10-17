export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
        Terms of Service & Customer Policies
      </h1>
      <p className="text-xs text-gray-500">Effective: October 2026 — Mahama Operations</p>

      <div className="prose prose-emerald text-sm text-gray-700 space-y-4 leading-relaxed">
        <h2 className="text-lg font-bold text-gray-900 pt-2">1. Scope of Service</h2>
        <p>
          Turashoboye Feeds operates an agro-processing facility producing balanced poultry, pig, and cattle feeds, as well as milling raw feed grains in Sector Mahama, Kirehe District, Rwanda.
        </p>

        <h2 className="text-lg font-bold text-gray-900 pt-2">2. Product Presentation & Pricing</h2>
        <p>
          All prices on our catalogue are quoted in whole Rwandan Francs (RWF). While we strive for continuous availability, all orders are subject to physical stock confirmation at our depot. Prices are subject to adjustment based on prevailing raw grain and soya market rates.
        </p>

        <h2 className="text-lg font-bold text-gray-900 pt-2">3. Collection, Inspection & Bagging</h2>
        <p>
          Customers or their designated transporters are encouraged to inspect bag seals and weight stamps at the time of depot collection. Any discrepancy in bag integrity must be reported immediately prior to dispatch from the premises.
        </p>

        <h2 className="text-lg font-bold text-gray-900 pt-2">4. Payment Terms</h2>
        <p>
          We accept cash at the depot counter, verified MTN Mobile Money (MoMo) payments, and direct bank transfers. Official receipts are issued for all transactions. Offline payments reported by staff are reconciled with the server upon connectivity sync.
        </p>

        <h2 className="text-lg font-bold text-gray-900 pt-2">5. Quality Assurance & Returns</h2>
        <p>
          In the event of an authorized product hold or verified defect, feed bags may be returned to the depot with the batch identification label intact for investigation, replacement, or approved credit adjustment.
        </p>
      </div>
    </div>
  );
}
