-- Ranking allocation, leaderboard reads, and engagement writes.
-- Daily scope keys are UTC dates: a payment at 2026-10-15T23:59:59.999Z belongs to 2026-10-15.
-- The next UTC day starts empty because its scope key has no rows. Old rows stay as history.

create or replace function public.ranking_rules()
returns table (minimum_bid bigint, minimum_increment bigint, max_bid bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((value->>'minimumBidPaise')::bigint, 9900),
    coalesce((value->>'minimumIncrementPaise')::bigint, 1000),
    coalesce((value->>'maxBidPaise')::bigint, 100000000)
  from public.platform_settings
  where key = 'ranking';
$$;

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
    v_key := to_char((now() at time zone 'utc'), 'YYYY-MM-DD');
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

create or replace function public.attach_provider_order(p_order_id uuid, p_provider_order_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.payment_orders
    set provider_order_id = p_provider_order_id
    where id = p_order_id and status = 'pending' and (user_id = auth.uid() or auth.role() = 'service_role');
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
  v_existing bigint;
  v_rank integer;
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
    return jsonb_build_object('duplicate', true, 'orderId', v_order.id, 'status', v_order.status, 'finalRank', v_order.final_rank, 'fulfillment', v_order.fulfillment, 'ignored', false);
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
    if v_order.status = 'paid' then
      return jsonb_build_object('duplicate', true, 'orderId', v_order.id, 'status', v_order.status, 'finalRank', v_order.final_rank, 'fulfillment', v_order.fulfillment, 'ignored', false);
    end if;
    if v_order.status <> 'pending' then
      raise exception 'invalid capture state';
    end if;
    perform pg_advisory_xact_lock(hashtext(v_order.scope_type || ':' || v_order.scope_key));
    insert into public.ledger_entries (order_id, entry_type, amount_paise, currency, direction)
    values (v_order.id, 'charge', v_order.amount_paise, 'INR', 'credit');
    update public.payment_orders
      set status = 'paid', provider_payment_id = p_provider_payment_id, paid_at = now(), fulfillment = 'pending'
      where id = v_order.id;
    if v_order.purpose = 'ranking_upgrade' then
      select amount_paise into v_existing from public.ranking_placements
        where product_id = v_order.product_id and scope_type = v_order.scope_type and scope_key = v_order.scope_key and status = 'active'
        for update;
      if v_existing is not null and v_existing >= v_order.amount_paise then
        update public.payment_orders set fulfillment = 'needs_refund' where id = v_order.id;
      else
        insert into public.ranking_placements (product_id, scope_type, scope_key, amount_paise, confirmed_at, status, order_id)
        values (v_order.product_id, v_order.scope_type, v_order.scope_key, v_order.amount_paise, now(), 'active', v_order.id)
        on conflict (product_id, scope_type, scope_key) where status = 'active'
        do update set amount_paise = excluded.amount_paise, confirmed_at = excluded.confirmed_at, order_id = excluded.order_id;
        select count(*)::integer into v_rank from public.ranking_placements
          where status = 'active' and scope_type = v_order.scope_type and scope_key = v_order.scope_key
            and (
              amount_paise > v_order.amount_paise
              or (amount_paise = v_order.amount_paise and confirmed_at < now())
              or (amount_paise = v_order.amount_paise and confirmed_at = now() and product_id < v_order.product_id)
            );
        v_rank := v_rank + 1;
        update public.payment_orders set final_rank = v_rank, fulfillment = 'fulfilled' where id = v_order.id;
        insert into public.ranking_events (product_id, scope_type, scope_key, amount_paise, rank, order_id, reason)
        values (v_order.product_id, v_order.scope_type, v_order.scope_key, v_order.amount_paise, v_rank, v_order.id, 'payment_captured');
      end if;
    end if;
  elsif p_event_type = 'payment.failed' and v_order.status = 'pending' then
    update public.payment_orders set status = 'failed', fulfillment = 'not_applicable' where id = v_order.id;
  elsif p_event_type = 'payment.cancelled' and v_order.status = 'pending' then
    update public.payment_orders set status = 'cancelled', fulfillment = 'not_applicable' where id = v_order.id;
  elsif p_event_type = 'refund.processed' and v_order.status = 'paid' and p_amount = v_order.amount_paise then
    insert into public.ledger_entries (order_id, entry_type, amount_paise, currency, direction)
    values (v_order.id, 'refund', v_order.amount_paise, 'INR', 'debit');
    update public.ranking_placements set status = 'superseded'
      where order_id = v_order.id and status = 'active';
    update public.payment_orders set status = 'refunded', fulfillment = 'not_applicable', final_rank = null where id = v_order.id;
  elsif p_event_type in ('payment.failed', 'payment.cancelled') then
    return jsonb_build_object('duplicate', false, 'ignored', true, 'orderId', v_order.id, 'status', v_order.status, 'finalRank', v_order.final_rank, 'fulfillment', v_order.fulfillment);
  else
    raise exception 'event cannot be applied';
  end if;

  select * into v_order from public.payment_orders where id = v_order.id;
  return jsonb_build_object('duplicate', false, 'ignored', false, 'orderId', v_order.id, 'status', v_order.status, 'finalRank', v_order.final_rank, 'fulfillment', v_order.fulfillment);
end;
$$;

create or replace function public.get_leaderboard(p_scope_type text, p_scope_key text, p_limit integer, p_offset integer)
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
    order by sort_group, rank nulls last, approved_at desc nulls last, name
  )
  select jsonb_build_object(
    'total', (select count(*) from ordered),
    'paidCount', (select count(*) from paid),
    'entries', coalesce((
      select jsonb_agg(to_jsonb(page_rows) - 'sort_group')
      from (
        select * from ordered
        offset greatest(p_offset, 0)
        limit least(greatest(p_limit, 1), 48)
      ) page_rows
    ), '[]'::jsonb)
  );
$$;

create or replace function public.record_engagement(p_product_id uuid, p_kind text, p_dedupe text, p_day date)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'engagement writes are server-only';
  end if;
  insert into public.analytics_events (product_id, kind, dedupe_key, day)
  values (p_product_id, p_kind, p_dedupe, p_day)
  on conflict (dedupe_key) do nothing;
  if not found then
    return false;
  end if;
  insert into public.analytics_daily (product_id, day, views, clicks)
  values (p_product_id, p_day, case when p_kind = 'view' then 1 else 0 end, case when p_kind = 'click' then 1 else 0 end)
  on conflict (product_id, day) do update
    set views = public.analytics_daily.views + excluded.views,
        clicks = public.analytics_daily.clicks + excluded.clicks;
  return true;
end;
$$;

revoke all on function public.create_ranking_order(uuid, text, bigint, text, integer, text) from public;
revoke all on function public.attach_provider_order(uuid, text) from public;
revoke all on function public.apply_provider_event(text, text, text, text, text, bigint, text) from public;
revoke all on function public.get_leaderboard(text, text, integer, integer) from public;
revoke all on function public.record_engagement(uuid, text, text, date) from public;
grant execute on function public.create_ranking_order(uuid, text, bigint, text, integer, text) to authenticated;
grant execute on function public.attach_provider_order(uuid, text) to authenticated, service_role;
grant execute on function public.apply_provider_event(text, text, text, text, text, bigint, text) to service_role;
grant execute on function public.get_leaderboard(text, text, integer, integer) to anon, authenticated;
grant execute on function public.record_engagement(uuid, text, text, date) to service_role;

create or replace function public.delete_own_account(p_confirmation text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_role text;
  v_supers integer;
begin
  select username, role into v_username, v_role from public.profiles where id = auth.uid() and deleted_at is null;
  if v_username is null or v_username is distinct from p_confirmation then
    raise exception 'confirmation does not match';
  end if;
  select count(*) into v_supers from public.profiles where role = 'super_admin' and deleted_at is null;
  if v_role = 'super_admin' and v_supers <= 1 then
    raise exception 'last super administrator';
  end if;
  update public.products set owner_id = null, owner_username = null, owner_display_name = null, ownership_verified = false
    where owner_id = auth.uid();
  update public.profiles
    set deleted_at = now(), email = 'deleted+' || id::text || '@example.invalid', display_name = 'Deleted user', bio = '', website = null
    where id = auth.uid();
end;
$$;

create or replace function public.snapshot_daily_board(p_day text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if auth.role() <> 'service_role' and not public.is_admin() then
    raise exception 'not allowed';
  end if;
  select count(*) into v_count from public.ranking_placements
    where scope_type = 'daily' and scope_key = p_day and status = 'active';
  insert into public.leaderboard_snapshots (scope_type, scope_key, entry_count)
  values ('daily', p_day, v_count)
  on conflict (scope_type, scope_key) do nothing;
end;
$$;

revoke all on function public.delete_own_account(text) from public;
revoke all on function public.snapshot_daily_board(text) from public;
grant execute on function public.delete_own_account(text) to authenticated;
grant execute on function public.snapshot_daily_board(text) to authenticated, service_role;

create or replace function public.confirm_ownership_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim public.ownership_claims%rowtype;
  v_hold boolean;
begin
  select * into v_claim from public.ownership_claims
    where token_hash = encode(digest(p_token, 'sha256'), 'hex') and method = 'email' and status = 'pending';
  if v_claim.id is null then
    raise exception 'invalid token';
  end if;
  update public.ownership_claims set status = 'verified', verified_at = now() where id = v_claim.id;
  select coalesce((value->>'holdNewListingsForReview')::boolean, true) into v_hold
    from public.platform_settings where key = 'moderation';
  update public.products
    set ownership_verified = true,
        status = case
          when status in ('draft', 'pending_verification') and v_hold then 'pending_review'
          when status in ('draft', 'pending_verification') and not v_hold then 'approved'
          else status
        end,
        approved_at = case
          when status in ('draft', 'pending_verification') and not v_hold then coalesce(approved_at, now())
          else approved_at
        end
    where id = v_claim.product_id;
end;
$$;

create or replace function public.confirm_domain_for_user(p_user_id uuid, p_product_id uuid, p_file text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim public.ownership_claims%rowtype;
begin
  if auth.role() <> 'service_role' then
    raise exception 'domain confirmation is server-only';
  end if;
  select * into v_claim from public.ownership_claims
    where user_id = p_user_id and product_id = p_product_id and method = 'domain' and status = 'pending'
    order by created_at desc limit 1;
  if v_claim.id is null or v_claim.token_hash is distinct from encode(digest(trim(p_file), 'sha256'), 'hex') then
    raise exception 'verification file does not match';
  end if;
  update public.ownership_claims set status = 'verified', verified_at = now() where id = v_claim.id;
  update public.products set ownership_verified = true,
    status = case when status in ('draft', 'pending_verification') then 'pending_review' else status end
    where id = p_product_id;
end;
$$;

revoke all on function public.confirm_ownership_token(text) from public;
revoke all on function public.confirm_domain_for_user(uuid, uuid, text) from public;
grant execute on function public.confirm_ownership_token(text) to anon, authenticated;
grant execute on function public.confirm_domain_for_user(uuid, uuid, text) to service_role;
