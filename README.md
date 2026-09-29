# ELYF EVSPARE — store front

A fast, mobile-first storefront for EV spare parts built with Next.js (App Router) and Tailwind CSS.
Includes catalogue browsing, search, cart, a full checkout flow and order confirmation with
WhatsApp hand-off.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Framework preset is detected automatically (Next.js) — click **Deploy**.

Or from the CLI:

```bash
npm i -g vercel
vercel          # preview deployment
vercel --prod   # production deployment
```

## Where things live

| Path | What it does |
| --- | --- |
| `src/lib/config.js` | Store name, phone, WhatsApp number, GST rules, shipping and payment options |
| `src/data/products.json` | Fallback catalogue (786 products) shipped with the repo |
| `src/data/categories.json` | Fallback category list with images and counts |
| `src/lib/sheet.js` | Google Sheet parsing — products, categories, image links |
| `src/lib/catalog.js` | Catalogue access used by every page (sheet first, bundled data as fallback) |
| `src/app/*` | Pages — home, categories, product, cart, checkout, order, contact, policies |
| `src/components/*` | Header, footer, product card, cart drawer, gallery, buy box |
| `src/context/CartContext.jsx` | Cart state (saved in the browser) |
| `src/lib/orders.js` | Order records + WhatsApp message builder |
| `public/img/p\|/c` | Locally optimised product and category images |
| `CLIENT-GUIDE.md` | Plain-English guide to hand to the shop owner |
| `templates/*.csv` | Column templates to import into Google Sheets |

## Letting the shop owner manage products (Google Sheet)

The store can read its catalogue straight from a Google Sheet, so products, prices,
photos, descriptions and categories are all editable without touching code.

1. Create a Google Sheet with a **Products** tab, using `templates/products-template.csv`
   as the column layout (you can import it via *File → Import*).
2. Optionally add a **Categories** tab (`templates/categories-template.csv`) to control the
   category tile images.
3. Share the sheet: **Anyone with the link → Viewer**.
4. In Vercel → Project → Settings → Environment Variables add:

   | Name | Value |
   | --- | --- |
   | `CATALOG_SHEET_URL` | the sheet link (or just the sheet id) |
   | `CATALOG_REVALIDATE_SECONDS` | `300` (optional — refresh interval) |

5. Redeploy once. From then on the owner edits the sheet and the site follows within
   `CATALOG_REVALIDATE_SECONDS`.

If `CATALOG_SHEET_URL` is missing or the sheet cannot be read, the store silently falls
back to the bundled catalogue, so the site never breaks.

## Notes for the client demo

- **Orders are stored in the browser** (`localStorage`) — there is no backend yet. Placing an
  order creates a record, shows the confirmation page and offers a pre-filled WhatsApp message
  so the shop can confirm stock and share the final invoice.
- **Prices exclude GST**; 18% is applied to most items and 5% to chargers, matching the current
  pricing policy. Change the rates in `src/lib/config.js`.
- **Shipping charges** are configured in `src/lib/config.js` (`shippingMethods`).
- To connect a real backend later, replace `saveOrder()` in `src/lib/orders.js` and the cart
  drawer/checkout submit handlers with API calls.
