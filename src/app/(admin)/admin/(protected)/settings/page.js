import { ShieldCheck } from 'lucide-react';
import { getSettings } from '@/lib/settings';
import SettingsForm from './SettingsForm';
import { saveSettings } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Settings', robots: { index: false } };

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Store details, contact numbers, delivery charges and tax rates.
        </p>
      </div>

      <p className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-800" />
        These values drive the live store — the phone number, WhatsApp orders, GST on the cart and
        checkout, and the delivery options customers can pick.
      </p>

      <SettingsForm action={saveSettings} settings={settings} />
    </div>
  );
}
