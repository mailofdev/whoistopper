# RankPush

RankPush (rankpush.lol) is an India-first directory for products, websites, and tools. Anyone can claim a rank with a product link and a verified INR payment. There is no account. A paid rank is the verified bid. It is not a rating or an endorsement.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The board stays empty until `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are set and the migrations are applied. A failed database call shows that message. It does not invent listings.

Outside production, a claim opens a labelled test payment. Production stays unpaid until Razorpay confirms the amount.

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

Apply `supabase/migrations` in order, then `supabase/seed.sql` for categories. Configure Auth redirect URLs for `/auth/callback` and `/auth/update-password`. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. The service role key stays on the server.

## Payments

Leave Razorpay keys empty outside production to use the labelled sandbox on `/payments/sandbox/[orderId]`. Live mode needs `PAYMENT_MODE=live` plus `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`. Register `https://<domain>/api/webhooks/razorpay`. Production with missing keys or `PAYMENT_MODE=sandbox` leaves checkout unconfigured and does not simulate success.

See `PAYMENTS.md` and `DEPLOYMENT.md`.
