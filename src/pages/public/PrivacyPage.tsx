export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
        Privacy & Data Handling Notice
      </h1>
      <p className="text-xs text-gray-500">Last updated: October 2026 — Mahama, Rwanda</p>

      <div className="prose prose-emerald text-sm text-gray-700 space-y-4 leading-relaxed">
        <p>
          Turashoboye Feeds ("we", "our") values the trust of the farmers, suppliers, and community members we serve in Mahama and Kirehe District. This policy explains what information we collect, why we collect it, and how we safeguard it.
        </p>

        <h2 className="text-lg font-bold text-gray-900 pt-2">1. Information We Collect</h2>
        <p>
          We practice data minimization and collect only what is strictly necessary to conduct legitimate agro-processing operations:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Customer Contact Details:</strong> Name, phone number, and administrative sector to fulfill feed orders and provide delivery/collection receipts.</li>
          <li><strong>Transaction Records:</strong> Order quantities, product package sizes, sales amounts, and payment methods (cash, MoMo reference).</li>
          <li><strong>Supplier Records:</strong> Vendor legal name, Rwanda TIN number, and delivery documents for quality traceability.</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 pt-2">2. How Information is Used</h2>
        <p>
          Customer and order records are used solely to:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Process feed sales and manage physical inventory.</li>
          <li>Enable forward and backward batch traceability in the event of an ingredient or feed quality hold.</li>
          <li>Comply with Rwanda Revenue Authority (RRA) statutory accounting retention requirements (10 years).</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 pt-2">3. Data Protection & Non-Disclosure</h2>
        <p>
          We never sell, rent, or monetize personal customer details. Internal access to customer phone numbers and purchase histories is restricted to authorized staff via secure Row Level Security (RLS) controls.
        </p>

        <h2 className="text-lg font-bold text-gray-900 pt-2">4. Contact Us</h2>
        <p>
          If you have questions regarding your records or wish to update your contact details, please contact our team at <strong>contact@turashoboye.rw</strong> or visit our depot in Sector Mahama.
        </p>
      </div>
    </div>
  );
}
