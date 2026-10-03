/**
 * Order security tests — proves the server ignores client-supplied pricing.
 *
 *   node scripts/order-test.mjs
 *
 * Requires the app to be running (npm start) and the catalogue seeded.
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnv, assertConfigured } from './_env.mjs';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3200';

const loaded = loadEnv();
assertConfigured(loaded);

const db = createClient(loaded.url, loaded.key, { auth: { persistSession: false } });

let passed = 0;
let failed = 0;
function check(name, ok, detail = '') {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function postOrder(body) {
  const res = await fetch(`${BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

const { data: product } = await db
  .from('products')
  .select('slug, name, price, moq, unit')
  .eq('is_active', true)
  .gt('price', 100)
  .limit(1)
  .single();

console.log(`\nUsing ${product.name} (₹${product.price} per ${product.unit}, min ${product.moq})\n`);

const customer = {
  name: 'Order Test',
  phone: '9876500001',
  email: 'order-test@example.test',
  address: '1 Test Road',
  city: 'Indore',
  state: 'MP',
  zip: '452001',
};

console.log('1. Price tampering');

{
  const tampered = await postOrder({
    items: [{ slug: product.slug, qty: product.moq, price: 1, lineTotal: 1 }],
    customer,
    shipping: { id: 'delivery' },
    payment: { id: 'cod' },
  });

  check('order with a forged price is accepted (prices simply ignored)', tampered.status === 201, `status ${tampered.status}`);

  if (tampered.status === 201) {
    const { data: stored } = await db
      .from('orders')
      .select('id, subtotal, total, items')
      .eq('id', tampered.data.id)
      .single();

    const expectedSubtotal = product.price * product.moq;
    check(
      'stored subtotal uses the catalogue price, not the client price',
      Math.abs(Number(stored.subtotal) - expectedSubtotal) < 0.01,
      `stored ${stored.subtotal}, expected ${expectedSubtotal}`,
    );
    check(
      'stored item price is the catalogue price',
      Math.abs(Number(stored.items[0].price) - product.price) < 0.01,
      `stored ${stored.items[0].price}`,
    );
    check('no client price field was stored', stored.items[0].lineTotal === undefined);

    await db.from('orders').delete().eq('id', stored.id);
  }
}

console.log('\n2. Minimum order quantity');

{
  const res = await postOrder({
    items: [{ slug: product.slug, qty: 1 }],
    customer,
    shipping: { id: 'delivery' },
    payment: { id: 'cod' },
  });

  if (product.moq > 1) {
    check('below-MOQ order is rejected', res.status === 409, `status ${res.status}`);
  } else {
    check('MOQ of 1 allows a single unit', res.status === 201, `status ${res.status}`);
    if (res.status === 201) await db.from('orders').delete().eq('id', res.data.id);
  }
}

console.log('\n3. Invalid input');

{
  const noItems = await postOrder({ items: [], customer, shipping: { id: 'delivery' }, payment: { id: 'cod' } });
  check('empty cart is rejected', noItems.status === 400, `status ${noItems.status}`);
}

{
  const badPhone = await postOrder({
    items: [{ slug: product.slug, qty: product.moq }],
    customer: { ...customer, phone: '123' },
    shipping: { id: 'delivery' },
    payment: { id: 'cod' },
  });
  check('invalid phone is rejected', badPhone.status === 400, `status ${badPhone.status}`);
}

{
  const noAddress = await postOrder({
    items: [{ slug: product.slug, qty: product.moq }],
    customer: { name: 'X', phone: '9876500002', zip: '' },
    shipping: { id: 'delivery' },
    payment: { id: 'cod' },
  });
  check('missing delivery address is rejected', noAddress.status === 400, `status ${noAddress.status}`);
}

{
  const fake = await postOrder({
    items: [{ slug: 'this-product-does-not-exist', qty: 1 }],
    customer,
    shipping: { id: 'delivery' },
    payment: { id: 'cod' },
  });
  check('unknown product is rejected', fake.status === 409, `status ${fake.status}`);
}

console.log('\n4. Order privacy');

const good = await postOrder({
  items: [{ slug: product.slug, qty: product.moq }],
  customer,
  shipping: { id: 'delivery' },
  payment: { id: 'cod' },
});

if (good.status === 201) {
  check('a valid order is created', true);

  const page = await fetch(`${BASE}/order/${good.data.token}`);
  check('confirmation page loads with the token', page.status === 200, `status ${page.status}`);

  const wrong = await fetch(`${BASE}/order/${'0'.repeat(8)}-0000-0000-0000-000000000000`);
  check('a wrong token shows not-found', wrong.status === 404, `status ${wrong.status}`);

  const guess = await fetch(`${BASE}/order/ELYF-0000-AAAA`);
  check('guessing an order number does not work', guess.status === 404, `status ${guess.status}`);

  await db.from('orders').delete().eq('id', good.data.id);
  console.log('\n   (test order cleaned up)');
} else {
  check('a valid order is created', false, `status ${good.status}`);
}

console.log('\n5. Direct database insert is blocked');

{
  const anon = createClient(loaded.url, loaded.anonKey, {
    auth: { persistSession: false },
  });
  const { error } = await anon.from('orders').insert({
    order_no: 'HACK-1',
    customer_name: 'Hacker',
    customer_phone: '9000000000',
    items: [{ slug: 'x', qty: 1, price: 1 }],
    subtotal: 1,
    gst: 0,
    shipping: 0,
    total: 1,
  });
  check('browser cannot insert an order directly', !!error, 'insert succeeded!');
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
