import { NextResponse } from 'next/server';
import { quickSearch } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export function GET(request) {
  const q = new URL(request.url).searchParams.get('q') || '';
  return NextResponse.json({ results: quickSearch(q, 6) });
}
