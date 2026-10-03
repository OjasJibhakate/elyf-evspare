'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft,
  BadgeIndianRupee,
  CheckCircle2,
  Lock,
  MessageCircle,
  ShieldCheck,
  Truck,
  User,
  MapPin,
  Wallet,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import ProductImage from '@/components/ProductImage';
import { inr } from '@/lib/format';
import { newOrderId, saveOrder } from '@/lib/orders';

const initialForm = {
  name: '',
  phone: '',
  email: '',
  business: '',
  gstin: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  notes: '',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, gst, shipping, total, shippingId, setShippingId, clear, count, shippingMethods, paymentMethods, store, storeOpen } = useCart();
  const [form, setForm] = useState(initialForm);
  const [payment, setPayment] = useState('cod');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const method = shippingMethods.find((m) => m.id === shippingId) || shippingMethods[0];
  const needsAddress = method.id !== 'pickup';

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Please enter your name';
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, '').slice(-10)))
      next.phone = 'Enter a valid 10-digit mobile number';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
    if (needsAddress) {
      if (!form.address.trim()) next.address = 'Please enter the delivery address';
      if (!form.city.trim()) next.city = 'Please enter your city';
      if (!form.state.trim()) next.state = 'Please enter your state';
      if (!/^\d{6}$/.test(form.zip.trim())) next.zip = 'Enter a valid 6-digit pincode';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function placeOrder(e) {
    e.preventDefault();
    if (items.length === 0 || !validate()) return;
    setSubmitting(true);

    const pay = paymentMethods.find((p) => p.id === payment) || paymentMethods[0];
    const order = {
      id: newOrderId(),
      createdAt: new Date().toISOString(),
      items: items.map((i) => ({ ...i })),
      customer: { ...form },
      shipping: { id: method.id, label: method.label, note: method.note },
      payment: { id: pay.id, label: pay.label },
      totals: { subtotal, gst, shipping, total },
    };

    saveOrder(order);
    clear();
    router.push(`/order/${order.id}`);
  }

  if (!storeOpen) {
    return (
      <div className="container py-16">
        <div className="card mx-auto max-w-lg p-10 text-center">
          <h1 className="text-xl font-bold">We are not accepting orders right now</h1>
          <p className="mt-2 text-sm text-slate-500">
            The store is temporarily closed for new orders. Your cart is saved — please try again
            later, or message us on WhatsApp and we will sort it out.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <a
              href={`https://wa.me/${store.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="btn-brand"
            >
              Message us on WhatsApp
            </a>
            <Link href="/" className="btn-outline">
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <div className="card mx-auto max-w-lg p-10 text-center">
          <h1 className="text-xl font-bold">Nothing to checkout</h1>
          <p className="mt-2 text-sm text-slate-500">Add a few parts to your cart first.</p>
          <Link href="/categories" className="btn-brand mt-5">
            Browse categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-800">
        <ArrowLeft className="h-4 w-4" /> Back to cart
      </Link>

      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Checkout</h1>
      <p className="mt-1 text-sm text-slate-500">
        {count} units in {items.length} {items.length === 1 ? 'line' : 'lines'} · no account needed
      </p>

      <form onSubmit={placeOrder} className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-800 text-xs font-bold text-white">
                1
              </span>
              Contact details
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="name">
                  Full name *
                </label>
                <input
                  id="name"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className={`input ${errors.name ? 'border-rose-400' : ''}`}
                  placeholder="Ramesh Kumar"
                />
                {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
              </div>
              <div>
                <label className="label" htmlFor="phone">
                  Mobile number *
                </label>
                <input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className={`input ${errors.phone ? 'border-rose-400' : ''}`}
                  placeholder="98765 43210"
                  inputMode="tel"
                />
                {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>}
              </div>
              <div>
                <label className="label" htmlFor="email">
                  Email (optional)
                </label>
                <input
                  id="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className={`input ${errors.email ? 'border-rose-400' : ''}`}
                  placeholder="you@business.com"
                  inputMode="email"
                />
                {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
              </div>
              <div>
                <label className="label" htmlFor="business">
                  Business / shop name (optional)
                </label>
                <input
                  id="business"
                  value={form.business}
                  onChange={(e) => update('business', e.target.value)}
                  className="input"
                  placeholder="For GST invoice"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="gstin">
                  GSTIN (optional — needed for input credit)
                </label>
                <input
                  id="gstin"
                  value={form.gstin}
                  onChange={(e) => update('gstin', e.target.value.toUpperCase())}
                  className="input uppercase"
                  placeholder="27ABCDE1234F1Z5"
                />
              </div>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-800 text-xs font-bold text-white">
                2
              </span>
              Delivery
            </h2>

            <div className="mt-4 space-y-3">
              {shippingMethods
                .filter((m) => m.enabled)
                .map((m) => (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                      shippingId === m.id ? 'border-brand-800 bg-brand-50/50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping-method"
                      checked={shippingId === m.id}
                      onChange={() => setShippingId(m.id)}
                      className="mt-0.5 h-4 w-4 text-brand-800 focus:ring-brand-800"
                    />
                    <span className="flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                          {m.id === 'pickup' ? <MapPin className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                          {m.label}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                          {m.rate === 0 ? 'Free' : inr(m.rate)}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">{m.note}</span>
                    </span>
                  </label>
                ))}
            </div>

            {needsAddress && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="address">
                    Address *
                  </label>
                  <textarea
                    id="address"
                    rows={3}
                    value={form.address}
                    onChange={(e) => update('address', e.target.value)}
                    className={`input resize-none ${errors.address ? 'border-rose-400' : ''}`}
                    placeholder="Shop / building, street, area, landmark"
                  />
                  {errors.address && <p className="mt-1 text-xs text-rose-600">{errors.address}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="city">
                    City *
                  </label>
                  <input
                    id="city"
                    value={form.city}
                    onChange={(e) => update('city', e.target.value)}
                    className={`input ${errors.city ? 'border-rose-400' : ''}`}
                  />
                  {errors.city && <p className="mt-1 text-xs text-rose-600">{errors.city}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="state">
                    State *
                  </label>
                  <input
                    id="state"
                    value={form.state}
                    onChange={(e) => update('state', e.target.value)}
                    className={`input ${errors.state ? 'border-rose-400' : ''}`}
                  />
                  {errors.state && <p className="mt-1 text-xs text-rose-600">{errors.state}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="zip">
                    Pincode *
                  </label>
                  <input
                    id="zip"
                    value={form.zip}
                    onChange={(e) => update('zip', e.target.value)}
                    className={`input ${errors.zip ? 'border-rose-400' : ''}`}
                    inputMode="numeric"
                    maxLength={6}
                  />
                  {errors.zip && <p className="mt-1 text-xs text-rose-600">{errors.zip}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="notes">
                    Delivery notes (optional)
                  </label>
                  <input
                    id="notes"
                    value={form.notes}
                    onChange={(e) => update('notes', e.target.value)}
                    className="input"
                    placeholder="Best time to deliver"
                  />
                </div>
              </div>
            )}
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-800 text-xs font-bold text-white">
                3
              </span>
              Payment method
            </h2>
            <div className="mt-4 space-y-3">
              {paymentMethods
                .filter((p) => p.enabled)
                .map((p) => (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                      payment === p.id ? 'border-brand-800 bg-brand-50/50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={payment === p.id}
                      onChange={() => setPayment(p.id)}
                      className="mt-0.5 h-4 w-4 text-brand-800 focus:ring-brand-800"
                    />
                    <span className="flex-1">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                        {p.id === 'whatsapp' ? (
                          <MessageCircle className="h-4 w-4" />
                        ) : (
                          <Wallet className="h-4 w-4" />
                        )}
                        {p.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">{p.note}</span>
                    </span>
                  </label>
                ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-base font-bold">Order summary</h2>
            </div>
            <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
              {items.map((i) => (
                <li key={i.slug} className="flex items-start gap-3 px-5 py-3">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white p-1">
                    <ProductImage src={i.image} alt={i.name} className="h-full w-full object-contain" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="clamp-2 block text-xs font-semibold text-slate-800">{i.name}</span>
                    <span className="mt-0.5 block text-[11px] text-slate-500">
                      {i.qty} × {inr(i.price)} / {i.unit}
                    </span>
                  </span>
                  <span className="text-xs font-bold text-slate-800">{inr(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t border-slate-100 px-5 py-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <dt>Subtotal (excl. GST)</dt>
                <dd className="font-medium text-slate-800">{inr(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt className="inline-flex items-center gap-1">
                  <BadgeIndianRupee className="h-3.5 w-3.5" /> GST
                </dt>
                <dd className="font-medium text-slate-800">{inr(gst)}</dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt className="inline-flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" /> {method.label}
                </dt>
                <dd className="font-medium text-slate-800">{shipping === 0 ? 'Free' : inr(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                <dt className="font-bold">Total payable</dt>
                <dd className="font-bold">{inr(total)}</dd>
              </div>
            </dl>

            <div className="px-5 pb-5">
              <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5 text-base">
                {submitting ? 'Placing order…' : 'Place order'}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
                <Lock className="h-3 w-3" /> Your details stay on this device — we confirm every order
                on WhatsApp.
              </p>
            </div>
          </div>

          <ul className="card space-y-2.5 p-4 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-800" /> GST invoice for every business order
            </li>
            <li className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-brand-800" /> Dispatch within 24–48 working hours
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand-800" /> Free replacement on damaged parts
            </li>
            <li className="flex items-center gap-2">
              <User className="h-4 w-4 text-brand-800" /> Need help? Call {store.phone}
            </li>
          </ul>
        </aside>
      </form>
    </div>
  );
}
