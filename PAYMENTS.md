# Payments

## Modes

- Development and test, without live keys: sandbox. The upgrade form creates an internal order and opens `/payments/sandbox/[orderId]`. The page is labelled as a test. Success, failure, and cancel are simulated and never call a bank.
- Production: live Razorpay only when `PAYMENT_MODE=live` and the key id, key secret, and webhook secret are all set. Otherwise checkout is unconfigured. Sandbox completion throws.
- Cashfree: webhook signatures can be verified. Creating a Cashfree order is not implemented.

## Order lifecycle

1. The owner previews a rank. The preview is not reserved.
2. `createRankingOrder` checks the floor on the server, stores a pending order, and reuses the same user idempotency key.
3. Live mode creates a Razorpay order and stores the provider order id. Sandbox stores a `sandbox_` id.
4. A verified `payment.captured` event moves the order to paid, writes one charge in the ledger, and allocates the rank inside a lock.
5. If the verified amount cannot raise the current bid, fulfillment becomes `needs_refund` and the rank is not reduced.
6. A refund event reverses the placement created by that order and writes a debit.
7. Failure or cancel after a paid order is ignored. A refund before payment is rejected.
8. The same provider event id or payment id is a duplicate and does not change the rank again.

## Reconciliation

The admin payments page compares paid and refunded orders with ledger rows. It flags missing charges, duplicate charges, amount mismatches, and orphan ledger rows. Partial unique indexes allow one charge and one refund per order.

## Refunds

Published policy: a payment that cannot be applied is marked for refund review. A completed rank is not undone because traffic is low. A provider refund event removes the placement that order created. Card numbers are never stored.

## Enabling live Razorpay

1. Create a Razorpay account and finish merchant activation, including the methods you will offer (UPI where enabled on that account).
2. Set `PAYMENT_MODE=live`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` in the production environment.
3. Point the webhook at `https://<domain>/api/webhooks/razorpay` for payment captured, payment failed, and refund processed.
4. Confirm a small live payment, then match the provider payment id to `payment_orders` and `ledger_entries`.
5. Do not set `platform_settings.payments.allowSandbox` in production. That flag only permits the SQL sandbox provider in a development database.
