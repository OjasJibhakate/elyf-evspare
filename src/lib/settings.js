import { unstable_cache } from 'next/cache';
import { settingsDefaults, normaliseWhatsapp } from '@/lib/settings-shared';
import { createPublicClient, supabaseConfigured } from '@/lib/supabase/public';

export { settingsDefaults, gstRateFor } from '@/lib/settings-shared';

/**
 * Store settings live in the `site_settings` table (single row, id = 1) and are
 * edited from /admin/settings. Anything missing falls back to the values in
 * src/lib/config.js, so the storefront keeps working before the row exists.
 */

async function loadSettings() {
  const fallback = settingsDefaults;
  if (!supabaseConfigured()) return fallback;

  const supabase = createPublicClient();
  const { data, error } = await supabase.from('site_settings').select('data').eq('id', 1).single();
  if (error || !data?.data) return fallback;

  const d = data.data;
  const whatsapp = normaliseWhatsapp(d.whatsapp) || fallback.store.whatsapp;
  const shipping = Array.isArray(d.shipping) && d.shipping.length ? d.shipping : fallback.shipping;
  const payments = Array.isArray(d.payments) && d.payments.length ? d.payments : fallback.payments;

  return {
    store: {
      name: d.store_name || fallback.store.name,
      tagline: d.tagline || fallback.store.tagline,
      phone: d.phone || fallback.store.phone,
      phoneRaw: whatsapp,
      whatsapp,
      email: d.email || fallback.store.email,
      address: d.address || fallback.store.address,
    },
    gst: {
      default: Number(d.gst_default_rate ?? fallback.gst.default),
      charger: Number(d.gst_charger_rate ?? fallback.gst.charger),
    },
    shipping: shipping.map((m) => ({ ...m, enabled: m.enabled !== false })),
    payments,
    trustPoints: fallback.trustPoints,
    storeOpen: d.store_open !== false,
  };
}

export const getSettings = unstable_cache(loadSettings, ['elyf-settings'], {
  revalidate: 300,
  tags: ['settings'],
});
