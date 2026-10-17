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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const profile = await fetchProfile(rawUser.id);
    const mfaEnabled = Boolean(rawUser.factors && rawUser.factors.length > 0);
    return {
      ...rawUser,
      profile,
      mfaEnabled,
    };
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        const authUser = await createAuthUser(sess.user);
        setUser(authUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user) {
        const authUser = await createAuthUser(data.session.user);
        setUser(authUser);
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
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
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
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return { success: false, error: signUpError.message };
    }

    if (data.user?.id) {
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          auth_user_id: data.user.id,
          role,
          display_name: displayName,
          mfa_enabled: false,
        },
      ]);
      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return { success: false, error: profileError.message };
      }
    }

    setLoading(false);
    return { success: true };
  };

  const signOut = async () => {
    setLoading(true);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
    setUser(null);
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

  const value: AuthContextProps = {
    user,
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
