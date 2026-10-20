/**
 * Deploy readiness check — run this before handing the site to anyone.
 *
 *   node scripts/preflight.mjs
 *
 * Verifies the things that cause silent, embarrassing failures: a database that
 * is not actually connected, signup that cannot work, no admin account, and
 * uncommitted code that would not match what gets deployed.
 */
import { execSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { loadEnv, assertConfigured } from './_env.mjs';

const loaded = loadEnv();
assertConfigured(loaded);

const admin = createClient(loaded.url, loaded.key, { auth: { persistSession: false } });
const anon = createClient(loaded.url, loaded.anonKey, { auth: { persistSession: false } });

let failures = 0;
let warnings = 0;

function pass(label, detail = '') {
  console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ''}`);
}
function fail(label, detail = '') {
  failures += 1;
  console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
}
function warn(label, detail = '') {
  warnings += 1;
  console.log(`  WARN  ${label}${detail ? ` — ${detail}` : ''}`);
}

console.log(`\nTarget : ${loaded.url}`);
console.log(`Mode   : ${loaded.isLocal ? 'LOCAL' : 'REMOTE'}`);

/* ---------------------------------------------------------------- code state */
console.log('\n=== Code ===');
try {
  const dirty = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  if (dirty) {
    warn('working tree has uncommitted changes', `${dirty.split('\n').length} file(s)`);
  } else {
    pass('working tree is clean');
  }
} catch {
  warn('could not read git status');
}

try {
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  pass('branch', branch);
  const ahead = execSync('git rev-list --count @{u}..HEAD', { encoding: 'utf8' }).trim();
  if (Number(ahead) > 0) warn(`${ahead} commit(s) not pushed`);
  else pass('all commits pushed');
} catch {
  warn('no upstream branch configured');
}

/* ------------------------------------------------------------------ database */
console.log('\n=== Database ===');
const [{ count: products }, { count: categories }, { count: admins }] = await Promise.all([
  admin.from('products').select('id', { count: 'exact', head: true }),
  admin.from('categories').select('id', { count: 'exact', head: true }),
  admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
]);

if (products > 0) pass('catalogue present', `${products} products, ${categories} categories`);
else fail('catalogue is empty', 'run node scripts/seed-db.mjs');

if (admins > 0) pass('an admin account exists', `${admins} admin(s)`);
else fail('no admin account', 'run node scripts/create-admin.mjs');

/* ---------------------------------------------------------------------- auth */
console.log('\n=== Customer signup ===');

// Supabase's built-in mail sender is test-only. If signup requires confirming an
// email, real customers never receive it and can never sign in.
const probe = `preflight-${Date.now()}@mailinator.com`;

try {
  const { data, error } = await anon.auth.signUp({
    email: probe,
    password: `Probe-${Math.random().toString(36).slice(2)}-Aa1`,
  });

  if (error) {
    warn('could not probe signup', error.message);
  } else if (data.session) {
    pass('signup returns a live session (email confirmation is OFF)');
  } else {
    fail(
      'signup does NOT return a session — email confirmation is ON',
      'Supabase → Authentication → Sign In / Providers → Email → turn "Confirm email" off',
    );
  }

  // Remove the probe account either way.
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  const found = (list?.users || []).find((u) => u.email === probe);
  if (found) {
    await admin.from('profiles').delete().eq('id', found.id);
    await admin.auth.admin.deleteUser(found.id);
  }
} catch (e) {
  warn('signup probe failed', e.message);
}

/* -------------------------------------------------------------- what remains */
console.log('\n=== Reminders ===');
console.log('  · Supabase free projects pause after 7 days of no activity.');
console.log('    A daily hit on /api/health prevents it (cron-job.org, free).');
console.log('  · Free tier has no automatic backups. The catalogue also lives in');
console.log('    src/data/products.json, so products can always be re-imported.');

console.log(
  failures
    ? `\n${failures} blocker(s), ${warnings} warning(s) — fix the blockers before handover.\n`
    : `\nReady. ${warnings} warning(s).\n`,
);

process.exit(failures ? 1 : 0);
