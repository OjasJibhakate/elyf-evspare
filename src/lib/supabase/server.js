import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server client for Server Components, Server Actions and Route Handlers.
 * Reads the session from HTTP-only cookies, so page code can check the user
 * and their role without ever trusting the browser.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Called from a Server Component — the middleware refreshes the
            // session cookie instead, so this can be safely ignored.
          }
        },
      },
    },
  );
}

/** Returns the signed-in user plus their profile row, or null. */
export async function getSessionProfile() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, email, phone, business_name, gstin, is_blocked')
    .eq('id', user.id)
    .single();

  if (!profile || profile.is_blocked) return null;

  return { user, profile };
}

export async function requireStaff() {
  const session = await getSessionProfile();
  if (!session || !['admin', 'staff'].includes(session.profile.role)) return null;
  return session;
}

export async function requireAdmin() {
  const session = await getSessionProfile();
  if (!session || session.profile.role !== 'admin') return null;
  return session;
}
