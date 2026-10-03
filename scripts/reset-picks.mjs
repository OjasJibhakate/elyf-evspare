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

// back to automatic selection for the demo
await db.from('content_blocks').upsert(
  [
    { key: 'hero_products', type: 'products', position: 4, is_active: true, data: { items: [] } },
    { key: 'featured_products', type: 'products', position: 5, is_active: true, data: { items: [] } },
  ],
  { onConflict: 'key' },
);

const { data } = await db.from('content_blocks').select('key, data').order('position');
for (const b of data) {
  const summary = b.data.items ? `${b.data.items.length} items` : 'object';
  console.log(`${b.key}: ${summary}`);
}
