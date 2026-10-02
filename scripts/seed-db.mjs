/**
 * Seeds the catalogue into Supabase from the bundled JSON files.
 *
 *   node scripts/seed-db.mjs            # uses .env.local
 *   node scripts/seed-db.mjs --reset    # deletes existing products/categories first
 *
 * Safe to re-run: products are upserted by slug.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

function loadEnv() {
  const file = join(root, '.env.local');
  const env = {};
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  } catch (e) {
    /* fall back to process.env */
  }
  return { ...env, ...process.env };
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
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
