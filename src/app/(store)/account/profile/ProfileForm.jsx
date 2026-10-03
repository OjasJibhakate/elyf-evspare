'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const FIELDS = [
  { name: 'full_name', label: 'Full name', placeholder: 'Ramesh Kumar', autoComplete: 'name' },
  { name: 'phone', label: 'Mobile number', placeholder: '98765 43210', autoComplete: 'tel' },
  { name: 'business_name', label: 'Business / shop name', placeholder: 'For your GST invoice' },
  { name: 'gstin', label: 'GSTIN', placeholder: '27ABCDE1234F1Z5' },
];

const ADDRESS_FIELDS = [
  { name: 'line', label: 'Address', placeholder: 'Shop / building, street, area', wide: true },
  { name: 'city', label: 'City', placeholder: 'Indore' },
  { name: 'state', label: 'State', placeholder: 'MP' },
  { name: 'zip', label: 'Pincode', placeholder: '452001' },
];

export default function ProfileForm({ profile }) {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: profile.full_name || '',
    phone: profile.phone || '',
    business_name: profile.business_name || '',
    gstin: profile.gstin || '',
  });
  const [address, setAddress] = useState({
    line: profile.default_address?.line || '',
    city: profile.default_address?.city || '',
    state: profile.default_address?.state || '',
    zip: profile.default_address?.zip || '',
  });
  const [state, setState] = useState({ busy: false, error: '', done: false });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setState((s) => ({ ...s, done: false, error: '' }));
  }

  function updateAddress(field, value) {
    setAddress((a) => ({ ...a, [field]: value }));
    setState((s) => ({ ...s, done: false, error: '' }));
  }

  async function onSubmit(event) {
    event.preventDefault();

    const digits = form.phone.replace(/\D/g, '').slice(-10);
    if (form.phone && !/^[6-9]\d{9}$/.test(digits)) {
      setState({ busy: false, done: false, error: 'Please enter a valid 10-digit mobile number.' });
      return;
    }
    if (address.zip && !/^\d{6}$/.test(address.zip.trim())) {
      setState({ busy: false, done: false, error: 'Pincode must be 6 digits.' });
      return;
    }

    setState({ busy: true, error: '', done: false });

    const supabase = createClient();

    // Only these columns go through. role and is_blocked are guarded by a
    // database trigger regardless of what this payload contains.
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name.trim(),
        phone: digits,
        business_name: form.business_name.trim(),
        gstin: form.gstin.trim().toUpperCase(),
        default_address: address.line.trim() ? address : null,
      })
      .eq('id', profile.id);

    if (error) {
      setState({ busy: false, done: false, error: error.message });
      return;
    }

    setState({ busy: false, error: '', done: true });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="card p-5">
        <h3 className="text-sm font-bold">Your details</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.name}>
              <label className="label" htmlFor={field.name}>
                {field.label}
              </label>
              <input
                id={field.name}
                className="input"
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
                value={form[field.name]}
                onChange={(e) => update(field.name, e.target.value)}
              />
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Email is {profile.email} and cannot be changed here. Contact us if you need it updated.
        </p>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-bold">Default delivery address</h3>
        <p className="mt-1 text-xs text-slate-500">
          Saved so checkout fills itself in. You can always use a different address per order.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {ADDRESS_FIELDS.map((field) => (
            <div key={field.name} className={field.wide ? 'sm:col-span-2' : ''}>
              <label className="label" htmlFor={`addr-${field.name}`}>
                {field.label}
              </label>
              <input
                id={`addr-${field.name}`}
                className="input"
                placeholder={field.placeholder}
                value={address[field.name]}
                onChange={(e) => updateAddress(field.name, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {state.error && (
        <p className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {state.error}
        </p>
      )}

      {state.done && (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Saved.
        </p>
      )}

      <button type="submit" disabled={state.busy} className="btn-brand">
        {state.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {state.busy ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
