'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient, requireStaff } from '@/lib/supabase/server';

export async function savePage(prevState, formData) {
  const session = await requireStaff();
  if (!session) return { error: 'Not authorised.' };

  const slug = String(formData.get('slug') || '').trim();
  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '');
  const isActive = formData.get('is_active') === 'on';

  if (!/^[a-z0-9-]{2,60}$/.test(slug)) {
    return { error: 'The web address may only contain lowercase letters, numbers and dashes.' };
  }
  if (!title) return { error: 'Give the page a title.' };
  if (body.length > 40000) return { error: 'That page is too long.' };

  const supabase = createClient();
  const { error } = await supabase
    .from('pages')
    .upsert({ slug, title, body, is_active: isActive }, { onConflict: 'slug' });

  if (error) {
    console.error('[admin] savePage', error);
    return { error: 'Could not save the page.' };
  }

  revalidateTag('content');
  revalidatePath('/', 'layout');
  return { ok: true, savedAt: new Date().toISOString() };
}
