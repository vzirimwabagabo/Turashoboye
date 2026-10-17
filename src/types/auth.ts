// src/types/auth.ts
/**
 * Types related to authentication and user profile data.
 */
import type { Profile, UserRole } from "./database";
import type { User, Session } from "@supabase/supabase-js";

/** AuthUser extends Supabase User with our profile fields */
export interface AuthUser extends User {
  /** Application profile data stored in `profiles` table */
  profile?: Profile;
  /** Convenience boolean for MFA status (true if TOTP enabled) */
  mfaEnabled?: boolean;
}

/** State of the authentication context */
export interface AuthState {
  /** Currently logged‑in user (null if not authenticated) */
  user: AuthUser | null;
  /** Supabase session (null if not authenticated) */
  session: Session | null;
  /** Loading flag while auth state is being resolved */
  loading: boolean;
  /** Error message if authentication fails */
  error: string | null;
}

/** Credentials for sign‑in */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Credentials for sign‑up – includes optional metadata for profile */
export interface SignupCredentials extends LoginCredentials {
  displayName: string;
  role: UserRole;
}

/** Props for a protected route component */
export interface ProtectedRouteProps {
  /** Allowed roles – if omitted, any authenticated user may access */
  allowedRoles?: UserRole[];
  /** Children to render when authorized */
  children?: React.ReactNode;
}

export type { UserRole };
