'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createAnonClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireStaff } from '@/lib/supabase/server';

/**
 * Self-service credentials for staff.
 *
 * Both the email and the password change require the CURRENT password. A stolen
 * session alone is not enough to take the account over, which matters because
 * these are the accounts that can edit the shop.
 *
 * The email is changed through the service-role admin API rather than
 * auth.updateUser(). Supabase's own email-change flow requires clicking a
 * confirmation link sent to both the old and new address, and the free tier's
 * built-in mail sender is test-only — so that link would never arrive and the
 * change would silently never happen. Requiring the current password first is
 * what keeps the admin route safe.
 */

const MIN_PASSWORD = 12;

function clean(value, max = 160) {
  return String(value ?? '').trim().slice(0, max);
}

/** True when the supplied password really is the signed-in user's password. */
async function passwordMatches(email, password) {
  if (!email || !password) return false;
  const client = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await client.auth.signInWithPassword({ email, password });
  return !error;
}

export async function changePassword(prevState, formData) {
  const session = await requireStaff();
  if (!session) return { error: 'Not authorised.' };

  const current = String(formData.get('current_password') || '');
  const next = String(formData.get('new_password') || '');
  const confirm = String(formData.get('confirm_password') || '');

  if (!current) return { error: 'Enter your current password.' };
  if (next.length < MIN_PASSWORD) return { error: `Use at least ${MIN_PASSWORD} characters.` };
  if (next !== confirm) return { error: 'The two new passwords do not match.' };
  if (next === current) return { error: 'That is already your password.' };

  if (!(await passwordMatches(session.profile.email, current))) {
    return { error: 'Your current password is incorrect.' };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(session.user.id, { password: next });

  if (error) {
    console.error('[account] password', error);
    return { error: 'Could not change the password. Please try again.' };
  }

  return { ok: true, message: 'Password changed. Use the new one next time you sign in.' };
}

export async function changeEmail(prevState, formData) {
  const session = await requireStaff();
  if (!session) return { error: 'Not authorised.' };

  const current = String(formData.get('current_password') || '');
  const email = clean(formData.get('email')).toLowerCase();

  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Enter a valid email address.' };
  if (email === String(session.profile.email).toLowerCase()) {
    return { error: 'That is already your email address.' };
  }
  if (!current) return { error: 'Enter your current password to confirm.' };

  if (!(await passwordMatches(session.profile.email, current))) {
    return { error: 'Your current password is incorrect.' };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(session.user.id, {
    email,
    email_confirm: true,
  });

  if (error) {
    if (/already|registered|exists|duplicate/i.test(error.message)) {
      return { error: 'Another account already uses that email.' };
    }
    console.error('[account] email', error);
    return { error: 'Could not change the email. Please try again.' };
  }

  await admin.from('profiles').update({ email }).eq('id', session.user.id);

  revalidatePath('/admin/account');
  revalidatePath('/admin/team');

  return {
    ok: true,
    message: `Done — sign in with ${email} from now on. Write it down before you sign out.`,
  };
}

export async function changeName(prevState, formData) {
  const session = await requireStaff();
  if (!session) return { error: 'Not authorised.' };

  const fullName = clean(formData.get('full_name'), 120);
  if (!fullName) return { error: 'Enter your name.' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', session.user.id);

  if (error) {
    console.error('[account] name', error);
    return { error: 'Could not save your name.' };
  }

  revalidatePath('/admin/account');
  return { ok: true, message: 'Name saved.' };
}
