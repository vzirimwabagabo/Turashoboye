import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

/**
 * 403 Unauthorized page — shown when user lacks permission
 * to access a resource or route.
 */
export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <ShieldAlert size={64} className="mb-4 text-red-300" />
      <h1 className="text-6xl font-bold text-gray-900">403</h1>
      <p className="mt-2 text-lg text-gray-600">
        Access denied
      </p>
      <p className="mt-1 max-w-sm text-sm text-gray-400">
        You don't have permission to access this page. Contact your administrator
        if you believe this is a mistake.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center rounded-lg bg-[#2E7D32] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#256b29]"
        >
          Back to Dashboard
        </Link>
        <Link
          to="/"
          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
