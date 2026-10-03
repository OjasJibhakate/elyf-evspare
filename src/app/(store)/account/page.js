import Link from 'next/link';
import { ArrowRight, Package, Truck, CheckCircle2, ShoppingBag } from 'lucide-react';
import { createClient, getSessionProfile } from '@/lib/supabase/server';
import { inr } from '@/lib/format';
import { STATUS_LABEL, STATUS_STYLE, formatDate } from '@/lib/order-status';

export const dynamic = 'force-dynamic';

export default async function AccountOverview() {
  const session = await getSessionProfile();
  const supabase = createClient();

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_no, status, total, created_at, items, courier_name, tracking_no')
    .order('created_at', { ascending: false });

  const list = orders || [];
  const inProgress = list.filter((o) =>
    ['new', 'confirmed', 'packed', 'shipped'].includes(o.status),
  ).length;
  const delivered = list.filter((o) => o.status === 'delivered').length;
  const spent = list
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total), 0);

  const missing = ['phone', 'business_name', 'gstin'].filter((k) => !session.profile[k]);

  const stats = [
    { label: 'Orders placed', value: list.length, icon: Package },
    { label: 'In progress', value: inProgress, icon: Truck },
    { label: 'Delivered', value: delivered, icon: CheckCircle2 },
    { label: 'Total value', value: inr(spent), icon: ShoppingBag },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-800">
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {missing.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            Add your business details to get a GST invoice with every order, and to check
            out faster next time.
          </p>
          <Link href="/account/profile" className="btn-outline shrink-0">
            Complete profile
          </Link>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Recent orders</h2>
          {list.length > 3 && (
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-800 hover:underline"
            >
              View all {list.length} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {list.length === 0 ? (
          <div className="card mt-4 p-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <ShoppingBag className="h-5 w-5 text-slate-400" />
            </span>
            <p className="mt-3 font-semibold text-slate-800">No orders yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Orders you place while signed in will show up here.
            </p>
            <Link href="/categories" className="btn-brand mt-4">
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {list.slice(0, 3).map((order) => (
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
                      {order.tracking_no ? ` · ${order.courier_name || 'Courier'} ${order.tracking_no}` : ''}
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
    </div>
  );
}
