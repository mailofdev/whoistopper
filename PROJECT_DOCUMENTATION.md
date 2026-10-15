# Project documentation

## Scope

Who's Topper helps people in India discover products, SaaS, developer tools, and online businesses. Listing is free after review. Paid positions are optional, priced in INR, and labelled as paid placement.

## Roles

- Visitor: browse, search, filter, and report a public listing.
- Registered user: profile, submissions, ownership verification, own analytics, own payments, data export, account deletion.
- Product owner: not a stored role. It is a user with a verified ownership claim on an approved listing. Only that user can start a ranking upgrade for that listing.
- Administrator: moderate listings, reports, categories, and sponsored cards.
- Super administrator: change roles and platform settings. The last super administrator cannot be removed by the mock role rules.

Authorization is enforced in server actions and in Supabase Row Level Security. Hidden buttons are not a control.

## Journeys

1. A visitor opens the home page, a leaderboard, a category, or search, then a product page. Outbound clicks go through `/out/[slug]`.
2. A person creates an account, submits a listing, and verifies ownership by email link or by publishing a token at `https://<host>/.well-known/whoistopper.txt`.
3. With review enabled (the default), a verified listing waits for an administrator. After approval, the owner previews a rank and creates an order. The quoted rank is a preview. The final rank is written only after a verified payment.
4. An administrator reviews reports, changes listing status, and inspects payment reconciliation and webhook failures.

## Ranking

All-time, UTC daily, and category boards share one order: amount descending, earlier confirmation first, then listing id ascending. Free listings follow paid rows. Daily keys are `YYYY-MM-DD` in UTC. A payment at `2026-10-15T23:59:59.999Z` stays on 15 October. `2026-10-16T00:00:00.000Z` starts the next day. Old daily rows stay as history. The default floor is ₹99 and the default increase is ₹10. A later smaller payment does not lower an existing bid.

## What is not live without configuration

- Supabase Auth, database, and storage.
- Razorpay or Cashfree live checkout. Cashfree signature checks exist; Cashfree order creation does not.
- Transactional email beyond Supabase Auth emails and the mock development inbox.
- Logo file upload. Listings can store an https logo URL. Cards use initials.
- Shared rate limiting across more than one server process.
- Sentry. `SENTRY_DSN` is accepted and documented. Events are not sent until a client is added.
