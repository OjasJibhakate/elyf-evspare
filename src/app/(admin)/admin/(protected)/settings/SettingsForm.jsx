'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-brand px-5 py-3">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? 'Saving…' : 'Save settings'}
    </button>
  );
}

function Field({ label, hint, error, children, className = '' }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export default function SettingsForm({ action, settings }) {
  const [state, formAction] = useFormState(action, {});
  const errors = state?.fieldErrors || {};
  const { store, gst, shipping, payments, storeOpen } = settings;

  const delivery = shipping.find((s) => s.id === 'delivery') || {};
  const pickup = shipping.find((s) => s.id === 'pickup') || {};
  const paymentById = (id) => payments.find((p) => p.id === id) || {};

  return (
    <form action={formAction} className="space-y-6">
      {state?.ok && (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> Saved. The storefront has been refreshed.
        </p>
      )}
      {state?.error && (
        <p className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4" /> {state.error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="card space-y-4 p-5">
            <h2 className="text-base font-bold">Store identity</h2>
            <Field label="Store name *" error={errors.store_name}>
              <input name="store_name" defaultValue={store.name} className="input" required />
            </Field>
            <Field label="Tagline" hint="Shown under the name in the footer and search results.">
              <input name="tagline" defaultValue={store.tagline} className="input" />
            </Field>
            <Field label="Address" error={errors.address}>
              <input name="address" defaultValue={store.address} className="input" placeholder="City, State" />
            </Field>
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="text-base font-bold">Contact</h2>
            <p className="-mt-2 text-xs text-slate-500">
              The WhatsApp number is where every order message is sent.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone shown on site" error={errors.phone} hint="Displayed as typed.">
                <input name="phone" defaultValue={store.phone} className="input" />
              </Field>
              <Field
                label="WhatsApp number *"
                error={errors.whatsapp}
                hint="Digits only with country code — e.g. 919325880128."
              >
                <input name="whatsapp" defaultValue={store.whatsapp} className="input" inputMode="numeric" required />
              </Field>
            </div>
            <Field label="Email *" error={errors.email}>
              <input name="email" type="email" defaultValue={store.email} className="input" required />
            </Field>
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="text-base font-bold">Delivery</h2>
            <div className="space-y-3">
              {[
                { key: 'delivery', index: 0, data: delivery },
                { key: 'pickup', index: 1, data: pickup },
              ].map(({ index, data }) => (
                <div key={index} className="rounded-lg border border-slate-200 p-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <input
                      type="checkbox"
                      name={`shipping_${index}_enabled`}
                      defaultChecked={data.enabled !== false}
                      className="h-4 w-4 rounded border-slate-300 text-brand-800 focus:ring-brand-800"
                    />
                    {data.label || (index === 0 ? 'Courier delivery' : 'Store pickup')}
                  </label>
                  <input type="hidden" name={`shipping_${index}_label`} value={data.label || ''} />
                  <input type="hidden" name={`shipping_${index}_note`} value={data.note || ''} />
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Charge (₹)</label>
                      <input
                        name={`shipping_${index}_rate`}
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={data.rate ?? 0}
                        className="input py-2"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Free above (₹)</label>
                      <input
                        name={`shipping_${index}_free_above`}
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={data.freeAbove ?? ''}
                        className="input py-2"
                        placeholder="leave empty for never"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="text-base font-bold">Payment methods</h2>
            <div className="space-y-2">
              {['cod', 'upi', 'whatsapp'].map((id, index) => {
                const p = paymentById(id);
                const fallbackLabel =
                  id === 'cod' ? 'Cash on delivery' : id === 'upi' ? 'UPI / bank transfer' : 'Confirm on WhatsApp';
                return (
                  <label key={id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
                    <input
                      type="checkbox"
                      name={`payment_${index}_enabled`}
                      defaultChecked={p.enabled !== false}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-800 focus:ring-brand-800"
                    />
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-slate-800">
                        {p.label || fallbackLabel}
                      </span>
                      <span className="block text-xs text-slate-500">{p.note}</span>
                      <input type="hidden" name={`payment_${index}_label`} value={p.label || fallbackLabel} />
                      <input type="hidden" name={`payment_${index}_note`} value={p.note || ''} />
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-slate-500">
              Card payments are not offered — orders are settled on delivery or by bank transfer.
            </p>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card space-y-4 p-5">
            <h2 className="text-base font-bold">Tax</h2>
            <Field
              label="GST — most items"
              hint="0.18 means 18%. Applied to everything except chargers."
              error={errors.gst_default_rate}
            >
              <input
                name="gst_default_rate"
                type="number"
                min="0"
                max="0.5"
                step="0.01"
                defaultValue={gst.default}
                className="input"
              />
            </Field>
            <Field
              label="GST — chargers"
              hint="Lithium and lead-acid chargers are taxed at 5%."
              error={errors.gst_charger_rate}
            >
              <input
                name="gst_charger_rate"
                type="number"
                min="0"
                max="0.5"
                step="0.01"
                defaultValue={gst.charger}
                className="input"
              />
            </Field>
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="text-base font-bold">Store status</h2>
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                name="store_open"
                defaultChecked={storeOpen}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-800 focus:ring-brand-800"
              />
              <span>
                <span className="block font-medium">Open for orders</span>
                <span className="block text-xs text-slate-500">
                  Untick to pause ordering. Browsing still works.
                </span>
              </span>
            </label>
          </section>

          <div className="flex gap-2">
            <SubmitButton />
          </div>
          <p className="text-xs text-slate-500">
            The storefront refreshes the moment you save. Every change is recorded in the audit log.
          </p>
        </div>
      </div>
    </form>
  );
}
