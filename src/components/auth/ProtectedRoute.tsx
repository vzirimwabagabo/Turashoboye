import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import type { UserRole } from '../../types/database';

interface ProtectedRouteProps {
  children?: ReactNode;
  allowedRoles?: UserRole | UserRole[];
}

/**
 * ProtectedRoute component ensures that a user is authenticated (and optionally has the required role).
 * If the user is not authenticated, they are redirected to /login.
 * If the user lacks the required role, they are redirected to /unauthorized.
 * While authentication state is loading, a spinner is shown.
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { loading } = useRequireAuth(allowedRoles);

  // Show a loading indicator while auth state is being resolved.
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-[#2E7D32]" />
      </div>
    );
  }

  // If children are provided, render them; otherwise render nested routes via Outlet.
  return <>{children ? children : <Outlet />}</>;
}
