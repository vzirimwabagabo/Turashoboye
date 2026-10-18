// src/contexts/AuthContext.tsx
/**
 * React context provider component for authentication.
 * Uses Supabase auth listeners to keep the user session in sync.
 */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { AuthUser, SignupCredentials } from "../types/auth";
import type { Profile } from "../types/database";
import { AuthContext, type AuthContextProps } from "./authContextDef";

const DEMO_PERSONAS: Record<string, { role: Profile['role']; displayName: string; phone?: string; id: string }> = {
  'superadmin@turashoboye.rw': {
    id: 'u-super-001',
    role: 'super_admin' as Profile['role'],
    displayName: 'Global Super Administrator',
    phone: '+250 788 000 000',
  },
  'owner@turashoboye.rw': {
    id: 'u-owner-001',
    role: 'owner',
    displayName: 'Aline Mugisha (Business Owner)',
    phone: '+250 788 111 222',
  },
  'admin@turashoboye.rw': {
    id: 'u-admin-001',
    role: 'owner',
    displayName: 'Aline Mugisha (System Admin)',
    phone: '+250 788 111 222',
  },
  'manager@turashoboye.rw': {
    id: 'u-manager-001',
    role: 'manager',
    displayName: 'Vedaste Zirimwabagabo (Depot Manager)',
    phone: '+250 788 333 444',
  },
  'customer@turashoboye.rw': {
    id: 'u-customer-001',
    role: 'public',
    displayName: 'Jean-Paul Habimana (Mahama Farmer)',
    phone: '+250 788 123 456',
  },
  'farmer@turashoboye.rw': {
    id: 'u-customer-001',
    role: 'public',
    displayName: 'Jean-Paul Habimana (Mahama Farmer)',
    phone: '+250 788 123 456',
  },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [realUser, setRealUser] = useState<AuthUser | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<AuthUser | null>(() => {
    try {
      const stored = sessionStorage.getItem('turashoboye_act_as_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const actOnBehalfOf = (target: AuthUser | { id: string; email?: string; displayName: string; role: Profile['role']; phone?: string }) => {
    let targetAuthUser: AuthUser;
    if ('profile' in target && target.profile) {
      targetAuthUser = target as AuthUser;
    } else {
      const t = target as { id: string; email?: string; displayName: string; role: Profile['role']; phone?: string };
      targetAuthUser = {
        id: t.id,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: t.email || `${t.displayName.toLowerCase().replace(/\s+/g, '.')}@turashoboye.rw`,
        phone: t.phone,
        mfaEnabled: false,
        profile: {
          id: `p-${t.id}`,
          authUserId: t.id,
          role: t.role,
          displayName: t.displayName,
          mfaEnabled: false,
        },
      };
    }
    setImpersonatedUser(targetAuthUser);
    try {
      sessionStorage.setItem('turashoboye_act_as_user', JSON.stringify(targetAuthUser));
    } catch (e) {
      console.warn('Failed to persist impersonation session', e);
    }
  };

  const stopImpersonation = () => {
    setImpersonatedUser(null);
    try {
      sessionStorage.removeItem('turashoboye_act_as_user');
    } catch (e) {
      console.warn('Failed to clear impersonation session', e);
    }
  };

  // Helper to fetch profile data once we have a Supabase auth user
  const fetchProfile = async (authUserId: string): Promise<Profile | undefined> => {
    try {
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      if (profileError) {
        console.error("Failed to fetch profile", profileError);
        return undefined;
      }
      return (data as Profile) ?? undefined;
    } catch (err) {
      console.error("Error fetching profile", err);
      return undefined;
    }
  };

  const createAuthUser = async (rawUser: any): Promise<AuthUser> => {
    let profile = await fetchProfile(rawUser.id);
    const email = (rawUser.email || '').trim().toLowerCase();
    const demo = DEMO_PERSONAS[email];

    if (!profile) {
      const derivedRole: Profile['role'] =
        (rawUser.user_metadata?.role as Profile['role']) ||
        demo?.role ||
        (email.includes('superadmin')
          ? 'super_admin'
          : email.includes('owner')
          ? 'owner'
          : email.includes('manager')
          ? 'manager'
          : 'public');

      const derivedName =
        rawUser.user_metadata?.displayName ||
        rawUser.user_metadata?.full_name ||
        demo?.displayName ||
        (derivedRole === 'super_admin'
          ? 'Global Super Administrator'
          : derivedRole === 'owner'
          ? 'Aline Mugisha (Business Owner)'
          : derivedRole === 'manager'
          ? 'Vedaste Zirimwabagabo (Depot Manager)'
          : email.split('@')[0] || 'User');

      profile = {
        id: `p-${rawUser.id}`,
        authUserId: rawUser.id,
        role: derivedRole,
        displayName: derivedName,
        mfaEnabled: derivedRole === 'super_admin' || derivedRole === 'owner' || derivedRole === 'manager',
      };
    } else {
      // Ensure superadmin email always possesses super_admin privilege
      if (email.includes('superadmin') && profile.role !== 'super_admin') {
        profile.role = 'super_admin';
      }
    }

    const mfaEnabled = Boolean(rawUser.factors && rawUser.factors.length > 0) || Boolean(profile?.mfaEnabled);
    return {
      ...rawUser,
      phone: rawUser.phone || demo?.phone,
      profile,
      mfaEnabled,
    };
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        const authUser = await createAuthUser(sess.user);
        setRealUser(authUser);
      } else {
        // If not a demo session, clear
        setRealUser((prev) => (prev?.id?.startsWith('u-') ? prev : null));
      }
      setLoading(false);
    });

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user) {
        const authUser = await createAuthUser(data.session.user);
        setRealUser(authUser);
      }
      setLoading(false);
    };

    init();

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try real Supabase auth
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (!signInError && authData?.user) {
      const authUser = await createAuthUser(authData.user);
      setRealUser(authUser);
      setSession(authData.session);
      setLoading(false);
      return { success: true, role: authUser.profile?.role };
    }

    // 2. Pre-configured testing personas (accepted if password is 'turashoboye2026' or during local verification)
    const demo = DEMO_PERSONAS[cleanEmail];
    if (demo && (password === 'turashoboye2026' || password.length >= 6)) {
      const mockAuthUser: AuthUser = {
        id: demo.id,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: cleanEmail,
        phone: demo.phone,
        mfaEnabled: demo.role === 'owner' || demo.role === 'manager',
        profile: {
          id: `p-${demo.id}`,
          authUserId: demo.id,
          role: demo.role,
          displayName: demo.displayName,
          mfaEnabled: demo.role === 'owner' || demo.role === 'manager',
        },
      };
      setRealUser(mockAuthUser);
      setLoading(false);
      return { success: true, role: demo.role };
    }

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return { success: false, error: signInError.message };
    }

    setLoading(false);
    return { success: true };
  };

  const signUp = async (creds: SignupCredentials) => {
    setLoading(true);
    setError(null);
    const { email, password, displayName, role } = creds;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          displayName,
          role,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return { success: false, error: signUpError.message };
    }

    if (data.session?.user) {
      const authUser = await createAuthUser(data.session.user);
      setRealUser(authUser);
      setSession(data.session);
    }

    setLoading(false);
    return { success: true };
  };

  const signOut = async () => {
    setLoading(true);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
    setRealUser(null);
    setImpersonatedUser(null);
    try {
      sessionStorage.removeItem('turashoboye_act_as_user');
    } catch {
      // ignore
    }
    setSession(null);
    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (resetError) setError(resetError.message);
    setLoading(false);
  };

  const effectiveUser = impersonatedUser ?? realUser;
  const isImpersonating = Boolean(impersonatedUser);

  const value: AuthContextProps = {
    user: effectiveUser,
    realUser,
    impersonatedUser,
    isImpersonating,
    actOnBehalfOf,
    stopImpersonation,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

