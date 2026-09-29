import { unstable_cache } from 'next/cache';
import bundledProducts from '@/data/products.json';
import bundledCategories from '@/data/categories.json';
import { sheetCsvUrl, parseCsv, rowsToObjects, buildProducts, buildCategories } from '@/lib/sheet';

const SHEET_URL = process.env.CATALOG_SHEET_URL || '';
const REVALIDATE_SECONDS = Number(process.env.CATALOG_REVALIDATE_SECONDS || 300);

/**
 * Catalogue source.
 *
 * By default the store renders the catalogue that ships with the repo
 * (src/data/products.json). Set CATALOG_SHEET_URL to a Google Sheet id or link
 * and the store reads products straight from the sheet instead, refreshing
 * every few minutes — so the shop owner can add or edit products without a
 * developer or a redeploy.
 */
async function loadFromSheet() {
  const productsRes = await fetch(sheetCsvUrl(SHEET_URL, 'Products'), {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!productsRes.ok) throw new Error(`products sheet responded ${productsRes.status}`);
  const products = buildProducts(rowsToObjects(parseCsv(await productsRes.text())));

  let categoryRows = [];
  try {
    const categoriesRes = await fetch(sheetCsvUrl(SHEET_URL, 'Categories'), {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (categoriesRes.ok) {
      const text = await categoriesRes.text();
      if (!/^\s*</.test(text)) categoryRows = rowsToObjects(parseCsv(text));
    }
  } catch (e) {
    /* the Categories tab is optional */
  }

  if (!products.length) throw new Error('products sheet is empty');

  return {
    products,
    categories: buildCategories(categoryRows, products),
    source: 'google-sheet',
    updatedAt: new Date().toISOString(),
  };
}

async function loadBundled() {
  return {
    products: bundledProducts,
    categories: bundledCategories,
    source: 'bundled',
    updatedAt: null,
  };
}

export const getCatalog = unstable_cache(
  async () => {
    if (SHEET_URL) {
      try {
        return await loadFromSheet();
      } catch (error) {
        console.error('[catalog] falling back to bundled catalogue:', error.message);
      }
    }
    return loadBundled();
  },
  ['elyf-catalog'],
  { revalidate: REVALIDATE_SECONDS, tags: ['catalog'] },
);

/* ------------------------------------------------------------------ */
/* helpers — every one resolves the catalogue for the current request   */
/* ------------------------------------------------------------------ */

export async function getCategories() {
  return (await getCatalog()).categories;
}

export async function getProduct(slug) {
  const { products } = await getCatalog();
  return products.find((p) => p.slug === slug) || null;
}

export async function getCategory(slug) {
  const { categories } = await getCatalog();
  return categories.find((c) => c.slug === slug) || null;
}

export async function productsByCategory(slug) {
  const { products } = await getCatalog();
  return products.filter((p) => p.category === slug);
}

export async function featuredProducts(limit = 8) {
  const { products } = await getCatalog();
  return products
    .filter((p) => p.images.length > 1)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limit);
}

export async function newArrivals(limit = 8) {
  const { products } = await getCatalog();
  return products.slice().reverse().slice(0, limit);
}

export async function relatedProducts(product, limit = 8) {
  if (!product) return [];
  const { products } = await getCatalog();
  return products
    .filter((p) => p.category === product.category && p.slug !== product.slug)
    .slice(0, limit);
}

export async function searchProducts(query, limit = 40) {
  const { products } = await getCatalog();
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const scored = [];
  for (const p of products) {
    const haystack = `${p.name} ${p.partNo} ${p.categoryName}`.toLowerCase();
    let score = 0;
    let matchedAll = true;
    for (const t of terms) {
      if (haystack.includes(t)) score += t.length >= 3 ? 3 : 1;
      else matchedAll = false;
    }
    if (!matchedAll) continue;
    if (p.name.toLowerCase().startsWith(q)) score += 6;
    if (p.partNo && p.partNo.toLowerCase() === q) score += 10;
    scored.push({ product: p, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .slice(0, limit)
    .map((s) => s.product);
}

export async function quickSearch(query, limit = 6) {
  return (await searchProducts(query, limit)).map((p) => ({
    name: p.name,
    slug: p.slug,
    price: p.price,
    unit: p.unit,
    partNo: p.partNo,
    image: p.images[0],
  }));
}

export function priceBounds(list) {
  if (!list.length) return { min: 0, max: 0 };
  let min = Infinity;
  let max = 0;
  for (const p of list) {
    if (p.price < min) min = p.price;
    if (p.price > max) max = p.price;
  }
  return { min: Math.floor(min), max: Math.ceil(max) };
}

export async function catalogStats() {
  const { products, source } = await getCatalog();
  const prices = products.map((p) => p.price).filter((p) => p > 0);
  return {
    totalProducts: products.length,
    cheapest: prices.length ? Math.min(...prices) : 0,
    source,
  };
}
