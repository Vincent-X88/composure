import { supabase } from './supabase';

function billingError(error, data, fallback) {
  const message = data?.error ?? error?.message ?? fallback;

  if (typeof message === 'string' && message.includes('Failed to send a request to the Edge Function')) {
    return 'Supabase Edge Functions could not be reached. Make sure the Paystack functions are deployed for this project, your internet connection is working, and the Supabase URL in `.env` matches the project you deployed to.';
  }

  if (typeof message === 'string' && message.includes('Edge Function returned a non-2xx status code')) {
    return (
      data?.error ??
      'Checkout could not be started. Check that the Pro Paystack plan code is set in Supabase secrets or the pricing_plans table.'
    );
  }

  return message;
}

export async function startCheckout(planId) {
  if (!supabase) {
    throw new Error('Supabase is not configured yet.');
  }

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { plan: planId },
  });

  if (error) {
    throw new Error(billingError(error, data, 'Could not start checkout.'));
  }

  if (!data?.url) {
    throw new Error('Checkout did not return a redirect URL.');
  }

  window.location.assign(data.url);
}

export async function openCustomerPortal() {
  if (!supabase) {
    throw new Error('Supabase is not configured yet.');
  }

  const { data, error } = await supabase.functions.invoke('create-customer-portal');

  if (error) {
    throw new Error(billingError(error, data, 'Could not open billing portal.'));
  }

  if (!data?.url) {
    throw new Error('Billing management did not return a redirect URL.');
  }

  window.location.assign(data.url);
}

export const openBillingManagement = openCustomerPortal;
