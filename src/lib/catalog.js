import { unstable_cache } from 'next/cache';
import bundledProducts from '@/data/products.json';
import bundledCategories from '@/data/categories.json';
import { sheetCsvUrl, parseCsv, rowsToObjects, buildProducts, buildCategories } from '@/lib/sheet';
import { createPublicClient, supabaseConfigured } from '@/lib/supabase/public';

const SHEET_URL = process.env.CATALOG_SHEET_URL || '';
const REVALIDATE_SECONDS = Number(process.env.CATALOG_REVALIDATE_SECONDS || 300);

/**
 * Catalogue source, in priority order:
 *
 *   1. Supabase      — the admin panel writes here (cache tag: 'catalog')
 *   2. Google Sheet  — optional bulk-import source
 *   3. bundled JSON  — always works, so the storefront can never go blank
 *
 * Everything is cached under the 'catalog' tag, so saving in the admin panel
 * refreshes the whole storefront immediately.
 */

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function loadFromSupabase() {
  const supabase = createPublicClient();
  if (!supabase) throw new Error('supabase not configured');

  const [{ data: categoryRows, error: categoryError }, { data: productRows, error: productError }] =
    await Promise.all([
      supabase
        .from('categories')
        .select('id, name, slug, image_url, image_focus, position')
        .eq('is_active', true)
        .order('position'),
      supabase
        .from('products')
        .select(
          'id, name, slug, category_id, price, mrp, unit, moq, stock, part_no, description, images, tags, created_at',
        )
        .eq('is_active', true)
        .order('name'),
    ]);

  if (categoryError) throw categoryError;
  if (productError) throw productError;
  if (!productRows?.length) throw new Error('no products in database');

  const categoryById = new Map(categoryRows.map((c) => [c.id, c]));

  const products = productRows.map((row) => {
    const category = categoryById.get(row.category_id);
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: category?.slug || 'uncategorised',
      categoryName: category?.name || 'Other',
      price: toNumber(row.price),
      mrp: row.mrp === null || row.mrp === undefined ? null : toNumber(row.mrp),
      unit: row.unit || 'PCS',
      moq: toNumber(row.moq, 1),
      stock: toNumber(row.stock, 0),
      partNo: row.part_no || '',
      images: Array.isArray(row.images) ? row.images : [],
      description: row.description || '',
      tags: Array.isArray(row.tags) ? row.tags : [],
      createdAt: row.created_at || null,
    };
  });

  const counts = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  const categories = categoryRows
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      image: c.image_url || '',
      focus: c.image_focus || null,
      position: c.position ?? 0,
      icon: 'box',
      count: counts[c.slug] || 0,
    }))
    .filter((c) => c.count > 0 || c.image);

  return { products, categories, source: 'supabase', updatedAt: new Date().toISOString() };
}

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

function loadBundled() {
  return {
    products: bundledProducts,
    categories: bundledCategories,
    source: 'bundled',
    updatedAt: null,
  };
}

export const getCatalog = unstable_cache(
  async () => {
    if (supabaseConfigured()) {
      try {
        return await loadFromSupabase();
      } catch (error) {
        console.error('[catalog] Supabase unavailable, falling back:', error.message);
      }
    }
    if (SHEET_URL) {
      try {
        return await loadFromSheet();
      } catch (error) {
        console.error('[catalog] sheet failed, falling back:', error.message);
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
  const { products, categories, source } = await getCatalog();
  const prices = products.map((p) => p.price).filter((p) => p > 0);
  return {
    totalProducts: products.length,
    totalCategories: categories.length,
    cheapest: prices.length ? Math.min(...prices) : 0,
    source,
  };
}
