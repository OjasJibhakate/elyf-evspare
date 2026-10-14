/**
 * Writes the store identity from src/lib/config.js into the live site_settings
 * row, leaving GST, shipping and payment settings alone.
 *
 *   node scripts/update-store-identity.mjs
 *
 * Use this after changing the shop name, phone numbers, email or address in
 * config.js — otherwise the people on the site read from the database and the
 * new details never appear.
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnv, confirmTarget, assertConfigured } from './_env.mjs';
import { store } from '../src/lib/config.js';

const loaded = loadEnv();
assertConfigured(loaded);
if (!(await confirmTarget(loaded))) {
  console.log('Cancelled.');
  process.exit(0);
}

const db = createClient(loaded.url, loaded.key, { auth: { persistSession: false } });

const { data: current, error: readError } = await db
  .from('site_settings')
  .select('data')
  .eq('id', 1)
  .maybeSingle();

if (readError) {
  console.error('Could not read the settings:', readError.message);
  process.exit(1);
}

const existing = current?.data || {};

console.log('\nBefore → after\n');
const next = {
  ...existing,
  store_name: store.name,
  tagline: store.tagline,
  phone: store.phone,
  phone2: store.phone2,
  whatsapp: store.whatsapp,
  email: store.email,
  address: store.address,
};

for (const key of ['store_name', 'tagline', 'phone', 'phone2', 'whatsapp', 'email', 'address']) {
  const before = existing[key] ?? '—';
  const after = next[key] ?? '—';
  console.log(`  ${key.padEnd(11)} ${before}${before === after ? '' : `  →  ${after}`}`);
}

// GST, shipping, payments, store_open and anything else are carried through
// untouched, so this cannot quietly reset the shop's tax or delivery rules.
const { error } = await db
  .from('site_settings')
  .upsert({ id: 1, data: next }, { onConflict: 'id' });

if (error) {
  console.error('\nSave failed:', error.message);
  process.exit(1);
}

console.log('\nSaved. The storefront picks this up within a few seconds.');
