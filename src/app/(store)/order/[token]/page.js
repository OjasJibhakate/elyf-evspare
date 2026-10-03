import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, MessageCircle, Truck, MapPin, Wallet, PackageCheck } from 'lucide-react';
import PrintButton from '@/components/PrintButton';
import ProductImage from '@/components/ProductImage';
import { getOrderByToken, getOrderEvents } from '@/lib/orders-server';
import { getSettings } from '@/lib/settings';
import { inr } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your order', robots: { index: false, follow: false } };

function whatsappLink(order, store) {
  const lines = [
    `*Order ${order.order_no}*`,
    '',
    `Name: ${order.customer_name}`,
    `Phone: ${order.customer_phone}`,
    '',
    '*Items*',
    ...order.items.map((i) => `• ${i.name} — ${i.qty} ${i.unit} × ${inr(i.price)} = ${inr(i.price * i.qty)}`),
    '',
    `Subtotal: ${inr(order.subtotal)}`,
    `GST: ${inr(order.gst)}`,
    `Shipping: ${order.shipping === 0 ? 'Free' : inr(order.shipping)}`,
    `*Total: ${inr(order.total)}*`,
    '',
    `Payment: ${order.payment_method?.label || '—'}`,
    `Delivery: ${order.shipping_method?.label || '—'}`,
  ];

  if (order.shipping_address?.line) {
    lines.push('', '*Delivery address*', order.shipping_address.line);
    lines.push(
      [order.shipping_address.city, order.shipping_address.state, order.shipping_address.zip]
        .filter(Boolean)
        .join(', '),
    );
  }

  return `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}

const STATUS_LABEL = {
  new: 'Received',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default async function OrderPage({ params }) {
  const [order, settings] = await Promise.all([getOrderByToken(params.token), getSettings()]);
  if (!order) notFound();

  const store = settings.store;
  const events = await getOrderEvents(order.id);
  const placed = new Date(order.created_at);

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl">
        <div className="card p-6 text-center sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Thank you for your order!</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your order <span className="font-bold text-slate-900">{order.order_no}</span> has been
            received. Send it to us on WhatsApp and we will confirm stock, share the final invoice
            and dispatch.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <a href={whatsappLink(order, store)} target="_blank" rel="noreferrer" className="btn-primary px-5 py-3">
              <MessageCircle className="h-4 w-4" /> Send order on WhatsApp
            </a>
            <PrintButton />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Placed on{' '}
            {placed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at{' '}
            {placed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Status: {STATUS_LABEL[order.status] || order.status}
          </p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Truck className="h-4 w-4 text-brand-800" /> Shipping
            </h2>
            <p className="mt-2 text-sm text-slate-700">{order.shipping_method?.label}</p>
            <p className="text-xs text-slate-500">{order.shipping_method?.note}</p>
            {order.shipping_address?.line && (
              <p className="mt-3 text-xs leading-5 text-slate-600">
                {order.shipping_address.line}
                <br />
                {[order.shipping_address.city, order.shipping_address.state, order.shipping_address.zip]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
          </div>

          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Wallet className="h-4 w-4 text-brand-800" /> Payment
            </h2>
            <p className="mt-2 text-sm text-slate-700">{order.payment_method?.label}</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5" /> {order.customer_name} · {order.customer_phone}
            </p>
            {order.business_name && (
              <p className="text-xs text-slate-500">Business: {order.business_name}</p>
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
                    {i.partNo ? ` · Part No. ${String(i.partNo).toUpperCase()}` : ''}
                  </span>
                </span>
                <span className="text-sm font-bold">{inr(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-slate-100 bg-slate-50 px-5 py-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <dt>Subtotal</dt>
              <dd className="font-medium text-slate-800">{inr(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>GST</dt>
              <dd className="font-medium text-slate-800">{inr(order.gst)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>Shipping</dt>
              <dd className="font-medium text-slate-800">
                {order.shipping === 0 ? 'Free' : inr(order.shipping)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
              <dt className="font-bold">Total</dt>
              <dd className="font-bold">{inr(order.total)}</dd>
            </div>
          </dl>
        </div>

        {events.length > 0 && (
          <div className="card mt-6 p-5">
            <h2 className="text-sm font-bold">Order timeline</h2>
            <ol className="mt-3 space-y-3">
              {events.map((e, index) => (
                <li key={index} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-800" />
                  <span>
                    <span className="block text-sm font-medium text-slate-800">
                      {STATUS_LABEL[e.status] || e.status}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {new Date(e.created_at).toLocaleString('en-IN')}
                      {e.note ? ` · ${e.note}` : ''}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          Keep this link — it is the only way to view this order online.
        </p>

        <div className="mt-6 text-center">
          <Link href="/categories" className="btn-outline px-5 py-3">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
