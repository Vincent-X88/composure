-- Public pricing plans table for the marketing site.
-- This is the source of truth for the frontend pricing cards.

create table if not exists public.pricing_plans (
  id text primary key,
  name text not null,
  cta_label text not null,
  description text not null,
  amount_cents integer not null,
  currency text not null,
  billing_type text not null,
  paystack_plan_code text,
  price_display text not null,
  international_price_display text,
  cadence text not null,
  checkout_path text not null,
  badge text,
  featured boolean not null default false,
  sort_order integer not null default 0,
  features jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.pricing_plans
  add column if not exists name text not null,
  add column if not exists cta_label text not null,
  add column if not exists description text not null,
  add column if not exists amount_cents integer not null default 0,
  add column if not exists currency text not null default 'ZAR',
  add column if not exists billing_type text not null default 'one_time',
  add column if not exists paystack_plan_code text,
  add column if not exists price_display text not null,
  add column if not exists international_price_display text,
  add column if not exists cadence text not null,
  add column if not exists checkout_path text not null,
  add column if not exists badge text,
  add column if not exists featured boolean not null default false,
  add column if not exists sort_order integer not null default 0,
  add column if not exists features jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

insert into public.pricing_plans (
  id,
  name,
  cta_label,
  description,
  amount_cents,
  currency,
  billing_type,
  paystack_plan_code,
  price_display,
  international_price_display,
  cadence,
  checkout_path,
  badge,
  featured,
  sort_order,
  features,
  updated_at
)
values
  (
    'free',
    'Free',
    'Start Free',
    'For trying Composure before upgrading.',
    0,
    'ZAR',
    'free',
    null,
    '$0',
    '$0',
    'forever',
    '?view=auth&plan=free',
    null,
    false,
    1,
    '["5 coaching sessions/day","Screen capture mode","Core question coverage","Single-device access","Email support"]'::jsonb,
    now()
  ),
  (
    'pro',
    'Pro',
    'Choose Pro',
    'For heavy usage, deeper prep, and premium support.',
    29500,
    'ZAR',
    'subscription',
    null,
    'R295',
    '$16.40',
    'mo',
    '?view=checkout&plan=pro',
    'Most Popular',
    true,
    2,
    '["Everything in Free","Dedicated performance tier","Custom prep packs","Advanced coaching workflows","Unlimited devices","Priority 1:1 support"]'::jsonb,
    now()
  ),
  (
    'premium',
    'Premium',
    'Choose Premium',
    'Lifetime access for serious candidates who want one payment and permanent activation.',
    168000,
    'ZAR',
    'one_time',
    null,
    'R1680',
    '$93.50',
    'lifetime',
    '?view=checkout&plan=premium',
    'Lifetime',
    false,
    3,
    '["Everything in Pro","Lifetime Composure access","No monthly subscription","Unlimited devices","All future premium updates","Priority lifetime support"]'::jsonb,
    now()
  )
on conflict (id) do update
set
  name = excluded.name,
  cta_label = excluded.cta_label,
  description = excluded.description,
  amount_cents = excluded.amount_cents,
  currency = excluded.currency,
  billing_type = excluded.billing_type,
  paystack_plan_code = excluded.paystack_plan_code,
  price_display = excluded.price_display,
  international_price_display = excluded.international_price_display,
  cadence = excluded.cadence,
  checkout_path = excluded.checkout_path,
  badge = excluded.badge,
  featured = excluded.featured,
  sort_order = excluded.sort_order,
  features = excluded.features,
  updated_at = now();

alter table public.pricing_plans enable row level security;

drop policy if exists "Anyone can read pricing plans" on public.pricing_plans;
create policy "Anyone can read pricing plans"
  on public.pricing_plans
  for select
  using (true);

grant select on public.pricing_plans to anon;
grant select on public.pricing_plans to authenticated;
