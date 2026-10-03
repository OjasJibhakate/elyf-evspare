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

const { data: orders } = await db
  .from('orders')
  .select('id, order_no, status, lookup_token, updated_at')
  .order('created_at', { ascending: false })
  .limit(3);

console.log('orders:', JSON.stringify(orders, null, 1));

if (orders?.[0]) {
  const { data: events } = await db
    .from('order_events')
    .select('status, note, created_at')
    .eq('order_id', orders[0].id)
    .order('created_at');
  console.log('events:', JSON.stringify(events, null, 1));
}
