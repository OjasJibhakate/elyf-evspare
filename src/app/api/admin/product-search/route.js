import { NextResponse } from 'next/server';
import { createClient, requireStaff } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Product search for the admin home-page picker.
 * Staff only, minimum 2 characters, hard limit of 10 rows — so a stolen session
 * cannot use it to dump the catalogue.
 */
export async function GET(request) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: 'not-authorised', results: [] }, { status: 401 });
  }

  const raw = new URL(request.url).searchParams.get('q') || '';
  const q = raw.trim().replace(/[%_\\]/g, '');
  if (q.length < 2) return NextResponse.json({ results: [] });

  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select('slug, name, price, unit, part_no, images')
    .eq('is_active', true)
    .or(`name.ilike.%${q}%,part_no.ilike.%${q}%`)
    .order('name')
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message, results: [] }, { status: 500 });
  }

  return NextResponse.json({
    results: (data || []).map((p) => ({
      slug: p.slug,
      name: p.name,
      price: Number(p.price),
      unit: p.unit,
      partNo: p.part_no || '',
      image: Array.isArray(p.images) ? p.images[0] : null,
    })),
  });
}
