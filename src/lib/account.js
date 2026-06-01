import { supabase } from './supabase';

export async function ensureCurrentSubscriptionRow() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.rpc('ensure_subscription_row');

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function activateFreePlan() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.rpc('activate_free_plan');

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function loadCurrentSubscription() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select(
      'plan,status,current_period_end,cancel_at_period_end,plan_changed_at,updated_at,paystack_subscription_code,paystack_plan_code,paystack_customer_code',
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}
