-- Creator lanes, organic score, and referral hosts.
-- Historical payment rows stay. Promotions remain labelled advertisements and are not scored.

insert into public.categories (slug, name, description, sort_order, is_active, group_slug, group_name, group_sort, field_set)
values
  ('youtube', 'YouTube', 'Channels and YouTube creators with a public page.', 1, true, 'creators', 'Creators', 1, 'creator'),
  ('streaming', 'Streaming', 'Live streamers on Twitch, Kick, YouTube, and similar public platforms.', 2, true, 'creators', 'Creators', 1, 'creator'),
  ('gaming', 'Gaming', 'Players and gaming creators. Gambling and cheating services are excluded.', 3, true, 'creators', 'Creators', 1, 'creator'),
  ('esports', 'Esports', 'Players, teams, and competitive organisations with a public profile.', 4, true, 'creators', 'Creators', 1, 'creator'),
  ('clips', 'Clips', 'Short-form creators on Shorts, TikTok, Reels, and clip channels.', 5, true, 'creators', 'Creators', 1, 'creator'),
  ('communities', 'Communities', 'Game communities, shows, and other public creator pages.', 6, true, 'creators', 'Creators', 1, 'creator')
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order,
    is_active = true,
    group_slug = excluded.group_slug,
    group_name = excluded.group_name,
    group_sort = excluded.group_sort,
    field_set = excluded.field_set;

update public.categories
set is_active = false
where slug in (
  'saas', 'fintech', 'commerce', 'education', 'health', 'climate', 'media',
  'cars-bikes', 'luxury-gadgets', 'travel-experiences', 'fashion-collections',
  'achievements-skills', 'fitness-lifestyle',
  'websites-saas', 'business-startups', 'developer-tools', 'instagram-pages',
  'youtube-channels', 'other-online-profiles', 'gaming-esports', 'art-creative-work',
  'music-entertainment', 'skills-portfolios'
);

insert into public.category_migrations (product_id, from_slug, to_slug, reason)
select p.id, c.slug, m.to_slug, m.reason
from public.products p
join public.categories c on c.id = p.category_id
join (
  values
    ('youtube-channels', 'youtube', 'creator catalogue'),
    ('instagram-pages', 'clips', 'creator catalogue'),
    ('gaming-esports', 'gaming', 'creator catalogue'),
    ('music-entertainment', 'streaming', 'creator catalogue'),
    ('media', 'streaming', 'creator catalogue'),
    ('art-creative-work', 'communities', 'creator catalogue'),
    ('other-online-profiles', 'communities', 'creator catalogue'),
    ('skills-portfolios', 'communities', 'creator catalogue'),
    ('websites-saas', 'communities', 'creator catalogue'),
    ('business-startups', 'communities', 'creator catalogue'),
    ('developer-tools', 'communities', 'creator catalogue'),
    ('saas', 'communities', 'creator catalogue'),
    ('fintech', 'communities', 'creator catalogue'),
    ('commerce', 'communities', 'creator catalogue'),
    ('health', 'communities', 'creator catalogue'),
    ('climate', 'communities', 'creator catalogue'),
    ('education', 'communities', 'creator catalogue'),
    ('achievements-skills', 'communities', 'creator catalogue')
) as m(from_slug, to_slug, reason) on m.from_slug = c.slug
where not exists (
  select 1 from public.category_migrations existing
  where existing.product_id = p.id and existing.from_slug = c.slug and existing.to_slug = m.to_slug
);

update public.products p
set category_id = target.id
from public.categories c
join (
  values
    ('youtube-channels', 'youtube'),
    ('instagram-pages', 'clips'),
    ('gaming-esports', 'gaming'),
    ('music-entertainment', 'streaming'),
    ('media', 'streaming'),
    ('art-creative-work', 'communities'),
    ('other-online-profiles', 'communities'),
    ('skills-portfolios', 'communities'),
    ('websites-saas', 'communities'),
    ('business-startups', 'communities'),
    ('developer-tools', 'communities'),
    ('saas', 'communities'),
    ('fintech', 'communities'),
    ('commerce', 'communities'),
    ('health', 'communities'),
    ('climate', 'communities'),
    ('education', 'communities'),
    ('achievements-skills', 'communities')
) as m(from_slug, to_slug) on m.from_slug = c.slug
join public.categories target on target.slug = m.to_slug
where p.category_id = c.id
  and p.category_id is distinct from target.id;

update public.ad_packages
set name = 'Daily featured profile',
    description = 'A labelled advertisement beside discovery for 24 hours from activation. It does not change the organic score.'
where slug = 'daily-featured' and name = 'Daily Featured Listing';

update public.ad_packages
set name = 'Weekly featured profile',
    description = 'A labelled advertisement on the creator directory for seven days from activation. Organic profiles keep their own score.'
where slug = 'weekly-featured' and name = 'Weekly Featured Listing';

update public.ad_packages
set name = 'Weekly lane sponsor',
    description = 'A labelled sponsorship on one creator lane for seven days from activation. The organic list in that lane is unchanged.'
where slug = 'weekly-category-sponsor' and name = 'Weekly Category Sponsor';

-- Range scans for the 30-day click total. The primary key stays (product_id, day).
create index if not exists analytics_daily_day_product_idx
  on public.analytics_daily (day, product_id);

create table if not exists public.analytics_referrers (
  product_id uuid not null references public.products (id) on delete cascade,
  day date not null,
  host text not null check (host ~ '^[a-z0-9.-]{1,253}$' and host like '%.%'),
  views integer not null default 0 check (views >= 0),
  primary key (product_id, day, host)
);

alter table public.analytics_referrers enable row level security;
revoke all on table public.analytics_referrers from anon, authenticated;
grant select on table public.analytics_referrers to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'analytics_referrers' and policyname = 'analytics_referrers_read'
  ) then
    create policy analytics_referrers_read on public.analytics_referrers
      for select to authenticated
      using (
        public.is_admin()
        or exists (
          select 1 from public.products p
          where p.id = product_id and p.owner_id = (select auth.uid())
        )
      );
  end if;
end $$;

create or replace function public.record_referral(p_product_id uuid, p_day date, p_host text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'referral writes are server-only';
  end if;
  if p_host is null or p_host !~ '^[a-z0-9.-]{1,253}$' or p_host not like '%.%' then
    return;
  end if;
  insert into public.analytics_referrers (product_id, day, host, views)
  values (p_product_id, p_day, p_host, 1)
  on conflict (product_id, day, host) do update
    set views = public.analytics_referrers.views + 1;
end;
$$;

revoke all on function public.record_referral(uuid, date, text) from public;
grant execute on function public.record_referral(uuid, date, text) to service_role;

-- Organic score, mirrored by organicScore() in src/features/leaderboards/engine.ts:
-- least(clicks in the last 30 UTC days, 100) * 2
-- + 25 if ownership_verified
-- + 30 if approved_at is within 14 days
-- + 10 if logo_url is present
-- Ties: newer approval, then name, then id.
-- Sponsored rows stay in sort_group 0 and are not scored.
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
  with clicks as (
    select product_id, least(sum(clicks), 100) as capped
    from public.analytics_daily
    where day >= (timezone('utc', now()))::date - 29
    group by product_id
  ),
  sponsored as (
    select
      p.id, p.slug, p.name, p.short_description, c.name as category_name, c.slug as category_slug,
      coalesce(array_agg(t.slug) filter (where t.slug is not null), '{}') as tags,
      'sponsored'::text as placement,
      null::integer as rank,
      null::bigint as amount_paise,
      p.ownership_verified, p.approved_at, camp.starts_at as confirmed_at, camp.ends_at,
      0 as organic_score,
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
      (
        coalesce(clicks.capped, 0) * 2
        + case when p.ownership_verified then 25 else 0 end
        + case when p.approved_at >= now() - interval '14 days' then 30 else 0 end
        + case when coalesce(p.logo_url, '') <> '' then 10 else 0 end
      )::integer as organic_score,
      1 as sort_group
    from public.products p
    join public.categories c on c.id = p.category_id and c.is_active
    left join public.product_tags pt on pt.product_id = p.id
    left join public.tags t on t.id = pt.tag_id
    left join clicks on clicks.product_id = p.id
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
    group by p.id, c.name, c.slug, clicks.capped
  ),
  combined as (
    select * from sponsored
    union all
    select * from organic
  ),
  ordered as (
    select * from combined
    order by sort_group,
      case when sort_group = 0 then confirmed_at end asc nulls last,
      organic_score desc,
      approved_at desc nulls last,
      name asc,
      id
  )
  select jsonb_build_object(
    'total', (select count(*) from ordered),
    'paidCount', (select count(*) from sponsored),
    'entries', coalesce((
      select jsonb_agg(
        to_jsonb(page_rows) - 'sort_group'
        order by page_rows.sort_group,
          case when page_rows.sort_group = 0 then page_rows.confirmed_at end asc nulls last,
          page_rows.organic_score desc,
          page_rows.approved_at desc nulls last,
          page_rows.name,
          page_rows.id
      )
      from (
        select * from ordered
        order by sort_group,
          case when sort_group = 0 then confirmed_at end asc nulls last,
          organic_score desc,
          approved_at desc nulls last,
          name asc,
          id
        offset greatest(p_offset, 0)
        limit least(greatest(p_limit, 1), 48)
      ) page_rows
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_leaderboard(text, text, integer, integer, text, uuid) from public;
grant execute on function public.get_leaderboard(text, text, integer, integer, text, uuid) to anon, authenticated;
