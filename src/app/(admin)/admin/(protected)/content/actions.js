'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient, requireStaff } from '@/lib/supabase/server';
import { contentBlockSchema, fieldErrors } from '@/lib/validation';

function text(formData, key, fallback = '') {
  const value = formData.get(key);
  return value === null ? fallback : String(value);
}

export async function saveHomeContent(prevState, formData) {
  const session = await requireStaff();
  if (!session) return { error: 'Not authorised.' };

  const blocks = [
    {
      key: 'hero',
      type: 'hero',
      position: 0,
      is_active: true,
      data: {
        badge: text(formData, 'hero_badge'),
        heading: text(formData, 'hero_heading'),
        heading_accent: text(formData, 'hero_heading_accent'),
        subheading: text(formData, 'hero_subheading'),
        primary_cta_label: text(formData, 'hero_primary_label'),
        primary_cta_href: text(formData, 'hero_primary_href'),
        secondary_cta_label: text(formData, 'hero_secondary_label'),
        secondary_cta_href: text(formData, 'hero_secondary_href'),
      },
    },
    {
      key: 'bulk_banner',
      type: 'banner',
      position: 1,
      is_active: true,
      data: {
        chip: text(formData, 'banner_chip'),
        heading: text(formData, 'banner_heading'),
        body: text(formData, 'banner_body'),
        cta_label: text(formData, 'banner_cta_label'),
      },
    },
    {
      key: 'trust_points',
      type: 'trust',
      position: 2,
      is_active: true,
      data: {
        items: [0, 1, 2, 3].map((i) => ({
          title: text(formData, `trust_${i}_title`),
          note: text(formData, `trust_${i}_note`),
        })),
      },
    },
    {
      key: 'sections',
      type: 'sections',
      position: 3,
      is_active: true,
      data: {
        items: ['hero', 'categories', 'bestsellers', 'bulk_banner', 'new_arrivals'].map((key) => ({
          key,
          label: text(formData, `section_${key}_label`, key),
          enabled: formData.get(`section_${key}_enabled`) === 'on',
        })),
      },
    },
  ];

  for (const block of blocks) {
    const parsed = contentBlockSchema.safeParse(block);
    if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('content_blocks')
    .upsert(blocks, { onConflict: 'key' });

  if (error) {
    console.error('[admin] saveHomeContent', error);
    return { error: 'Could not save the home page content. Please try again.' };
  }

  revalidateTag('content');
  revalidatePath('/', 'layout');
  return { ok: true, savedAt: new Date().toISOString() };
}
