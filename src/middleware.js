import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Refreshes the auth session cookie on every request and blocks /admin and
 * /account routes before they render.
 *
 * This is a convenience layer — every admin page and route handler still
 * re-checks the session and role on the server. Middleware alone is never the
 * lock, because a middleware matcher mistake would silently expose everything.
 */
const STAFF_ONLY = ['/admin'];
const SIGNED_IN_ONLY = ['/account'];

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not add logic between this call and the checks below — it must run on
  // every request so the session never goes stale mid-navigation.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (STAFF_ONLY.some((p) => pathname.startsWith(p))) {
    if (pathname === '/admin/login') return response;
    if (!user) {
      return NextResponse.redirect(new URL(`/admin/login?next=${encodeURIComponent(pathname)}`, request.url));
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_blocked')
      .eq('id', user.id)
      .single();
    if (!profile || profile.is_blocked || !['admin', 'staff'].includes(profile.role)) {
      return NextResponse.redirect(new URL('/admin/login?error=not-authorised', request.url));
    }
  }

  if (SIGNED_IN_ONLY.some((p) => pathname.startsWith(p))) {
    if (!user) {
      return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url));
    }
  }

  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
};
