/**
 * Verifies the Supabase configuration without ever printing a key.
 *
 *   node scripts/verify-env.mjs
 *
 * Reports which variables are set (yes/no), checks the URL is the right shape,
 * then tests each key by performing an operation only that key can perform.
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './_env.mjs';

const loaded = loadEnv();

console.log('\n=== Configuration ===');
console.log(`keys read from : ${loaded.source}`);
console.log(`project URL    : ${loaded.url || '(not set)'}`);
console.log(`anon key       : ${loaded.anonKey ? 'set' : 'MISSING'}`);
console.log(`service key    : ${loaded.key ? 'set' : 'MISSING'}`);

if (!loaded.url || !loaded.key || !loaded.anonKey) {
  console.log('\nNot configured — stopping here.');
  process.exit(1);
}

// ------------------------------------------------------- URL shape check
// The single most common mistake: pasting the dashboard link instead of the
// API URL. Catch it before anything else so the error message is useful.
console.log('\n=== URL check ===');
let urlOk = true;

if (/supabase\.com\/(dashboard|project)/i.test(loaded.url)) {
  console.log('  FAIL  That is the dashboard link, not the API URL.');
  console.log('        The dashboard link looks like:  https://supabase.com/dashboard/project/<ref>');
  console.log('        You need the API URL, which is:  https://<ref>.supabase.co');
  console.log(`        For this project that would be:  https://heuvtgojmczmnpewtzlq.supabase.co`);
  urlOk = false;
} else if (!/^https:\/\/[a-z0-9]+\.supabase\.(co|in)$/i.test(loaded.url.replace(/\/$/, ''))) {
  console.log(`  WARN  URL does not look like https://<ref>.supabase.co — got ${loaded.url}`);
  console.log('        If this is a custom domain, ignore this warning.');
} else {
  console.log(`  OK    ${new URL(loaded.url).host}`);
}

if (!urlOk) {
  console.log('\nFix NEXT_PUBLIC_SUPABASE_URL in .env.local and run this again.\n');
  process.exit(1);
}

const host = new URL(loaded.url).host;
console.log(`target         : ${loaded.isLocal ? 'LOCAL' : 'REMOTE'} (${host})`);

let failures = 0;
function report(name, ok, detail = '') {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

function short(message) {
  const text = String(message || '');
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
}

// ---------------------------------------------------------------- anon key
console.log('\n=== Public key (what the browser gets) ===');
const anon = createClient(loaded.url, loaded.anonKey, { auth: { persistSession: false } });

{
  const { data, error } = await anon.from('categories').select('slug').limit(3);
  // An empty table is fine before seeding — what matters is that the read works.
  report(
    'public key can read the catalogue',
    !error,
    error ? short(error.message) : `${data?.length ?? 0} row(s) so far`,
  );
}

{
  // RLS must stop this. If it succeeds, the anon slot holds the service key.
  const { data, error } = await anon.from('profiles').select('id').limit(1);
  const readable = !error && data && data.length > 0;
  report('cannot read profiles (RLS working)', !readable, readable ? 'profiles are readable!' : '');
}

// ------------------------------------------------------------ service key
console.log('\n=== Service key (server only) ===');
const admin = createClient(loaded.url, loaded.key, { auth: { persistSession: false } });

{
  // Only the real service role can list auth users.
  const { error } = await admin.auth.admin.listUsers({ perPage: 5 });
  report(
    'can manage auth users',
    !error,
    error ? short(`${error.message} — is this really the service_role key?`) : '',
  );
}

for (const table of ['products', 'categories', 'site_settings', 'orders', 'content_blocks', 'pages']) {
  const { error } = await admin.from(table).select('id').limit(1);
  report(`${table} table reachable`, !error, short(error?.message));
}

{
  const { error } = await admin.from('orders').select('lookup_token').limit(1);
  report('orders.lookup_token exists (migration 0002)', !error, short(error?.message));
}

// ------------------------------------------------------------------ counts
console.log('\n=== Database contents ===');
for (const table of ['products', 'categories', 'orders', 'content_blocks', 'pages', 'profiles']) {
  const { count, error } = await admin.from(table).select('id', { count: 'exact', head: true });
  console.log(`  ${table.padEnd(16)} ${error ? `error: ${short(error.message)}` : count}`);
}

// --------------------------------------------------------------- accounts
console.log('\n=== Staff accounts ===');
{
  const { data, error } = await admin.from('profiles').select('email, role, is_blocked');
  if (error) {
    console.log(`  error: ${short(error.message)}`);
  } else if (!data.length) {
    console.log('  none yet — create one with scripts/create-admin.mjs');
  } else {
    for (const row of data) {
      console.log(`  ${row.role.padEnd(10)} ${row.email}${row.is_blocked ? '  (blocked)' : ''}`);
    }
    const admins = data.filter((r) => r.role === 'admin' && !r.is_blocked).length;
    if (admins === 0) console.log('\n  WARNING: no active admin — nobody can sign in to /admin');
  }
}

console.log(
  failures
    ? `\n${failures} check(s) failed — fix these before continuing.\n`
    : '\nAll checks passed. Ready to seed.\n',
);
process.exit(failures ? 1 : 0);
