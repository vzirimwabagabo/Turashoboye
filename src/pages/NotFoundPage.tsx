import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

/**
 * 404 Not Found page — shown when no route matches.
 */
export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <FileQuestion size={64} className="mb-4 text-gray-300" />
      <h1 className="text-6xl font-bold text-gray-900">404</h1>
      <p className="mt-2 text-lg text-gray-600">
        Page not found
      </p>
      <p className="mt-1 text-sm text-gray-400">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center rounded-lg bg-[#2E7D32] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#256b29]"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
