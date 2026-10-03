import Link from 'next/link';
import { Search, ShoppingBag } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { inr } from '@/lib/format';
import { STATUSES, STATUS_LABEL, STATUS_STYLE, formatDate } from '@/lib/order-status';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Orders', robots: { index: false } };

const PAGE_SIZE = 25;

export default async function AdminOrdersPage({ searchParams }) {
  const supabase = createClient();
  const sp = searchParams || {};
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q || '').trim().replace(/[%_,]/g, '');
  const status = STATUSES.includes(sp.status) ? sp.status : '';

  let query = supabase
    .from('orders')
    .select('id, order_no, customer_name, customer_phone, total, status, created_at, items', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (q) {
    query = query.or(`order_no.ilike.%${q}%,customer_phone.ilike.%${q}%,customer_name.ilike.%${q}%`);
  }
  if (status) query = query.eq('status', status);

  const { data: orders, count, error } = await query;
  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  const buildHref = (patch) => {
    const next = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => {
      if (!v) next.delete(k);
      else next.set(k, v);
    });
    if (!('page' in patch)) next.delete('page');
    const qs = next.toString();
    return `/admin/orders${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">
          {count ?? 0} order{count === 1 ? '' : 's'} placed on the website.
        </p>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <form action="/admin/orders" className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search order number, phone or name…"
              className="input py-2 pl-9"
            />
            {status && <input type="hidden" name="status" value={status} />}
          </form>

          <Link
            href="/admin/orders"
            className={`btn-outline py-2 ${!status ? 'border-brand-800 text-brand-800' : ''}`}
          >
            All
          </Link>
          {['new', 'confirmed', 'shipped', 'delivered'].map((s) => (
            <Link
              key={s}
              href={buildHref({ status: s })}
              className={`btn-outline py-2 ${status === s ? 'border-brand-800 text-brand-800' : ''}`}
            >
              {STATUS_LABEL[s]}
            </Link>
          ))}
          <button type="submit" className="btn-outline py-2">
            Search
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(orders || []).map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold text-slate-800 hover:text-brand-800">
                      {o.order_no}
                    </Link>
                    <span className="block text-xs text-slate-500">{formatDate(o.created_at)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block text-slate-800">{o.customer_name}</span>
                    <span className="block text-xs text-slate-500">{o.customer_phone}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {Array.isArray(o.items) ? o.items.length : 0} line
                    {Array.isArray(o.items) && o.items.length === 1 ? '' : 's'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{inr(o.total)}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        STATUS_STYLE[o.status] || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {STATUS_LABEL[o.status] || o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/orders/${o.id}`} className="btn-outline px-3 py-1.5 text-xs">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {!orders?.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                      <ShoppingBag className="h-5 w-5 text-slate-400" />
                    </span>
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      {error ? 'Could not load orders.' : 'No orders yet.'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Orders placed on the website appear here immediately.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildHref({ page: String(page - 1) })} className="btn-outline py-2">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildHref({ page: String(page + 1) })} className="btn-outline py-2">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
