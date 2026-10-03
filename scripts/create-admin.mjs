/**
 * Creates (or updates) an admin account.
 *
 *   node scripts/create-admin.mjs you@example.com "a-strong-password" "Your Name"
 *
 * There is no signup form for admins on purpose: the only way to get one is for
 * someone with database access to run this.
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnv, confirmTarget, assertConfigured } from './_env.mjs';

const [, , email, password, fullName] = process.argv;

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password> [full name]');
  process.exit(1);
}

if (password.length < 12) {
  console.error('Use a password of at least 12 characters for an admin account.');
  process.exit(1);
}

const loaded = loadEnv();
assertConfigured(loaded);
if (!(await confirmTarget(loaded))) {
  console.log('Cancelled.');
  process.exit(0);
}

const db = createClient(loaded.url, loaded.key, { auth: { persistSession: false } });

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
  const { data: list } = await db.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) {
    console.error('Account exists but could not be found.');
    process.exit(1);
  }
  userId = existing.id;
  await db.auth.admin.updateUserById(userId, { password });
  console.log('Account already existed — password updated.');
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
console.log(`   email:   ${email}`);
console.log(`   user id: ${userId}`);
console.log(`\nSign in at /admin/login`);
