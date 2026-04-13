import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

import { RevenueCatService } from "@/lib/revenueCat";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[useAuth] Hook mounted. URL:", window.location.href);
    console.log("[useAuth] Is Native Platform:", Capacitor.isNativePlatform());

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) {
          console.log("Auth state changed: No session", event);
        } else {
          console.log("Auth state changed: Session for", session.user.email, event);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user?.id) {
          console.log("Identifying with RevenueCat:", session.user.id);
          await RevenueCatService.identify(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          console.log("Resetting RevenueCat");
          await RevenueCatService.reset();
        }
      }
    );

    // 2. FOR WEB: Manually process tokens in URL if present
    if (!Capacitor.isNativePlatform()) {
      const hash = window.location.hash.substring(1);
      const search = window.location.search.substring(1);
      const hashParams = new URLSearchParams(hash);
      const searchParams = new URLSearchParams(search);

      const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
      const code = searchParams.get('code');
      const errorMsg = hashParams.get('error_description') || searchParams.get('error_description') ||
        hashParams.get('error') || searchParams.get('error');

      if (errorMsg) {
        console.error("[useAuth] Auth error in URL:", errorMsg);
        setError(decodeURIComponent(errorMsg).replace(/\+/g, ' '));
        window.history.replaceState(null, '', window.location.pathname);
      } else if (accessToken && refreshToken) {
        console.log("[useAuth] Web tokens detected, setting session manually...");
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ data, error }) => {
            if (error) {
              console.error("[useAuth] Web setSession error:", error);
              setError(error.message);
            } else {
              console.log("[useAuth] Web setSession success. Session for:", data.session?.user?.email);
              // Clear URL tokens
              window.history.replaceState(null, '', window.location.pathname);
            }
          });
      } else if (code) {
        console.log("[useAuth] Web code detected, exchanging...");
        supabase.auth.exchangeCodeForSession(code)
          .then(({ data, error }) => {
            if (error) {
              console.error("[useAuth] Web exchangeCode error:", error);
              setError(error.message);
            } else {
              console.log("[useAuth] Web exchangeCode success. Session for:", data.session?.user?.email);
              // Clear URL code
              window.history.replaceState(null, '', window.location.pathname);
            }
          });
      }
    }

    // 3. THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("[useAuth] getSession error:", error);
      }
      console.log("[useAuth] Initial session check result:", {
        hasSession: !!session,
        email: session?.user?.email
      });
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        RevenueCatService.identify(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata?: Record<string, unknown>) => {
    setError(null);
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return { error: signUpError, data: null };
      }

      setLoading(false);
      return { error: null, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setLoading(false);
      return { error: { message: errorMessage }, data: null };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return { error: signInError, data: null };
      }

      setLoading(false);
      return { error: null, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setLoading(false);
      return { error: { message: errorMessage }, data: null };
    }
  }, []);

  const queryClient = useQueryClient();

  const signOut = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError(signOutError.message);
        setLoading(false);
        return { error: signOutError };
      }

      // CRITICAL: Clear all cached data (Pet profile, entries, etc.)
      // This prevents the next user from seeing the previous user's data
      queryClient.clear();

      // Also clear local storage specifically for this app if needed
      // (Supabase handles its own token clearing)

      setUser(null);
      setSession(null);
      setLoading(false);
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setLoading(false);
      return { error: { message: errorMessage } };
    }
  }, [queryClient]);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return { error: resetError };
      }

      setLoading(false);
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setLoading(false);
      return { error: { message: errorMessage } };
    }
  }, []);


  const signInWithEmail = useCallback(async (email: string) => {
    setError(null);
    setLoading(true);

    try {
      const redirectUrl = Capacitor.isNativePlatform()
        ? "com.pawmood.app://google-auth"
        : `${window.location.origin}/`;

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (signInError) {
        console.error('Email Sign in error detail:', {
          message: signInError.message,
          status: signInError.status,
          name: signInError.name
        });
        setError(signInError.message);
        setLoading(false);
        return { error: signInError };
      }

      setLoading(false);
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error('Unexpected email sign in error:', err);
      setError(errorMessage);
      setLoading(false);
      return { error: { message: errorMessage } };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const redirectUrl = Capacitor.isNativePlatform()
        ? "com.pawmood.app://google-auth"
        : `${window.location.origin}/`;

      console.log('Starting Google Sign In with redirect:', redirectUrl);

      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Capacitor.isNativePlatform(),
        },
      });

      if (signInError) {
        console.error('Google Sign in error detail:', {
          message: signInError.message,
          status: signInError.status,
          name: signInError.name
        });
        setError(signInError.message);
        setLoading(false);
        return { error: signInError, data: null };
      }

      console.log('OAuth Data received:', data);

      if (data?.url) {
        await Browser.open({ url: data.url });
      } else {
        console.error('No URL returned from Supabase OAuth');
        setError("Configuration Error: No redirect URL returned.");
        setLoading(false);
        return { error: { message: "Configuration Error: Check Supabase Dashboard." }, data: null };
      }

      setLoading(false);
      return { error: null, data };
    } catch (err) {
      console.error('Unexpected error in Google Sign In:', err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setLoading(false);
      return { error: { message: errorMessage }, data: null };
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const redirectUrl = Capacitor.isNativePlatform()
        ? "com.pawmood.app://google-auth"
        : `${window.location.origin}/`;

      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Capacitor.isNativePlatform(),
        },
      });

      if (signInError) {
        console.error('Apple Sign in error detail:', {
          message: signInError.message,
          status: signInError.status,
          name: signInError.name
        });
        setError(signInError.message);
        setLoading(false);
        return { error: signInError, data: null };
      }

      if (data?.url) {
        await Browser.open({ url: data.url });
      }

      setLoading(false);
      return { error: null, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setLoading(false);
      return { error: { message: errorMessage }, data: null };
    }
  }, []);

  return {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!session,
    signUp,
    signIn,
    signOut,
    resetPassword,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
  };
}
