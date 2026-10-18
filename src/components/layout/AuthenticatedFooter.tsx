// src/components/layout/AuthenticatedFooter.tsx
import { Link } from 'react-router-dom';
import { ShieldCheck, HelpCircle, FileText, Database } from 'lucide-react';

export default function AuthenticatedFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white text-gray-500 text-xs py-4 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Left: System status & depot */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
          <span className="font-semibold text-gray-700">Turashoboye Operational Workspace</span>
          <span className="hidden sm:inline text-gray-300">•</span>
          <span className="inline-flex items-center gap-1 text-gray-600">
            <Database size={12} className="text-[#2E7D32]" />
            PostgreSQL Ledger Active
          </span>
          <span className="hidden sm:inline text-gray-300">•</span>
          <span className="text-gray-500 font-mono text-[11px]">Mahama Depot (DEPOT-01)</span>
        </div>

        {/* Right: Version, Support, Privacy, Terms */}
        <div className="flex items-center gap-4 text-gray-500">
          <span className="font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[11px]">
            v1.0.0-rc1
          </span>
          <Link
            to="/contact"
            className="hover:text-gray-900 transition-colors inline-flex items-center gap-1"
          >
            <HelpCircle size={12} />
            <span>Support</span>
          </Link>
          <Link
            to="/privacy"
            className="hover:text-gray-900 transition-colors inline-flex items-center gap-1"
          >
            <FileText size={12} />
            <span>Privacy</span>
          </Link>
          <Link
            to="/terms"
            className="hover:text-gray-900 transition-colors inline-flex items-center gap-1"
          >
            <ShieldCheck size={12} />
            <span>Terms</span>
          </Link>
          <span className="text-gray-400">© {currentYear}</span>
        </div>
      </div>
    </footer>
  );
}
