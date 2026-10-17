import LoginForm from '../components/auth/LoginForm';

const CURRENT_YEAR = 2026;

/**
 * Login page — displayed to unauthenticated users.
 * Centered layout with brand header, tagline, and login form
 * over a subtle green gradient background.
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#2E7D32]/10 via-white to-[#A5D6A7]/20 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2E7D32] text-xl font-bold text-white shadow-lg">
            TF
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Turashoboye Feeds
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Animal Feed Production Management
          </p>
        </div>

        {/* Login form card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8">
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          &copy; {CURRENT_YEAR} Turashoboye Feeds. All rights reserved.
        </p>
      </div>
    </div>
  );
}
