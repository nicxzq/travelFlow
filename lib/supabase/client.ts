import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Whether runtime env variables are present.
 *
 * Keep this check side-effect free so tests/build tooling can import the module
 * without crashing when env is not configured.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Create a cookie-backed Supabase browser client.
 * Throws only when the function is called, not at module import time.
 *
 * Deliberately not memoised: a module-level singleton outlives the request in a
 * long-running server process and can leak one user's session into another's.
 */
export function createSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
