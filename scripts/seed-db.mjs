/**
 * Seeds the catalogue into Supabase.
 *
 *   node scripts/seed-db.mjs              # local database, no prompt
 *   node scripts/seed-db.mjs --yes        # remote without the confirmation
 *   node scripts/seed-db.mjs --reset      # delete existing products/categories first
 *
 * Safe to re-run: products and categories are upserted by slug.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { loadEnv, confirmTarget, assertConfigured, root } from './_env.mjs';

const loaded = loadEnv();
assertConfigured(loaded);
if (!(await confirmTarget(loaded))) {
  console.log('Cancelled.');
  process.exit(0);
}

const db = createClient(loaded.url, loaded.key, { auth: { persistSession: false } });
const reset = process.argv.includes('--reset');

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const products = JSON.parse(readFileSync(join(root, 'src/data/products.json'), 'utf8'));
const categories = JSON.parse(readFileSync(join(root, 'src/data/categories.json'), 'utf8'));

console.log(`Seeding ${categories.length} categories and ${products.length} products…`);

if (reset) {
  if (!loaded.isLocal && !process.argv.includes('--yes')) {
    console.error('Refusing to --reset a remote database without --yes');
    process.exit(1);
  }
  const { error } = await db.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
  const { error: catError } = await db.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (catError) throw catError;
  console.log('Cleared existing catalogue.');
}

// ---- categories -------------------------------------------------------------
const categoryRows = categories.map((c, index) => ({
  name: c.name,
  slug: c.slug || slugify(c.name),
  image_url: c.image || null,
  position: index,
  is_active: true,
}));

const { data: savedCategories, error: catError } = await db
  .from('categories')
  .upsert(categoryRows, { onConflict: 'slug' })
  .select('id, slug');

if (catError) throw catError;

const categoryIdBySlug = new Map(savedCategories.map((c) => [c.slug, c.id]));
console.log(`Categories ready: ${savedCategories.length}`);

// ---- products ---------------------------------------------------------------
const productRows = products.map((p) => ({
  name: p.name,
  slug: p.slug,
  category_id: categoryIdBySlug.get(p.category) || null,
  price: p.price,
  mrp: p.mrp || null,
  unit: p.unit,
  moq: p.moq,
  stock: p.stock,
  part_no: p.partNo || null,
  description: p.description || null,
  images: p.images || [],
  tags: p.tags || [],
  is_active: true,
  position: 0,
}));

let inserted = 0;
const CHUNK = 200;
for (let i = 0; i < productRows.length; i += CHUNK) {
  const chunk = productRows.slice(i, i + CHUNK);
  const { error } = await db.from('products').upsert(chunk, { onConflict: 'slug' });
  if (error) throw error;
  inserted += chunk.length;
  process.stdout.write(`  ${inserted}/${productRows.length}\r`);
}

console.log(`\nDone. ${inserted} products in Supabase.`);

// ---- settings + starter content --------------------------------------------
const { error: settingsError } = await db.from('site_settings').upsert(
  {
    id: 1,
    data: {
      store_name: 'ELYF EVSPARE',
      tagline: 'Electric Vehicle Spare Parts',
      phone: '+91 93258 80128',
      whatsapp: '919325880128',
      email: 'ojasjibhakate2006@gmail.com',
      address: 'India',
      gst_default_rate: 0.18,
      gst_charger_rate: 0.05,
      store_open: true,
    },
  },
  { onConflict: 'id' },
);
if (settingsError) throw settingsError;

const { error: blockError } = await db.from('content_blocks').upsert(
  [
    {
      key: 'hero',
      type: 'hero',
      position: 0,
      is_active: true,
      data: {
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
    },
    {
      key: 'bulk_banner',
      type: 'banner',
      position: 1,
      is_active: true,
      data: {
        chip: 'For dealers, workshops & fleet owners',
        heading: 'Buying in bulk? Get a custom quote today.',
        body:
          "Send us your parts list on WhatsApp and we'll confirm availability, best rates and dispatch timeline within the same working day.",
        cta_label: 'Get a quote on WhatsApp',
      },
    },
    {
      key: 'trust_points',
      type: 'trust',
      position: 2,
      is_active: true,
      data: {
        items: [
          { title: 'Genuine parts only', note: 'Sourced from verified manufacturers' },
          { title: 'Wholesale pricing', note: 'Direct rates for dealers and workshops' },
          { title: 'Pan-India delivery', note: 'Dispatched within 24–48 hours' },
          { title: 'GST invoice', note: 'Proper billing for business purchases' },
        ],
      },
    },
    {
      key: 'sections',
      type: 'sections',
      position: 3,
      is_active: true,
      data: {
        items: [
          { key: 'hero', label: 'Hero banner', enabled: true },
          { key: 'categories', label: 'Shop by category', enabled: true },
          { key: 'bestsellers', label: 'Best sellers', enabled: true },
          { key: 'bulk_banner', label: 'Bulk quote banner', enabled: true },
          { key: 'new_arrivals', label: 'Newly listed', enabled: true },
        ],
      },
    },
    { key: 'hero_products', type: 'products', position: 4, is_active: true, data: { items: [] } },
    { key: 'featured_products', type: 'products', position: 5, is_active: true, data: { items: [] } },
  ],
  { onConflict: 'key' },
);
if (blockError) throw blockError;

const { error: pagesError } = await db.from('pages').upsert(
  [
    {
      slug: 'terms',
      title: 'Terms & conditions',
      is_active: true,
      body: 'Prices are exclusive of GST unless stated otherwise.\n\nMinimum order quantities apply per item.\n\nOrders are confirmed on WhatsApp before dispatch.',
    },
    {
      slug: 'shipping',
      title: 'Shipping & returns',
      is_active: true,
      body: 'Orders confirmed before 4pm are packed the same day.\n\nReport damaged parts within 48 hours with photos.',
    },
  ],
  { onConflict: 'slug' },
);
if (pagesError) throw pagesError;

console.log('Settings, homepage content and pages seeded.');
