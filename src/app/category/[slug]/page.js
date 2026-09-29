import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import ListingToolbar from '@/components/ListingToolbar';
import { categories, getCategory, productsByCategory, priceBounds } from '@/lib/catalog';

const PAGE_SIZE = 24;

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }) {
  const category = getCategory(params.slug);
  if (!category) return { title: 'Category not found' };
  return {
    title: category.name,
    description: `Buy ${category.name} at wholesale rates — ${category.count} products, GST invoice and pan-India delivery.`,
  };
}

function applyFilters(list, sp) {
  let items = list.slice();
  const q = (sp.q || '').trim().toLowerCase();
  if (q) {
    const terms = q.split(/\s+/).filter(Boolean);
    items = items.filter((p) => {
      const hay = `${p.name} ${p.partNo} ${p.categoryName}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }
  if (sp.stock === '1') items = items.filter((p) => p.stock > 0);
  const min = Number(sp.min);
  const max = Number(sp.max);
  if (sp.min && !Number.isNaN(min)) items = items.filter((p) => p.price >= min);
  if (sp.max && !Number.isNaN(max)) items = items.filter((p) => p.price <= max);

  switch (sp.sort) {
    case 'price-asc':
      items.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      items.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      items.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      break;
  }
  return items;
}

export default function CategoryPage({ params, searchParams }) {
  const category = getCategory(params.slug);
  if (!category) notFound();

  const sp = searchParams || {};
  const all = productsByCategory(params.slug);
  const filtered = applyFilters(all, sp);
  const page = Math.max(1, Number(sp.page) || 1);
  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = filtered.length > visible.length;

  const buildPageHref = (nextPage) => {
    const search = new URLSearchParams(sp);
    search.set('page', String(nextPage));
    return `/category/${params.slug}?${search.toString()}`;
  };

  return (
    <div className="container py-8">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-brand-800">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/categories" className="hover:text-brand-800">
          Categories
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">{category.name}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{category.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {all.length} parts · wholesale pricing · GST invoice on every order
          </p>
        </div>
      </div>

      <div className="mt-6">
        <ListingToolbar total={filtered.length} bounds={priceBounds(all)} />
      </div>

      {filtered.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-base font-semibold text-slate-800">No products match these filters</p>
          <p className="mt-1 text-sm text-slate-500">
            Try clearing the filters or search for the part number instead.
          </p>
          <Link href={`/category/${params.slug}`} className="btn-brand mt-4">
            Reset filters
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 text-center">
              <Link href={buildPageHref(page + 1)} className="btn-outline px-6 py-3" scroll={false}>
                Load {Math.min(PAGE_SIZE, filtered.length - visible.length)} more products
              </Link>
              <p className="mt-2 text-xs text-slate-500">
                Showing {visible.length} of {filtered.length}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
