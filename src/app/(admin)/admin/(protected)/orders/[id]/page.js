import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MessageCircle, Phone, Mail, MapPin, Receipt } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import { inr } from '@/lib/format';
import { StatusForm, NotesForm, TrackingForm } from '../OrderForms';
import { updateOrderStatus, saveAdminNotes, saveTracking } from '../actions';
import { STATUS_LABEL, STATUS_STYLE, formatDate } from '@/lib/order-status';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Order', robots: { index: false } };

export default async function AdminOrderPage({ params }) {
  const supabase = createClient();

  const [{ data: order }, { data: events }, settings] = await Promise.all([
    supabase.from('orders').select('*').eq('id', params.id).maybeSingle(),
    supabase
      .from('order_events')
      .select('status, note, created_at')
      .eq('order_id', params.id)
      .order('created_at'),
    getSettings(),
  ]);

  if (!order) notFound();

  const items = Array.isArray(order.items) ? order.items : [];
  const address = order.shipping_address || {};

  const whatsappText = encodeURIComponent(
    `Hi ${order.customer_name}, about your order ${order.order_no}:`,
  );
  const whatsappHref = `https://wa.me/${String(order.customer_phone).replace(/[^\d]/g, '')}?text=${whatsappText}`;

  return (
    <div className="space-y-5">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{order.order_no}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Placed {formatDate(order.created_at)} · {items.length} line
            {items.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              STATUS_STYLE[order.status] || 'bg-slate-100 text-slate-600'
            }`}
          >
            {STATUS_LABEL[order.status] || order.status}
          </span>
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="btn-outline">
            <MessageCircle className="h-4 w-4" /> WhatsApp customer
          </a>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="card overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-3">
              <h2 className="flex items-center gap-2 text-base font-bold">
                <Receipt className="h-4 w-4 text-brand-800" /> Items
              </h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {items.map((i, index) => (
                <li key={`${i.slug}-${index}`} className="flex items-start gap-3 px-5 py-3.5">
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white p-1">
                    {i.image ? (
                      <img src={i.image} alt="" className="h-full w-full object-contain" loading="lazy" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="clamp-2 block text-sm font-medium text-slate-800">{i.name}</span>
                    <span className="block text-xs text-slate-500">
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
                  {Number(order.shipping) === 0 ? 'Free' : inr(order.shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                <dt className="font-bold">Total</dt>
                <dd className="font-bold">{inr(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="text-base font-bold">Update status</h2>
            <p className="mt-1 text-xs text-slate-500">
              The customer sees this on their order page straight away.
            </p>
            <div className="mt-4">
              <StatusForm action={updateOrderStatus.bind(null, order.id)} order={order} />
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-base font-bold">Delivery tracking</h2>
            <p className="mt-1 text-xs text-slate-500">
              Fill this in once the parcel is with the courier. The customer sees it on their
              order page under My account.
            </p>
            <div className="mt-4">
              <TrackingForm action={saveTracking.bind(null, order.id)} order={order} />
            </div>
          </section>

          {events?.length ? (
            <section className="card p-5">
              <h2 className="text-base font-bold">History</h2>
              <ol className="mt-3 space-y-3">
                {events.map((e, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-800" />
                    <span>
                      <span className="block text-sm font-medium text-slate-800">
                        {STATUS_LABEL[e.status] || e.status}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {formatDate(e.created_at)}
                        {e.note ? ` · ${e.note}` : ''}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>

        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="text-base font-bold">Customer</h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li className="font-medium text-slate-800">{order.customer_name}</li>
              <li>
                <a
                  href={`tel:${order.customer_phone}`}
                  className="inline-flex items-center gap-2 text-slate-600 hover:text-brand-800"
                >
                  <Phone className="h-4 w-4 text-brand-800" /> {order.customer_phone}
                </a>
              </li>
              {order.customer_email && (
                <li>
                  <a
                    href={`mailto:${order.customer_email}`}
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-brand-800"
                  >
                    <Mail className="h-4 w-4 text-brand-800" /> {order.customer_email}
                  </a>
                </li>
              )}
              {order.business_name && (
                <li className="text-slate-600">Business: {order.business_name}</li>
              )}
              {order.gstin && <li className="text-slate-600">GSTIN: {order.gstin}</li>}
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="text-base font-bold">Delivery</h2>
            <p className="mt-2 text-sm text-slate-700">{order.shipping_method?.label}</p>
            {address.line ? (
              <p className="mt-2 flex gap-2 text-xs leading-5 text-slate-600">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-800" />
                <span>
                  {address.line}
                  <br />
                  {[address.city, address.state, address.zip].filter(Boolean).join(', ')}
                  {address.notes ? (
                    <>
                      <br />
                      Note: {address.notes}
                    </>
                  ) : null}
                </span>
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Customer will collect from the store.</p>
            )}
            <p className="mt-3 text-xs text-slate-500">
              Payment: {order.payment_method?.label || '—'}
            </p>
          </section>

          <section className="card p-5">
            <h2 className="text-base font-bold">Notes</h2>
            <div className="mt-3">
              <NotesForm action={saveAdminNotes.bind(null, order.id)} order={order} />
            </div>
          </section>

          <p className="text-xs text-slate-500">
            Store contact for this order: <span className="font-medium">{settings.store.phone}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
