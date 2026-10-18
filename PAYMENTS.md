# Payments

## Modes

- Development and test, without live keys: sandbox. The upgrade form creates an internal order and opens `/payments/sandbox/[orderId]`. The page is labelled as a test. Success, failure, and cancel are simulated and never call a bank.
- Production: live Razorpay only when `PAYMENT_MODE=live`, the key id, key secret, and webhook secret are set, and `ADVERTISING_LIVE_APPROVED=true`. That flag stays unset until the provider approves this fixed-price advertising model. Otherwise advertising checkout is refused. Sandbox completion throws in production.
- Cashfree: webhook signatures can be verified. Creating a Cashfree order is not implemented.

## Order lifecycle

1. The server reads the package price. A client-supplied price that differs is rejected.
2. A pending order stores that server price, the package, and an estimated window.
3. Live mode creates a Razorpay order only when advertising payments are explicitly approved. Sandbox stores a `sandbox_` id.
4. A verified `payment.captured` event moves the order to paid, writes one charge, and creates one campaign. If the listing is not approved yet, the campaign stays scheduled and the clock starts on approval.
5. A captured `ranking_upgrade` is marked `refund_pending` and does not change directory order.
6. A refund event marks the campaign refunded and writes a debit.
7. Failure or cancel after a paid order is ignored. A refund before payment is rejected.
8. The same provider event id does not create a second campaign.

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
