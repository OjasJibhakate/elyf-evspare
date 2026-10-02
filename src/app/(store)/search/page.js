import Link from 'next/link';
import { ChevronRight, SearchX } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { searchProducts, getCatalog } from '@/lib/catalog';

export const revalidate = 300;

export async function generateMetadata({ searchParams }) {
  const q = searchParams?.q || '';
  return {
    title: q ? `Search: ${q}` : 'Search products',
    description: `Search results for ${q || 'EV spare parts'}.`,
  };
}

export default async function SearchPage({ searchParams }) {
  const q = (searchParams?.q || '').trim();
  const results = q ? await searchProducts(q, 120) : [];
  const { products } = await getCatalog();
  const suggestions = products.filter((p) => p.stock > 0).slice(0, 8);

  return (
    <div className="container py-8">
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-brand-800">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">Search</span>
      </nav>

      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
        {q ? `Results for “${q}”` : 'Search products'}
      </h1>
      {q && (
        <p className="mt-1 text-sm text-slate-500">
          {results.length} {results.length === 1 ? 'match' : 'matches'} found
        </p>
      )}

      {!q ? (
        <>
          <p className="mt-2 text-sm text-slate-500">
            Type a part name or part number in the search bar above.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {suggestions.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </>
      ) : results.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <SearchX className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-3 text-base font-semibold text-slate-800">No parts matched “{q}”</p>
          <p className="mt-1 text-sm text-slate-500">
            Try a shorter keyword, or send us the part number on WhatsApp and we will source it.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/categories" className="btn-brand">
              Browse categories
            </Link>
            <Link href="/contact" className="btn-outline">
              Ask for a part
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
