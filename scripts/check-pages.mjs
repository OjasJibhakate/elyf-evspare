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

const { data } = await db.from('pages').select('slug, title, body, is_active').order('slug');
for (const p of data) {
  console.log(`--- ${p.slug} | ${p.title} | active=${p.is_active}`);
  console.log((p.body || '').slice(0, 90).replace(/\n/g, ' ⏎ '));
}
