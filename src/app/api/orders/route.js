import { NextResponse } from 'next/server';
import { createOrder, OrderError } from '@/lib/orders-server';
import { getSessionProfile } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Order creation. The browser sends product slugs and quantities only — all
 * pricing is recomputed server-side in createOrder().
 *
 * The customer is read from the session cookie. If nobody is signed in the
 * order is stored as a guest order, which is still allowed.
 */
export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  let userId = null;
  try {
    const session = await getSessionProfile();
    userId = session?.user?.id || null;
  } catch (e) {
    // A failure to read the session must not block a guest from ordering.
    console.error('[api/orders] session lookup failed', e);
  }

  try {
    const result = await createOrder(payload, userId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[api/orders] unexpected', error);
    return NextResponse.json({ error: 'Could not place the order.' }, { status: 500 });
  }
}
