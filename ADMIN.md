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

## Layout

| Path | Purpose |
| --- | --- |
| `supabase/migrations/0001_init.sql` | Tables, roles, RLS policies, audit triggers, storage bucket |
| `src/lib/supabase/client.js` | Browser client (publishable key, RLS applies) |
| `src/lib/supabase/server.js` | Server client + `requireStaff()` / `requireAdmin()` helpers |
| `src/lib/supabase/admin.js` | Service-role client — `server-only`, never reaches the browser |
| `src/middleware.js` | Refreshes sessions, gates `/admin` and `/account` |
| `next.config.mjs` | CSP, HSTS, clickjacking and MIME-sniffing headers |
| `scripts/seed-db.mjs` | Catalogue + settings + content blocks importer |
| `scripts/create-admin.mjs` | Creates an admin account |
| `scripts/security-test.mjs` | The 15-check security suite |
