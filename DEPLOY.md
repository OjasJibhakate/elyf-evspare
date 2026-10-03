# Going live — Supabase + Vercel

Takes about 20 minutes. No code changes — this is all account setup and commands.

You need: a Supabase account (free) and your Vercel project.

---

## 1. Create the Supabase project

1. **supabase.com** → **New project**
2. Name: `elyf-evspare`
3. **Database password** — generate a strong one, save it in your password manager
4. **Region: Mumbai (ap-south-1)** — do not leave the default. This is the difference
   between a fast and a slow site for Indian customers.
5. Wait ~2 minutes

## 2. Create the tables

```powershell
cd C:\Users\VICTUS\web_scrapper\elyf-store
npx supabase login
npx supabase link --project-ref heuvtgojmczmnpewtzlq
npx supabase db push
```

Project ref is in the dashboard URL: `supabase.com/dashboard/project/<THIS>`.
This applies all three migrations — tables, roles, row level security, audit log, storage bucket.

## 2b. Supabase auth settings — one toggle

**Authentication → Sign In / Providers → Email → turn "Confirm email" OFF.**

Supabase's built-in mail sender only allows a few emails per hour and is meant for
testing. With confirmation on, customers sign up and simply never receive the link, so
they can never sign in — and it looks like your site is broken.

What you give up: email addresses are not verified. That is exactly why an account only
ever shows orders placed **while signed in**. Nobody can claim a stranger's guest orders
by typing their email at signup.

When you have a domain, set up custom SMTP (Resend, Brevo and Postmark all have free
tiers), turn confirmation back on, and this is solved properly.

⚠️ Supabase rejects placeholder email domains like `example.com` and `.test` at signup.
That is their anti-junk protection and it does not affect real customers.

## 3. Copy the keys

Supabase → **Project Settings → API**:

| What | Where | Variable name |
| --- | --- | --- |
| Project URL | top of page | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` / publishable key | Project API keys | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` / secret key | Project API keys — **Reveal** | `SUPABASE_SERVICE_ROLE_KEY` |

> The service role key bypasses every security rule. Vercel only — never in the code,
> never in a chat message, never in a screenshot.

## 4. Put the keys in two places

**Vercel** → your project → **Settings → Environment Variables** — add all three,
ticked for Production, Preview and Development. Then **Deployments → ⋯ → Redeploy**.

**Locally** — create `.env.production.local` in the project folder with the same three
lines. The scripts print which database they are about to touch, and ask before doing
anything to a remote one.

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 5. One command sets everything up

```powershell
node scripts/setup-production.mjs ojasjibhakate2006@gmail.com "a-strong-password" "Ojas"
```

It checks the connection, seeds the 787 products and 20 categories, loads the store
settings and home page content, and creates your admin account. Re-running it is safe.

## 6. Check it before sending the link

```powershell
$env:TEST_BASE_URL="https://your-site.vercel.app"
node scripts/security-test.mjs
node scripts/order-test.mjs
```

Both suites must be green. Then open `https://your-site.vercel.app/admin/login` and:

- [ ] Edit a product price → the storefront shows it within seconds
- [ ] Place a test order → it appears in **Orders**
- [ ] Update the status → the customer's order page shows it
- [ ] Add a staff member → sign in as them → they cannot open Team or Settings

Finally, clear the test data:

```powershell
node scripts/cleanup-demo.mjs
```

---

## ⚠️ Turn off Deployment Protection

**Vercel → Settings → Deployment Protection → Vercel Authentication → Disabled.**

While it is on, anyone opening your link gets a Vercel login wall instead of the store.
Your client will not be able to see anything.

---

## Hosting options (decide with the client)

| | Vercel Hobby (free) | Vercel Pro | Hostinger Web Apps |
| --- | --- | --- | --- |
| Cost | ₹0 | ~$20/month | ~₹3,000/year |
| Commercial use allowed | **No** | Yes | Yes |
| Setup | done | one click | a few hours |
| Who fixes outages | Vercel | Vercel | you |

Measured traffic for this store: **~822 KB per first visit**, so 100 GB (the Hobby
bandwidth allowance) is about 127,000 visits a month. A shop doing 1,000–2,000 visits
a month uses under 2% of it.

So the free tier is not limited by capacity — it is limited by *terms*. Vercel's fair
use page states Hobby is for "non-commercial personal use only", and defines commercial
as including "advertising the sale of a product or service" and "receiving payment to
create, update, or host the site".

Fine for showing the client. Not fine to run their business on.

---

## Environment variables, in full

| Name | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Database, auth, storage |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public key — browser-safe, limited by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-only: order creation, team management |
| `CATALOG_SHEET_URL` | no | Only to import products from a Google Sheet |
| `CATALOG_REVALIDATE_SECONDS` | no | Sheet refresh interval, default 300 |

## Handy commands

| Command | What it does |
| --- | --- |
| `node scripts/setup-production.mjs <email> <password> [name]` | Full production setup |
| `node scripts/seed-db.mjs` | Re-import the catalogue |
| `node scripts/create-admin.mjs <email> <password> [name]` | Add or reset an admin |
| `node scripts/security-test.mjs` | 15 access-control checks |
| `node scripts/order-test.mjs` | 14 order and pricing checks |
| `node scripts/cleanup-demo.mjs` | Clear test orders |
| `node scripts/cleanup-users.mjs` | Remove throwaway accounts |

## Backups and key rotation

- Free plan: run `npx supabase db dump -f backup.sql` occasionally and keep the file safe.
  The catalogue also lives in `src/data/products.json`, so it can always be re-imported.
- Leaked key: Supabase → Settings → API → reset, update Vercel, redeploy. No code change.
- Custom domain: Vercel → Settings → Domains, once everything else works.
