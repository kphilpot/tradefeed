// ═══════════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ═══════════════════════════════════════════════════════════════════
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file
// to connect to a real Supabase project.
//
// Database schema:
//   profiles: id, email, name, handle, role (superadmin|verified_gc|verified_sub|free),
//             verified, approved, trade, location, license_number, bio, avatar_color,
//             consent_lead_sharing boolean, created_at
//   posts: id, author_id, content, image_url, poll_options jsonb, tags text[],
//          likes int, reposts int, replies int, created_at
//   ghost_accounts: id, name, handle, avatar_color, trade, is_active, last_posted_at
//   seeded_questions: id, source, content, engagement_score, used boolean, created_at
//   leads: id, email, name, trade, location, type (job_seeker|contact_request), created_at
//   jobs: id, title, company, location, type, pay, tags text[], verified boolean, created_at
//   newsletters: id, date, title, summary, preview, full text, published boolean, created_at
// ═══════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Returns null if env vars not set — app falls back to mock data
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConnected = Boolean(supabase);

// ─── AUTH HELPERS ────────────────────────────────────────────────

export async function signIn(email, password) {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured — using mock auth' } };
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email, password, metadata = {}) {
  if (!supabase) return { data: null, error: { message: 'Supabase not configured — using mock auth' } };
  return supabase.auth.signUp({ email, password, options: { data: metadata } });
}

export async function signOut() {
  if (!supabase) return;
  return supabase.auth.signOut();
}

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}

// ─── PROFILE HELPERS ─────────────────────────────────────────────

export async function getProfile(userId) {
  if (!supabase) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return data;
}

export async function upsertProfile(profile) {
  if (!supabase) return null;
  const { data } = await supabase.from('profiles').upsert(profile).select().single();
  return data;
}

// ─── POSTS HELPERS ───────────────────────────────────────────────

export async function fetchPosts({ limit = 20, offset = 0 } = {}) {
  if (!supabase) return null;
  const { data } = await supabase
    .from('posts')
    .select('*, profiles(name, handle, avatar_color, verified)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  return data;
}

export async function createPost(post) {
  if (!supabase) return null;
  const { data } = await supabase.from('posts').insert(post).select().single();
  return data;
}

// ─── LEADS HELPERS ───────────────────────────────────────────────

export async function captureLead(lead) {
  if (!supabase) return null;
  const { data } = await supabase.from('leads').insert(lead).select().single();
  return data;
}
