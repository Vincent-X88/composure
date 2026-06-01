import { supabase } from './supabase';

function isSouthAfricanLocale(locale) {
  const upperLocale = (locale ?? '').toUpperCase();
  return upperLocale.includes('-ZA') || upperLocale === 'ZA';
}

function getVisitorLocale() {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language;
  }

  return 'en-ZA';
}

function normalizePricingPlan(row) {
  const locale = getVisitorLocale();
  const displayCurrency = isSouthAfricanLocale(locale) ? 'ZAR' : 'USD';
  const price = displayCurrency === 'ZAR'
    ? row.price_display
    : row.international_price_display ?? row.price_display;

  return {
    id: row.id,
    name: row.name,
    ctaLabel: row.cta_label,
    description: row.description,
    amountCents: row.amount_cents,
    currency: row.currency,
    billingType: row.billing_type,
    paystackPlanCode: row.paystack_plan_code,
    price,
    displayCurrency,
    checkoutCurrency: row.currency,
    localPrice: row.price_display,
    internationalPrice: row.international_price_display ?? row.price_display,
    cadence: row.cadence,
    checkoutPath: row.checkout_path,
    badge: row.badge,
    featured: row.featured,
    features: Array.isArray(row.features) ? row.features : [],
  };
}

export async function loadPricingPlans() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('pricing_plans')
    .select(
      'id,name,cta_label,description,amount_cents,currency,billing_type,paystack_plan_code,price_display,international_price_display,cadence,checkout_path,badge,featured,sort_order,features',
    )
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(normalizePricingPlan);
}
