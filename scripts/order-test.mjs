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

console.log('\n6. Accounts do not open a hole');

{
  // This request carries no session cookie, so it must be stored as a guest
  // order. If a customer_id ever showed up here, the server would be trusting
  // something from the request body.
  const guest = await postOrder({
    items: [{ slug: product.slug, qty: product.moq }],
    customer,
    shipping: { id: 'delivery' },
    payment: { id: 'cod' },
    // Deliberately trying to file this under someone else's account.
    customer_id: '00000000-0000-0000-0000-000000000001',
    customerId: '00000000-0000-0000-0000-000000000001',
  });

  if (guest.status !== 201) {
    check('a guest can still order', false, `status ${guest.status}`);
  } else {
    const { data: stored } = await db
      .from('orders')
      .select('customer_id')
      .eq('id', guest.data.id)
      .single();
    check(
      'a guest order is stored with no customer attached',
      stored?.customer_id === null,
      `customer_id is ${stored?.customer_id}`,
    );
    await db.from('orders').delete().eq('id', guest.data.id);
  }
}

console.log('\n7. Free delivery threshold');

{
  const { data: settings } = await db.from('site_settings').select('data').eq('id', 1).single();
  const delivery = (settings?.data?.shipping || []).find((m) => m.id === 'delivery');

  if (!delivery?.freeAbove) {
    check('a free-delivery threshold is configured', false, 'no freeAbove on the delivery method');
  } else {
    const threshold = Number(delivery.freeAbove);
    const rate = Number(delivery.rate);

    // A basket comfortably under the threshold should still be charged delivery.
    const smallQty = Math.max(product.moq, Math.floor(threshold / 4 / product.price) || product.moq);
    const small = await postOrder({
      items: [{ slug: product.slug, qty: smallQty }],
      customer,
      shipping: { id: 'delivery' },
      payment: { id: 'cod' },
    });

    if (small.status !== 201) {
      check('a below-threshold order is accepted', false, `status ${small.status}`);
    } else {
      const { data: stored } = await db
        .from('orders')
        .select('subtotal, gst, shipping, total')
        .eq('id', small.data.id)
        .single();
      const gross = Number(stored.subtotal) + Number(stored.gst);
      check(
        'below the threshold delivery is charged',
        gross >= threshold || Math.abs(Number(stored.shipping) - rate) < 0.01,
        `gross ${gross}, charged ${stored.shipping}`,
      );
      check(
        'total includes the delivery charge',
        Math.abs(Number(stored.total) - (gross + Number(stored.shipping))) < 0.01,
        `total ${stored.total}`,
      );
      await db.from('orders').delete().eq('id', small.data.id);
    }

    // Enough units to cross the threshold must not be charged.
    const bigQty = Math.ceil((threshold * 1.2) / product.price) + product.moq;
    const big = await postOrder({
      items: [{ slug: product.slug, qty: bigQty }],
      customer,
      shipping: { id: 'delivery' },
      payment: { id: 'cod' },
    });

    if (big.status !== 201) {
      check('an above-threshold order is accepted', false, `status ${big.status}`);
    } else {
      const { data: stored } = await db
        .from('orders')
        .select('subtotal, gst, shipping, total')
        .eq('id', big.data.id)
        .single();
      const gross = Number(stored.subtotal) + Number(stored.gst);
      check('the above-threshold basket really is above it', gross >= threshold, `gross ${gross}`);
      check(
        'delivery is free above the threshold',
        Number(stored.shipping) === 0,
        `charged ${stored.shipping}`,
      );
      check(
        'total excludes delivery above the threshold',
        Math.abs(Number(stored.total) - gross) < 0.01,
        `total ${stored.total}, gross ${gross}`,
      );
      await db.from('orders').delete().eq('id', big.data.id);
    }

    // Store pickup is free regardless of basket size.
    const pickup = await postOrder({
      items: [{ slug: product.slug, qty: product.moq }],
      customer,
      shipping: { id: 'pickup' },
      payment: { id: 'cod' },
    });
    if (pickup.status === 201) {
      const { data: stored } = await db
        .from('orders')
        .select('shipping')
        .eq('id', pickup.data.id)
        .single();
      check('store pickup is always free', Number(stored.shipping) === 0, `charged ${stored.shipping}`);
      await db.from('orders').delete().eq('id', pickup.data.id);
    } else {
      check('store pickup order is accepted', false, `status ${pickup.status}`);
    }
  }
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
