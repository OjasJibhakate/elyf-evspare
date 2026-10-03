import { createClient, getSessionProfile } from '@/lib/supabase/server';
import ProfileForm from './ProfileForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My profile', robots: { index: false, follow: false } };

export default async function ProfilePage() {
  const session = await getSessionProfile();
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, business_name, gstin, default_address')
    .eq('id', session.profile.id)
    .single();

  return (
    <div className="max-w-3xl">
      <h2 className="text-base font-bold">Profile</h2>
      <p className="mt-1 text-sm text-slate-600">
        Keep these up to date so your invoices and deliveries are correct.
      </p>
      <div className="mt-4">
        <ProfileForm profile={profile || session.profile} />
      </div>
    </div>
  );
}
