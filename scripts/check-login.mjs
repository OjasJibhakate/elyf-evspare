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

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const { data, error } = await db.auth.signInWithPassword({
  email: 'admin@elyf.local',
  password: 'LocalDev-Admin-2026',
});

console.log('error:', error ? `${error.status} ${error.message}` : 'none');
console.log('user:', data?.user?.email || 'none');

if (data?.user) {
  const { data: profile, error: pErr } = await db
    .from('profiles')
    .select('role, is_blocked, email')
    .eq('id', data.user.id)
    .single();
  console.log('profile:', profile, pErr?.message || '');
}
