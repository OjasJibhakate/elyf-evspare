import { Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Settings', robots: { index: false } };

export default async function AdminSettingsPage() {
  const supabase = createClient();
  const { data } = await supabase.from('site_settings').select('data, updated_at').eq('id', 1).single();
  const settings = data?.data || {};

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Store details used across the site.</p>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-base font-bold">Current values</h2>
        </div>
        <dl className="divide-y divide-slate-100 text-sm">
          {[
            ['Store name', settings.store_name],
            ['Phone', settings.phone],
            ['WhatsApp', settings.whatsapp],
            ['Email', settings.email],
            ['GST (default)', settings.gst_default_rate],
            ['GST (chargers)', settings.gst_charger_rate],
            ['Store open', settings.store_open ? 'Yes' : 'No'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 px-5 py-3">
              <dt className="text-slate-500">{label}</dt>
              <dd className="font-medium text-slate-800">{String(value ?? '—')}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="card p-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          <Clock className="h-3.5 w-3.5" /> Phase 2
        </span>
        <h2 className="mt-3 text-base font-bold">Editable settings land next</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          These values already drive the storefront. The editable form (including delivery charges
          and payment options) ships with the home page editor in Phase 2.
        </p>
      </div>
    </div>
  );
}
