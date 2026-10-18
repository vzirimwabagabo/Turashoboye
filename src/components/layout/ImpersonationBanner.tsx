// src/components/layout/ImpersonationBanner.tsx
/**
 * Universal client-side impersonation is decommissioned for security compliance.
 * Any future impersonation will require server-delegated sessions, cryptographic
 * audit trails, and dual-signoff authorization.
 */
import { useAuth } from '../../hooks/useAuth';

export default function ImpersonationBanner() {
  const { isImpersonating } = useAuth();

  if (!isImpersonating) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-semibold text-center border-b border-amber-600">
      ⚠️ Impersonation mode is currently disabled by security policy.
    </div>
  );
}
