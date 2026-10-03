'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/supabase/server';

/**
 * Team management. Every action re-checks the admin role on the server, and the
 * guard rails below stop an admin from locking the shop out of its own panel.
 */

const ROLES = ['staff', 'admin'];

function clean(value, max = 120) {
  return String(value ?? '').trim().slice(0, max);
}

async function adminCount() {
  const admin = createAdminClient();
  const { count } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin');
  return count ?? 0;
}

export async function createTeamMember(prevState, formData) {
  const session = await requireAdmin();
  if (!session) return { error: 'Only an admin can add team members.' };

  const email = clean(formData.get('email'), 160).toLowerCase();
  const password = String(formData.get('password') || '');
  const fullName = clean(formData.get('full_name'), 120);
  const role = clean(formData.get('role'), 20) || 'staff';

  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Enter a valid email address.' };
  if (password.length < 12) return { error: 'Use a password of at least 12 characters.' };
  if (!ROLES.includes(role)) return { error: 'Pick a valid role.' };

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    const message = String(error.message || '').toLowerCase();
    if (message.includes('already') || message.includes('registered')) {
      return { error: 'An account with that email already exists.' };
    }
    console.error('[team] create', error);
    return { error: 'Could not create the account.' };
  }

  // The signup trigger already created a profile as 'customer' — elevate it.
  const { error: roleError } = await admin
    .from('profiles')
    .update({ role, full_name: fullName || null })
    .eq('id', data.user.id);

  if (roleError) {
    console.error('[team] role', roleError);
    return { error: 'Account created but the role could not be set. Try editing it below.' };
  }

  revalidatePath('/admin/team');
  return { ok: true, email };
}

export async function updateTeamRole(userId, role) {
  const session = await requireAdmin();
  if (!session) return { error: 'Only an admin can change roles.' };
  if (!['customer', 'staff', 'admin'].includes(role)) return { error: 'Pick a valid role.' };

  if (userId === session.user.id) {
    return { error: 'You cannot change your own role. Ask another admin.' };
  }

  const admin = createAdminClient();

  if (role !== 'admin') {
    const { data: current } = await admin.from('profiles').select('role').eq('id', userId).single();
    if (current?.role === 'admin' && (await adminCount()) <= 1) {
      return { error: 'This is the only admin. Promote someone else first.' };
    }
  }

  const { error } = await admin.from('profiles').update({ role }).eq('id', userId);
  if (error) {
    console.error('[team] role update', error);
    return { error: 'Could not update the role.' };
  }

  revalidatePath('/admin/team');
  return { ok: true };
}

export async function setMemberBlocked(userId, blocked) {
  const session = await requireAdmin();
  if (!session) return { error: 'Only an admin can do that.' };

  if (userId === session.user.id) return { error: 'You cannot block your own account.' };

  const admin = createAdminClient();

  if (blocked) {
    const { data: current } = await admin.from('profiles').select('role').eq('id', userId).single();
    if (current?.role === 'admin' && (await adminCount()) <= 1) {
      return { error: 'This is the only admin and cannot be blocked.' };
    }
  }

  const { error } = await admin.from('profiles').update({ is_blocked: blocked }).eq('id', userId);
  if (error) return { error: 'Could not update the account.' };

  revalidatePath('/admin/team');
  return { ok: true };
}

export async function removeTeamMember(userId) {
  const session = await requireAdmin();
  if (!session) return { error: 'Only an admin can remove accounts.' };

  if (userId === session.user.id) return { error: 'You cannot delete your own account.' };

  const admin = createAdminClient();

  const { data: current } = await admin.from('profiles').select('role').eq('id', userId).single();
  if (current?.role === 'admin' && (await adminCount()) <= 1) {
    return { error: 'This is the only admin. Promote someone else first.' };
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error('[team] delete', error);
    return { error: 'Could not delete the account.' };
  }

  revalidatePath('/admin/team');
  return { ok: true };
}
