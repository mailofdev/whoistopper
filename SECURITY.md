# Security

## Threats and controls

- Account takeover: operator routes use Supabase Auth, with rate limits on login, signup, and reset. Public rank claims do not create an account.
- Privilege escalation: roles live in `profiles`. Signup metadata cannot set them. Admin pages call `requireAdmin`. Production requires authenticator assurance level `aal2` unless `REQUIRE_ADMIN_MFA=false`.
- IDOR: listing edits, analytics, receipts, and upgrades load the row for the signed-in user and check ownership on the server.
- Payment fraud: the browser success page is not proof of payment. Webhooks verify signatures. Amount, currency, and order id are checked before a rank changes. Duplicate events do not double-credit.
- XSS: React escapes text. Website URLs are normalized to https. `javascript:`, `data:`, credentials, shorteners, IP hosts, and localhost are rejected.
- SSRF: domain verification resolves the host and refuses private addresses, does not follow redirects, and times out after 5 seconds.
- Injection: Supabase queries are parameterized. SQL lives in migrations.
- CSRF: Server Actions use the Next.js action protocol. The proxy only checks cookie presence and does not grant access.
- Secrets: service role, webhook secrets, and Razorpay secret are server environment variables. `NEXT_PUBLIC_` is limited to the site URL, Supabase URL, anon key, and the Razorpay key id.
- Uploads: logo files are not accepted yet. An optional https logo URL is stored as text.
- Logs: the logger redacts keys whose names look like secrets, passwords, tokens, or signatures.
- Privacy: public profiles omit email. Analytics store a salted hash. Production skips analytics when `ANALYTICS_SALT` is missing. Account export and deletion are available to the signed-in user. Financial rows are retained.

## Headers

`next.config.ts` sets a Content-Security-Policy, `nosniff`, a referrer policy, frame denial, and a permissions policy. The policy allows inline scripts because nonce-based CSP conflicts with the cached static shell. `unsafe-eval` is included so the Next.js dev server can run. Tighten this before a high-risk launch if the deployment no longer needs it.

## Rate limits

Limits are in memory for one process. They reset on restart and are not shared across instances. Use a shared store before running more than one server.

## Residual items

- Enroll Supabase MFA for every administrator before production and keep `REQUIRE_ADMIN_MFA` on.
- Review provider terms, backup retention, and the Supabase and Vercel quotas before charging users.
- Run `npm audit` and patch compatible upgrades. Do not use `npm audit fix --force` blindly; it can jump major versions.
