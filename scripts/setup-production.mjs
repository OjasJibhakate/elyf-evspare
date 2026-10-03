/**
 * Runs the whole production setup in one go, after you have created the
 * Supabase project and put its three keys in .env.production.local.
 *
 *   node scripts/setup-production.mjs ojas@example.com "your-strong-password" "Ojas"
 *
 * It checks the connection, reports what is already there, seeds the catalogue,
 * creates the admin account and lists what is left to do by hand.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { loadEnv, confirmTarget, assertConfigured, root } from './_env.mjs';

const [, , email, password, fullName] = process.argv;

const loaded = loadEnv();
assertConfigured(loaded);

console.log('\n=== Checking the connection ===');
if (!(await confirmTarget(loaded))) {
  console.log('Cancelled.');
  process.exit(0);
}

const db = createClient(loaded.url, loaded.key, { auth: { persistSession: false } });

// Are the tables there? (migrations pushed?)
const { error: tableError } = await db.from('profiles').select('id').limit(1);
if (tableError) {
  console.error(
    `\nThe tables are not there yet.\n\n` +
      `Run these two commands first, then try again:\n` +
      `  npx supabase login\n` +
      `  npx supabase link --project-ref <your-project-ref>\n` +
      `  npx supabase db push\n\n` +
      `Underlying error: ${tableError.message}\n`,
  );
  process.exit(1);
}
console.log('Tables found.');

const [{ count: products }, { count: categories }, { count: admins }] = await Promise.all([
  db.from('products').select('id', { count: 'exact', head: true }),
  db.from('categories').select('id', { count: 'exact', head: true }),
  db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
]);

console.log(`Current state: ${products} products, ${categories} categories, ${admins} admin(s)`);

if (categories === 0) {
  console.log('\n=== Seeding the catalogue ===');
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync(process.execPath, [join(root, 'scripts/seed-db.mjs'), '--yes'], {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error('Seeding failed — fix that first.');
    process.exit(1);
  }
} else {
  console.log('Catalogue already present — skipping seeding.');
}

if (email && password) {
  console.log('\n=== Creating the admin account ===');
  const { spawnSync } = await import('node:child_process');
  spawnSync(process.execPath, [join(root, 'scripts/create-admin.mjs'), email, password, fullName || ''], {
    stdio: 'inherit',
  });
}

console.log('\n=== Next steps by hand ===');
console.log('  1. Vercel → Settings → Environment Variables: add the three Supabase keys');
console.log('     (Production, Preview and Development), then redeploy.');
console.log('  2. Vercel → Settings → Deployment Protection → turn Vercel Authentication OFF');
console.log('     or your client will see a Vercel login wall instead of the store.');
console.log('  3. Verify the live site:');
console.log('       $env:TEST_BASE_URL="https://your-site.vercel.app"');
console.log('       node scripts/security-test.mjs');
console.log('       node scripts/order-test.mjs');
console.log('  4. Sign in at /admin/login and place one test order end to end.\n');
