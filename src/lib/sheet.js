const SHEET_ID_RE = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;

export function sheetCsvUrl(input, sheetName = 'Products') {
  if (!input) return '';
  const trimmed = input.trim();
  if (trimmed.includes('output=csv') || trimmed.includes('tqx=out:csv')) return trimmed;
  const m = trimmed.match(SHEET_ID_RE);
  const id = m ? m[1] : trimmed;
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => String(cell).trim() !== ''));
}

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Accepts whatever the client pastes into the image column and turns it into
 * usable <img> sources:
 *  - https://example.com/pic.jpg
 *  - https://drive.google.com/file/d/<id>/view?usp=sharing
 *  - https://drive.google.com/open?id=<id>
 *  - plain Drive ids
 * Multiple images can be separated with a comma, semicolon or new line.
 */
export function normalizeImageUrl(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';

  const driveFile = value.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{20,})/);
  if (driveFile) return `https://lh3.googleusercontent.com/d/${driveFile[1]}`;

  const driveOpen = value.match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([a-zA-Z0-9_-]{20,})/);
  if (driveOpen) return `https://lh3.googleusercontent.com/d/${driveOpen[1]}`;

  const lh3 = value.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]{20,})/);
  if (lh3) return `https://lh3.googleusercontent.com/d/${lh3[1]}`;

  if (/^https?:\/\//i.test(value)) return value;

  if (/^[a-zA-Z0-9_-]{25,}$/.test(value)) return `https://lh3.googleusercontent.com/d/${value}`;

  return value;
}

export function splitImages(raw) {
  return String(raw || '')
    .split(/[,;\n|]+/)
    .map((part) => normalizeImageUrl(part))
    .filter(Boolean);
}

export function pick(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && String(row[key]).trim() !== '') return String(row[key]).trim();
  }
  return '';
}

export function toNumber(value, fallback = 0) {
  const cleaned = String(value ?? '')
    .replace(/[₹,\s]/g, '')
    .replace(/[^\d.-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

export function rowsToObjects(rows) {
  if (!rows.length) return [];
  const header = rows[0].map((h) => slugify(h));
  return rows.slice(1).map((r) => {
    const obj = {};
    header.forEach((key, i) => {
      obj[key] = r[i] !== undefined ? String(r[i]).trim() : '';
    });
    return obj;
  });
}

export function buildProducts(objects) {
  const products = [];
  objects.forEach((row, index) => {
    const name = pick(row, ['name', 'product-name', 'title', 'product']);
    const price = toNumber(pick(row, ['price', 'rate', 'selling-price']), 0);
    if (!name || !price) return;

    const categoryName = pick(row, ['category', 'category-name']) || 'Other';
    const categorySlug = slugify(categoryName);
    const partNo = pick(row, ['part-no', 'part-number', 'partno', 'sku']);
    const unit = (pick(row, ['unit', 'unit-label']) || 'PCS').toUpperCase();
    const moq = Math.max(1, Math.round(toNumber(pick(row, ['moq', 'minimum-quantity', 'min-qty']), 1)));
    const stock = Math.round(toNumber(pick(row, ['stock', 'quantity', 'qty']), 999));
    const mrp = toNumber(pick(row, ['mrp', 'list-price']), 0);
    const images = [
      ...splitImages(pick(row, ['image-1', 'image', 'photo', 'images'])),
      ...splitImages(pick(row, ['image-2', 'image-3', 'more-images'])),
    ];

    const slugSource = pick(row, ['slug']) || (partNo ? `${name}-${partNo}` : name);

    products.push({
      id: `sheet-${index}`,
      name,
      slug: slugify(slugSource),
      category: categorySlug,
      categoryName,
      price,
      mrp: mrp > price ? mrp : null,
      unit,
      moq,
      stock: stock > 0 ? stock : 0,
      partNo,
      images,
      description: pick(row, ['description', 'details', 'product-description']),
      tags: splitImages(pick(row, ['tags', 'tag'])),
    });
  });
  return products;
}

export function buildCategories(categoryRows, products) {
  const map = new Map();
  products.forEach((p) => {
    if (!map.has(p.category)) {
      map.set(p.category, { slug: p.category, name: p.categoryName, image: p.images[0] || '', count: 0, icon: 'box' });
    }
    const entry = map.get(p.category);
    entry.count += 1;
    if (!entry.image && p.images[0]) entry.image = p.images[0];
  });

  categoryRows.forEach((row) => {
    const name = pick(row, ['category', 'name', 'category-name']);
    if (!name) return;
    const slug = slugify(name);
    const image = splitImages(pick(row, ['image', 'photo', 'banner']))[0] || '';
    if (map.has(slug)) {
      if (image) map.get(slug).image = image;
    } else {
      map.set(slug, { slug, name, image, count: 0, icon: 'box' });
    }
  });

  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
