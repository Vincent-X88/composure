-- Refresh pricing for the Pro and Premium (Lifetime) plans.
--
-- Pro:        R248/mo  -> R295/mo
-- Premium:    R745     -> R1680  (one-time lifetime)
--
-- The amount_cents column is the source of truth that the
-- create-checkout-session edge function sends to Paystack, so updating it
-- here is what actually changes how much customers are charged.
--
-- NOTE: For the Pro recurring subscription, you must ALSO update the price
-- on the Paystack plan in the Paystack dashboard (or create a new plan and
-- update pricing_plans.paystack_plan_code / the PAYSTACK_PLAN_PRO secret).
-- Existing Pro subscribers keep paying their original Paystack plan amount
-- until they resubscribe.

update public.pricing_plans
set
  amount_cents               = 29500,
  price_display              = 'R295',
  international_price_display = '$16.40',
  updated_at                 = now()
where id = 'pro';

update public.pricing_plans
set
  amount_cents               = 168000,
  price_display              = 'R1680',
  international_price_display = '$93.50',
  updated_at                 = now()
where id = 'premium';
