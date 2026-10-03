import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  BadgeIndianRupee,
  Check,
  CircleDashed,
  MapPin,
  Truck,
  Wallet,
  XCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ProductImage from '@/components/ProductImage';
import { inr } from '@/lib/format';
import {
  PROGRESS,
  STATUS_LABEL,
  STATUS_NOTE,
  STATUS_STYLE,
  formatDate,
  progressIndex,
} from '@/lib/order-status';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Order', robots: { index: false, follow: false } };

export default async function AccountOrderPage({ params }) {
  const supabase = createClient();

  // RLS scopes this to the signed-in customer — another user's id simply
  // returns nothing, so it renders as a 404 rather than leaking existence.
  const { data: order } = await supabase
    .from('orders')
    .select(
      'id, order_no, status, items, subtotal, gst, shipping, total, created_at, shipping_address, shipping_method, payment_method, courier_name, tracking_no, business_name, gstin',
    )
    .eq('id', params.id)
    .maybeSingle();

  if (!order) notFound();

  const { data: events } = await supabase
    .from('order_events')
    .select('status, note, created_at')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true });

  // First time each status was reached, so the timeline can show real times.
  const reachedAt = new Map();
  reachedAt.set('new', order.created_at);
  for (const event of events || []) {
    if (event.status && !reachedAt.has(event.status)) reachedAt.set(event.status, event.created_at);
  }

  const cancelled = order.status === 'cancelled';
  const currentIndex = progressIndex(order.status);
  const address = order.shipping_address || {};
  const shipping = order.shipping_method || {};
  const payment = order.payment_method || {};

  return (
    <div className="space-y-6">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to my orders
      </Link>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight">{order.order_no}</h2>
            <p className="mt-0.5 text-xs text-slate-500">Placed {formatDate(order.created_at)}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              STATUS_STYLE[order.status] || 'bg-slate-100 text-slate-600'
            }`}
          >
            {STATUS_LABEL[order.status] || order.status}
          </span>
        </div>

        {cancelled ? (
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <p className="text-sm font-semibold text-rose-900">This order was cancelled</p>
              <p className="mt-0.5 text-xs text-rose-800">
                {STATUS_NOTE.cancelled} If this looks wrong, message us on WhatsApp and we will sort
                it out.
              </p>
            </div>
          </div>
        ) : (
          <ol className="mt-6 space-y-0">
            {PROGRESS.map((step, index) => {
              const done = index <= currentIndex;
              const at = reachedAt.get(step);
              const isLast = index === PROGRESS.length - 1;

              return (
                <li key={step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                        done
                          ? 'border-brand-800 bg-brand-800 text-white'
                          : 'border-slate-200 bg-white text-slate-300'
                      }`}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : <CircleDashed className="h-3.5 w-3.5" />}
                    </span>
                    {!isLast && (
                      <span
                        className={`w-0.5 flex-1 ${index < currentIndex ? 'bg-brand-800' : 'bg-slate-200'}`}
                        style={{ minHeight: '1.75rem' }}
                      />
                    )}
                  </div>
                  <div className={isLast ? 'pb-0' : 'pb-5'}>
                    <p
                      className={`text-sm font-semibold ${done ? 'text-slate-900' : 'text-slate-400'}`}
                    >
                      {STATUS_LABEL[step]}
                    </p>
                    <p className="text-xs text-slate-500">
                      {at ? formatDate(at) : done ? '' : 'Pending'}
                    </p>
                    {step === order.status && (
                      <p className="mt-0.5 text-xs text-slate-500">{STATUS_NOTE[step]}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {order.tracking_no && (
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-violet-200 bg-violet-50 p-4">
            <Truck className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />
            <div>
              <p className="text-sm font-semibold text-violet-900">
                {order.courier_name || 'Courier'} · {order.tracking_no}
              </p>
              <p className="mt-0.5 text-xs text-violet-800">
                Use this number on the courier&apos;s website to follow your parcel.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="card overflow-hidden">
          <h3 className="border-b border-slate-100 px-5 py-3 text-sm font-bold">
            {order.items?.length || 0} item{(order.items?.length || 0) === 1 ? '' : 's'}
          </h3>
          <ul className="divide-y divide-slate-100">
            {(order.items || []).map((item) => (
              <li key={item.slug} className="flex gap-3 p-4">
                <Link
                  href={`/product/${item.slug}`}
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5"
                >
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-contain"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${item.slug}`}
                    className="clamp-2 text-sm font-semibold text-slate-800 hover:text-brand-800"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {inr(item.price)} / {item.unit} · qty {item.qty}
                    {item.partNo ? ` · ${item.partNo}` : ''}
                  </p>
                </div>
                <p className="text-sm font-bold">{inr(item.price * item.qty)}</p>
              </li>
            ))}
          </ul>

          <dl className="space-y-2 border-t border-slate-100 bg-slate-50 px-5 py-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <dt>Subtotal (excl. GST)</dt>
              <dd className="font-medium text-slate-800">{inr(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt className="inline-flex items-center gap-1">
                <BadgeIndianRupee className="h-3.5 w-3.5" /> GST
              </dt>
              <dd className="font-medium text-slate-800">{inr(order.gst)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt className="inline-flex items-center gap-1">
                <Truck className="h-3.5 w-3.5" /> {shipping.label || 'Shipping'}
              </dt>
              <dd className={`font-medium ${Number(order.shipping) === 0 ? 'text-emerald-700' : 'text-slate-800'}`}>
                {Number(order.shipping) === 0 ? 'Free' : inr(order.shipping)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
              <dt className="font-bold">Total paid</dt>
              <dd className="font-bold">{inr(order.total)}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Truck className="h-4 w-4 text-brand-800" /> Delivery
            </h3>
            <p className="mt-2 text-sm text-slate-700">{shipping.label || '—'}</p>
            {address.line ? (
              <p className="mt-2 flex gap-2 text-xs text-slate-500">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {address.line}
                  {address.city ? `, ${address.city}` : ''}
                  {address.state ? `, ${address.state}` : ''}
                  {address.zip ? ` — ${address.zip}` : ''}
                </span>
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Store pickup</p>
            )}
            {address.notes && (
              <p className="mt-2 text-xs text-slate-500">Note: {address.notes}</p>
            )}
          </div>

          <div className="card p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Wallet className="h-4 w-4 text-brand-800" /> Payment
            </h3>
            <p className="mt-2 text-sm text-slate-700">{payment.label || '—'}</p>
            {payment.note && <p className="mt-1 text-xs text-slate-500">{payment.note}</p>}
          </div>

          {order.gstin && (
            <div className="card p-5">
              <h3 className="text-sm font-bold">GST details</h3>
              <p className="mt-2 text-sm text-slate-700">{order.business_name || '—'}</p>
              <p className="mt-0.5 text-xs text-slate-500">GSTIN {order.gstin}</p>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        Something wrong with this order?{' '}
        <Link href="/contact" className="font-medium text-brand-800 hover:underline">
          Contact us
        </Link>{' '}
        with order number {order.order_no}.
      </p>
    </div>
  );
}
