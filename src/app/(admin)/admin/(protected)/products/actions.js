'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, requireStaff } from '@/lib/supabase/server';
import { productSchema, fieldErrors, slugify } from '@/lib/validation';

function emptyToNull(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed === '' ? null : trimmed;
}

function parseList(value) {
  if (!value) return [];
  const str = String(value).trim();
  if (!str) return [];
  if (str.startsWith('[')) {
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  // plain comma separated string from a text input
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function readForm(formData) {
  return {
    name: formData.get('name'),
    slug: formData.get('slug'),
    category_id: emptyToNull(formData.get('category_id')),
    price: formData.get('price'),
    mrp: formData.get('mrp') || '',
    unit: formData.get('unit') || 'PCS',
    moq: formData.get('moq') || 1,
    stock: formData.get('stock') || 0,
    part_no: formData.get('part_no') || '',
    description: formData.get('description') || '',
    images: parseList(formData.get('images')),
    tags: parseList(formData.get('tags')),
    is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
  };
}

function refreshStorefront() {
  revalidateTag('catalog');
  revalidatePath('/', 'layout');
}

export async function createProduct(prevState, formData) {
  const session = await requireStaff();
  if (!session) return { error: 'Not authorised.' };

  const parsed = productSchema.safeParse(readForm(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const payload = parsed.data;
  if (!payload.slug) payload.slug = slugify(payload.name);

  const supabase = createClient();
  const { error } = await supabase.from('products').insert({
    ...payload,
    part_no: payload.part_no || null,
  });

  if (error) {
    if (error.code === '23505') {
      return { fieldErrors: { slug: 'Another product already uses this slug.' } };
    }
    console.error('[admin] createProduct', error);
    return { error: 'Could not save the product. Please try again.' };
  }

  refreshStorefront();
  redirect('/admin/products?created=1');
}

export async function updateProduct(id, prevState, formData) {
  const session = await requireStaff();
  if (!session) return { error: 'Not authorised.' };

  const parsed = productSchema.safeParse(readForm(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const payload = parsed.data;
  const supabase = createClient();

  const { error } = await supabase
    .from('products')
    .update({ ...payload, part_no: payload.part_no || null })
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      return { fieldErrors: { slug: 'Another product already uses this slug.' } };
    }
    console.error('[admin] updateProduct', error);
    return { error: 'Could not save the product. Please try again.' };
  }

  refreshStorefront();
  redirect('/admin/products?saved=1');
}

export async function setProductActive(id, isActive) {
  const session = await requireStaff();
  if (!session) return { error: 'Not authorised.' };

  const supabase = createClient();
  const { error } = await supabase.from('products').update({ is_active: isActive }).eq('id', id);
  if (error) return { error: 'Could not update the product.' };

  refreshStorefront();
  revalidatePath('/admin/products');
  return { ok: true };
}

export async function deleteProduct(id) {
  const session = await requireStaff();
  if (!session) return { error: 'Not authorised.' };

  const supabase = createClient();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return { error: 'Could not delete the product.' };

  refreshStorefront();
  revalidatePath('/admin/products');
  return { ok: true };
}

/**
 * Bulk price change for a category (or the whole catalogue).
 * percent = 5 raises prices by 5%, -10 drops them.
 */
export async function bulkAdjustPrices({ categoryId, percent }) {
  const session = await requireStaff();
  if (!session) return { error: 'Not authorised.' };

  const pct = Number(percent);
  if (!Number.isFinite(pct) || pct === 0 || Math.abs(pct) > 90) {
    return { error: 'Enter a percentage between -90 and 90.' };
  }

  const supabase = createClient();
  const PAGE = 500;
  let from = 0;
  let updated = 0;

  for (;;) {
    let query = supabase
      .from('products')
      .select('id, price')
      .order('id')
      .range(from, from + PAGE - 1);
    if (categoryId) query = query.eq('category_id', categoryId);

    const { data, error } = await query;
    if (error) return { error: 'Could not read products.' };
    if (!data.length) break;

    for (const row of data) {
      const next = Math.max(0, Math.round(Number(row.price) * (1 + pct / 100) * 100) / 100);
      const { error: updateError } = await supabase
        .from('products')
        .update({ price: next })
        .eq('id', row.id);
      if (updateError) return { error: 'Could not update prices.' };
      updated += 1;
    }

    if (data.length < PAGE) break;
    from += PAGE;
  }

  refreshStorefront();
  revalidatePath('/admin/products');
  return { ok: true, updated };
}
