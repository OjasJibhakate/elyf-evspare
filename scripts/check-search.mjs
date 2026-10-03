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

const q = 'motor';

const a = await db
  .from('products')
  .select('slug, name, part_no')
  .eq('is_active', true)
  .or(`name.ilike.%${q}%,part_no.ilike.%${q}%`)
  .order('name')
  .limit(5);
console.log('or() query ->', a.error ? `ERROR: ${a.error.message}` : `${a.data.length} rows`);
console.log(a.data);

const b = await db
  .from('products')
  .select('slug, name')
  .eq('is_active', true)
  .ilike('name', `%${q}%`)
  .limit(5);
console.log('\nilike only ->', b.error ? `ERROR: ${b.error.message}` : `${b.data.length} rows`);
console.log(b.data);
