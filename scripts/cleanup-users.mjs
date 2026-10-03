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

const KEEP = ['admin@elyf.local'];

const { data: list } = await db.auth.admin.listUsers({ perPage: 200 });
const users = list?.users || [];

let removed = 0;
for (const u of users) {
  const email = u.email || '';
  const isTest = email.includes('@example.test') || email === 'suresh@elyf.local';
  if (KEEP.includes(email) || !isTest) continue;
  const { error } = await db.auth.admin.deleteUser(u.id);
  if (!error) removed += 1;
}

const { data: left } = await db.auth.admin.listUsers({ perPage: 200 });
console.log(`removed ${removed} test account(s)`);
console.log('remaining:', (left?.users || []).map((u) => u.email).join(', '));
