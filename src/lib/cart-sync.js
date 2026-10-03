import { createClient } from '@/lib/supabase/client';

/**
 * Merge a device cart with the one saved on the account.
 *
 * Keeps the larger quantity per product rather than summing. Someone who added
 * 6 on their phone and then opened their laptop has 6 items, not 12 — summing
 * would silently double an order. Max never invents a basket bigger than either
 * device actually showed.
 *
 * Remote lines win on presentation fields (name, price) since those are the
 * most recently written from the catalogue.
 */
export function mergeCarts(local, remote) {
  const merged = new Map();

  for (const item of local || []) {
    if (item?.slug) merged.set(item.slug, { ...item });
  }

  for (const item of remote || []) {
    if (!item?.slug) continue;
    const existing = merged.get(item.slug);
    if (!existing) {
      merged.set(item.slug, { ...item });
      continue;
    }
    merged.set(item.slug, {
      ...existing,
      ...item,
      qty: Math.max(Number(existing.qty) || 0, Number(item.qty) || 0),
    });
  }

  return [...merged.values()];
}

export async function readRemoteCart(userId) {
  if (!userId) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('carts')
      .select('items')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return [];
    return Array.isArray(data.items) ? data.items : [];
  } catch (e) {
    // A sync failure must never break the cart — it stays local.
    return [];
  }
}

export async function writeRemoteCart(userId, items) {
  if (!userId) return;
  try {
    const supabase = createClient();
    await supabase
      .from('carts')
      .upsert({ user_id: userId, items: items || [] }, { onConflict: 'user_id' });
  } catch (e) {
    /* ignore — the cart still works from localStorage */
  }
}
