'use server';

import { createClient, requireStaff } from '@/lib/supabase/server';

/**
 * Resolves selected slugs into display rows for the home-page product picker.
 * The search itself lives at /api/admin/product-search (easier to verify).
 */

/** Turns a list of slugs into display rows so the picker can render labels. */
export async function resolvePickerProducts(slugs) {
  const session = await requireStaff();
  if (!session) return { results: [] };

  const list = (Array.isArray(slugs) ? slugs : []).filter(Boolean).slice(0, 20);
  if (!list.length) return { results: [] };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select('slug, name, price, unit, part_no, images')
    .in('slug', list);

  if (error) return { results: [] };

  const bySlug = new Map((data || []).map((p) => [p.slug, p]));

  return {
    results: list
      .map((slug) => bySlug.get(slug))
      .filter(Boolean)
      .map((p) => ({
        slug: p.slug,
        name: p.name,
        price: Number(p.price),
        unit: p.unit,
        partNo: p.part_no || '',
        image: Array.isArray(p.images) ? p.images[0] : null,
      })),
  };
}
