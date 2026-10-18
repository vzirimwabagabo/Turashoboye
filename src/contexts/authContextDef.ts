import { createContext } from 'react';
import type { AuthState, SignupCredentials, AuthUser } from '../types/auth';
import type { Profile } from '../types/database';

export interface AuthContextProps extends AuthState {
  realUser: AuthUser | null;
  impersonatedUser: AuthUser | null;
  isImpersonating: boolean;
  actOnBehalfOf: (target: AuthUser | { id: string; email?: string; displayName: string; role: Profile['role']; phone?: string }) => void;
  stopImpersonation: () => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: Profile['role'] }>;
  signUp: (creds: SignupCredentials) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}


export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

