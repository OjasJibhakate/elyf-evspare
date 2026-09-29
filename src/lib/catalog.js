import products from '@/data/products.json';
import categoriesData from '@/data/categories.json';

export const allProducts = products;
export const categories = categoriesData;

export function getProduct(slug) {
  return products.find((p) => p.slug === slug) || null;
}

export function getCategory(slug) {
  return categories.find((c) => c.slug === slug) || null;
}

export function productsByCategory(slug) {
  return products.filter((p) => p.category === slug);
}

export function featuredProducts(limit = 8) {
  return products
    .filter((p) => p.images.length > 1)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function newArrivals(limit = 8) {
  return products.slice().reverse().slice(0, limit);
}

export function relatedProducts(product, limit = 8) {
  if (!product) return [];
  return products
    .filter((p) => p.category === product.category && p.slug !== product.slug)
    .slice(0, limit);
}

export function searchProducts(query, limit = 40) {
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

export function quickSearch(query, limit = 6) {
  return searchProducts(query, limit).map((p) => ({
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
