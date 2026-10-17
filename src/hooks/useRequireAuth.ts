// src/hooks/useRequireAuth.ts
/**
 * Hook that checks authentication and optional role authorization.
 * If the user is not authenticated, redirects to /login.
 * If the user does not have the required role(s), redirects to /unauthorized.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";
import type { UserRole } from "../types/database";

/**
 * @param requiredRoles optional single role or array of roles that are allowed to view the page
 * @returns { user, loading } – user object (or null) and loading flag
 */
export const useRequireAuth = (requiredRoles?: UserRole | UserRole[]) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated – send to login
        navigate("/login", { replace: true });
        return;
      }
      if (requiredRoles) {
        const allowed = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        if (!allowed.includes(user.profile?.role as UserRole)) {
          // Authenticated but not authorized
          navigate("/unauthorized", { replace: true });
        }
      }
    }
  }, [user, loading, requiredRoles, navigate]);

  return { user, loading };
};

