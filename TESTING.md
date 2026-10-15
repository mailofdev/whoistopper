# Testing

## Commands

- `npm test` runs Vitest in `tests/unit` and `tests/integration`.
- `npm run typecheck` and `npm run lint` are required before a release.
- `npm run test:e2e` starts Playwright against `npm run dev`. Install browsers with `npx playwright install chromium` first. CI runs lint, types, unit tests, and the production build. It does not run Playwright and it does not use live payment keys.

## Coverage

- Ranking order, UTC day keys, tie breaks, and bid floors.
- URL normalization and INR formatting.
- Payment state transitions, including duplicates, amount mismatch, and refunds.
- Webhook signature acceptance and rejection for Razorpay and Cashfree.
- Mock versus production data-source selection.
- Mock service search visibility, duplicate capture, and the all-time tie.
- Paid versus free labels on the product card.
- SQL rank order string matches the engine.

Not automated yet: a real Supabase RLS suite, concurrent SQL bids against Postgres, and the full Playwright signup path. Run those against a staging project before launch. The Playwright spec covers the home page and search in mock mode.

## Manual checklist

- Home, leaderboard, today, category, search, and a product page on a phone-width window.
- Sign in as an owner, submit a listing, and confirm validation errors.
- Complete a sandbox success and confirm the receipt shows a final rank.
- Sign in as an administrator and open moderation.
- Signed-out visit to `/dashboard` redirects to login.
- Production build with mock requested still serves Supabase, not mock data.
