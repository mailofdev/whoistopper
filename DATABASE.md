# Database

Migrations in `supabase/migrations` are the schema source of truth. `supabase/seed.sql` inserts the public categories. Do not load fictional product rows into production.

## Relationships

- `profiles` belong to `auth.users` and store the role. Signup metadata cannot set the role; a trigger keeps new profiles as `user`.
- `products` belong to one `categories` row and optionally one owner profile. Owner display fields are copied onto the product so public reads do not join profiles.
- `tags` and `product_tags` attach keywords.
- `ownership_claims` store a hash of the email or domain token.
- `ranking_placements` hold one active row per product, scope, and scope key. History rows remain when status changes.
- `payment_orders`, `payment_attempts`, `provider_events`, and `ledger_entries` record money. Ledger rows are the auditable charges and refunds.
- `analytics_events` and `analytics_daily` store views and clicks. Public trending can read daily counts. Raw visitor hashes are not public.
- `notifications`, `reports`, `moderation_decisions`, `contact_messages`, `admin_audit_logs`, `platform_settings`, `sponsored_placements`, and `webhook_failures` support operations.

## Ranking consistency

Active placements use a partial unique index on `(product_id, scope_type, scope_key) where status = 'active'`. `apply_provider_event` takes `pg_advisory_xact_lock` for the scope, checks amount and currency, writes the ledger once, and inserts or updates the placement. The order is `amount_paise desc, confirmed_at asc, product_id asc`.

Daily scope keys created for signed-in upgrades are `to_char(now() at time zone 'Asia/Kolkata', 'YYYY-MM-DD')`, so a client cannot pre-buy tomorrow. Guest bids use the same IST date on the server. Older UTC keys stay as history. `snapshot_daily_board` records a finished IST day. Removing or rejecting a listing supersedes its active placements. Payment rows stay.

`listing_manage_tokens` stores a hash of the private edit link. The table is not readable by `anon` or `authenticated`. `products.details` holds category-specific public text. Categories carry `group_slug`, `group_name`, `group_sort`, and `field_set`. Listing images go in the public `listing-media` bucket; uploads use the service role.

## Row Level Security

User-accessible tables have RLS. Profiles are readable by the owner or an administrator. Public profile data goes through `get_public_profile`. Visitors can read approved products and active categories. Owners can update their own eligible listings. Payment rows are visible to the paying user and administrators. Webhook application, engagement writes, and account deletion use security-definer functions or the service role. The service role is not shipped to the browser.

## Deletion

`delete_own_account` anonymises the profile and detaches listings. Ledger and payment rows stay. The application then deletes the Auth user when the service role is configured.
