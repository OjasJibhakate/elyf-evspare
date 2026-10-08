import Link from 'next/link';
import { ArrowRight, Search, Sparkles, PackageCheck, Wrench, Star } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import ProductImage from '@/components/ProductImage';
import { getCatalog } from '@/lib/catalog';
import { getContent } from '@/lib/content';
import { getSettings } from '@/lib/settings';
import { inr } from '@/lib/format';

export const revalidate = 300;

export default async function HomePage() {
  const [{ products, categories }, { store }, content] = await Promise.all([
    getCatalog(),
    getSettings(),
    getContent(),
  ]);

  const { hero, bulk_banner: banner } = content;
  const show = (key) => content.sections.items.find((s) => s.key === key)?.enabled !== false;

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const pick = (slugs, fallback) => {
    const chosen = (slugs || []).map((s) => bySlug.get(s)).filter(Boolean);
    return chosen.length ? chosen : fallback;
  };

  // Newest first — genuinely "newly listed", not alphabetical.
  const fresh = products
    .slice()
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 8);

  const byCategory = (slug, n = 1) => products.filter((p) => p.category === slug).slice(0, n);
  const autoHero = [
    ...byCategory('ev-motors-and-motor-accessories'),
    ...byCategory('lithium-battery-chargers'),
    ...byCategory('ev-controllers-and-dc-dc-convertors'),
    ...byCategory('ev-disc-parts'),
  ].slice(0, 4);

  const autoFeatured = products
    .filter((p) => p.images.length > 1)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 8);

  const heroPicks = pick(content.hero_products.items, autoHero);
  const featured = pick(content.featured_products.items, autoFeatured);

  const totalSkus = products.length;
  const prices = products.map((p) => p.price).filter((p) => p > 0);
  const cheapest = prices.length ? Math.min(...prices) : 0;

  const whatsappQuote = `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(
    'Hi, I want a bulk quote for EV spare parts.',
  )}`;

  return (
    <>
      {show('hero') && (
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, white 0, transparent 45%), radial-gradient(circle at 80% 0%, white 0, transparent 40%)',
            }}
          />
          <div className="container relative grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
            <div className="text-white">
              {hero.badge && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-inset ring-white/20">
                  <Sparkles className="h-3.5 w-3.5" /> {hero.badge}
                </span>
              )}
              <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                {hero.heading}
                <span className="block text-accent-400">{hero.heading_accent}</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-brand-100 sm:text-base">
                {hero.subheading}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={hero.primary_cta_href || '/categories'} className="btn-primary px-5 py-3 text-base">
                  {hero.primary_cta_label} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={hero.secondary_cta_href || '/search'}
                  className="btn px-5 py-3 text-base text-white ring-1 ring-inset ring-white/30 hover:bg-white/10"
                >
                  <Search className="h-4 w-4" /> {hero.secondary_cta_label}
                </Link>
              </div>

              <dl className="mt-8 grid max-w-lg grid-cols-3 gap-4 border-t border-white/15 pt-6">
                <div>
                  <dt className="text-xs text-brand-200">Products</dt>
                  <dd className="text-lg font-bold">{totalSkus}+</dd>
                </div>
                <div>
                  <dt className="text-xs text-brand-200">Starts from</dt>
                  <dd className="text-lg font-bold">{inr(cheapest)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-brand-200">Dispatch</dt>
                  <dd className="text-lg font-bold">24–48 hrs</dd>
                </div>
              </dl>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {heroPicks.map((p, i) => (
                <Link
                  key={p.slug}
                  href={`/product/${p.slug}`}
                  className={`group overflow-hidden rounded-2xl bg-white/95 p-3 shadow-lift transition hover:-translate-y-0.5 ${
                    i % 2 === 1 ? 'lg:mt-6' : ''
                  }`}
                >
                  <div className="aspect-square overflow-hidden rounded-xl bg-slate-50">
                    <ProductImage
                      src={p.images[0]}
                      alt={p.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-2 clamp-2 text-xs font-semibold text-slate-700">{p.name}</p>
                  <p className="text-sm font-bold text-brand-800">{inr(p.price)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {show('categories') && (
        <section className="container py-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">Shop by category</h2>
              <p className="mt-1 text-sm text-slate-500">
                Pick a part family and jump straight to what fits your scooter.
              </p>
            </div>
            <Link href="/categories" className="hidden text-sm font-semibold text-brand-800 hover:underline sm:block">
              View all {categories.length} categories →
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.slice(0, 8).map((c) => (
              <Link
                key={c.slug}
                href={`/category/${c.slug}`}
                className="group card overflow-hidden transition hover:shadow-lift"
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-50">
                  <ProductImage
                    src={c.image}
                    alt={c.name}
                    focus={c.focus}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <p className="clamp-2 text-sm font-semibold text-slate-800 group-hover:text-brand-800">
                    {c.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{c.count} products</p>
                </div>
              </Link>
            ))}
          </div>
          <Link href="/categories" className="btn-outline mt-5 w-full sm:hidden">
            View all categories
          </Link>
        </section>
      )}

      {show('bestsellers') && (
        <section className="border-y border-slate-200 bg-slate-50 py-12">
          <div className="container">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">Best sellers</h2>
                <p className="mt-1 text-sm text-slate-500">Parts our dealers reorder the most.</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {show('bulk_banner') && (
        <section className="container py-12">
          <div className="card overflow-hidden">
            <div className="grid items-center gap-8 p-8 lg:grid-cols-[1.2fr_1fr] lg:p-10">
              <div>
                <span className="chip">
                  <Wrench className="h-3.5 w-3.5" /> {banner.chip}
                </span>
                <h2 className="mt-4 text-xl font-bold sm:text-2xl">{banner.heading}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{banner.body}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a href={whatsappQuote} target="_blank" rel="noreferrer" className="btn-primary">
                    {banner.cta_label}
                  </a>
                  <a href={`tel:+${store.phoneRaw}`} className="btn-outline">
                    Call {store.phone}
                  </a>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  { icon: PackageCheck, title: 'Same-day dispatch', note: 'Orders confirmed before 4pm ship the same day.' },
                  { icon: Star, title: 'Verified quality', note: 'Every batch checked before it leaves our warehouse.' },
                  { icon: Wrench, title: 'Fitment help', note: 'Share your scooter model — we suggest the right part.' },
                ].map((row) => (
                  <li key={row.title} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-800 shadow-card">
                      <row.icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">{row.title}</span>
                      <span className="block text-xs text-slate-500">{row.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {show('new_arrivals') && (
        <section className="container pb-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">Newly listed</h2>
              <p className="mt-1 text-sm text-slate-500">Fresh stock added to the catalogue.</p>
            </div>
            <Link href="/categories" className="hidden text-sm font-semibold text-brand-800 hover:underline sm:block">
              See everything →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {fresh.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
