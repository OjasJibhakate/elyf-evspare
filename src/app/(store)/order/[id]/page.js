'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, MessageCircle, Printer, Truck, MapPin, Wallet, PackageCheck } from 'lucide-react';
import ProductImage from '@/components/ProductImage';
import { getOrder, orderToWhatsApp } from '@/lib/orders';
import { inr } from '@/lib/format';
import { store } from '@/lib/config';

export default function OrderPage({ params }) {
  const [order, setOrder] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setOrder(getOrder(params.id));
    setLoaded(true);
  }, [params.id]);

  if (!loaded) {
    return <div className="container py-20 text-center text-sm text-slate-500">Loading order…</div>;
  }

  if (!order) {
    return (
      <div className="container py-16">
        <div className="card mx-auto max-w-lg p-10 text-center">
          <h1 className="text-xl font-bold">Order not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            We could not find order <span className="font-semibold">{params.id}</span> on this device.
            Orders are stored locally in this demo.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link href="/categories" className="btn-brand">
              Continue shopping
            </Link>
            <Link href="/contact" className="btn-outline">
              Contact us
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const waLink = orderToWhatsApp(order, store);
  const placed = new Date(order.createdAt);

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl">
        <div className="card p-6 text-center sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Thank you for your order!</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your order <span className="font-bold text-slate-900">{order.id}</span> has been recorded.
            Send it to us on WhatsApp and we will confirm stock, share the final invoice and dispatch.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <a href={waLink} target="_blank" rel="noreferrer" className="btn-primary px-5 py-3">
              <MessageCircle className="h-4 w-4" /> Send order on WhatsApp
            </a>
            <button type="button" onClick={() => window.print()} className="btn-outline px-5 py-3">
              <Printer className="h-4 w-4" /> Print / save PDF
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Placed on{' '}
            {placed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}{' '}
            at {placed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Truck className="h-4 w-4 text-brand-800" /> Shipping
            </h2>
            <p className="mt-2 text-sm text-slate-700">{order.shipping.label}</p>
            <p className="text-xs text-slate-500">{order.shipping.note}</p>
            {order.customer.address && (
              <p className="mt-3 text-xs leading-5 text-slate-600">
                {order.customer.address}
                <br />
                {[order.customer.city, order.customer.state, order.customer.zip].filter(Boolean).join(', ')}
              </p>
            )}
          </div>

          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Wallet className="h-4 w-4 text-brand-800" /> Payment
            </h2>
            <p className="mt-2 text-sm text-slate-700">{order.payment.label}</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5" /> {order.customer.name} · {order.customer.phone}
            </p>
            {order.customer.business && (
              <p className="text-xs text-slate-500">Business: {order.customer.business}</p>
            )}
          </div>
        </div>

        <div className="card mt-6 overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <PackageCheck className="h-4 w-4 text-brand-800" /> Items
            </h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {order.items.map((i) => (
              <li key={i.slug} className="flex items-start gap-3 px-5 py-3.5">
                <span className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white p-1">
                  <ProductImage src={i.image} alt={i.name} className="h-full w-full object-contain" />
                </span>
                <span className="min-w-0 flex-1">
                  <Link href={`/product/${i.slug}`} className="clamp-2 block text-sm font-semibold hover:text-brand-800">
                    {i.name}
                  </Link>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {i.qty} {i.unit} × {inr(i.price)}
                    {i.partNo ? ` · Part No. ${i.partNo.toUpperCase()}` : ''}
                  </span>
                </span>
                <span className="text-sm font-bold">{inr(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-slate-100 bg-slate-50 px-5 py-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <dt>Subtotal</dt>
              <dd className="font-medium text-slate-800">{inr(order.totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>GST</dt>
              <dd className="font-medium text-slate-800">{inr(order.totals.gst)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>Shipping</dt>
              <dd className="font-medium text-slate-800">
                {order.totals.shipping === 0 ? 'Free' : inr(order.totals.shipping)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
              <dt className="font-bold">Total</dt>
              <dd className="font-bold">{inr(order.totals.total)}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 text-center">
          <Link href="/categories" className="btn-outline px-5 py-3">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
