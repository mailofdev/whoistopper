# Deployment

## Environments

- Local: `.env.local` and sandbox payments. The board is empty until Supabase is configured.
- Preview: Supabase branch or staging project, Razorpay test keys if you want real test checkout. Do not point preview webhooks at production data.
- Production: live Razorpay, service role, analytics salt, cron secret, admin MFA on.

Validate variables with the health route. `configurationGaps()` lists what is missing. It does not print secret values.

## Vercel

1. Import the repository. Framework preset is Next.js.
2. Set the environment variables from `.env.example` for Production and Preview separately.
3. Add the production domain `rankpush.lol` and HTTPS. Set `NEXT_PUBLIC_SITE_URL=https://rankpush.lol`.
4. Set Auth Site URL and redirect allow-list to the production origin, `/auth/callback`, and `/auth/update-password`.
5. After deploy, open `/api/health`, `/sitemap.xml`, and `/robots.txt`.

## Database

Apply migrations before the app starts taking orders. Take a backup first. Do not edit applied migration files; add a new one. Restore by creating a new Supabase project from the backup and pointing the environment at it. Confirm the provider's backup retention on the paid plan you use.

Schedule `POST /api/cron/daily` with `Authorization: Bearer <CRON_SECRET>` after 00:05 UTC so the previous day is complete.

## Rollback

Redeploy the previous Vercel deployment if the app is the problem and the schema did not change. If a migration already ran, roll forward with a fix migration or restore the database backup. Do not assume an app rollback undoes SQL.

## Monitoring

Use `/api/health` and the admin webhook page. Add Sentry later with `SENTRY_DSN` if you want exception capture; scrub emails and payment ids before enabling it. Set billing alerts on Vercel, Supabase, and Razorpay.

## PWA

Install is deferred. The app does not register `public/sw.js`, does not show an install button, and does not publish a web manifest. A later phase can turn that shell back on. The offline notice in the header still appears when the browser reports no connection.

## Before charging users

Confirm Razorpay merchant approval, the methods enabled on that account, Supabase and Vercel commercial terms, a tested backup restore, and administrator MFA.
