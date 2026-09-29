import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Package, Tag, Boxes, Hash, Ruler } from 'lucide-react';
import ProductGallery from '@/components/ProductGallery';
import BuyBox from '@/components/BuyBox';
import ProductCard from '@/components/ProductCard';
import { getProduct, getCategory, relatedProducts } from '@/lib/catalog';
import { markdownToHtml, excerpt } from '@/lib/markdown';
import { partNumberLabel, stockLabel } from '@/lib/format';

// Catalogue can change at any time (Google Sheet source), so cache for a few minutes.
export const revalidate = 300;
export const dynamicParams = true;

export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Product not found' };
  return {
    title: product.name,
    description: excerpt(product.description, 150) || `Buy ${product.name} at wholesale rates.`,
    openGraph: {
      title: product.name,
      images: product.images.slice(0, 1),
    },
  };
}

export default async function ProductPage({ params }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const category = await getCategory(product.category);
  const related = await relatedProducts(product, 8);
  const stock = stockLabel(product.stock);
  const descriptionHtml = markdownToHtml(product.description);

  const specs = [
    { icon: Hash, label: 'Part number', value: product.partNo ? product.partNo.toUpperCase() : '—' },
    { icon: Boxes, label: 'Category', value: category?.name || product.categoryName },
    { icon: Package, label: 'Unit', value: product.unit },
    { icon: Ruler, label: 'Minimum order', value: `${product.moq} ${product.unit}` },
    { icon: Tag, label: 'Availability', value: stock.text },
  ];

  return (
    <div className="container py-8">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-brand-800">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/category/${product.category}`} className="hover:text-brand-800">
          {category?.name || product.categoryName}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="clamp-2 font-medium text-slate-700">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <ProductGallery images={product.images} alt={product.name} />

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">
                {category?.name || product.categoryName}
              </p>
              <h1 className="mt-2 text-xl font-bold leading-snug sm:text-2xl">{product.name}</h1>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {product.partNo && (
                  <span className="chip">
                    <Hash className="h-3 w-3" /> {partNumberLabel(product.partNo).replace('Part No. ', '')}
                  </span>
                )}
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    stock.tone === 'ok'
                      ? 'bg-emerald-50 text-emerald-700'
                      : stock.tone === 'warn'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {stock.text}
                </span>
                <span className="chip">Min. order {product.moq} {product.unit}</span>
              </div>

              {product.description && (
                <p className="mt-4 text-sm leading-6 text-slate-600">{excerpt(product.description, 260)}</p>
              )}

              <div className="mt-6 lg:hidden">
                <BuyBox product={product} />
              </div>
            </div>
          </div>

          <section className="card p-5">
            <h2 className="text-base font-bold">Product information</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {specs.map((s) => (
                <div key={s.label} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-brand-800">
                    <s.icon className="h-4 w-4" />
                  </span>
                  <span>
                    <dt className="text-xs text-slate-500">{s.label}</dt>
                    <dd className="text-sm font-semibold text-slate-800">{s.value}</dd>
                  </span>
                </div>
              ))}
            </dl>
          </section>

          {descriptionHtml && (
            <section className="card p-5">
              <h2 className="text-base font-bold">Description</h2>
              <div className="prose-elyf mt-2" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
            </section>
          )}
        </div>

        <div className="hidden lg:block">
          <BuyBox product={product} />
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold">More from {category?.name || product.categoryName}</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
