-- ============================================================================
--  Orders: unguessable lookup tokens + tighter insert policy
-- ============================================================================

-- The customer-facing order URL uses this token, not the order number, so
-- nobody can read someone else's order by guessing a reference.
alter table public.orders
  add column if not exists lookup_token uuid not null default gen_random_uuid();

create unique index if not exists orders_lookup_token_idx on public.orders (lookup_token);

-- Order creation now happens through a server route that validates the cart and
-- recomputes every price from the products table. Direct inserts from a browser
-- (which could forge prices and totals) are no longer allowed.
drop policy if exists orders_guest_insert on public.orders;

-- Status history is readable by staff and by the owning customer only, which is
-- already covered by order_events_read. Insert stays staff-only.
