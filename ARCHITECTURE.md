# Architecture

## Layout

- `src/app` — App Router pages, route handlers, metadata, sitemap, and robots.
- `src/components/ui` — buttons, forms, cards, badges, pagination.
- `src/components/layout` — header, footer, mobile menu, and offline status. PWA install is not active.
- `src/features` — auth, products, leaderboard rules, payments, admin, profiles, ownership.
- `src/lib` — money, URLs, validation, security, logging, Supabase clients, and the service entry point.
- `src/config` — site copy and environment parsing.
- `supabase/migrations` — schema, RLS, and ranking/payment functions.
- `src/proxy.ts` — keeps operator routes behind a session. Public ranking does not require one. Pages still authorize on the server.

## Data access

Feature UI calls `getServices()`. That function is server-only and always returns the Supabase implementation. Components do not keep a local copy of the board. A failed Supabase call shows an error and leaves the board empty.

## Rendering

Public pages are Server Components. Forms that need React Hook Form are Client Components. `cacheComponents` is enabled. Request time (`cookies`, `searchParams`, the current UTC day) sits behind Suspense or `connection()` so the static shell can prerender. Private dashboards read the session on the server. User-specific results are not placed in a shared public cache.

## Payments

`src/features/payments/gateway.ts` creates Razorpay orders when live keys exist. Sandbox order ids are local. Webhooks verify signatures and call `applyProviderEvent`. Rank changes for real data happen inside the SQL function with an advisory lock. Mock data uses the TypeScript ranking engine and an in-process lock.

## Boundaries

Validation schemas live in `src/lib/validation`. Ranking comparison lives in `src/features/leaderboards/engine.ts` and is mirrored by the SQL `order by`. Authorization helpers live in `src/lib/security/authorization.ts`. Service-role Supabase access stays in server modules.
