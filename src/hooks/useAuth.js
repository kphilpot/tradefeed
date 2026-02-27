// ═══════════════════════════════════════════════════════════════════
// useAuth — Auth state hook
//
// When VITE_SUPABASE_URL is set: uses real Supabase Auth.
// Without it: falls back to mock auth so the app works without a backend.
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConnected, signIn, signUp, signOut, getProfile } from "../lib/supabase.js";

// Mock users for local dev / demo
const MOCK_USERS = {
  superadmin: { name: "Korey Philpot", handle: "@koreyphilpot", role: "superadmin", verified: true, avatarColor: "#FFD600" },
  verified:   { name: "Mike R.", handle: "@miker_concrete", role: "verified_sub", verified: true, avatarColor: "#FF6B2B" },
  free:       { name: "Guest User", handle: "@guest", role: "free", verified: false, avatarColor: "#0057FF" },
};

export function useAuth() {
  const [user, setUser] = useState(null);       // profile object
  const [session, setSession] = useState(null); // Supabase session (or null)
  const [loading, setLoading] = useState(isSupabaseConnected);

  // ── Supabase: listen to auth state changes ──────────────────────
  useEffect(() => {
    if (!isSupabaseConnected) return;

    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadProfile(data.session.user.id);
      else setLoading(false);
    });

    // Subscribe to changes (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) loadProfile(session.user.id);
      else { setUser(null); setLoading(false); }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    setLoading(true);
    const profile = await getProfile(userId);
    if (profile) setUser(profile);
    setLoading(false);
  }

  // ── Login ────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    if (!isSupabaseConnected) {
      // Mock login: admin email → superadmin, any other → verified_sub
      const mock = (email.toLowerCase().includes("korey") || email === "admin@tradefeed.com")
        ? MOCK_USERS.superadmin
        : MOCK_USERS.verified;
      setUser(mock);
      return { error: null };
    }

    const { data, error } = await signIn(email, password);
    if (error) return { error };
    // Profile loads via onAuthStateChange
    return { error: null };
  }, []);

  // ── Signup ───────────────────────────────────────────────────────
  const signup = useCallback(async ({ email, password, name, role, avatarColor = "#0057FF" }) => {
    if (!isSupabaseConnected) {
      const isVerified = role === "verified_sub" || role === "verified_gc";
      setUser({
        name, role,
        handle: "@" + name.toLowerCase().replace(/\s/g, ""),
        verified: isVerified,
        avatarColor,
      });
      return { error: null, pendingVerification: isVerified };
    }

    const { data, error } = await signUp(email, password, { name, role, avatar_color: avatarColor });
    if (error) return { error };
    return { error: null, pendingVerification: role === "verified_sub" || role === "verified_gc" };
  }, []);

  // ── Logout ───────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (isSupabaseConnected) await signOut();
    setUser(null);
    setSession(null);
  }, []);

  const isVerifiedUser = user?.role === "verified_sub" || user?.role === "verified_gc" || user?.role === "superadmin";
  const isSuperAdmin   = user?.role === "superadmin";

  return { user, session, loading, login, signup, logout, isVerifiedUser, isSuperAdmin };
}
