import { NextResponse } from 'next/server';
import { createOrder, OrderError } from '@/lib/orders-server';

export const dynamic = 'force-dynamic';

/**
 * Order creation. The browser sends product slugs and quantities only — all
 * pricing is recomputed server-side in createOrder().
 */
export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    const result = await createOrder(payload);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[api/orders] unexpected', error);
    return NextResponse.json({ error: 'Could not place the order.' }, { status: 500 });
  }
}
