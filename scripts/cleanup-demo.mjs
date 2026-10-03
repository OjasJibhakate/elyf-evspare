/**
 * Clears test data: orders created while testing, and the category name that an
 * earlier test changed. Also lists any throwaway accounts.
 *
 *   node scripts/cleanup-demo.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnv, confirmTarget, assertConfigured } from './_env.mjs';

const loaded = loadEnv();
assertConfigured(loaded);
if (!(await confirmTarget(loaded))) {
  console.log('Cancelled.');
  process.exit(0);
}

const db = createClient(loaded.url, loaded.key, { auth: { persistSession: false } });

const { data: removed } = await db
  .from('orders')
  .delete()
  .neq('id', '00000000-0000-0000-0000-000000000000')
  .select('order_no');
console.log('test orders removed:', removed?.map((o) => o.order_no).join(', ') || 'none');

await db
  .from('categories')
  .update({ name: 'EV Cables & Connectors' })
  .eq('slug', 'ev-cables-and-connectors');

const { data: users } = await db.auth.admin.listUsers({ perPage: 200 });
const testAccounts = (users?.users || []).filter(
  (u) => (u.email || '').includes('@example.test') || u.email === 'suresh@elyf.local',
);

if (testAccounts.length) {
  console.log('\nthrowaway accounts found (remove with scripts/cleanup-users.mjs):');
  for (const u of testAccounts) console.log('  ', u.email);
}

const [{ count: orders }, { count: products }, { count: categories }] = await Promise.all([
  db.from('orders').select('id', { count: 'exact', head: true }),
  db.from('products').select('id', { count: 'exact', head: true }),
  db.from('categories').select('id', { count: 'exact', head: true }),
]);

console.log(`\nfinal state: ${products} products, ${categories} categories, ${orders} orders`);
