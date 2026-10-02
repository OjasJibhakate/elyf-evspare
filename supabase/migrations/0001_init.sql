-- ============================================================================
--  ELYF EVSPARE — schema, roles and row level security
--  Run with:  supabase db reset        (local)
--             supabase db push         (linked project)
--
--  Order matters: tables first, then the helper functions that read them.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ----------------------------------------------------------------------------
--  Profiles (one row per auth user — customers, staff and admins)
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text not null default 'customer'
                check (role in ('customer', 'staff', 'admin')),
  full_name     text,
  phone         text,
  business_name text,
  gstin         text,
  email         text,
  is_blocked    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists profiles_phone_idx on public.profiles (phone);
create index if not exists profiles_role_idx on public.profiles (role);

-- ----------------------------------------------------------------------------
--  Role helpers — security definer so policies can read profiles safely
-- ----------------------------------------------------------------------------

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'anon');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_role() = 'admin';
$$;

-- Staff = admin or staff (can see and edit shop content)
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_role() in ('admin', 'staff');
$$;

-- ----------------------------------------------------------------------------
--  Every new auth user gets a profile with the safest possible default role
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- A customer may edit their own profile but must never be able to promote
-- themselves. RLS alone cannot express this, so a trigger guards the column.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    -- auth.uid() is null for server-side / service-role calls
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'Only an admin can change a role';
    end if;
  end if;
  if new.is_blocked is distinct from old.is_blocked then
    if auth.uid() is not null and not public.is_staff() then
      raise exception 'Only staff can block an account';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_guard_profile_role on public.profiles;
create trigger trg_guard_profile_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_staff());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- No insert policy: rows are only created by the auth trigger (security definer).
-- No delete policy: deleting an auth user cascades.

-- ----------------------------------------------------------------------------
--  Categories
-- ----------------------------------------------------------------------------

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  position    integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists categories_position_idx on public.categories (position, name);

alter table public.categories enable row level security;

drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories
  for select using (is_active or public.is_staff());

drop policy if exists categories_write on public.categories;
create policy categories_write on public.categories
  for all using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
--  Products
-- ----------------------------------------------------------------------------

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  price       numeric(12, 2) not null check (price >= 0),
  mrp         numeric(12, 2) check (mrp is null or mrp >= 0),
  unit        text not null default 'PCS',
  moq         integer not null default 1 check (moq >= 1),
  stock       integer not null default 0 check (stock >= 0),
  part_no     text,
  description text,
  images      jsonb not null default '[]'::jsonb,
  tags        jsonb not null default '[]'::jsonb,
  is_active   boolean not null default true,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_active_idx on public.products (is_active);
-- Speeds up storefront search without opening a write endpoint.
create index if not exists products_name_trgm_idx on public.products using gin (name gin_trgm_ops);

alter table public.products enable row level security;

drop policy if exists products_read on public.products;
create policy products_read on public.products
  for select using (is_active or public.is_staff());

drop policy if exists products_write on public.products;
create policy products_write on public.products
  for all using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
--  Editable homepage / content blocks
-- ----------------------------------------------------------------------------

create table if not exists public.content_blocks (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  type       text not null,
  data       jsonb not null default '{}'::jsonb,
  position   integer not null default 0,
  is_active  boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.content_blocks enable row level security;

drop policy if exists content_read on public.content_blocks;
create policy content_read on public.content_blocks
  for select using (is_active or public.is_staff());

drop policy if exists content_write on public.content_blocks;
create policy content_write on public.content_blocks
  for all using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
--  Store settings (single row) and static pages
-- ----------------------------------------------------------------------------

create table if not exists public.site_settings (
  id         integer primary key default 1 check (id = 1),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists settings_read on public.site_settings;
create policy settings_read on public.site_settings
  for select using (true);

drop policy if exists settings_write on public.site_settings;
create policy settings_write on public.site_settings
  for all using (public.is_staff()) with check (public.is_staff());

create table if not exists public.pages (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  title      text not null,
  body       text,
  is_active  boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.pages enable row level security;

drop policy if exists pages_read on public.pages;
create policy pages_read on public.pages
  for select using (is_active or public.is_staff());

drop policy if exists pages_write on public.pages;
create policy pages_write on public.pages
  for all using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
--  Orders
-- ----------------------------------------------------------------------------

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_no         text not null unique,
  customer_id      uuid references auth.users(id) on delete set null,
  customer_name    text not null,
  customer_phone   text not null,
  customer_email   text,
  business_name    text,
  gstin            text,
  shipping_address jsonb,
  shipping_method  jsonb,
  payment_method   jsonb,
  items            jsonb not null,
  subtotal         numeric(12, 2) not null check (subtotal >= 0),
  gst              numeric(12, 2) not null check (gst >= 0),
  shipping         numeric(12, 2) not null check (shipping >= 0),
  total            numeric(12, 2) not null check (total >= 0),
  status           text not null default 'new'
                   check (status in ('new', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')),
  admin_notes      text,
  idempotency_key  text unique,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists orders_customer_idx on public.orders (customer_id, created_at desc);
create index if not exists orders_phone_idx on public.orders (customer_phone);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

alter table public.orders enable row level security;

-- Guests may place orders, but they can never read them back through the API.
-- Order creation goes through a server route that validates the cart and
-- recomputes every price from the products table (never trusting the browser).
drop policy if exists orders_guest_insert on public.orders;
create policy orders_guest_insert on public.orders
  for insert with check (true);

drop policy if exists orders_read_own on public.orders;
create policy orders_read_own on public.orders
  for select using (customer_id = auth.uid() or public.is_staff());

drop policy if exists orders_staff_update on public.orders;
create policy orders_staff_update on public.orders
  for update using (public.is_staff()) with check (public.is_staff());

create table if not exists public.order_events (
  id         bigserial primary key,
  order_id   uuid not null references public.orders(id) on delete cascade,
  status     text,
  note       text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

alter table public.order_events enable row level security;

drop policy if exists order_events_read on public.order_events;
create policy order_events_read on public.order_events
  for select using (
    public.is_staff()
    or exists (
      select 1 from public.orders o
      where o.id = order_events.order_id and o.customer_id = auth.uid()
    )
  );

drop policy if exists order_events_staff_write on public.order_events;
create policy order_events_staff_write on public.order_events
  for insert with check (public.is_staff());

-- ----------------------------------------------------------------------------
--  Audit log — who changed what
-- ----------------------------------------------------------------------------

create table if not exists public.audit_log (
  id          bigserial primary key,
  actor_id    uuid,
  actor_email text,
  action      text not null,
  table_name  text not null,
  record_id   text,
  before      jsonb,
  after       jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists audit_log_created_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;

drop policy if exists audit_read on public.audit_log;
create policy audit_read on public.audit_log
  for select using (public.is_admin());

-- No insert/update/delete policies — rows are written by a security definer
-- trigger, so a compromised staff session cannot rewrite history.

create or replace function public.log_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_email text;
begin
  if actor is not null then
    select email into actor_email from public.profiles where id = actor;
  end if;

  insert into public.audit_log (actor_id, actor_email, action, table_name, record_id, before, after)
  values (
    actor,
    actor_email,
    lower(tg_op),
    tg_table_name,
    (case when tg_op = 'DELETE' then old.id else new.id end)::text,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_products on public.products;
create trigger trg_audit_products
  after insert or update or delete on public.products
  for each row execute function public.log_change();

drop trigger if exists trg_audit_categories on public.categories;
create trigger trg_audit_categories
  after insert or update or delete on public.categories
  for each row execute function public.log_change();

drop trigger if exists trg_audit_content on public.content_blocks;
create trigger trg_audit_content
  after insert or update or delete on public.content_blocks
  for each row execute function public.log_change();

drop trigger if exists trg_audit_settings on public.site_settings;
create trigger trg_audit_settings
  after update on public.site_settings
  for each row execute function public.log_change();

-- ----------------------------------------------------------------------------
--  updated_at bookkeeping
-- ----------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['categories', 'products', 'content_blocks', 'site_settings', 'pages', 'orders']
  loop
    execute format('drop trigger if exists trg_touch_%1$s on public.%1$s', t);
    execute format(
      'create trigger trg_touch_%1$s before update on public.%1$s
       for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
--  Media bucket (uploads only ever come from authenticated staff)
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists media_staff_write on storage.objects;
create policy media_staff_write on storage.objects
  for insert with check (bucket_id = 'media' and public.is_staff());

drop policy if exists media_staff_update on storage.objects;
create policy media_staff_update on storage.objects
  for update using (bucket_id = 'media' and public.is_staff());

drop policy if exists media_staff_delete on storage.objects;
create policy media_staff_delete on storage.objects
  for delete using (bucket_id = 'media' and public.is_staff());
