import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// remove the orders created while testing
const { data: removed } = await db.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000').select('order_no');
console.log('test orders removed:', removed?.map((o) => o.order_no).join(', ') || 'none');

// the category name was changed during an earlier test
await db
  .from('categories')
  .update({ name: 'EV Cables & Connectors' })
  .eq('slug', 'ev-cables-and-connectors');
console.log('category name restored');

const [{ count: orders }, { count: products }, { count: categories }] = await Promise.all([
  db.from('orders').select('id', { count: 'exact', head: true }),
  db.from('products').select('id', { count: 'exact', head: true }),
  db.from('categories').select('id', { count: 'exact', head: true }),
]);

console.log(`final state: ${products} products, ${categories} categories, ${orders} orders`);
