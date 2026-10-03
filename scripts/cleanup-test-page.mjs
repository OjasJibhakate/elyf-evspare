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

// the About page was created during testing with placeholder copy — remove it
// so it shows up as available-to-create in the editor
await db.from('pages').delete().eq('slug', 'about');

const { data: pages } = await db.from('pages').select('slug, title');
const { data: blocks } = await db.from('content_blocks').select('key');
const { data: products } = await db.from('products').select('id', { count: 'exact' });

console.log('pages:', pages.map((p) => p.slug).join(', ') || 'none');
console.log('content blocks:', blocks.map((b) => b.key).join(', '));
console.log('products:', products.length);
