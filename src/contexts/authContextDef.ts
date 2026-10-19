import { createContext } from 'react';
import type { AuthState, SignupCredentials } from '../types/auth';
import type { Profile } from '../types/database';

export interface AuthContextProps extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: Profile['role'] }>;
  signUp: (creds: SignupCredentials) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);
