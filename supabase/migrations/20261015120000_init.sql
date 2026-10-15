-- Who's Topper initial schema. Apply in the Supabase SQL editor or via the Supabase CLI.
-- Financial writes and rank allocation go through security-definer functions.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  bio text not null default '',
  website text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin', 'super_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  website_url text not null,
  normalized_url text not null unique,
  short_description text not null,
  full_description text not null,
  logo_url text,
  category_id uuid not null references public.categories (id),
  owner_id uuid references public.profiles (id) on delete set null,
  owner_username text,
  owner_display_name text,
  creator_name text not null,
  social_links jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in (
    'draft', 'pending_verification', 'pending_review', 'approved', 'rejected', 'suspended', 'removed'
  )),
  rejection_reason text,
  ownership_verified boolean not null default false,
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(short_description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(full_description, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);

create table public.product_tags (
  product_id uuid not null references public.products (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (product_id, tag_id)
);

create table public.ownership_claims (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  method text not null check (method in ('email', 'domain')),
  token_hash text not null,
  host text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'expired', 'rejected')),
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create table public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  product_id uuid not null references public.products (id),
  provider text not null check (provider in ('razorpay', 'cashfree', 'sandbox')),
  provider_order_id text unique,
  provider_payment_id text,
  amount_paise bigint not null check (amount_paise > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  purpose text not null check (purpose in ('ranking_upgrade', 'sponsored_placement')),
  scope_type text check (scope_type in ('all_time', 'daily', 'category')),
  scope_key text,
  quoted_rank integer,
  final_rank integer,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  fulfillment text not null default 'pending' check (fulfillment in ('pending', 'fulfilled', 'needs_refund', 'not_applicable')),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  unique (user_id, idempotency_key)
);

create table public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.payment_orders (id) on delete cascade,
  provider_payment_id text,
  status text not null,
  created_at timestamptz not null default now()
);

create table public.provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.payment_orders (id),
  entry_type text not null check (entry_type in ('charge', 'refund', 'adjustment')),
  amount_paise bigint not null check (amount_paise > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  direction text not null check (direction in ('credit', 'debit')),
  created_at timestamptz not null default now()
);

create unique index ledger_one_charge_per_order on public.ledger_entries (order_id) where entry_type = 'charge';
create unique index ledger_one_refund_per_order on public.ledger_entries (order_id) where entry_type = 'refund';

create table public.ranking_placements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  scope_type text not null check (scope_type in ('all_time', 'daily', 'category')),
  scope_key text not null,
  amount_paise bigint not null check (amount_paise > 0),
  confirmed_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'superseded')),
  order_id uuid references public.payment_orders (id),
  created_at timestamptz not null default now()
);

create unique index ranking_one_active_placement
  on public.ranking_placements (product_id, scope_type, scope_key)
  where status = 'active';

create index ranking_scope_order_idx
  on public.ranking_placements (scope_type, scope_key, amount_paise desc, confirmed_at asc, product_id asc)
  where status = 'active';

create table public.ranking_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  scope_type text not null,
  scope_key text not null,
  amount_paise bigint not null,
  rank integer,
  order_id uuid references public.payment_orders (id),
  reason text not null,
  created_at timestamptz not null default now()
);

create table public.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  scope_type text not null,
  scope_key text not null,
  captured_at timestamptz not null default now(),
  entry_count integer not null,
  unique (scope_type, scope_key)
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  kind text not null check (kind in ('view', 'click')),
  dedupe_key text not null unique,
  day date not null,
  created_at timestamptz not null default now()
);

create table public.analytics_daily (
  product_id uuid not null references public.products (id) on delete cascade,
  day date not null,
  views integer not null default 0,
  clicks integer not null default 0,
  primary key (product_id, day)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete set null,
  reporter_id uuid references public.profiles (id) on delete set null,
  reason text not null,
  details text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create table public.moderation_decisions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  actor_id uuid not null references public.profiles (id),
  action text not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

create table public.sponsored_placements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.webhook_failures (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  error text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index products_status_approved_idx on public.products (approved_at desc) where status = 'approved';
create index products_owner_idx on public.products (owner_id);
create index products_search_idx on public.products using gin (search_vector);
create index payment_orders_user_idx on public.payment_orders (user_id, created_at desc);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin') and deleted_at is null
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin' and deleted_at is null
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired text;
begin
  desired := lower(coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(replace(new.id::text, '-', ''), 1, 8)));
  if desired !~ '^[a-z0-9_]{3,24}$' then
    desired := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  insert into public.profiles (id, email, display_name, username, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, 'user'), '@', 1)),
    desired,
    'user'
  );
  return new;
exception when unique_violation then
  insert into public.profiles (id, email, display_name, username, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'display_name', 'New user'),
    'user_' || substr(replace(new.id::text, '-', ''), 1, 12),
    'user'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  if new.role is distinct from old.role and not public.is_super_admin() then
    raise exception 'role change not permitted';
  end if;
  return new;
end;
$$;

create trigger profiles_role_guard
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

create or replace function public.prevent_product_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;
  if new.owner_id is distinct from old.owner_id then
    raise exception 'owner change not permitted';
  end if;
  if new.status is distinct from old.status and new.status not in ('draft', 'pending_verification', 'pending_review') then
    raise exception 'status change not permitted';
  end if;
  if new.status = 'approved' and old.status is distinct from 'approved' then
    raise exception 'approval is reserved for moderators';
  end if;
  return new;
end;
$$;

create trigger products_status_guard
  before update on public.products
  for each row execute function public.prevent_product_escalation();

create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.payment_orders
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.products enable row level security;
alter table public.product_tags enable row level security;
alter table public.ownership_claims enable row level security;
alter table public.payment_orders enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.provider_events enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.ranking_placements enable row level security;
alter table public.ranking_events enable row level security;
alter table public.leaderboard_snapshots enable row level security;
alter table public.analytics_events enable row level security;
alter table public.analytics_daily enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_decisions enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.platform_settings enable row level security;
alter table public.sponsored_placements enable row level security;
alter table public.webhook_failures enable row level security;
alter table public.contact_messages enable row level security;

create policy profiles_select_private on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy categories_read on public.categories for select using (is_active or public.is_admin());
create policy categories_admin on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy tags_read on public.tags for select using (true);
create policy tags_insert on public.tags for insert to authenticated with check (true);
create policy tags_admin on public.tags for all using (public.is_admin()) with check (public.is_admin());

create policy products_public_read on public.products for select
  using (status = 'approved' or owner_id = auth.uid() or public.is_admin());
create policy products_insert_own on public.products for insert
  with check (owner_id = auth.uid() and status in ('draft', 'pending_verification'));
create policy products_update_own on public.products for update
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy product_tags_read on public.product_tags for select using (true);
create policy product_tags_write on public.product_tags for all
  using (
    public.is_admin() or exists (
      select 1 from public.products p where p.id = product_id and p.owner_id = auth.uid()
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.products p where p.id = product_id and p.owner_id = auth.uid()
    )
  );

create policy claims_own on public.ownership_claims for select using (user_id = auth.uid() or public.is_admin());
create policy claims_insert_own on public.ownership_claims for insert with check (user_id = auth.uid());

create policy orders_read on public.payment_orders for select using (user_id = auth.uid() or public.is_admin());
create policy attempts_read on public.payment_attempts for select
  using (public.is_admin() or exists (select 1 from public.payment_orders o where o.id = order_id and o.user_id = auth.uid()));
create policy ledger_read on public.ledger_entries for select
  using (public.is_admin() or exists (select 1 from public.payment_orders o where o.id = order_id and o.user_id = auth.uid()));
create policy provider_events_admin on public.provider_events for select using (public.is_admin());

create policy placements_public on public.ranking_placements for select using (status = 'active' or public.is_admin());
create policy ranking_events_admin on public.ranking_events for select using (public.is_admin());
create policy snapshots_public on public.leaderboard_snapshots for select using (true);

create policy analytics_daily_public on public.analytics_daily for select using (true);
create policy analytics_daily_owner on public.analytics_daily for select
  using (
    public.is_admin() or exists (
      select 1 from public.products p where p.id = product_id and p.owner_id = auth.uid()
    )
  );
create policy analytics_events_admin on public.analytics_events for select using (public.is_admin());

create policy notifications_own on public.notifications for select using (user_id = auth.uid());
create policy notifications_update_own on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy reports_insert on public.reports for insert with check (reporter_id is null or reporter_id = auth.uid());
create policy reports_read on public.reports for select using (reporter_id = auth.uid() or public.is_admin());
create policy decisions_admin on public.moderation_decisions for select using (public.is_admin());
create policy audit_admin on public.admin_audit_logs for select using (public.is_admin());
create policy settings_read on public.platform_settings for select using (true);
create policy settings_super on public.platform_settings for update using (public.is_super_admin()) with check (public.is_super_admin());
create policy sponsored_read on public.sponsored_placements for select using (active or public.is_admin());
create policy sponsored_admin on public.sponsored_placements for insert with check (public.is_admin());
create policy webhook_admin on public.webhook_failures for select using (public.is_admin());
create policy contact_admin on public.contact_messages for select using (public.is_admin());
create policy contact_insert on public.contact_messages for insert with check (true);

-- Profiles expose email to anyone who can select the row. Public pages must use get_public_profile.
create or replace function public.get_public_profile(p_username text)
returns table (username text, display_name text, bio text, website text)
language sql
stable
security definer
set search_path = public
as $$
  select profiles.username, profiles.display_name, profiles.bio, profiles.website
  from public.profiles
  where profiles.username = p_username and profiles.deleted_at is null;
$$;

revoke all on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;

insert into public.platform_settings (key, value) values
  ('ranking', '{"minimumBidPaise":9900,"minimumIncrementPaise":1000,"maxBidPaise":100000000}'::jsonb),
  ('sponsored', '{"weeklyPricePaise":49900,"maxActive":3}'::jsonb),
  ('moderation', '{"holdNewListingsForReview":true}'::jsonb)
on conflict (key) do nothing;
