'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requireStaff } from '@/lib/supabase/server';
import { STATUSES } from '@/lib/order-status';

export async function updateOrderStatus(orderId, prevState, formData) {
  const session = await requireStaff();
  if (!session) return { error: 'Not authorised.' };

  const status = String(formData.get('status') || '');
  const note = String(formData.get('note') || '').trim().slice(0, 300);

  if (!STATUSES.includes(status)) return { error: 'Pick a valid status.' };

  const supabase = createClient();

  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (error) {
    console.error('[admin] updateOrderStatus', error);
    return { error: 'Could not update the order.' };
  }

  const { error: eventError } = await supabase.from('order_events').insert({
    order_id: orderId,
    status,
    note: note || `Marked ${status} by ${session.profile.email}`,
    created_by: session.user.id,
  });

  if (eventError) console.error('[admin] order event', eventError);

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function saveAdminNotes(orderId, prevState, formData) {
  const session = await requireStaff();
  if (!session) return { error: 'Not authorised.' };

  const notes = String(formData.get('admin_notes') || '').slice(0, 2000);

  const supabase = createClient();
  const { error } = await supabase.from('orders').update({ admin_notes: notes }).eq('id', orderId);
  if (error) return { error: 'Could not save the notes.' };

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

/**
 * Courier and tracking number. Shown to the customer on their order page, and
 * revalidated so it appears immediately rather than at the next deploy.
 */
export async function saveTracking(orderId, prevState, formData) {
  const session = await requireStaff();
  if (!session) return { error: 'Not authorised.' };

  const courier = String(formData.get('courier_name') || '').trim().slice(0, 80);
  const tracking = String(formData.get('tracking_no') || '').trim().slice(0, 80);

  const supabase = createClient();
  const { error } = await supabase
    .from('orders')
    .update({ courier_name: courier || null, tracking_no: tracking || null })
    .eq('id', orderId);

  if (error) {
    console.error('[admin] saveTracking', error);
    return { error: 'Could not save the tracking details.' };
  }

  if (tracking) {
    await supabase.from('order_events').insert({
      order_id: orderId,
      note: `Tracking added — ${courier || 'Courier'} ${tracking}`,
      created_by: session.user.id,
    });
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/account');
  revalidatePath('/account/orders');
  return { ok: true };
}
