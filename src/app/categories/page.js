import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getCategories } from '@/lib/catalog';
import ProductImage from '@/components/ProductImage';

export const revalidate = 300;

export const metadata = {
  title: 'All categories',
  description: 'Browse every EV spare part category — motors, controllers, chargers, brakes and more.',
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="container py-8">
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-brand-800">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-slate-700">All categories</span>
      </nav>

      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">All categories</h1>
      <p className="mt-2 text-sm text-slate-500">
        {categories.length} part families · thousands of SKUs ready to ship.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}`} className="group card overflow-hidden transition hover:shadow-lift">
            <div className="aspect-[4/3] overflow-hidden bg-slate-50">
              <ProductImage
                src={c.image}
                alt={c.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-3.5">
              <p className="clamp-2 text-sm font-semibold text-slate-800 group-hover:text-brand-800">
                {c.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">{c.count} products</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
