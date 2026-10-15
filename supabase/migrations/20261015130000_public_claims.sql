-- A rank can be claimed from the public board without an account.
-- Guest orders keep a null user_id. Authenticated orders are unchanged.

alter table public.payment_orders alter column user_id drop not null;

create unique index if not exists payment_orders_guest_idempotency
  on public.payment_orders (idempotency_key)
  where user_id is null;
