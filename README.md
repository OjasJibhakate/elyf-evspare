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
| `src/data/products.json` | Catalogue (786 products) generated from the supplier sheet |
| `src/data/categories.json` | Category list with images and counts |
| `src/app/*` | Pages — home, categories, product, cart, checkout, order, contact, policies |
| `src/components/*` | Header, footer, product card, cart drawer, gallery, buy box |
| `src/context/CartContext.jsx` | Cart state (saved in the browser) |
| `src/lib/orders.js` | Order records + WhatsApp message builder |
| `public/img/p|/c` | Locally optimised product and category images |

## Notes for the client demo

- **Orders are stored in the browser** (`localStorage`) — there is no backend yet. Placing an
  order creates a record, shows the confirmation page and offers a pre-filled WhatsApp message
  so the shop can confirm stock and share the final invoice.
- **Prices exclude GST**; 18% is applied to most items and 5% to chargers, matching the current
  pricing policy. Change the rates in `src/lib/config.js`.
- **Shipping charges** are configured in `src/lib/config.js` (`shippingMethods`).
- To connect a real backend later, replace `saveOrder()` in `src/lib/orders.js` and the cart
  drawer/checkout submit handlers with API calls.
