/**
 * Clears test data: orders created while testing, and the category name that an
 * earlier test changed. Also lists any throwaway accounts.
 *
 *   node scripts/cleanup-demo.mjs           # delete every order
 *   node scripts/cleanup-demo.mjs --list    # just show them first
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnv, confirmTarget, assertConfigured } from './_env.mjs';

const listOnly = process.argv.includes('--list');

const loaded = loadEnv();
assertConfigured(loaded);

const db = createClient(loaded.url, loaded.key, { auth: { persistSession: false } });

if (listOnly) {
  const { data: orders } = await db
    .from('orders')
    .select('order_no, customer_id, customer_name, customer_phone, total, status, created_at')
    .order('created_at', { ascending: false });

  console.log(`target: ${loaded.url}\n`);
  if (!orders?.length) {
    console.log('no orders in the database.');
  } else {
    console.log(`${orders.length} order(s):\n`);
    for (const o of orders) {
      console.log(
        `  ${o.order_no}  ${o.status.padEnd(9)} ₹${String(o.total).padStart(10)}  ` +
          `${o.customer_name} (${o.customer_phone})  ` +
          `${o.customer_id ? 'linked to an account' : 'GUEST'}`,
      );
      console.log(`      ${new Date(o.created_at).toLocaleString('en-IN')}`);
    }
  }
  process.exit(0);
}

if (!(await confirmTarget(loaded))) {
  console.log('Cancelled.');
  process.exit(0);
}

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
