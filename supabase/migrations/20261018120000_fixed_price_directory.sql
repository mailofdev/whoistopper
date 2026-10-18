-- Fixed-price advertising directory.
-- Historical payment_orders and ledger_entries are left in place.
-- Public boards stop ordering by amount. New ranking upgrades are refused.

create table if not exists public.category_migrations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  from_slug text not null,
  to_slug text,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists category_migrations_product_idx on public.category_migrations (product_id);

alter table public.category_migrations enable row level security;
revoke all on table public.category_migrations from anon, authenticated;

create table if not exists public.ad_packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  price_paise bigint not null check (price_paise > 0),
  duration_hours integer not null check (duration_hours > 0),
  placement text not null check (placement in ('daily_featured', 'weekly_featured', 'category_sponsor')),
  exclusive boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  package_id uuid not null references public.ad_packages (id),
  order_id uuid not null unique references public.payment_orders (id),
  category_id uuid references public.categories (id),
  placement text not null check (placement in ('daily_featured', 'weekly_featured', 'category_sponsor')),
  status text not null check (status in ('scheduled', 'active', 'expired', 'cancelled', 'refunded')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  constraint ad_campaigns_window check (
    (status = 'scheduled' and starts_at is null and ends_at is null)
    or (starts_at is not null and ends_at is not null and ends_at > starts_at)
    or status in ('expired', 'cancelled', 'refunded')
  )
);

create index if not exists ad_campaigns_visible_idx
  on public.ad_campaigns (placement, starts_at, product_id)
  where status = 'active';
create index if not exists ad_campaigns_category_idx
  on public.ad_campaigns (category_id, starts_at)
  where status = 'active' and placement = 'category_sponsor';
create index if not exists ad_campaigns_product_idx on public.ad_campaigns (product_id, status);
create index if not exists products_organic_idx
  on public.products (approved_at desc, name)
  where status = 'approved';

create table if not exists public.listing_contacts (
  product_id uuid primary key references public.products (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.ad_packages enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.listing_contacts enable row level security;
revoke all on table public.listing_contacts from anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ad_packages' and policyname = 'ad_packages_read') then
    create policy ad_packages_read on public.ad_packages for select using (is_active or public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ad_packages' and policyname = 'ad_packages_admin') then
    create policy ad_packages_admin on public.ad_packages for update using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ad_campaigns' and policyname = 'ad_campaigns_read') then
    create policy ad_campaigns_read on public.ad_campaigns for select using (
      public.is_admin()
      or (status = 'active' and starts_at is not null and starts_at <= now() and ends_at > now())
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'category_migrations' and policyname = 'category_migrations_admin') then
    create policy category_migrations_admin on public.category_migrations for select using (public.is_admin());
  end if;
end $$;

alter table public.payment_orders add column if not exists package_id uuid references public.ad_packages (id);
alter table public.payment_orders add column if not exists quoted_starts_at timestamptz;
alter table public.payment_orders add column if not exists quoted_ends_at timestamptz;
create index if not exists payment_orders_package_idx on public.payment_orders (package_id);

alter table public.payment_orders drop constraint if exists payment_orders_purpose_check;
alter table public.payment_orders add constraint payment_orders_purpose_check
  check (purpose in ('ranking_upgrade', 'sponsored_placement', 'advertising_package'));

alter table public.payment_orders drop constraint if exists payment_orders_status_check;
alter table public.payment_orders add constraint payment_orders_status_check
  check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded', 'refund_pending'));

insert into public.categories (slug, name, description, sort_order, is_active, group_slug, group_name, group_sort, field_set)
values
  ('websites-saas', 'Websites & SaaS', 'Public websites, web apps, and software products.', 1, true, 'directory', 'Directory', 1, 'websites-saas'),
  ('business-startups', 'Business & Startups', 'Companies, brands, and service businesses with a public page.', 2, true, 'directory', 'Directory', 1, 'business-startups'),
  ('developer-tools', 'Developer Tools', 'Libraries, APIs, CLIs, and other tools for people building software.', 3, true, 'directory', 'Directory', 1, 'developer-tools'),
  ('instagram-pages', 'Instagram Pages', 'Public Instagram pages. Account passwords and private data are never collected.', 4, true, 'directory', 'Directory', 1, 'instagram-pages'),
  ('youtube-channels', 'YouTube Channels', 'Public YouTube channels. Listing a channel does not verify its audience.', 5, true, 'directory', 'Directory', 1, 'youtube-channels'),
  ('other-online-profiles', 'Other Online Profiles', 'Public profiles on LinkedIn, X, a personal site, or a similar network.', 6, true, 'directory', 'Directory', 1, 'other-online-profiles'),
  ('gaming-esports', 'Gaming & Esports', 'Players, teams, tournaments, communities, and gaming websites.', 7, true, 'directory', 'Directory', 1, 'gaming-esports'),
  ('art-creative-work', 'Art & Creative Work', 'Public portfolios of illustration, photography, design, writing, and animation.', 8, true, 'directory', 'Directory', 1, 'art-creative-work'),
  ('music-entertainment', 'Music & Entertainment', 'Musicians, podcasts, entertainment channels, and public events.', 9, true, 'directory', 'Directory', 1, 'music-entertainment'),
  ('skills-portfolios', 'Skills & Portfolios', 'Professional profiles and portfolios.', 10, true, 'directory', 'Directory', 1, 'skills-portfolios')
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order,
    is_active = true,
    group_slug = excluded.group_slug,
    group_name = excluded.group_name,
    group_sort = excluded.group_sort,
    field_set = excluded.field_set;

insert into public.category_migrations (product_id, from_slug, to_slug, reason)
select p.id, c.slug, m.to_slug, m.reason
from public.products p
join public.categories c on c.id = p.category_id
join (
  values
    ('saas', 'websites-saas', 'legacy catalogue map'),
    ('fintech', 'business-startups', 'legacy catalogue map'),
    ('commerce', 'business-startups', 'legacy catalogue map'),
    ('health', 'business-startups', 'legacy catalogue map'),
    ('climate', 'business-startups', 'legacy catalogue map'),
    ('education', 'skills-portfolios', 'legacy catalogue map'),
    ('media', 'music-entertainment', 'default media map; review if the listing is not entertainment'),
    ('achievements-skills', 'skills-portfolios', 'catalogue replacement')
) as m(from_slug, to_slug, reason) on m.from_slug = c.slug
where not exists (
  select 1 from public.category_migrations existing
  where existing.product_id = p.id and existing.from_slug = c.slug
);

update public.products p
set category_id = target.id
from public.categories c
join (
  values
    ('saas', 'websites-saas'),
    ('fintech', 'business-startups'),
    ('commerce', 'business-startups'),
    ('health', 'business-startups'),
    ('climate', 'business-startups'),
    ('education', 'skills-portfolios'),
    ('media', 'music-entertainment'),
    ('achievements-skills', 'skills-portfolios')
) as m(from_slug, to_slug) on m.from_slug = c.slug
join public.categories target on target.slug = m.to_slug
where p.category_id = c.id;

insert into public.category_migrations (product_id, from_slug, to_slug, reason)
select p.id, c.slug, null, 'left on an inactive category for manual review'
from public.products p
join public.categories c on c.id = p.category_id
where c.slug in ('cars-bikes', 'luxury-gadgets', 'travel-experiences', 'fashion-collections', 'fitness-lifestyle')
  and not exists (
    select 1 from public.category_migrations existing
    where existing.product_id = p.id and existing.from_slug = c.slug
  );

update public.categories
set is_active = false
where slug in (
  'saas', 'fintech', 'commerce', 'education', 'health', 'climate', 'media',
  'cars-bikes', 'luxury-gadgets', 'travel-experiences', 'fashion-collections',
  'achievements-skills', 'fitness-lifestyle'
);

create or replace function public.reject_retired_category()
returns trigger
language plpgsql
as $$
begin
  if new.is_active and new.slug = any (array[
    'saas', 'fintech', 'commerce', 'education', 'health', 'climate', 'media',
    'cars-bikes', 'luxury-gadgets', 'travel-experiences', 'fashion-collections',
    'achievements-skills', 'fitness-lifestyle'
  ]) then
    raise exception 'retired category cannot be activated';
  end if;
  return new;
end;
$$;

drop trigger if exists categories_reject_retired on public.categories;
create trigger categories_reject_retired
  before insert or update on public.categories
  for each row execute function public.reject_retired_category();

insert into public.ad_packages (slug, name, description, price_paise, duration_hours, placement, exclusive, is_active, sort_order)
values
  ('daily-featured', 'Daily Featured Listing', 'Labelled advertisement on Today''s Featured Ads for 24 hours from activation.', 19900, 24, 'daily_featured', false, true, 1),
  ('weekly-featured', 'Weekly Featured Listing', 'Labelled advertisement on the permanent directory for seven days from activation.', 99900, 168, 'weekly_featured', false, true, 2),
  ('weekly-category-sponsor', 'Weekly Category Sponsor', 'Labelled category sponsorship for seven days from activation.', 199900, 168, 'category_sponsor', false, true, 3)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    duration_hours = excluded.duration_hours,
    placement = excluded.placement,
    exclusive = excluded.exclusive,
    is_active = true,
    sort_order = excluded.sort_order;
-- price_paise is intentionally not overwritten, so an administrator price change survives a re-seed.

create or replace function public.create_ranking_order(
  p_product_id uuid,
  p_scope text,
  p_amount bigint,
  p_idempotency text,
  p_quoted_rank integer,
  p_provider text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'ranking upgrades are closed';
end;
$$;

create or replace function public.apply_provider_event(
  p_provider text,
  p_event_id text,
  p_event_type text,
  p_provider_order_id text,
  p_provider_payment_id text,
  p_amount bigint,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.payment_orders%rowtype;
  v_package public.ad_packages%rowtype;
  v_product_status text;
  v_category uuid;
  v_start timestamptz;
  v_end timestamptz;
begin
  if auth.role() <> 'service_role' then
    raise exception 'webhook processing is server-only';
  end if;
  if p_provider = 'sandbox' and coalesce((select value->>'allowSandbox' from public.platform_settings where key = 'payments')::boolean, false) is not true then
    raise exception 'sandbox payments are disabled';
  end if;
  insert into public.provider_events (provider, event_id, event_type)
  values (p_provider, p_event_id, p_event_type)
  on conflict (provider, event_id) do nothing;
  if not found then
    select * into v_order from public.payment_orders where provider_order_id = p_provider_order_id;
    return jsonb_build_object('duplicate', true, 'orderId', v_order.id, 'status', v_order.status, 'finalRank', null, 'fulfillment', v_order.fulfillment, 'ignored', false);
  end if;

  select * into v_order from public.payment_orders where provider_order_id = p_provider_order_id for update;
  if v_order.id is null then
    insert into public.webhook_failures (provider, event_id, error)
    values (p_provider, p_event_id, 'No order matches this provider reference.');
    raise exception 'unknown order';
  end if;

  if p_event_type = 'payment.captured' then
    if p_currency <> 'INR' or p_amount is distinct from v_order.amount_paise then
      raise exception 'amount mismatch';
    end if;
    if v_order.status in ('paid', 'refunded', 'refund_pending') then
      return jsonb_build_object('duplicate', true, 'orderId', v_order.id, 'status', v_order.status, 'finalRank', null, 'fulfillment', v_order.fulfillment, 'ignored', false);
    end if;
    if v_order.status <> 'pending' then
      raise exception 'invalid capture state';
    end if;
    insert into public.ledger_entries (order_id, entry_type, amount_paise, currency, direction)
    values (v_order.id, 'charge', v_order.amount_paise, 'INR', 'credit');
    update public.payment_orders
      set status = 'paid', provider_payment_id = p_provider_payment_id, paid_at = now(), fulfillment = 'pending'
      where id = v_order.id;

    if v_order.purpose = 'advertising_package' then
      select * into v_package from public.ad_packages where id = v_order.package_id and is_active;
      if v_package.id is null or v_package.price_paise is distinct from v_order.amount_paise then
        update public.payment_orders set status = 'refund_pending', fulfillment = 'needs_refund' where id = v_order.id;
      else
        select status, category_id into v_product_status, v_category from public.products where id = v_order.product_id;
        if v_package.placement = 'category_sponsor' and v_order.scope_key ~* '^[0-9a-f-]{36}$' then
          v_category := v_order.scope_key::uuid;
        end if;
        if v_product_status = 'approved' then
          v_start := now();
          v_end := v_start + make_interval(hours => v_package.duration_hours);
          insert into public.ad_campaigns (product_id, package_id, order_id, category_id, placement, status, starts_at, ends_at)
          values (v_order.product_id, v_package.id, v_order.id, v_category, v_package.placement, 'active', v_start, v_end)
          on conflict (order_id) do nothing;
          update public.payment_orders
            set fulfillment = 'fulfilled', quoted_starts_at = v_start, quoted_ends_at = v_end
            where id = v_order.id;
        else
          insert into public.ad_campaigns (product_id, package_id, order_id, category_id, placement, status, starts_at, ends_at)
          values (v_order.product_id, v_package.id, v_order.id, v_category, v_package.placement, 'scheduled', null, null)
          on conflict (order_id) do nothing;
          update public.payment_orders set fulfillment = 'pending' where id = v_order.id;
        end if;
      end if;
    elsif v_order.purpose = 'ranking_upgrade' then
      update public.payment_orders set status = 'refund_pending', fulfillment = 'needs_refund' where id = v_order.id;
    end if;
  elsif p_event_type = 'payment.failed' and v_order.status = 'pending' then
    update public.payment_orders set status = 'failed', fulfillment = 'not_applicable' where id = v_order.id;
  elsif p_event_type = 'payment.cancelled' and v_order.status = 'pending' then
    update public.payment_orders set status = 'cancelled', fulfillment = 'not_applicable' where id = v_order.id;
  elsif p_event_type = 'refund.processed' and v_order.status in ('paid', 'refund_pending') and p_amount = v_order.amount_paise then
    insert into public.ledger_entries (order_id, entry_type, amount_paise, currency, direction)
    values (v_order.id, 'refund', v_order.amount_paise, 'INR', 'debit');
    update public.ad_campaigns set status = 'refunded' where order_id = v_order.id and status in ('scheduled', 'active');
    update public.ranking_placements set status = 'superseded' where order_id = v_order.id and status = 'active';
    update public.payment_orders set status = 'refunded', fulfillment = 'not_applicable', final_rank = null where id = v_order.id;
  elsif p_event_type in ('payment.failed', 'payment.cancelled') then
    return jsonb_build_object('duplicate', false, 'ignored', true, 'orderId', v_order.id, 'status', v_order.status, 'finalRank', null, 'fulfillment', v_order.fulfillment);
  else
    raise exception 'event cannot be applied';
  end if;

  select * into v_order from public.payment_orders where id = v_order.id;
  return jsonb_build_object('duplicate', false, 'ignored', false, 'orderId', v_order.id, 'status', v_order.status, 'finalRank', null, 'fulfillment', v_order.fulfillment);
end;
$$;

create or replace function public.activate_scheduled_campaigns(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_start timestamptz := now();
begin
  if auth.role() <> 'service_role' and not public.is_admin() then
    raise exception 'campaign activation is restricted';
  end if;
  for v_row in
    select c.id, c.order_id, p.duration_hours
    from public.ad_campaigns c
    join public.ad_packages p on p.id = c.package_id
    where c.product_id = p_product_id and c.status = 'scheduled'
    for update
  loop
    update public.ad_campaigns
      set status = 'active', starts_at = v_start, ends_at = v_start + make_interval(hours => v_row.duration_hours)
      where id = v_row.id;
    update public.payment_orders
      set fulfillment = 'fulfilled', quoted_starts_at = v_start, quoted_ends_at = v_start + make_interval(hours => v_row.duration_hours)
      where id = v_row.order_id and status = 'paid' and fulfillment = 'pending';
  end loop;
end;
$$;

create or replace function public.expire_ad_campaigns()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  if auth.role() <> 'service_role' then
    raise exception 'campaign expiry is server-only';
  end if;
  update public.ad_campaigns
    set status = 'expired'
    where status = 'active' and ends_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.get_leaderboard(
  p_scope_type text,
  p_scope_key text,
  p_limit integer,
  p_offset integer,
  p_query text default '',
  p_category_id uuid default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with sponsored as (
    select
      p.id, p.slug, p.name, p.short_description, c.name as category_name, c.slug as category_slug,
      coalesce(array_agg(t.slug) filter (where t.slug is not null), '{}') as tags,
      'sponsored'::text as placement,
      null::integer as rank,
      null::bigint as amount_paise,
      p.ownership_verified, p.approved_at, camp.starts_at as confirmed_at, camp.ends_at,
      0 as sort_group
    from public.ad_campaigns camp
    join public.products p on p.id = camp.product_id
    join public.categories c on c.id = p.category_id and c.is_active
    left join public.product_tags pt on pt.product_id = p.id
    left join public.tags t on t.id = pt.tag_id
    where camp.status = 'active'
      and camp.starts_at <= now()
      and camp.ends_at > now()
      and p.status = 'approved'
      and (
        (p_scope_type = 'all_time' and camp.placement = 'weekly_featured')
        or (p_scope_type = 'daily' and camp.placement = 'daily_featured')
        or (p_scope_type = 'category' and camp.placement = 'category_sponsor' and camp.category_id::text = p_scope_key)
      )
      and (p_category_id is null or p.category_id = p_category_id)
      and (
        coalesce(p_query, '') = ''
        or p.name ilike '%' || p_query || '%'
        or p.short_description ilike '%' || p_query || '%'
      )
    group by p.id, c.name, c.slug, camp.starts_at, camp.ends_at
  ),
  organic as (
    select
      p.id, p.slug, p.name, p.short_description, c.name as category_name, c.slug as category_slug,
      coalesce(array_agg(t.slug) filter (where t.slug is not null), '{}') as tags,
      'organic'::text as placement,
      null::integer as rank,
      null::bigint as amount_paise,
      p.ownership_verified, p.approved_at, null::timestamptz as confirmed_at, null::timestamptz as ends_at,
      1 as sort_group
    from public.products p
    join public.categories c on c.id = p.category_id and c.is_active
    left join public.product_tags pt on pt.product_id = p.id
    left join public.tags t on t.id = pt.tag_id
    where p_scope_type <> 'daily'
      and p.status = 'approved'
      and (p_scope_type <> 'category' or p.category_id::text = p_scope_key)
      and (p_category_id is null or p.category_id = p_category_id)
      and (
        coalesce(p_query, '') = ''
        or p.name ilike '%' || p_query || '%'
        or p.short_description ilike '%' || p_query || '%'
      )
      and not exists (
        select 1 from public.ad_campaigns camp
        where camp.product_id = p.id
          and camp.status = 'active'
          and camp.starts_at <= now()
          and camp.ends_at > now()
          and (
            (p_scope_type = 'all_time' and camp.placement = 'weekly_featured')
            or (p_scope_type = 'category' and camp.placement = 'category_sponsor' and camp.category_id::text = p_scope_key)
          )
      )
    group by p.id, c.name, c.slug
  ),
  combined as (
    select * from sponsored
    union all
    select * from organic
  ),
  ordered as (
    select * from combined
    order by sort_group, confirmed_at asc nulls last, approved_at desc nulls last, name asc, id
  )
  select jsonb_build_object(
    'total', (select count(*) from ordered),
    'paidCount', (select count(*) from sponsored),
    'entries', coalesce((
      select jsonb_agg(to_jsonb(page_rows) - 'sort_group' order by page_rows.sort_group, page_rows.confirmed_at asc nulls last, page_rows.approved_at desc nulls last, page_rows.name, page_rows.id)
      from (
        select * from ordered
        order by sort_group, confirmed_at asc nulls last, approved_at desc nulls last, name asc, id
        offset greatest(p_offset, 0)
        limit least(greatest(p_limit, 1), 48)
      ) page_rows
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.activate_scheduled_campaigns(uuid) from public;
revoke all on function public.expire_ad_campaigns() from public;
grant execute on function public.activate_scheduled_campaigns(uuid) to service_role;
grant execute on function public.expire_ad_campaigns() to service_role;
grant execute on function public.get_leaderboard(text, text, integer, integer, text, uuid) to anon, authenticated;
