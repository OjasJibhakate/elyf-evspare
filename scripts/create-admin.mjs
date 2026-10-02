/**
 * Creates (or updates) an admin account.
 *
 *   node scripts/create-admin.mjs you@example.com "a-strong-password" "Ojas"
 *
 * Run this against the project you want the account in — it uses the same
 * .env.local as the app. There is no signup form for admins on purpose: the
 * only way to get one is for someone with database access to run this.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  } catch (e) {
    /* ignore */
  }
  return { ...env, ...process.env };
}

const env = loadEnv();
const [, , email, password, fullName] = process.argv;

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password> [full name]');
  process.exit(1);
}

if (password.length < 12) {
  console.error('Use a password of at least 12 characters for an admin account.');
  process.exit(1);
}

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: created, error } = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName || '' },
});

let userId = created?.user?.id;

if (error) {
  if (!String(error.message).toLowerCase().includes('already')) {
    console.error('Could not create the account:', error.message);
    process.exit(1);
  }
  // Already exists — find and update instead.
  const { data: list } = await db.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) {
    console.error('Account exists but could not be found.');
    process.exit(1);
  }
  userId = existing.id;
  if (password) {
    await db.auth.admin.updateUserById(userId, { password });
  }
  console.log('Account already existed — updated.');
}

const { error: profileError } = await db
  .from('profiles')
  .upsert(
    { id: userId, email, role: 'admin', full_name: fullName || '', is_blocked: false },
    { onConflict: 'id' },
  );

if (profileError) {
  console.error('Could not set the admin role:', profileError.message);
  process.exit(1);
}

console.log(`\n✅ Admin ready`);
console.log(`   email:    ${email}`);
console.log(`   user id:  ${userId}`);
console.log(`\nSign in at /admin/login`);
