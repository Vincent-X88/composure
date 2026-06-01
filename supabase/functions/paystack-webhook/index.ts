import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { paystackRequest, verifyPaystackWebhook } from '../_shared/paystack-rest.ts';

type PaystackEvent = {
  event: string;
  data: {
    status?: string;
    reference?: string;
    metadata?: {
      supabase_user_id?: string;
      plan?: string;
      billing_type?: string;
      paystack_plan_code?: string;
    };
    customer?: {
      id?: number;
      customer_code?: string;
      email?: string;
    };
    plan?: {
      plan_code?: string;
    } | string;
    subscription?: {
      subscription_code?: string;
    } | string;
    subscription_code?: string;
    next_payment_date?: string | null;
    period_end?: string | null;
  };
};

type PaystackTransactionVerifyResponse = {
  data?: {
    reference?: string;
    subscription?: PaystackSubscriptionShape | string | null;
    subscription_code?: string | null;
    plan?: { plan_code?: string } | string | null;
    customer?: PaystackCustomerShape | null;
    next_payment_date?: string | null;
    period_end?: string | null;
  };
};

type PaystackSubscriptionListResponse = {
  data?: PaystackSubscriptionShape[];
};

type PaystackCustomerShape = {
  id?: number;
  customer_code?: string;
  email?: string;
};

type PaystackSubscriptionShape = {
  subscription_code?: string;
  code?: string;
  next_payment_date?: string | null;
  period_end?: string | null;
  customer?: PaystackCustomerShape | string | null;
  plan?: { plan_code?: string } | string | null;
};

type ResolvedPaystackSubscription = {
  subscriptionCode: string | null;
  planCode: string | null;
  customerCode: string | null;
  nextPaymentDate: string | null;
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

Deno.serve(async (request) => {
  const cors = handleCors(request);
  if (cors) {
    return cors;
  }

  const rawBody = await request.text();
  const isValid = await verifyPaystackWebhook(rawBody, request.headers.get('x-paystack-signature'));

  if (!isValid) {
    return jsonResponse({ error: 'Invalid Paystack signature.' }, 400);
  }

  const event = JSON.parse(rawBody) as PaystackEvent;

  try {
    if (event.event === 'charge.success') {
      await handleChargeSuccess(event.data);
    }

    if (event.event === 'subscription.create' || event.event === 'subscription.enable') {
      await syncSubscriptionEvent(event.data, 'active');
    }

    if (event.event === 'subscription.not_renew') {
      await syncSubscriptionEvent(event.data, 'canceled');
    }

    if (event.event === 'subscription.disable') {
      await syncSubscriptionEvent(event.data, 'canceled');
    }

    if (event.event === 'invoice.payment_failed') {
      await syncSubscriptionEvent(event.data, 'past_due');
    }

    return jsonResponse({ received: true });
  } catch (error) {
    return jsonResponse({ error: errorMessage(error, 'Webhook handling failed.') }, 500);
  }
});

async function handleChargeSuccess(data: PaystackEvent['data']) {
  if (data.status !== 'success') {
    return;
  }

  const userId = data.metadata?.supabase_user_id ?? null;
  const currentSubscription = userId ? await getSubscriptionByUserId(userId) : null;
  const planFromMetadata = data.metadata?.plan ?? null;
  const planFromMetadataPaystackCode = data.metadata?.paystack_plan_code ?? null;
  const planFromPaystackCode = await getPlanFromPaystackPlanCode(
    planCode(data) ?? planFromMetadataPaystackCode,
  );
  const plan = normalizePlan(planFromMetadata ?? planFromPaystackCode ?? currentSubscription?.plan);

  if (!userId || plan === 'free') {
    return;
  }

  const now = new Date().toISOString();
  const isLifetimePremium = plan === 'premium' || data.metadata?.billing_type === 'one_time';
  const paystackSubscription = isLifetimePremium
    ? null
    : await findPaystackSubscription({
        reference: data.reference ?? null,
        customerId: data.customer?.id ?? null,
        planCode: data.metadata?.paystack_plan_code ?? planCode(data) ?? currentSubscription?.paystack_plan_code ?? null,
      });
  const resolvedSubscriptionCode =
    isLifetimePremium
      ? null
      : subscriptionCodeFrom(data) ??
        currentSubscription?.paystack_subscription_code ??
        paystackSubscription?.subscriptionCode ??
        null;
  const resolvedPlanCode =
    data.metadata?.paystack_plan_code ??
    planCode(data) ??
    currentSubscription?.paystack_plan_code ??
    paystackSubscription?.planCode ??
    null;
  const nextPeriodEnd = toIso(
    data.next_payment_date ?? data.period_end ?? paystackSubscription?.nextPaymentDate,
  );

  await supabaseAdmin.from('subscriptions').upsert(
    {
      user_id: userId,
      plan,
      status: 'active',
      paystack_customer_code:
        data.customer?.customer_code ??
        currentSubscription?.paystack_customer_code ??
        paystackSubscription?.customerCode ??
        null,
      paystack_subscription_code: resolvedSubscriptionCode,
      paystack_plan_code: resolvedPlanCode,
      paystack_reference: data.reference ?? currentSubscription?.paystack_reference ?? null,
      current_period_end: isLifetimePremium ? null : nextPeriodEnd ?? currentSubscription?.current_period_end ?? null,
      cancel_at_period_end: false,
      trial_end: null,
      plan_changed_at: currentSubscription?.plan !== plan ? now : currentSubscription?.plan_changed_at ?? now,
      updated_at: now,
    },
    { onConflict: 'user_id' },
  );
}

async function syncSubscriptionEvent(data: PaystackEvent['data'], status: 'active' | 'canceled' | 'past_due') {
  const subscriptionCode = subscriptionCodeFrom(data);
  const customerCode = data.customer?.customer_code ?? null;
  const userId = data.metadata?.supabase_user_id ?? null;
  const currentSubscription = userId ? await getSubscriptionByUserId(userId) : null;
  const planFromMetadata = data.metadata?.plan ?? null;
  const planFromMetadataPaystackCode = data.metadata?.paystack_plan_code ?? null;
  const planFromPaystackCode = await getPlanFromPaystackPlanCode(
    planCode(data) ?? planFromMetadataPaystackCode,
  );
  const resolvedPlan = normalizePlan(planFromMetadata ?? planFromPaystackCode ?? currentSubscription?.plan);
  const resolvedPlanCode =
    data.metadata?.paystack_plan_code ?? planCode(data) ?? currentSubscription?.paystack_plan_code ?? null;
  const resolvedSubscriptionCode =
    subscriptionCode ?? currentSubscription?.paystack_subscription_code ?? null;
  const currentPeriodEnd = toIso(data.next_payment_date ?? data.period_end ?? null);

  const payload = {
    plan: resolvedPlan,
    status,
    paystack_customer_code: customerCode ?? currentSubscription?.paystack_customer_code ?? null,
    paystack_subscription_code: resolvedSubscriptionCode,
    paystack_plan_code: resolvedPlanCode,
    current_period_end: currentPeriodEnd ?? currentSubscription?.current_period_end ?? null,
    updated_at: new Date().toISOString(),
  };

  const updates: Array<Promise<unknown>> = [];

  if (subscriptionCode) {
    updates.push(updateSubscriptionRecord('paystack_subscription_code', subscriptionCode, payload));
  }

  if (userId) {
    updates.push(updateSubscriptionRecord('user_id', userId, payload));
  } else if (customerCode) {
    updates.push(updateSubscriptionRecord('paystack_customer_code', customerCode, payload));
  }

  if (updates.length === 0) {
    return;
  }

  await Promise.all(updates);
}

function subscriptionCodeFrom(data: PaystackEvent['data']) {
  if (typeof data.subscription === 'string') {
    return data.subscription;
  }

  return data.subscription?.subscription_code ?? data.subscription_code ?? null;
}

async function findPaystackSubscription({
  reference,
  customerId,
  planCode,
}: {
  reference: string | null;
  customerId: number | null;
  planCode: string | null;
}): Promise<ResolvedPaystackSubscription | null> {
  const verified = reference ? await safePaystackLookup(() => verifyTransactionSubscription(reference)) : null;

  if (verified?.subscriptionCode) {
    return verified;
  }

  if (!customerId) {
    return verified;
  }

  const fromList = await safePaystackLookup(() => findSubscriptionByCustomer(customerId, planCode));
  return fromList ?? verified;
}

async function safePaystackLookup<T>(lookup: () => Promise<T>) {
  try {
    return await lookup();
  } catch {
    return null;
  }
}

async function verifyTransactionSubscription(reference: string) {
  const verified = await paystackRequest<PaystackTransactionVerifyResponse>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );

  return normalizePaystackSubscription({
    subscription: verified.data?.subscription,
    subscriptionCode: verified.data?.subscription_code ?? null,
    plan: verified.data?.plan,
    customer: verified.data?.customer,
    nextPaymentDate: verified.data?.next_payment_date ?? verified.data?.period_end ?? null,
  });
}

async function findSubscriptionByCustomer(customerId: number, expectedPlanCode: string | null) {
  const subscriptions = await paystackRequest<PaystackSubscriptionListResponse>(
    `/subscription?customer=${encodeURIComponent(String(customerId))}&perPage=20`,
  );

  const matchingSubscription =
    subscriptions.data?.find((subscription) => {
      const candidatePlanCode = planCodeFromValue(subscription.plan);
      return !expectedPlanCode || candidatePlanCode === expectedPlanCode;
    }) ?? subscriptions.data?.[0] ?? null;

  if (!matchingSubscription) {
    return null;
  }

  return normalizePaystackSubscription({
    subscription: matchingSubscription,
    subscriptionCode: matchingSubscription.subscription_code ?? matchingSubscription.code ?? null,
    plan: matchingSubscription.plan,
    customer: matchingSubscription.customer,
    nextPaymentDate: matchingSubscription.next_payment_date ?? matchingSubscription.period_end ?? null,
  });
}

function normalizePaystackSubscription({
  subscription,
  subscriptionCode,
  plan,
  customer,
  nextPaymentDate,
}: {
  subscription?: PaystackSubscriptionShape | string | null;
  subscriptionCode?: string | null;
  plan?: PaystackSubscriptionShape['plan'];
  customer?: PaystackSubscriptionShape['customer'];
  nextPaymentDate?: string | null;
}): ResolvedPaystackSubscription | null {
  const subscriptionObject = typeof subscription === 'object' ? subscription : null;
  const resolvedSubscriptionCode =
    (typeof subscription === 'string' ? subscription : null) ??
    subscriptionObject?.subscription_code ??
    subscriptionObject?.code ??
    subscriptionCode ??
    null;

  if (!resolvedSubscriptionCode) {
    return null;
  }

  return {
    subscriptionCode: resolvedSubscriptionCode,
    planCode: planCodeFromValue(plan ?? subscriptionObject?.plan),
    customerCode: customerCodeFromValue(customer ?? subscriptionObject?.customer),
    nextPaymentDate: nextPaymentDate ?? subscriptionObject?.next_payment_date ?? subscriptionObject?.period_end ?? null,
  };
}

function customerCodeFromValue(customer: PaystackSubscriptionShape['customer']) {
  if (typeof customer === 'string') {
    return customer;
  }

  return customer?.customer_code ?? null;
}

function planCodeFromValue(plan: PaystackSubscriptionShape['plan']) {
  if (typeof plan === 'string') {
    return plan;
  }

  return plan?.plan_code ?? null;
}

function planCode(data: PaystackEvent['data']) {
  if (typeof data.plan === 'string') {
    return data.plan;
  }

  return data.plan?.plan_code ?? null;
}

function normalizePlan(plan: string | null | undefined) {
  if (plan === 'pro' || plan === 'premium') {
    return plan;
  }

  return 'free';
}

async function getPlanFromPaystackPlanCode(planCodeValue: string | null | undefined) {
  if (!planCodeValue) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from('pricing_plans')
    .select('id')
    .eq('paystack_plan_code', planCodeValue)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id ?? null;
}

async function getSubscriptionByUserId(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('plan,paystack_customer_code,paystack_subscription_code,paystack_plan_code,paystack_reference,current_period_end,plan_changed_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

async function updateSubscriptionRecord(
  field: 'user_id' | 'paystack_subscription_code' | 'paystack_customer_code',
  value: string,
  payload: Record<string, unknown>,
) {
  const { error } = await supabaseAdmin.from('subscriptions').update(payload).eq(field, value);

  if (error) {
    throw error;
  }
}

function toIso(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
