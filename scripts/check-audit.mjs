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

// revert the test edit
const { error } = await db
  .from('products')
  .update({ price: 89.9 })
  .eq('slug', 'clamp-of-guard-3e64');
console.log('reverted price:', error ? error.message : 'ok');

// prove the audit log captured the change
const { data: log, error: logError } = await db
  .from('audit_log')
  .select('action, table_name, actor_email, created_at')
  .order('created_at', { ascending: false })
  .limit(5);

console.log('audit log:', logError ? logError.message : JSON.stringify(log, null, 1));
