# API documentation

Mutations are Server Actions unless listed here. Actions validate with Zod and return `{ ok: false, error }` for expected failures. Unexpected failures are logged without secrets and shown as a short message.

## Routes

| Method | Path | Auth | Behaviour |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | `{ ok, service, gaps }`. Gaps name missing production configuration. No secrets. |
| POST | `/api/webhooks/razorpay` | Razorpay signature | Verifies `x-razorpay-signature` against the raw body. Applies `payment.captured`, `order.paid`, `payment.failed`, and `refund.processed`. Unknown events return `{ ignored: true }`. Invalid signature is 400. Apply failures are 500 so the provider can retry. Duplicate event ids are idempotent. |
| POST | `/api/webhooks/cashfree` | Cashfree signature | Verifies `x-webhook-timestamp` plus the raw body. Maps payment status to the same internal events. Checkout creation for Cashfree is not implemented. |
| POST | `/api/cron/daily` | `Authorization: Bearer $CRON_SECRET` | Snapshots the previous UTC day. Missing or wrong secret is 401. |
| GET | `/api/account/export` | Session | Downloads the signed-in user's profile, listings, and orders. `cache-control: no-store`. |
| GET | `/out/[slug]` | Public | Records an outbound click when the request is not treated as a bot or a duplicate, then redirects to the listing website. `no-store`. |
| GET | `/auth/callback` | Supabase code | Exchanges an email confirmation or recovery code for a session and redirects to `/dashboard` or `next`. |

## Actions

- Auth: `loginAction`, `signupAction`, `logoutAction`, `resetAction`, `updatePasswordAction`.
- Listings: `saveProductAction`, `reportAction`.
- Ranking: `previewUpgradeAction`, `createUpgradeAction` (accepts a client idempotency UUID), `sandboxOutcomeAction`, `cancelOrderAction`.
- Ownership: email start, domain start, domain check, mock-only domain simulation, email confirm.
- Profile: update, delete, notification read.
- Admin: moderate, set role, decide report, save category, save settings, set sponsored.

Sandbox completion throws in production and when live Razorpay keys are enabled. It is not a public payment endpoint.

## Status codes

Webhook and export routes use 400, 401, 500, and 503 as described above. Server Actions do not use HTTP status codes; they return a result object. Page-level denials use Next.js `redirect` to `/login` or `forbidden()`.
