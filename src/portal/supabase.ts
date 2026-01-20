import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is not set');
    if (!supabaseAnonKey) throw new Error('VITE_SUPABASE_ANON_KEY is not set');
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}

export async function login(email: string, password: string) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  const sb = getSupabase();
  await sb.auth.signOut();
}
