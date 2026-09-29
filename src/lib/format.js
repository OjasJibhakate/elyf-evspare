export function inr(value) {
  const n = Number(value) || 0;
  const whole = Number.isInteger(n);
  return (
    '₹' +
    n.toLocaleString('en-IN', {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    })
  );
}

export function inrPlain(value) {
  const n = Number(value) || 0;
  const whole = Number.isInteger(n);
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function stockPhrase(stock, unit = '') {
  if (stock <= 0) return 'Out of stock';
  if (stock > 500) return 'In stock';
  return `${stock} ${unit} in stock`.trim();
}

export function productHref(slug) {
  return `/product/${slug}`;
}

export function categoryHref(slug) {
  return `/category/${slug}`;
}

export function stockLabel(stock) {
  if (stock <= 0) return { text: 'Out of stock', tone: 'danger' };
  if (stock < 50) return { text: `Only ${stock} left`, tone: 'warn' };
  return { text: 'In stock', tone: 'ok' };
}

export function cleanTitle(name) {
  return (name || '').replace(/\s+/g, ' ').trim();
}

export function partNumberLabel(partNo) {
  return partNo ? `Part No. ${partNo.toUpperCase()}` : '';
}
