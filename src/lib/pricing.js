import { supabase } from './supabase';

// Local storage key for the user's explicit currency preference.
// If unset, we auto-detect from browser locale + timezone.
const CURRENCY_STORAGE_KEY = 'composure.displayCurrency';

const SUPPORTED_DISPLAY_CURRENCIES = ['ZAR', 'USD'];

// Browser locale signals that strongly suggest the visitor is in South Africa.
function localeLooksSouthAfrican() {
  if (typeof window === 'undefined') {
    return false;
  }

  const lang = (navigator.language || '').toUpperCase();
  if (lang.includes('-ZA') || lang === 'ZA') {
    return true;
  }

  // Many SA browsers report en-US for the language but keep their actual
  // timezone, so we also check for Africa/Johannesburg as a backup signal.
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === 'Africa/Johannesburg') {
      return true;
    }
  } catch {
    /* Intl unavailable — ignore */
  }

  return false;
}

// Returns the user's explicit choice if they've toggled, otherwise the
// auto-detected currency. Always returns 'ZAR' or 'USD'.
//
// This is synchronous so the first render has a good guess instantly.
// `detectDisplayCurrencyAsync` then refines it using IP geolocation, which
// is more accurate (especially for SA users on en-US browsers, or visitors
// from countries where the timezone signal isn't reliable).
export function getDisplayCurrency() {
  const stored = readStoredCurrency();
  if (stored) {
    return stored;
  }

  return localeLooksSouthAfrican() ? 'ZAR' : 'USD';
}

// Like `getDisplayCurrency` but also consults an IP-based geolocation API to
// improve accuracy. Honours the user's stored choice if there is one. Falls
// back to the synchronous detection on any network/parse failure so
// connectivity issues never block the UI.
export async function detectDisplayCurrencyAsync() {
  const stored = readStoredCurrency();
  if (stored) {
    return stored;
  }

  const country = await fetchVisitorCountry();
  if (country === 'ZA') {
    return 'ZAR';
  }

  if (country) {
    return 'USD';
  }

  // No country signal — use the synchronous heuristic.
  return localeLooksSouthAfrican() ? 'ZAR' : 'USD';
}

function readStoredCurrency() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    return SUPPORTED_DISPLAY_CURRENCIES.includes(stored) ? stored : null;
  } catch {
    return null;
  }
}

// Calls a free public IP geolocation service to retrieve the visitor's
// country code (ISO-3166 alpha-2, e.g. "ZA", "US"). Has its own short
// timeout so a slow/unreachable lookup never blocks the page.
async function fetchVisitorCountry() {
  if (typeof fetch !== 'function' || typeof window === 'undefined') {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch('https://ipapi.co/country/', {
      method: 'GET',
      headers: { Accept: 'text/plain' },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const text = (await response.text()).trim().toUpperCase();
    // ipapi returns 2-letter codes; reject anything else (rate-limit
    // responses sometimes come back as JSON or HTML).
    return /^[A-Z]{2}$/.test(text) ? text : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

// Persist a user-chosen currency. Pass `null` to clear it and fall back to
// auto-detection.
export function setDisplayCurrency(currency) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (currency && SUPPORTED_DISPLAY_CURRENCIES.includes(currency)) {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    } else {
      window.localStorage.removeItem(CURRENCY_STORAGE_KEY);
    }
  } catch {
    /* localStorage blocked — ignore */
  }
}

// Normalises a `pricing_plans` row into a plan object with both a local (ZAR)
// and an international (USD) price ready, plus the actual checkout currency
// Paystack will charge in. Display-time formatting is done by
// `applyDisplayCurrency` so we can react to user toggles without re-fetching.
function normalizePricingPlan(row) {
  const localPrice = row.price_display;
  const internationalPrice = row.international_price_display ?? row.price_display;

  return {
    id: row.id,
    name: row.name,
    ctaLabel: row.cta_label,
    description: row.description,
    amountCents: row.amount_cents,
    currency: row.currency,
    billingType: row.billing_type,
    paystackPlanCode: row.paystack_plan_code,
    cadence: row.cadence,
    checkoutPath: row.checkout_path,
    badge: row.badge,
    featured: row.featured,
    features: Array.isArray(row.features) ? row.features : [],

    // Currency-aware fields. `price` and `displayCurrency` are filled in by
    // applyDisplayCurrency() so the rest of the UI doesn't have to think
    // about it.
    localPrice,
    internationalPrice,
    checkoutCurrency: row.currency,
    price: localPrice,
    displayCurrency: row.currency,
  };
}

// Given a list of normalised plans and the chosen display currency, returns a
// new list where each plan has its `price` and `displayCurrency` set to match.
// Pure function — safe to call on every render or whenever the user toggles.
export function applyDisplayCurrency(plans, currency) {
  const target = SUPPORTED_DISPLAY_CURRENCIES.includes(currency) ? currency : 'ZAR';

  return plans.map((plan) => {
    const price = target === 'ZAR' ? plan.localPrice : plan.internationalPrice;
    return { ...plan, price, displayCurrency: target };
  });
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
