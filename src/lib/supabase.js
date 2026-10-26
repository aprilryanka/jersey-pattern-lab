import { createClient } from '@supabase/supabase-js';

// Publishable key memang aman di sisi browser; keamanan data dijaga oleh RLS di database.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://mwprkmudrelyxevdsncr.supabase.co';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_jciBM3fo-VGTkDySvK-rtQ_ShIUhDlf';
export const sb = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });

let _me = null;
let _meAt = 0;

/** Sesi + profil user saat ini (null bila belum masuk). Di-cache 20 detik. */
export async function getMe(force = false) {
  if (!force && _me !== null && Date.now() - _meAt < 20000) return _me;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { _me = null; _meAt = Date.now(); return null; }
  const { data: profile } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
  _me = { user: session.user, profile: profile || { role: 'user', plan: 'free' } };
  _meAt = Date.now();
  return _me;
}

/** Plan efektif: Pro hanya bila plan_until masih berlaku (admin selalu Pro). */
export function planOf(me) {
  if (!me) return 'guest';
  const p = me.profile;
  if (p.role === 'admin') return 'pro';
  if (p.plan && p.plan !== 'free' && p.plan_until && new Date(p.plan_until) > new Date()) return 'pro';
  return 'free';
}
export const isPro = me => planOf(me) === 'pro';
export const isAdmin = me => !!me && me.profile.role === 'admin';

let _settings = null;
export async function getSettings() {
  if (_settings) return _settings;
  const { data } = await sb.from('settings').select('key,value');
  _settings = Object.fromEntries((data || []).map(r => [r.key, r.value]));
  return _settings;
}

export async function signOut() {
  await sb.auth.signOut();
  _me = null;
  location.href = '/';
}
