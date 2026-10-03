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

const { data } = await db.from('site_settings').select('data, updated_at').eq('id', 1).single();
console.log('saved settings:');
console.log(JSON.stringify(data.data, null, 1));

// put the tagline back so the demo data is tidy
await db
  .from('site_settings')
  .update({ data: { ...data.data, tagline: 'Electric Vehicle Spare Parts' } })
  .eq('id', 1);
console.log('\ntagline reset to the original.');
