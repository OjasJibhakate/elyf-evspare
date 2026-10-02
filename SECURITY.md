# Security plan — ELYF EVSPARE

An online store gets attacked for three reasons: someone wants free products, someone
wants customer data, or someone wants to break the site. This document lists exactly how
each of those is handled.

Everything below is enforced in the database or on the server — **never in the browser**.
Anything the browser says is treated as a lie until the server proves it.

---

## 1. Accounts, roles and login

Three roles exist: `customer`, `staff`, `admin`.

- **No public admin signup.** There is no form anywhere that can create an admin. Accounts
  are created by an admin from the Team screen, or seeded directly in the database.
- Every new signup lands as `customer`, always. The default is set in the database, not in
  code, so a broken deploy cannot accidentally create an admin.
- A customer **cannot promote themselves** — even when editing their own profile. A database
  trigger blocks any change to the `role` column unless the caller is already an admin.
- Passwords are hashed by Supabase Auth (bcrypt). We never see or store them.
- Sessions are HTTP-only cookies — JavaScript on the page cannot read the token, which kills
  XSS token theft.
- Login attempts are rate limited (see §6).

### Phone OTP — the door we leave open
Login is email + password today. The `profiles.phone` column already exists and is indexed,
so switching to (or adding) phone OTP later is a configuration change plus one screen — not
a rewrite. Nothing about the current design blocks it.

---

## 2. Database access (row level security)

Every table has Row Level Security **enabled**, with explicit policies. If a policy does not
say you can do something, you cannot do it.

| Data | Anonymous visitor | Logged-in customer | Staff / Admin |
| --- | --- | --- | --- |
| Products | read (active only) | read (active only) | full |
| Categories | read (active only) | read (active only) | full |
| Home page content | read | read | full |
| Store settings | read | read | full |
| Their own profile | — | read + update (role locked) | read + update |
| Other customers' profiles | — | **no** | admins only |
| Orders | **insert only** (guest checkout) | their own orders only | all orders |
| Order history of others | — | **no** | all |
| Audit log | — | no | admins only |
| Uploading files | — | **no** | staff only |

Hidden products (`is_active = false`) are invisible to everyone except staff — useful for
preparing a new range without publishing it.

**Order privacy matters most.** A customer can only ever read rows where
`customer_id = auth.uid()`. Knowing someone's phone number is *not* enough to read their
orders through the API.

Guest order tracking (phone + order number) runs on the **server** with a service key,
returns only that one order, is rate limited, and never exposes other orders or customer
lists. It cannot be enumerated.

---

## 3. The attack that actually costs money: price tampering

The single most common e-commerce exploit is rewriting the price in the browser request.
A cart sends `price: 1` for a ₹14,990 motor and the shop eats the loss.

**How we prevent it:** the browser may only send `product_id` and `quantity`. The server
then:

1. Loads those products from the database
2. Recomputes every line total, GST, shipping and the grand total itself
3. Rejects the order if any product is missing, inactive, or below its minimum order quantity
4. Stores the server-calculated totals — the client's numbers are discarded and never read

The same rule applies to the admin panel: it never trusts hidden form fields for roles,
prices or stock.

---

## 4. Other things we explicitly guard against

- **Order spam / fake orders** — order creation is rate limited per IP and per phone number,
  with a basic bot check. Repeated junk orders get the number blocked.
- **Stock oversell** — stock is decremented inside a database transaction, so two customers
  ordering the last item cannot both succeed.
- **Duplicate submission** — the checkout sends an idempotency key; a double-tap on "Place
  order" on a slow connection creates one order, not two.
- **File upload abuse** — uploads go to a single bucket restricted to staff, capped at 5 MB,
  and limited to real image MIME types. A `.php` or `.exe` renamed to `.jpg` is rejected by
  content type, not by file extension.
- **Injection** — every query goes through parameterised Supabase/PostgREST calls or SQL with
  bound parameters. No string-built SQL, anywhere.
- **XSS** — React escapes output by default. Our own Markdown renderer escapes HTML *before*
  formatting, so a product description containing `<script>` renders as text. Rich text
  fields are sanitised on the server on save, not only on display.
- **Clickjacking** — the site refuses to be framed by another website.
- **Forced browsing** — every `/admin` page re-checks the session and role on the server. The
  middleware is a convenience, not the lock.

---

## 5. Secrets

- The Supabase **service role key bypasses every security rule.** It lives only in Vercel's
  environment variables and is used only in server-side route handlers. It is never imported
  into a client component, never sent to the browser, never committed.
- The browser only ever gets the publishable key, which can do nothing without a valid
  logged-in session.
- `.env*` is git-ignored; `.env.example` documents the variable names with no values.
- If a key is ever exposed, rotating it in Supabase is a two-minute job — no code change.

---

## 6. Rate limiting and monitoring

- Login: limited attempts per IP + per account, with a short lockout. Stops password guessing.
- Order creation and the guest tracking endpoint: limited per IP and per phone.
- Admin writes: debounced and logged.
- **Audit log** — every create/update/delete on products, categories, content and settings
  records who did it, when, and the before/after values. Written by a security-definer trigger,
  so even a staff account cannot erase its own tracks.
- Failed logins and unusual spikes are visible in Vercel + Supabase logs.

---

## 7. Transport and browser hardening

- HTTPS everywhere (Vercel), HSTS with preload.
- Security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, and a Content Security Policy that only
  allows scripts, styles and images from our own domain plus Supabase storage.
- `/admin` and `/account` are marked `noindex` — they will never appear in Google.
- Supabase cookies are `Secure`, `HttpOnly`, `SameSite=Lax`.

---

## 8. Backups and recovery

- Database: scheduled backups (Supabase daily). Free tier also allows manual `pg_dump` — we
  will keep a copy of the products table in the repo, so the catalogue can always be restored.
- Every product/category/content change is versioned in `audit_log`, so an accidental mass
  edit can be reversed.
- The storefront keeps working from its cached copy if the database is briefly unavailable.

---

## 9. Before we go live — checklist

- [ ] Supabase project created with a strong database password
- [ ] Email confirmation **on** for customer signups
- [ ] Owner account created, role set to `admin`, email confirmed
- [ ] Service role key stored only in Vercel environment variables
- [ ] Vercel project moved to the Mumbai region
- [ ] Vercel Deployment Protection turned off (it is currently blocking public access)
- [ ] Rate limits verified with a test script
- [ ] Price-tampering test: post a doctored cart and confirm the order is rejected
- [ ] RLS test: confirm an anonymous client cannot read orders or profiles
- [ ] Backup restore rehearsed once

---

## 10. What we are deliberately not doing yet

Being honest about the gaps:

- **Two-factor authentication** for admin — planned, not in phase 1. Until then, use a long
  unique password stored in a password manager.
- **CAPTCHA** on checkout — a bot check is in place; we add a real CAPTCHA only if junk orders
  actually appear, since it hurts conversion.
- **PCI compliance** — not applicable while payments are cash/UPI/bank transfer arranged
  offline. If we ever add card payments, that goes through a payment gateway (Razorpay), and
  card data never touches our servers.
- **Penetration test** — the checklist above is a solid baseline, but a full third-party
  security audit is worth doing before the shop handles serious volume.
