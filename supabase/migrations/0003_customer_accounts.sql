-- ----------------------------------------------------------------------------
--  Customer accounts
--
--  Everything else a customer account needs already exists in 0001:
--    · orders_read_own        — a customer can read their own orders
--    · order_events_read      — and their order's status history
--    · profiles_update_own    — and edit their own details
--    · guard_profile_role     — but never their own role or blocked flag
--
--  This migration adds the two things that are genuinely missing: a cart that
--  follows the customer between devices, and delivery tracking.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
--  Saved cart
--
--  A separate table rather than a column on profiles: cart writes happen on
--  every quantity change, and there is no reason for them to touch the row that
--  holds a user's role and blocked flag.
-- ----------------------------------------------------------------------------

create table if not exists public.carts (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  items      jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.carts enable row level security;

-- A cart is private to its owner. No staff policy on purpose — there is no
-- support reason for anyone else to read a customer's basket.
drop policy if exists carts_own on public.carts;
create policy carts_own on public.carts
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop trigger if exists trg_touch_carts on public.carts;
create trigger trg_touch_carts
  before update on public.carts
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
--  Delivery tracking
--
--  Filled in from the admin panel once a parcel is handed to the courier, so
--  the customer's order page can show something more useful than "shipped".
-- ----------------------------------------------------------------------------

alter table public.orders add column if not exists courier_name text;
alter table public.orders add column if not exists tracking_no  text;

-- ----------------------------------------------------------------------------
--  Saved delivery address
--
--  Stored on the profile so checkout can fill the form in for a signed-in
--  customer. Writable only through profiles_update_own, and guard_profile_role
--  still blocks any attempt to touch role or is_blocked alongside it.
-- ----------------------------------------------------------------------------

alter table public.profiles add column if not exists default_address jsonb;
