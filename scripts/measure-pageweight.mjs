/**
 * Measures what one visit to the site actually downloads, so the Vercel free
 * tier can be judged against real numbers instead of guesses.
 *
 *   node scripts/measure-pageweight.mjs
 */
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3200';

async function fetchBytes(url) {
  const res = await fetch(url, { headers: { 'Accept-Encoding': 'br, gzip' } });
  const buf = Buffer.from(await res.arrayBuffer());
  return { bytes: buf.length, status: res.status, type: res.headers.get('content-type') || '' };
}

function fmt(bytes) {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

async function measurePage(path, label) {
  const res = await fetch(`${BASE}${path}`, { headers: { 'Accept-Encoding': 'br, gzip' } });
  const html = await res.text();
  const htmlBytes = Buffer.byteLength(html);

  // Everything the browser will pull for a first visit.
  const assets = new Set();
  for (const m of html.matchAll(/(?:src|href)="(\/[^"]+)"/g)) {
    const url = m[1];
    if (url.startsWith('/_next/static') || url.startsWith('/img/')) assets.add(url);
  }

  let assetBytes = 0;
  let assetCount = 0;
  const biggest = [];

  for (const url of assets) {
    try {
      const r = await fetchBytes(`${BASE}${url}`);
      assetBytes += r.bytes;
      assetCount += 1;
      biggest.push({ url, bytes: r.bytes });
    } catch (e) {
      /* ignore */
    }
  }

  biggest.sort((a, b) => b.bytes - a.bytes);

  const total = htmlBytes + assetBytes;
  console.log(`\n=== ${label} (${path}) ===`);
  console.log(`HTML                ${fmt(htmlBytes)}`);
  console.log(`Assets (${assetCount})       ${fmt(assetBytes)}`);
  console.log(`TOTAL first visit   ${fmt(total)}`);
  console.log('Largest assets:');
  for (const b of biggest.slice(0, 6)) {
    console.log(`   ${fmt(b.bytes).padStart(8)}  ${b.url.slice(0, 70)}`);
  }
  return total;
}

const home = await measurePage('/', 'Home page');
const product = await measurePage('/product/steel-guard-sl-model-2032', 'Product page');

const avg = (home + product) / 2;
console.log('\n=== Vercel Hobby bandwidth (100 GB/month) ===');
console.log(`Average first visit: ${fmt(avg)}`);
console.log(`Visits supported:    ${Math.floor((100 * 1024 * 1024 * 1024) / avg).toLocaleString('en-IN')}`);
console.log(`Per day:             ${Math.floor((100 * 1024 * 1024 * 1024) / avg / 30).toLocaleString('en-IN')}`);

// Returning visitors only re-download the HTML; assets come from cache.
const returning = (home + product) / 2 - 0;
console.log(`\n(Returning visitors send far less — JS/CSS/images are cached.)`);
