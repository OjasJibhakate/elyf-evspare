import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role client. This key bypasses Row Level Security entirely.
 *
 * Rules for using it:
 *  - server-side only (imported via `server-only`, so a client component that
 *    imports this file fails the build instead of leaking the key)
 *  - never return raw query results to the browser without shaping them
 *  - only for things a user genuinely cannot do: guest order creation, guest
 *    order tracking by phone + order number, order status notifications
 */
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('The service role client must never run in the browser');
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase service role environment variables are missing');
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      // Next caches fetch() by default, which would serve a stale order after a
      // status change. Order data must always be live.
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  });
}
