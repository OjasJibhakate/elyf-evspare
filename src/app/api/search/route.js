import { NextResponse } from 'next/server';
import { quickSearch } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const q = new URL(request.url).searchParams.get('q') || '';
  return NextResponse.json({ results: await quickSearch(q, 6) });
}
