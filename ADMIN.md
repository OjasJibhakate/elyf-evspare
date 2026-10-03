# Admin panel + security

This folder now contains the foundations of the admin panel: the database schema,
role model, row level security, and a test suite that proves the rules hold.

**Design decisions and threat model: [SECURITY.md](SECURITY.md).**

## Local development

Prerequisites: Docker Desktop running, Node 18.17+.

```bash
npm install
npx supabase start          # boots Postgres + Auth + Storage locally (first run pulls images)
npx supabase db reset       # applies supabase/migrations/*.sql
node scripts/seed-db.mjs    # loads the 786-product catalogue
```

`npx supabase start` prints the local API URL and keys. Copy them into
`.env.local` (see `.env.example` for the shape) — or use the values the CLI
prints under *Authentication Keys*.

Create your admin account (there is no signup form for admins, on purpose):

```bash
node scripts/create-admin.mjs you@example.com "a-strong-password" "Your Name"
```

Then run the app:

```bash
npm run dev                 # storefront on :3000, admin on :3000/admin
```

## Prove the security rules still hold

```bash
node scripts/security-test.mjs
```

It creates two throwaway customer accounts, attempts the attacks that matter
(reading other people's orders, self-promoting to admin, editing products as a
guest, rewriting an order total), prints PASS/FAIL for each, and cleans up.

Run it after **every** change to the schema or policies. A green run is the
release gate.

## Deploying the database to a real project

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
node scripts/create-admin.mjs you@example.com "a-strong-password" "Your Name"
```

Add the three Supabase values to Vercel → Settings → Environment Variables, then
redeploy. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.

## Customer accounts

Customers have their own area at `/account` — order history, a status timeline, saved
delivery details and a cart that follows them between devices. Guest checkout is still
open; nothing forces an account.

How the pieces fit:

- **Nothing is claimed retroactively.** Only orders placed *while signed in* are linked to
  an account. Guest orders stay reachable through the confirmation link the customer
  already has. This matters because signup does not verify email addresses — matching past
  orders by email would let anyone read a stranger's name, phone, address and items.
- **`orders.customer_id` comes from the session cookie**, never from the request body.
  The order API ignores any customer id a browser tries to send.
- **Carts are private.** `public.carts` has no staff policy at all — there is no support
  reason for anyone else to read a customer's basket.
- **Merging a cart** keeps the larger quantity per product rather than summing, so opening
  a second device never doubles an order.
- **Tracking numbers** are entered per order in Admin → Orders → Delivery tracking, and
  appear on the customer's order page immediately.

## Layout

| Path | Purpose |
| --- | --- |
| `supabase/migrations/0001_init.sql` | Tables, roles, RLS policies, audit triggers, storage bucket |
| `supabase/migrations/0002_order_tokens.sql` | Secret order-lookup token |
| `supabase/migrations/0003_customer_accounts.sql` | Saved carts, courier + tracking, default address |
| `src/lib/supabase/client.js` | Browser client (publishable key, RLS applies) |
| `src/lib/supabase/server.js` | Server client + `requireStaff()` / `requireAdmin()` helpers |
| `src/lib/supabase/admin.js` | Service-role client — `server-only`, never reaches the browser |
| `src/lib/cart-sync.js` | Cart merge rules and remote read/write |
| `src/lib/safe-next.js` | Stops `?next=` being used as an open redirect |
| `src/middleware.js` | Refreshes sessions, gates `/admin` and `/account` |
| `next.config.mjs` | CSP, HSTS, clickjacking and MIME-sniffing headers |
| `scripts/seed-db.mjs` | Catalogue + settings + content blocks importer |
| `scripts/create-admin.mjs` | Creates an admin account |
| `scripts/verify-env.mjs` | Checks the connection and where the catalogue is coming from |
| `scripts/security-test.mjs` | The 22-check security suite |
