/**
 * Removes throwaway accounts.
 *
 *   node scripts/cleanup-users.mjs                       # known test patterns
 *   node scripts/cleanup-users.mjs someone@example.com   # one specific account
 *
 * Never removes an admin account, so it cannot be used to lock you out.
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnv, confirmTarget, assertConfigured } from './_env.mjs';

const requested = process.argv.slice(2).filter((a) => a && !a.startsWith('--'));

const loaded = loadEnv();
assertConfigured(loaded);

const db = createClient(loaded.url, loaded.key, { auth: { persistSession: false } });

console.log(`target: ${loaded.url}\n`);
if (!(await confirmTarget(loaded))) {
  console.log('Cancelled.');
  process.exit(0);
}

const { data: list } = await db.auth.admin.listUsers({ perPage: 500 });
const users = list?.users || [];

// Accounts created by the test suites, plus anything named explicitly.
function isTarget(user) {
  const email = user.email || '';
  if (requested.length) return requested.includes(email);
  return email.includes('@example.test') || email === 'suresh@elyf.local';
}

const { data: profiles } = await db.from('profiles').select('id, role');
const roleById = new Map((profiles || []).map((p) => [p.id, p.role]));

const targets = users.filter(isTarget);
if (!targets.length) {
  console.log('nothing to remove.');
  process.exit(0);
}

let removed = 0;
for (const user of targets) {
  const role = roleById.get(user.id);
  if (role === 'admin') {
    console.log(`  SKIP  ${user.email} — admin account`);
    continue;
  }
  const { error } = await db.auth.admin.deleteUser(user.id);
  if (error) {
    console.log(`  FAIL  ${user.email} — ${error.message}`);
  } else {
    removed += 1;
    console.log(`  done  ${user.email}`);
  }
}

const { data: left } = await db.auth.admin.listUsers({ perPage: 500 });
const remaining = (left?.users || []).map((u) => u.email);

console.log(`\nremoved ${removed} account(s)`);
console.log(`remaining: ${remaining.length ? remaining.join(', ') : 'none'}`);
