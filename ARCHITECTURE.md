# Architecture

## Layout

- `src/app` — App Router pages, route handlers, metadata, sitemap, and robots. The home page is the creator launch surface. `/leaderboard` is the organic directory.
- `src/components/ui` — buttons, forms, cards, badges, pagination.
- `src/components/layout` — header, footer, mobile menu, and offline status. PWA install is not active.
- `src/features` — auth, products, public listings, leaderboard rules, payments, admin, profiles, ownership. Daily boards use the IST date.
- `src/lib` — money, URLs, validation, security, logging, Supabase clients, and the service entry point.
- `src/config` — site copy and environment parsing.
- `supabase/migrations` — schema, RLS, and ranking/payment functions.
- `src/proxy.ts` — keeps operator routes behind a session. Public ranking does not require one. Pages still authorize on the server.

## Data access

Feature UI calls `getServices()`. That function is server-only and always returns the Supabase implementation. Components do not keep a local copy of the board. A failed Supabase call shows an error and leaves the board empty.

## Rendering

Public pages are Server Components. Forms that need React Hook Form are Client Components. `cacheComponents` is enabled. Request time (`cookies`, `searchParams`, the current UTC day) sits behind Suspense or `connection()` so the static shell can prerender. Private dashboards read the session on the server. User-specific results are not placed in a shared public cache.

## Payments

`src/features/payments/gateway.ts` creates Razorpay orders when live keys exist and `ADVERTISING_LIVE_APPROVED=true`. Otherwise live advertising checkout stays off. Sandbox order ids are local and are not available in production. Webhooks verify signatures and call `apply_provider_event`, which records the ledger row and schedules a fixed-price campaign. A browser redirect does not start a campaign. Older amount-based ranking is not applied to the public directory.

## Boundaries

Validation schemas live in `src/lib/validation`. Ranking comparison lives in `src/features/leaderboards/engine.ts` and is mirrored by the SQL `order by`. Authorization helpers live in `src/lib/security/authorization.ts`. Service-role Supabase access stays in server modules.
