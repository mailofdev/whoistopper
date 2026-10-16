-- Grouped categories, listing details, private manage tokens, and IST daily boards.
-- Daily scope keys created after this migration use Asia/Kolkata dates.
-- Older UTC keys stay in history and are not rewritten.

alter table public.categories
  add column if not exists group_slug text,
  add column if not exists group_name text,
  add column if not exists group_sort integer,
  add column if not exists field_set text;

alter table public.products
  add column if not exists details jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_details_object' and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_details_object check (jsonb_typeof(details) = 'object');
  end if;
end $$;

create table if not exists public.listing_manage_tokens (
  product_id uuid primary key references public.products (id) on delete cascade,
  token_hash text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index if not exists listing_manage_tokens_hash_active
  on public.listing_manage_tokens (token_hash)
  where revoked_at is null;

alter table public.listing_manage_tokens enable row level security;
revoke all on table public.listing_manage_tokens from anon, authenticated;

create index if not exists products_category_status_idx on public.products (category_id, status);
create index if not exists categories_group_sort_idx on public.categories (group_sort, sort_order);

insert into public.categories (slug, name, description, sort_order, is_active, group_slug, group_name, group_sort, field_set)
values
  ('websites-saas', 'Websites & SaaS', 'Sites, apps, and software people can open on the public web.', 1, true, 'digital-presence', 'Digital Presence', 1, 'website'),
  ('instagram-pages', 'Instagram Pages', 'Public Instagram pages and profiles.', 2, true, 'digital-presence', 'Digital Presence', 1, 'instagram'),
  ('youtube-channels', 'YouTube Channels', 'Public YouTube channels.', 3, true, 'digital-presence', 'Digital Presence', 1, 'youtube'),
  ('other-online-profiles', 'Other Online Profiles', 'Public profiles on other networks.', 4, true, 'digital-presence', 'Digital Presence', 1, 'profile'),
  ('cars-bikes', 'Cars & Bikes', 'Vehicles people choose to show publicly.', 1, true, 'lifestyle', 'Lifestyle & Possessions', 2, 'vehicle'),
  ('luxury-gadgets', 'Luxury & Gadgets', 'Collections of watches, devices, and other objects.', 2, true, 'lifestyle', 'Lifestyle & Possessions', 2, 'collection'),
  ('travel-experiences', 'Travel & Experiences', 'Trips and experiences described by the person who took them.', 3, true, 'lifestyle', 'Lifestyle & Possessions', 2, 'travel'),
  ('fashion-collections', 'Fashion & Collections', 'Wardrobes, drops, and styled collections.', 4, true, 'lifestyle', 'Lifestyle & Possessions', 2, 'fashion'),
  ('business-startups', 'Business & Startups', 'Companies and projects with a public page.', 1, true, 'success', 'Success & Identity', 3, 'business'),
  ('achievements-skills', 'Achievements & Skills', 'Claims about work, awards, or skills. These are not verified facts.', 2, true, 'success', 'Success & Identity', 3, 'achievement'),
  ('gaming-esports', 'Gaming & Esports', 'Players, teams, and public gaming profiles.', 1, true, 'community', 'Community & Entertainment', 4, 'gaming'),
  ('fitness-lifestyle', 'Fitness & Lifestyle', 'Training, routines, and public fitness profiles.', 2, true, 'community', 'Community & Entertainment', 4, 'fitness'),
  ('music-entertainment', 'Music & Entertainment', 'Artists, shows, and public entertainment pages.', 3, true, 'community', 'Community & Entertainment', 4, 'music'),
  ('art-creative-work', 'Art & Creative Work', 'Artwork and other creative work with a public page.', 4, true, 'community', 'Community & Entertainment', 4, 'artwork')
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active,
    group_slug = excluded.group_slug,
    group_name = excluded.group_name,
    group_sort = excluded.group_sort,
    field_set = excluded.field_set;

update public.categories
set group_slug = 'earlier',
    group_name = 'Earlier catalogue',
    group_sort = 90,
    field_set = coalesce(field_set, 'website')
where slug in ('saas', 'developer-tools', 'fintech', 'commerce', 'education', 'health', 'climate', 'media');

update public.categories
set group_slug = coalesce(group_slug, 'digital-presence'),
    group_name = coalesce(group_name, 'Digital Presence'),
    group_sort = coalesce(group_sort, 1),
    field_set = coalesce(field_set, 'website')
where group_slug is null or group_name is null or group_sort is null or field_set is null;

alter table public.categories alter column group_slug set default 'digital-presence';
alter table public.categories alter column group_name set default 'Digital Presence';
alter table public.categories alter column group_sort set default 1;
alter table public.categories alter column field_set set default 'website';
alter table public.categories alter column group_slug set not null;
alter table public.categories alter column group_name set not null;
alter table public.categories alter column group_sort set not null;
alter table public.categories alter column field_set set not null;

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('listing-media', 'listing-media', true)
    on conflict (id) do update set public = excluded.public;
  end if;
end $$;

-- Daily keys are IST dates. A payment at 2026-10-15T18:29:59.999Z belongs to 2026-10-15.
-- A payment at 2026-10-15T18:30:00.000Z belongs to 2026-10-16. The client cannot choose the key.
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
declare
  v_product public.products%rowtype;
  v_rules record;
  v_key text;
  v_own bigint;
  v_floor bigint;
  v_order public.payment_orders%rowtype;
begin
  if auth.uid() is null then
    raise exception 'sign in required';
  end if;
  if p_provider = 'sandbox' and coalesce((select value->>'allowSandbox' from public.platform_settings where key = 'payments')::boolean, false) is not true then
    raise exception 'sandbox payments are disabled';
  end if;
  select * into v_product from public.products where id = p_product_id;
  if v_product.id is null or v_product.owner_id is distinct from auth.uid() or v_product.status <> 'approved' or v_product.ownership_verified is not true then
    raise exception 'listing cannot be ranked';
  end if;
  if p_scope = 'daily' then
    v_key := to_char((now() at time zone 'Asia/Kolkata'), 'YYYY-MM-DD');
  elsif p_scope = 'category' then
    v_key := v_product.category_id::text;
  else
    v_key := 'all_time';
    p_scope := 'all_time';
  end if;
  select * into v_order from public.payment_orders
    where user_id = auth.uid() and idempotency_key = p_idempotency;
  if v_order.id is not null then
    return to_jsonb(v_order);
  end if;
  if exists (
    select 1 from public.payment_orders
    where product_id = p_product_id and scope_type = p_scope and scope_key = v_key and status = 'pending'
  ) then
    raise exception 'pending payment already exists';
  end if;
  select * into v_rules from public.ranking_rules();
  select amount_paise into v_own from public.ranking_placements
    where product_id = p_product_id and scope_type = p_scope and scope_key = v_key and status = 'active';
  v_floor := v_rules.minimum_bid;
  if v_own is not null then
    v_floor := greatest(v_floor, v_own + v_rules.minimum_increment);
  end if;
  if p_amount < v_floor or p_amount > v_rules.max_bid then
    raise exception 'amount is outside the ranking rules';
  end if;
  insert into public.payment_orders (
    user_id, product_id, provider, amount_paise, currency, purpose, scope_type, scope_key,
    quoted_rank, status, fulfillment, idempotency_key
  ) values (
    auth.uid(), p_product_id, p_provider, p_amount, 'INR', 'ranking_upgrade', p_scope, v_key,
    p_quoted_rank, 'pending', 'pending', p_idempotency
  ) returning * into v_order;
  return to_jsonb(v_order);
end;
$$;

drop function if exists public.get_leaderboard(text, text, integer, integer);

create function public.get_leaderboard(
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
  with paid as (
    select
      p.id, p.slug, p.name, p.short_description, c.name as category_name, c.slug as category_slug,
      coalesce(array_agg(t.slug) filter (where t.slug is not null), '{}') as tags,
      'paid'::text as placement,
      row_number() over (order by pl.amount_paise desc, pl.confirmed_at asc, p.id asc)::integer as rank,
      pl.amount_paise, p.ownership_verified, p.approved_at, pl.confirmed_at, 0 as sort_group
    from public.ranking_placements pl
    join public.products p on p.id = pl.product_id
    join public.categories c on c.id = p.category_id
    left join public.product_tags pt on pt.product_id = p.id
    left join public.tags t on t.id = pt.tag_id
    where pl.status = 'active' and pl.scope_type = p_scope_type and pl.scope_key = p_scope_key and p.status = 'approved'
      and (p_category_id is null or p.category_id = p_category_id)
      and (
        coalesce(p_query, '') = ''
        or p.name ilike '%' || p_query || '%'
        or p.short_description ilike '%' || p_query || '%'
      )
    group by p.id, c.name, c.slug, pl.amount_paise, pl.confirmed_at
  ),
  free as (
    select
      p.id, p.slug, p.name, p.short_description, c.name as category_name, c.slug as category_slug,
      coalesce(array_agg(t.slug) filter (where t.slug is not null), '{}') as tags,
      'free'::text as placement,
      null::integer as rank,
      null::bigint as amount_paise, p.ownership_verified, p.approved_at, null::timestamptz as confirmed_at, 1 as sort_group
    from public.products p
    join public.categories c on c.id = p.category_id
    left join public.product_tags pt on pt.product_id = p.id
    left join public.tags t on t.id = pt.tag_id
    where p.status = 'approved'
      and (p_scope_type <> 'category' or p.category_id::text = p_scope_key)
      and (p_category_id is null or p.category_id = p_category_id)
      and (
        coalesce(p_query, '') = ''
        or p.name ilike '%' || p_query || '%'
        or p.short_description ilike '%' || p_query || '%'
      )
      and not exists (
        select 1 from public.ranking_placements pl
        where pl.product_id = p.id and pl.status = 'active' and pl.scope_type = p_scope_type and pl.scope_key = p_scope_key
      )
    group by p.id, c.name, c.slug
  ),
  combined as (
    select * from paid
    union all
    select * from free
  ),
  ordered as (
    select * from combined
    order by sort_group, rank nulls last, approved_at desc nulls last, id
  )
  select jsonb_build_object(
    'total', (select count(*) from ordered),
    'paidCount', (select count(*) from paid),
    'entries', coalesce((
      select jsonb_agg(to_jsonb(page_rows) - 'sort_group' order by page_rows.sort_group, page_rows.rank nulls last, page_rows.approved_at desc nulls last, page_rows.id)
      from (
        select * from ordered
        order by sort_group, rank nulls last, approved_at desc nulls last, id
        offset greatest(p_offset, 0)
        limit least(greatest(p_limit, 1), 48)
      ) page_rows
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_leaderboard(text, text, integer, integer, text, uuid) from public;
grant execute on function public.get_leaderboard(text, text, integer, integer, text, uuid) to anon, authenticated;
