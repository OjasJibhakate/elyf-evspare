import Link from 'next/link';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { inr } from '@/lib/format';
import { STATUSES, STATUS_LABEL, STATUS_STYLE, formatDate } from '@/lib/order-status';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My orders', robots: { index: false, follow: false } };

export default async function OrdersPage({ searchParams }) {
  const filter = typeof searchParams?.status === 'string' ? searchParams.status : '';
  const supabase = createClient();

  let query = supabase
    .from('orders')
    .select('id, order_no, status, total, created_at, items, courier_name, tracking_no')
    .order('created_at', { ascending: false });

  if (STATUSES.includes(filter)) query = query.eq('status', filter);

  const { data } = await query;
  const orders = data || [];

  return (
    <div>
      <h2 className="text-base font-bold">My orders</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/account/orders"
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            !filter
              ? 'border-brand-800 bg-brand-50 text-brand-800'
              : 'border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          All
        </Link>
        {STATUSES.map((status) => (
          <Link
            key={status}
            href={`/account/orders?status=${status}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              filter === status
                ? 'border-brand-800 bg-brand-50 text-brand-800'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {STATUS_LABEL[status]}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="card mt-4 p-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <ShoppingBag className="h-5 w-5 text-slate-400" />
          </span>
          <p className="mt-3 font-semibold text-slate-800">
            {filter ? `No ${STATUS_LABEL[filter]?.toLowerCase()} orders` : 'No orders yet'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {filter
              ? 'Try a different filter.'
              : 'Orders you place while signed in will appear here.'}
          </p>
          {!filter && (
            <Link href="/categories" className="btn-brand mt-4">
              Start shopping
            </Link>
          )}
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="card flex flex-wrap items-center justify-between gap-3 p-4 transition hover:border-brand-200 hover:shadow-sm"
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{order.order_no}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        STATUS_STYLE[order.status] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {STATUS_LABEL[order.status] || order.status}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {formatDate(order.created_at)} · {order.items?.length || 0} item
                    {(order.items?.length || 0) === 1 ? '' : 's'}
                    {order.tracking_no
                      ? ` · ${order.courier_name || 'Courier'} ${order.tracking_no}`
                      : ''}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-bold">{inr(order.total)}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-800">
                    View <ArrowRight className="h-3 w-3" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
