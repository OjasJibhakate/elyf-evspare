'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, requireStaff } from '@/lib/supabase/server';
import { categorySchema, fieldErrors } from '@/lib/validation';

function readForm(formData) {
  return {
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || '',
    image_url: formData.get('image_url') || '',
    image_focus: formData.get('image_focus') || null,
    position: formData.get('position') || 0,
    is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
  };
}

function refreshStorefront() {
  revalidateTag('catalog');
  revalidatePath('/', 'layout');
}

export async function saveCategory(id, prevState, formData) {
  const session = await requireStaff();
  if (!session) return { error: 'Not authorised.' };

  const parsed = categorySchema.safeParse(readForm(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = createClient();
  const query = id
    ? supabase.from('categories').update(parsed.data).eq('id', id)
    : supabase.from('categories').insert(parsed.data);

  const { error } = await query;
  if (error) {
    if (error.code === '23505') {
      return { fieldErrors: { slug: 'Another category already uses this slug.' } };
    }
    console.error('[admin] saveCategory', error);
    return { error: 'Could not save the category.' };
  }

  refreshStorefront();
  revalidatePath('/admin/categories');
  return { ok: true };
}

export async function setCategoryActive(id, isActive) {
  const session = await requireStaff();
  if (!session) return { error: 'Not authorised.' };

  const supabase = createClient();
  const { error } = await supabase.from('categories').update({ is_active: isActive }).eq('id', id);
  if (error) return { error: 'Could not update the category.' };

  refreshStorefront();
  revalidatePath('/admin/categories');
  return { ok: true };
}

export async function reorderCategory(id, direction) {
  const session = await requireStaff();
  if (!session) return { error: 'Not authorised.' };

  const supabase = createClient();
  const { data: rows, error } = await supabase
    .from('categories')
    .select('id, position')
    .order('position')
    .order('name');

  if (error || !rows?.length) return { error: 'Could not read categories.' };

  const index = rows.findIndex((r) => r.id === id);
  const swapWith = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= rows.length) return { ok: true };

  const a = rows[index];
  const b = rows[swapWith];

  await supabase.from('categories').update({ position: swapWith }).eq('id', a.id);
  await supabase.from('categories').update({ position: index }).eq('id', b.id);

  refreshStorefront();
  revalidatePath('/admin/categories');
  return { ok: true };
}

/**
 * Deleting a category never deletes products. The products are detached
 * (category_id becomes null) so nothing disappears from the catalogue by
 * accident — the admin is told how many will be left uncategorised first.
 */
export async function deleteCategory(id) {
  const session = await requireStaff();
  if (!session) return { error: 'Not authorised.' };

  const supabase = createClient();

  const { count, error: countError } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id);

  if (countError) return { error: 'Could not check the category.' };
  if (count && count > 0) {
    return {
      error: `This category still has ${count} product${count === 1 ? '' : 's'}. Move them to another category first.`,
    };
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) return { error: 'Could not delete the category.' };

  refreshStorefront();
  revalidatePath('/admin/categories');
  return { ok: true };
}

export async function moveProductsToCategory(fromId, toId) {
  const session = await requireStaff();
  if (!session) return { error: 'Not authorised.' };

  const supabase = createClient();
  const { error } = await supabase
    .from('products')
    .update({ category_id: toId })
    .eq('category_id', fromId);

  if (error) return { error: 'Could not move the products.' };

  refreshStorefront();
  revalidatePath('/admin/categories');
  return { ok: true };
}
