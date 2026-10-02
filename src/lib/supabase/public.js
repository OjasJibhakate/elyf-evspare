import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Cookie-less client for public catalogue reads.
 *
 * The storefront only ever reads content that anonymous visitors are allowed to
 * see (enforced by row level security), so there is no session to carry. That
 * keeps these reads cacheable on the server instead of tying them to a user.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function supabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
