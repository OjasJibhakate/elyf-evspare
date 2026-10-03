'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient, requireStaff } from '@/lib/supabase/server';
import { settingsSchema, fieldErrors } from '@/lib/validation';

function readForm(formData) {
  return {
    store_name: formData.get('store_name'),
    tagline: formData.get('tagline') || '',
    phone: formData.get('phone'),
    whatsapp: String(formData.get('whatsapp') || '').replace(/[^\d]/g, ''),
    email: formData.get('email'),
    address: formData.get('address') || '',
    gst_default_rate: formData.get('gst_default_rate'),
    gst_charger_rate: formData.get('gst_charger_rate'),
    store_open: formData.get('store_open') === 'on',
  };
}

export async function saveSettings(prevState, formData) {
  const session = await requireStaff();
  if (!session) return { error: 'Not authorised.' };

  const parsed = settingsSchema.safeParse(readForm(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const shipping = [0, 1].map((index) => ({
    id: index === 0 ? 'delivery' : 'pickup',
    label: String(formData.get(`shipping_${index}_label`) || (index === 0 ? 'Courier delivery' : 'Store pickup')),
    note: String(formData.get(`shipping_${index}_note`) || ''),
    rate: Number(formData.get(`shipping_${index}_rate`) || 0),
    freeAbove: Number(formData.get(`shipping_${index}_free_above`) || 0) || null,
    enabled: formData.get(`shipping_${index}_enabled`) === 'on',
  }));

  const payments = ['cod', 'upi', 'whatsapp'].map((id, index) => ({
    id,
    label: String(formData.get(`payment_${index}_label`) || id),
    note: String(formData.get(`payment_${index}_note`) || ''),
    enabled: formData.get(`payment_${index}_enabled`) === 'on',
  }));

  const supabase = createClient();
  const { error } = await supabase.from('site_settings').upsert(
    { id: 1, data: { ...parsed.data, shipping, payments } },
    { onConflict: 'id' },
  );

  if (error) {
    console.error('[admin] saveSettings', error);
    return { error: 'Could not save the settings. Please try again.' };
  }

  revalidateTag('settings');
  revalidateTag('catalog');
  revalidatePath('/', 'layout');
  return { ok: true, savedAt: new Date().toISOString() };
}
