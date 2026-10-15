# Who's Topper

Who's Topper is an India-first directory for products, websites, and tools. Visitors can browse without an account. Owners can list for free and, after ownership is verified, pay in INR for a labelled position on a leaderboard. A paid rank is the verified bid. It is not a rating or an endorsement.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The committed `.env.local` turns mock data on for local development.

Development accounts (mock mode only):

| Account | Email | Password |
| --- | --- | --- |
| Owner | ananya@example.com | TopperDemo!2026 |
| Owner | rohan@example.com | TopperDemo!2026 |
| Owner | kabir@example.com | TopperDemo!2026 |
| Administrator | meera@example.com | TopperAdmin!2026 |
| Super administrator | arjun@example.com | TopperSuper!2026 |

## Mock data and real data

`NEXT_PUBLIC_USE_MOCK_DATA=true` uses the in-memory services in development and test. Omit the variable in development and mock data stays on. Set it to `false` to use Supabase.

Production ignores the public flag. `getServices()` always returns the Supabase implementation when `NODE_ENV` is `production`. A failed Supabase call shows an error. It does not fall back to mock data. Mock payment completion is refused in production.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run lint` | ESLint on source and tests |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit and integration tests |
| `npm run build` | Production build |
| `npm run test:e2e` | Playwright against the dev server |

## Supabase

Apply `supabase/migrations` in order, then `supabase/seed.sql` for categories. Configure Auth redirect URLs for `/auth/callback` and `/auth/update-password`. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. The service role key stays on the server.

## Payments

Leave Razorpay keys empty outside production to use the labelled sandbox on `/payments/sandbox/[orderId]`. Live mode needs `PAYMENT_MODE=live` plus `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`. Register `https://<domain>/api/webhooks/razorpay`. Production with missing keys or `PAYMENT_MODE=sandbox` leaves checkout unconfigured and does not simulate success.

See `PAYMENTS.md` and `DEPLOYMENT.md`.
