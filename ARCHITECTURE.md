# Architecture

## Layout

- `src/app` — App Router pages, route handlers, metadata, sitemap, robots, manifest.
- `src/components/ui` — buttons, forms, cards, badges, pagination.
- `src/components/layout` — header, footer, mobile menu, install and offline status.
- `src/features` — auth, products, leaderboard rules, payments, admin, profiles, ownership.
- `src/lib` — money, URLs, validation, security, logging, Supabase clients, the service switch.
- `src/mocks` — fictional development data and the mock `AppServices` implementation.
- `src/config` — site copy, environment parsing, mock-data guard.
- `supabase/migrations` — schema, RLS, and ranking/payment functions.
- `src/proxy.ts` — optimistic redirect to login when a session cookie is missing. Pages still authorize on the server.

## Data access

Feature UI calls `getServices()`. That function is server-only. In production it returns Supabase services. Otherwise it returns mock services when `resolveMockDataEnabled()` is true. Components do not read `NEXT_PUBLIC_USE_MOCK_DATA` themselves. The public flag cannot enable mock data in production.

## Rendering

Public pages are Server Components. Forms that need React Hook Form are Client Components. `cacheComponents` is enabled. Request time (`cookies`, `searchParams`, the current UTC day) sits behind Suspense or `connection()` so the static shell can prerender. Private dashboards read the session on the server. User-specific results are not placed in a shared public cache.

## Payments

`src/features/payments/gateway.ts` creates Razorpay orders when live keys exist. Sandbox order ids are local. Webhooks verify signatures and call `applyProviderEvent`. Rank changes for real data happen inside the SQL function with an advisory lock. Mock data uses the TypeScript ranking engine and an in-process lock.

## Boundaries

Validation schemas live in `src/lib/validation`. Ranking comparison lives in `src/features/leaderboards/engine.ts` and is mirrored by the SQL `order by`. Authorization helpers live in `src/lib/security/authorization.ts`. Service-role Supabase access stays in server modules.
