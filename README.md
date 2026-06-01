# Composure Website

React/Vite marketing site for Composure with Supabase Auth, Paystack Checkout, Paystack webhooks, and database-driven pricing for the desktop app.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Important: Vite loads `.env`, `.env.local`, and similar files, not `.env.example`. If you only edit `.env.example`, the app will still think Supabase is not configured.

3. Run the site:

```bash
npm run dev
```

## Supabase Setup

Apply the migration in `supabase/migrations/202605290001_billing_mvp.sql`.

If you already ran an earlier SQL draft in the Supabase SQL editor, run this migration again. It is idempotent and brings the database into the schema expected by the website and Edge Functions.

The migration creates or updates:

- `public.subscriptions`
- plan values: `free`, `pro`, `premium`
- status values: `trialing`, `active`, `canceled`, `past_due`
- RLS policies so clients can only read their own subscription row
- auth trigger to create a free subscription row on signup
- safe RPCs: `can_user_solve`, `increment_solves`, `claim_active_device`, `is_active_device`
- Paystack billing columns used by webhooks

In Supabase Auth settings, add your production site URL and local dev URL to the allowed redirect URLs:

```text
https://your-domain.com
http://localhost:5173
```

To enable Google sign-in, turn on the Google provider in Supabase Auth and paste the Google OAuth client ID and secret. In Google Cloud, add the Supabase callback URL shown in your Supabase provider settings.

## Paystack Setup

Create a Paystack account and use test mode while developing.

Add these Supabase Edge Function secrets:

```bash
supabase secrets set SITE_URL=https://your-domain.com
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_or_live_key
```

Pricing is now stored in `public.pricing_plans` and is the source of truth for the frontend and checkout flow. Update the database rows for `pro` and `premium` when prices change, then keep the Paystack dashboard plan/amount values in sync with those rows.

Deploy the Edge Functions:

```bash
supabase functions deploy create-checkout-session
supabase functions deploy create-customer-portal
supabase functions deploy paystack-webhook
```

In Paystack, add a webhook endpoint pointing to:

```text
https://your-project.supabase.co/functions/v1/paystack-webhook
```

The webhook verifies Paystack events with the `x-paystack-signature` header and your `PAYSTACK_SECRET_KEY`.

## Checkout Flow

The standard flow is:

1. User chooses a plan.
2. Free users create an account and receive a free subscription row from the auth trigger.
3. Paid users create an account or sign in with Supabase Auth.
4. The frontend invokes `create-checkout-session` for Pro or Premium.
5. Paystack Checkout collects payment.
6. Paystack sends a webhook to `paystack-webhook`.
7. The webhook updates `public.subscriptions`.
8. The desktop app checks Supabase for the user's active plan.

The frontend never stores Paystack secrets and never decides whether a subscription is active. Paystack webhooks and the Supabase `subscriptions` table are the source of truth.

## Production Checklist

1. Run `npm run build` before deployment.
2. Apply the Supabase migration.
3. Set Supabase Auth redirect URLs.
4. Set all Edge Function secrets.
5. Deploy all three Edge Functions.
6. Add the Paystack webhook endpoint.
7. Confirm the `public.pricing_plans` rows for Pro and Premium match the Paystack dashboard values.
8. Complete one Paystack test checkout for Pro.
9. Complete one Paystack test checkout for Premium.
10. Confirm the user's `public.subscriptions` row changes to the selected plan and `active`.

## Local Verification

Run the frontend production build:

```bash
npm run build
```

Run Edge Function type-checks with Deno:

```powershell
$env:DENO_DIR = "$PWD\.deno-cache"
deno check supabase/functions/create-checkout-session/index.ts supabase/functions/create-customer-portal/index.ts supabase/functions/paystack-webhook/index.ts
```

If `deno` is not found in an already-open terminal, close and reopen the terminal. On this Windows machine, Deno is installed at:

```text
C:\ProgramData\chocolatey\lib\deno\deno.exe
```
