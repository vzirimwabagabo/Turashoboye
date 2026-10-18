// src/contexts/AuthContext.tsx
/**
 * React context provider component for authentication.
 * Uses Supabase auth listeners and server-side RPC to maintain authoritative profile data.
 * Client-side role elevation, password backdoor bypasses, and unverified impersonation are strictly disabled.
 */
import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { AuthUser, SignupCredentials } from "../types/auth";
import type { Profile } from "../types/database";
import { AuthContext, type AuthContextProps } from "./authContextDef";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches the authoritative profile directly from the server.
   * Calls get_my_profile RPC (Security Definer) which guarantees:
   * 1. Profile retrieval matches authenticated auth.uid() in PostgreSQL.
   * 2. Self-signup accounts are safely initialized as 'public' in PostgreSQL.
   * 3. Roles are verified by PostgreSQL RLS, never by client-supplied metadata or email substrings.
   */
  const fetchAuthoritativeProfile = useCallback(async (authUserId: string): Promise<Profile | undefined> => {
    try {
      // 1. Try secure RPC
      const { data: rpcProfile, error: rpcError } = await supabase.rpc('get_my_profile');
      if (!rpcError && rpcProfile) {
        const raw = rpcProfile as any;
        return {
          id: raw.id,
          authUserId: raw.auth_user_id || raw.authUserId,
          role: raw.role,
          displayName: raw.display_name || raw.displayName || 'User',
          fullName: raw.full_name || raw.fullName,
          phone: raw.phone,
          avatarUrl: raw.avatar_url || raw.avatarUrl,
          mfaEnabled: Boolean(raw.mfa_enabled || raw.mfaEnabled),
          createdAt: raw.created_at || raw.createdAt,
          updatedAt: raw.updated_at || raw.updatedAt,
        } as Profile;
      }

      // 2. Direct table fallback if RPC unavailable
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      if (profileError) {
        console.error("Failed to fetch authoritative user profile:", profileError.message);
        return undefined;
      }
      if (!data) return undefined;

      const raw = data as any;
      return {
        id: raw.id,
        authUserId: raw.auth_user_id || raw.authUserId,
        role: raw.role,
        displayName: raw.display_name || raw.displayName || 'User',
        fullName: raw.full_name || raw.fullName,
        phone: raw.phone,
        avatarUrl: raw.avatar_url || raw.avatarUrl,
        mfaEnabled: Boolean(raw.mfa_enabled || raw.mfaEnabled),
        createdAt: raw.created_at || raw.createdAt,
        updatedAt: raw.updated_at || raw.updatedAt,
      } as Profile;
    } catch (err) {
      console.error("Error fetching authoritative profile:", err);
      return undefined;
    }
  }, []);

  const buildAuthUser = useCallback(async (rawUser: User): Promise<AuthUser> => {
    const profile = await fetchAuthoritativeProfile(rawUser.id);

    // Profile role must come from PostgreSQL. If missing, default to public with no staff privileges.
    const trustedRole: Profile['role'] = profile?.role ?? 'public';
    const trustedDisplayName = profile?.displayName || profile?.fullName || rawUser.email?.split('@')[0] || 'User';

    const trustedProfile: Profile = profile ?? {
      id: `p-${rawUser.id}`,
      authUserId: rawUser.id,
      role: trustedRole,
      displayName: trustedDisplayName,
      mfaEnabled: false,
    };

    const mfaEnabled = Boolean(rawUser.factors && rawUser.factors.length > 0) || Boolean(trustedProfile.mfaEnabled);

    return {
      ...rawUser,
      profile: trustedProfile,
      mfaEnabled,
    };
  }, [fetchAuthoritativeProfile]);

  useEffect(() => {
    let isMounted = true;

    // Listen to Supabase auth events
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (!isMounted) return;
      setSession(sess);
      if (sess?.user) {
        const authUser = await buildAuthUser(sess.user);
        if (isMounted) setUser(authUser);
      } else {
        if (isMounted) setUser(null);
      }
      if (isMounted) setLoading(false);
    });

    // Check active session on initialization
    const initSession = async () => {
      try {
        const { data, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) {
          console.error("Error retrieving session:", sessionErr.message);
        }
        if (!isMounted) return;
        setSession(data.session);
        if (data.session?.user) {
          const authUser = await buildAuthUser(data.session.user);
          if (isMounted) setUser(authUser);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initSession();

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [buildAuthUser]);

  /**
   * Authenticate strictly through Supabase Auth.
   * No bypass passwords or client-side mock logins are allowed.
   */
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    const cleanEmail = email.trim().toLowerCase();

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return { success: false, error: signInError.message };
    }

    if (authData?.user) {
      const authUser = await buildAuthUser(authData.user);
      setUser(authUser);
      setSession(authData.session);
      setLoading(false);
      return { success: true, role: authUser.profile?.role };
    }

    setLoading(false);
    return { success: false, error: 'Authentication failed. Please verify your credentials.' };
  };

  /**
   * Register a new customer / farmer account.
   * Role is locked to 'public' by server-side trigger (handle_new_user).
   */
  const signUp = async (creds: SignupCredentials) => {
    setLoading(true);
    setError(null);
    const { email, password, displayName } = creds;

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          displayName,
          // Note: Any role sent in options.data is ignored by the database trigger for security.
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return { success: false, error: signUpError.message };
    }

    if (data.session?.user) {
      const authUser = await buildAuthUser(data.session.user);
      setUser(authUser);
      setSession(data.session);
    }

    setLoading(false);
    return { success: true };
  };

  const signOut = async () => {
    setLoading(true);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("SignOut error:", signOutError.message);
      setError(signOutError.message);
    }
    setUser(null);
    setSession(null);
    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/login`,
    });
    if (resetError) {
      setError(resetError.message);
    }
    setLoading(false);
  };

  const value: AuthContextProps = {
    user,
    realUser: user,
    isImpersonating: false, // Universal impersonation disabled for security
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
