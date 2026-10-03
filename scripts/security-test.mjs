/**
 * Security test suite — proves the database rules actually hold.
 *
 *   node scripts/security-test.mjs
 *
 * Creates two temporary customers, tries to break the rules as each of them,
 * then cleans up after itself. Every check prints PASS or FAIL; the process
 * exits non-zero if anything regressed.
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnv, assertConfigured } from './_env.mjs';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3200';

const loaded = loadEnv();
assertConfigured(loaded);

const URL = loaded.url;
const ANON = loaded.anonKey;
const SERVICE = loaded.key;

if (!ANON) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

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

async function makeUser(email, password) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error && !String(error.message).toLowerCase().includes('already')) throw error;
  if (data?.user) return data.user.id;
  const { data: list } = await admin.auth.admin.listUsers();
  return list.users.find((u) => u.email === email).id;
}

async function signIn(email, password) {
  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

const stamp = Date.now();
const A = { email: `qa-a-${stamp}@example.test`, password: 'Test-pass-123456' };
const B = { email: `qa-b-${stamp}@example.test`, password: 'Test-pass-123456' };

console.log('\nSetting up temporary accounts…');
await admin.from('orders').delete().like('order_no', 'TEST-%');
const idA = await makeUser(A.email, A.password);
const idB = await makeUser(B.email, B.password);

const anon = createClient(URL, ANON, { auth: { persistSession: false } });
const userA = await signIn(A.email, A.password);
const userB = await signIn(B.email, B.password);

console.log('\n1. Anonymous visitors');

{
  const { data, error } = await anon.from('products').select('id').limit(3);
  check('can browse active products', !error && data.length > 0, error?.message);
}

{
  const { data, error } = await anon.from('orders').select('id');
  check('cannot read any orders', !error && data.length === 0, `got ${data?.length} rows`);
}

{
  const { data, error } = await anon.from('profiles').select('id');
  check('cannot read profiles', !!error || data.length === 0, `got ${data?.length} rows`);
}

{
  const { error } = await anon
    .from('products')
    .insert({ name: 'hack', slug: `hack-${stamp}`, price: 1 });
  check('cannot create a product', !!error, 'insert succeeded!');
}

{
  const { error } = await anon
    .from('site_settings')
    .update({ data: { hacked: true } })
    .eq('id', 1);
  const { data: after } = await admin.from('site_settings').select('data').eq('id', 1).single();
  check(
    'cannot overwrite store settings',
    !!error || !after?.data?.hacked,
    'settings were modified!',
  );
}

{
  const { error } = await anon.from('categories').insert({ name: 'hack', slug: `hack-${stamp}` });
  check('cannot create a category', !!error, 'insert succeeded!');
}

console.log('\n2. Signed-in customer');

{
  const { data } = await userA.from('profiles').select('id, role').eq('id', idA).single();
  check('new signup is a customer, never staff', data?.role === 'customer', `role=${data?.role}`);
}

{
  const { error } = await userA.from('profiles').update({ role: 'admin' }).eq('id', idA);
  const { data: after } = await admin.from('profiles').select('role').eq('id', idA).single();
  check(
    'cannot promote themselves to admin',
    !!error || after?.role === 'customer',
    `role is now ${after?.role}`,
  );
}

{
  const { data } = await userA.from('profiles').select('id').eq('id', idB);
  check('cannot read another customer profile', !data || data.length === 0);
}

{
  const { error } = await userA.from('products').insert({ name: 'x', slug: `x-${stamp}`, price: 5 });
  check('cannot create products', !!error, 'insert succeeded!');
}

{
  const { data } = await userA.from('audit_log').select('id').limit(1);
  check('cannot read the audit log', !data || data.length === 0);
}

console.log('\n3. Order privacy');

const orderNo = `TEST-${stamp}`;
const { data: madeOrder, error: orderError } = await admin
  .from('orders')
  .insert({
    order_no: orderNo,
    customer_id: idA,
    customer_name: 'Customer A',
    customer_phone: '9000000001',
    items: [{ slug: 'x', qty: 1 }],
    subtotal: 100,
    gst: 18,
    shipping: 10,
    total: 128,
  })
  .select('id')
  .single();

if (orderError) {
  check('could create a test order', false, orderError.message);
} else {
  const orderId = madeOrder.id;

  const { data: ownRead } = await userA.from('orders').select('id').eq('id', orderId);
  check('owner can read their own order', ownRead?.length === 1);

  const { data: otherRead } = await userB.from('orders').select('id').eq('id', orderId);
  check('another customer cannot read it', !otherRead || otherRead.length === 0);

  const { data: anonRead } = await anon.from('orders').select('id').eq('id', orderId);
  check('a guest cannot read it', !anonRead || anonRead.length === 0);

  const { error: tamper } = await userA
    .from('orders')
    .update({ total: 1 })
    .eq('id', orderId);
  const { data: afterTotal } = await admin.from('orders').select('total').eq('id', orderId).single();
  check(
    'customer cannot rewrite an order total',
    !!tamper || Number(afterTotal?.total) === 128,
    `total is now ${afterTotal?.total}`,
  );

  await admin.from('orders').delete().eq('id', orderId);
}

console.log('\nCleaning up…');
await admin.auth.admin.deleteUser(idA);
await admin.auth.admin.deleteUser(idB);
await admin.from('products').delete().like('slug', `hack-${stamp}%`);
await admin.from('products').delete().like('slug', `x-${stamp}`);
await admin.from('categories').delete().like('slug', `hack-${stamp}`);

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
