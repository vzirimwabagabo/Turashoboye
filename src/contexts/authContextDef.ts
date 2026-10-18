import { createContext } from 'react';
import type { AuthState, SignupCredentials, AuthUser } from '../types/auth';
import type { Profile } from '../types/database';

export interface AuthContextProps extends AuthState {
  realUser: AuthUser | null;
  /**
   * Universal client-side impersonation is disabled for security compliance.
   * Server-delegated impersonation requires audited session tokens and backend authorization.
   */
  isImpersonating: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: Profile['role'] }>;
  signUp: (creds: SignupCredentials) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);
