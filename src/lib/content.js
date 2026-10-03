import { unstable_cache } from 'next/cache';
import { createPublicClient, supabaseConfigured } from '@/lib/supabase/public';

/**
 * Editable home-page content.
 *
 * Stored in `content_blocks` (key + JSON) and edited from /admin/content.
 * The defaults below mirror the original hardcoded page, so the storefront
 * looks identical before the owner changes anything.
 */

export const contentDefaults = {
  hero: {
    badge: '786+ SKUs in stock right now',
    heading: 'Every EV spare part,',
    heading_accent: 'at wholesale rates.',
    subheading:
      'Controllers, motors, chargers, brakes, body kits and every small fitting — sourced from verified manufacturers and shipped across India with a GST invoice.',
    primary_cta_label: 'Browse categories',
    primary_cta_href: '/categories',
    secondary_cta_label: 'Search parts',
    secondary_cta_href: '/search?q=charger',
  },
  bulk_banner: {
    chip: 'For dealers, workshops & fleet owners',
    heading: 'Buying in bulk? Get a custom quote today.',
    body:
      "Send us your parts list on WhatsApp and we'll confirm availability, best rates and dispatch timeline within the same working day.",
    cta_label: 'Get a quote on WhatsApp',
  },
  trust_points: {
    items: [
      { title: 'Genuine parts only', note: 'Sourced from verified manufacturers' },
      { title: 'Wholesale pricing', note: 'Direct rates for dealers and workshops' },
      { title: 'Pan-India delivery', note: 'Dispatched within 24–48 hours' },
      { title: 'GST invoice', note: 'Proper billing for business purchases' },
    ],
  },
  sections: {
    items: [
      { key: 'hero', label: 'Hero banner', enabled: true },
      { key: 'categories', label: 'Shop by category', enabled: true },
      { key: 'bestsellers', label: 'Best sellers', enabled: true },
      { key: 'bulk_banner', label: 'Bulk quote banner', enabled: true },
      { key: 'new_arrivals', label: 'Newly listed', enabled: true },
    ],
  },
  // Manually picked products. Empty means "choose automatically", so the home
  // page is never blank before the owner curates it.
  hero_products: { items: [] },
  featured_products: { items: [] },
};

export const PICKER_LIMITS = {
  hero_products: 4,
  featured_products: 8,
};

function mergeBlock(key, data) {
  const base = contentDefaults[key] || {};
  if (!data || typeof data !== 'object') return base;
  return { ...base, ...data };
}

async function loadContent() {
  if (!supabaseConfigured()) return contentDefaults;

  const supabase = createPublicClient();
  const { data, error } = await supabase.from('content_blocks').select('key, data, is_active');
  if (error || !data?.length) return contentDefaults;

  const byKey = new Map(data.filter((r) => r.is_active !== false).map((r) => [r.key, r.data]));

  const trust = mergeBlock('trust_points', byKey.get('trust_points'));
  if (!Array.isArray(trust.items) || trust.items.length === 0) {
    trust.items = contentDefaults.trust_points.items;
  }

  const sections = mergeBlock('sections', byKey.get('sections'));
  if (!Array.isArray(sections.items) || sections.items.length === 0) {
    sections.items = contentDefaults.sections.items;
  }

  const heroProducts = mergeBlock('hero_products', byKey.get('hero_products'));
  const featuredProducts = mergeBlock('featured_products', byKey.get('featured_products'));

  return {
    hero: mergeBlock('hero', byKey.get('hero')),
    bulk_banner: mergeBlock('bulk_banner', byKey.get('bulk_banner')),
    trust_points: trust,
    sections,
    hero_products: { items: Array.isArray(heroProducts.items) ? heroProducts.items : [] },
    featured_products: {
      items: Array.isArray(featuredProducts.items) ? featuredProducts.items : [],
    },
  };
}

export const getContent = unstable_cache(loadContent, ['elyf-content'], {
  revalidate: 300,
  tags: ['content'],
});

export async function getPages() {
  if (!supabaseConfigured()) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('pages')
    .select('slug, title, body, is_active')
    .order('slug');

  if (error || !data) return [];
  return data;
}

export async function getPage(slug) {
  if (!supabaseConfigured()) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('pages')
    .select('slug, title, body, is_active')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data?.body) return null;
  return data;
}
