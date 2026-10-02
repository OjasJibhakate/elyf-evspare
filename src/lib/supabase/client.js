import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser client — uses the publishable (anon) key only.
 * Row Level Security decides what this client can actually read or write,
 * so even a tampered browser session cannot exceed its role.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
