# Going live — Supabase + Vercel

Everything below takes about 20 minutes. Nothing here needs code changes; it is all
account setup and commands.

You will need: a Supabase account (free) and the Vercel project you already created.

---

## 1. Create the Supabase project

1. Go to **supabase.com** → **New project**
2. Name: `elyf-evspare`
3. **Database password** — generate a strong one and save it in your password manager.
   You will not need it day to day, but losing it means losing database access.
4. **Region: Mumbai (ap-south-1)** — pick this, not the default. It is the difference
   between a fast site and a slow one for Indian customers.
5. Wait ~2 minutes for it to provision.

## 2. Create the tables

From the project folder:

```powershell
cd C:\Users\VICTUS\web_scrapper\elyf-store
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

The project ref is in the Supabase URL: `supabase.com/dashboard/project/<THIS-PART>`.

`db push` applies both migrations — tables, roles, row level security, the audit log
and the storage bucket. It prints what it applied.

## 3. Copy the keys

Supabase → **Project Settings → API**. You need three values:

| What | Where | Goes into |
| --- | --- | --- |
| Project URL | top of the page | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` / publishable key | under Project API keys | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` / secret key | under Project API keys — **Reveal** first | `SUPABASE_SERVICE_ROLE_KEY` |

> The service role key bypasses every security rule. It goes in Vercel only — never in
> the code, never in a chat message, never in a screenshot.

## 4. Add them to Vercel

Vercel → your project → **Settings → Environment Variables**. Add all three, for
**Production, Preview and Development**:

```
NEXT_PUBLIC_SUPABASE_URL      = https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY     = eyJhbGciOi...
```

Then **Deployments → ⋯ → Redeploy** so the running site picks them up.

## 5. Fill the database

Still in the project folder, create a file `.env.production.local` containing the
same three values (so the scripts talk to the live database), then:

```powershell
node scripts/seed-db.mjs
```

This loads the 787 products, 20 categories, store settings, home page content and the
two policy pages.

## 6. Create your admin account

```powershell
node scripts/create-admin.mjs ojasjibhakate2006@gmail.com "a-strong-password-you-keep" "Ojas"
```

Use a password of at least 12 characters that you do not use anywhere else. There is
no way to become an admin through the website — only this command.

## 7. Check it

```powershell
$env:TEST_BASE_URL="https://your-site.vercel.app"
node scripts/security-test.mjs
node scripts/order-test.mjs
```

Both suites should be green against the live site. If anything fails, stop and fix it
before sending the link to anyone.

Then sign in at `https://your-site.vercel.app/admin/login` and check:

- [ ] Products load and you can edit a price
- [ ] The change shows on the storefront within a few seconds
- [ ] Place a test order → it appears in **Orders**
- [ ] Update its status → the customer page reflects it
- [ ] Add a staff member in **Team**, then sign in as them and confirm they cannot
      open Team or Settings

## 8. Delete the test data

```powershell
node scripts/cleanup-demo.mjs   # clears test orders
```

---

## Environment variables, in full

| Name | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Database, auth and storage |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public key — safe in the browser, limited by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-only key for order creation and team management |
| `CATALOG_SHEET_URL` | no | Only if you want to import products from a Google Sheet |
| `CATALOG_REVALIDATE_SECONDS` | no | Sheet refresh interval, default 300 |

## Things to know

**Backups.** Supabase takes daily backups on paid plans. On the free plan, run
`npx supabase db dump -f backup.sql` occasionally and keep the file somewhere safe.
The product catalogue also lives in `src/data/products.json`, so it can always be
re-imported.

**Custom domain.** Vercel → Settings → Domains → add `store.elyfevspare.com` and
follow the DNS instructions. Do this after everything else works.

**Rotating keys.** If a key ever leaks: Supabase → Settings → API → reset the key,
then update it in Vercel and redeploy. No code change needed.

**Costs.** Supabase free tier covers 500 MB database, 1 GB file storage and 50,000
monthly users — comfortably more than this shop needs for a long time.
