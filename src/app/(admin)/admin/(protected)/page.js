import Link from 'next/link';
import { Package, FolderTree, AlertTriangle, TrendingUp, Plus, ArrowRight, Database } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = createClient();

  const [{ count: productCount }, { count: activeCount }, { count: categoryCount }, { data: lowStock }] =
    await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase
        .from('products')
        .select('id, name, slug, stock, unit')
        .eq('is_active', true)
        .lte('stock', 0)
        .order('name')
        .limit(30),
    ]);

  const cards = [
    { label: 'Products', value: productCount ?? 0, sub: `${activeCount ?? 0} live`, icon: Package, href: '/admin/products' },
    { label: 'Categories', value: categoryCount ?? 0, sub: 'arrange on home page', icon: FolderTree, href: '/admin/categories' },
    { label: 'Out of stock', value: lowStock?.length ?? 0, sub: 'hidden from ordering', icon: AlertTriangle, href: '/admin/products?stock=out' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Everything you change here goes live on the store within seconds.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/products/new" className="btn-brand">
            <Plus className="h-4 w-4" /> Add product
          </Link>
          <Link href="/admin/categories" className="btn-outline">
            <FolderTree className="h-4 w-4" /> Categories
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className="card p-5 transition hover:shadow-lift">
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-800">
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 text-slate-300" />
              </div>
              <p className="mt-3 text-2xl font-bold">{card.value}</p>
              <p className="text-sm font-medium text-slate-700">{card.label}</p>
              <p className="text-xs text-slate-500">{card.sub}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Out of stock
          </h2>
          {lowStock?.length ? (
            <ul className="mt-3 divide-y divide-slate-100">
              {lowStock.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                  <Link href={`/admin/products/${p.id}`} className="clamp-2 text-sm hover:text-brand-800">
                    {p.name}
                  </Link>
                  <span className="shrink-0 text-xs font-semibold text-rose-600">
                    {p.stock} {p.unit}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Nothing is out of stock. Every product can be ordered.
            </p>
          )}
          <Link href="/admin/products?stock=out" className="btn-outline mt-4 w-full">
            Review all
          </Link>
        </section>

        <section className="card p-5">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <TrendingUp className="h-4 w-4 text-brand-800" /> Quick actions
          </h2>
          <div className="mt-3 space-y-2">
            <Link href="/admin/products/new" className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm hover:border-brand-800 hover:bg-brand-50/40">
              <span className="font-medium">Add a new product</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link href="/admin/categories" className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm hover:border-brand-800 hover:bg-brand-50/40">
              <span className="font-medium">Create a category</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link href="/admin/products" className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm hover:border-brand-800 hover:bg-brand-50/40">
              <span className="font-medium">Bulk change prices</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link href="/" target="_blank" className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm hover:border-brand-800 hover:bg-brand-50/40">
              <span className="font-medium">Open the live store</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          </div>
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            <Database className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Changes are saved to the database and the storefront is refreshed automatically.
          </p>
        </section>
      </div>
    </div>
  );
}
