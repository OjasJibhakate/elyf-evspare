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

// remove the page that was saved with the wrong body during testing
const { error } = await db.from('pages').delete().eq('slug', 'about');
console.log('cleaned up the mis-saved about page:', error ? error.message : 'ok');

// reset the demo home content back to the shipped defaults
const blocks = [
  {
    key: 'hero',
    type: 'hero',
    position: 0,
    is_active: true,
    data: {
      badge: '786+ SKUs in stock right now',
      heading: 'Every EV spare part,',
      heading_accent: 'at wholesale rates.',
      subheading:
        'Controllers, motors, chargers, brakes, body kits and every small fitting — sourced from verified manufacturers and shipped across India with a GST invoice.',
      primary_cta_label: 'Browse categories',
      primary_cta_href: '/categories',
      secondary_cta_label: 'Search parts',
      secondary_cta_href: '/search?q=charger',
    },
  },
];

const { error: heroError } = await db.from('content_blocks').upsert(blocks, { onConflict: 'key' });
console.log('hero content reset:', heroError ? heroError.message : 'ok');

const { data: sections } = await db
  .from('content_blocks')
  .select('data')
  .eq('key', 'sections')
  .single();

const restored = ['hero', 'categories', 'bestsellers', 'bulk_banner', 'new_arrivals'].map((key) => ({
  key,
  label: (sections?.data?.items || []).find((i) => i.key === key)?.label || key,
  enabled: true,
}));

await db.from('content_blocks').update({ data: { items: restored } }).eq('key', 'sections');
console.log('all home sections re-enabled.');
