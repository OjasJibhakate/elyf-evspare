import Link from 'next/link';
import { Suspense } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { inr } from '@/lib/format';
import ProductRowActions from './ProductRowActions';
import BulkPriceTool from './BulkPriceTool';
import ProductsToolbar from './ProductsToolbar';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

const SORT_MAP = {
  'name-asc': { column: 'name', ascending: true },
  'name-desc': { column: 'name', ascending: false },
  newest: { column: 'created_at', ascending: false },
  oldest: { column: 'created_at', ascending: true },
  'price-asc': { column: 'price', ascending: true },
  'price-desc': { column: 'price', ascending: false },
  'stock-asc': { column: 'stock', ascending: true },
  'stock-desc': { column: 'stock', ascending: false },
};

export default async function AdminProductsPage({ searchParams }) {
  const supabase = createClient();
  const sp = searchParams || {};
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q || '').trim();
  const categoryId = sp.category || '';
  const stockFilter = sp.stock || '';
  const activeFilter = sp.active || '';
  const sort = SORT_MAP[sp.sort] ? sp.sort : 'name-asc';

  const { data: categories } = await supabase.from('categories').select('id, name').order('name');
  const categoryById = new Map((categories || []).map((c) => [c.id, c.name]));

  let query = supabase
    .from('products')
    .select('id, name, slug, price, unit, moq, stock, part_no, images, is_active, category_id', {
      count: 'exact',
    })
    .order(SORT_MAP[sort].column, { ascending: SORT_MAP[sort].ascending })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (q) {
    // Search by name or part number — wildcards are stripped so a stray % cannot
    // turn into an expensive scan.
    const safe = q.replace(/[%_]/g, '');
    query = query.or(`name.ilike.%${safe}%,part_no.ilike.%${safe}%`);
  }
  if (categoryId) query = query.eq('category_id', categoryId);
  if (stockFilter === 'out') query = query.lte('stock', 0);
  if (stockFilter === 'low') query = query.gt('stock', 0).lte('stock', 50);
  if (stockFilter === 'in') query = query.gt('stock', 50);
  if (activeFilter === 'hidden') query = query.eq('is_active', false);
  if (activeFilter === 'live') query = query.eq('is_active', true);

  const { data: products, count, error } = await query;

  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  const buildPageHref = (nextPage) => {
    const next = new URLSearchParams(sp);
    next.set('page', String(nextPage));
    return `/admin/products?${next.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-slate-500">Everything in your catalogue.</p>
        </div>
        <Link href="/admin/products/new" className="btn-brand">
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </div>

      {sp.created === '1' && (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> Product created and published to the store.
        </p>
      )}
      {sp.saved === '1' && (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> Changes saved.
        </p>
      )}

      <Suspense fallback={<div className="card h-24 animate-pulse" />}>
        <ProductsToolbar
          categories={categories || []}
          total={count ?? 0}
          showing={(products || []).length}
        />
      </Suspense>

      <BulkPriceTool categories={categories || []} />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 text-right font-semibold">Price</th>
                <th className="px-4 py-3 text-right font-semibold">Stock</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(products || []).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white p-1">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt="" className="h-full w-full object-contain" loading="lazy" />
                        ) : null}
                      </span>
                      <span className="min-w-0">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="clamp-2 block font-medium text-slate-800 hover:text-brand-800"
                        >
                          {p.name}
                        </Link>
                        {p.part_no && <span className="text-xs text-slate-500">Part No. {p.part_no}</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{categoryById.get(p.category_id) || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {inr(p.price)}
                    <span className="ml-1 text-xs text-slate-400">/ {p.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={p.stock > 0 ? 'text-slate-700' : 'font-semibold text-rose-600'}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {p.is_active ? 'Live' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ProductRowActions product={p} />
                  </td>
                </tr>
              ))}
              {!products?.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    {error ? 'Could not load products.' : 'No products match these filters.'}
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
              <Link href={buildPageHref(page - 1)} className="btn-outline py-2">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildPageHref(page + 1)} className="btn-outline py-2">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
