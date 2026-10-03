import { NextResponse } from 'next/server';
import { getCatalog } from '@/lib/catalog';
import { supabaseConfigured } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';

/**
 * Reports where the live catalogue is actually coming from.
 *
 * If `source` says "bundled" while Supabase is configured, the database is
 * unreachable and the site is quietly serving the copy compiled into the build —
 * admin edits would appear to save and change nothing. Check this after every
 * deploy.
 *
 * Only public information is returned: the project host is already visible in
 * the browser bundle. No keys are ever included.
 */
export async function GET() {
  const catalog = await getCatalog();
  const configured = supabaseConfigured();

  let host = null;
  try {
    host = configured ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host : null;
  } catch {
    host = 'invalid-url';
  }

  const fellBack = configured && catalog.source !== 'supabase';

  return NextResponse.json(
    {
      ok: !fellBack,
      catalog: {
        source: catalog.source,
        products: catalog.products.length,
        categories: catalog.categories.length,
        updatedAt: catalog.updatedAt,
      },
      database: { configured, host },
      warning: fellBack
        ? 'Supabase is configured but unreachable — the storefront is serving the bundled copy from the build. Check the environment variables and the project URL.'
        : null,
      checkedAt: new Date().toISOString(),
    },
    { status: fellBack ? 503 : 200 },
  );
}
