/**
 * Reproduces the order insert against whatever database .env points at, and
 * prints the real Postgres error.
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './_env.mjs';

const loaded = loadEnv();
console.log(`target: ${loaded.url}\n`);

const db = createClient(loaded.url, loaded.key, { auth: { persistSession: false } });

const { data: product } = await db
  .from('products')
  .select('slug, name, price, moq, unit')
  .eq('is_active', true)
  .gt('price', 100)
  .limit(1)
  .single();

console.log('product:', product?.name, product?.price);

const payload = {
  order_no: `DIAG-${Date.now().toString(36).toUpperCase()}`,
  customer_name: 'Diagnostic',
  customer_phone: '9876500099',
  items: [{ slug: product.slug, qty: product.moq, price: product.price }],
  subtotal: product.price * product.moq,
  gst: 0,
  shipping: 10,
  total: product.price * product.moq + 10,
  status: 'new',
};

const { data, error } = await db.from('orders').insert(payload).select('id, order_no').single();

if (error) {
  console.log('\nINSERT FAILED');
  console.log('  code    :', error.code);
  console.log('  message :', error.message);
  console.log('  details :', error.details);
  console.log('  hint    :', error.hint);
  process.exit(1);
}

console.log('\ninsert OK:', data.order_no);

// clean up
await db.from('orders').delete().eq('id', data.id);
console.log('cleaned up.');
