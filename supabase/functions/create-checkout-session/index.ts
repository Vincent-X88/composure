import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { paystackRequest } from '../_shared/paystack-rest.ts';

type PaystackInitializeResponse = {
  data?: {
    authorization_url?: string;
    reference?: string;
  };
};

Deno.serve(async (request) => {
  const cors = handleCors(request);
  if (cors) {
    return cors;
  }

  try {
    const authHeader = request.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '');

    if (!jwt) {
      return jsonResponse({ error: 'Sign in before starting checkout.' }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user?.email) {
      return jsonResponse({ error: 'Invalid session.' }, 401);
    }

    const body = await readJsonBody(request);
    const requestedPlan = typeof body?.plan === 'string' ? body.plan : null;
    if (!requestedPlan) {
      return jsonResponse({ error: 'Unknown plan selected.' }, 400);
    }

    const { data: plan, error: planError } = await supabaseAdmin
      .from('pricing_plans')
      .select(
        'id,name,amount_cents,currency,billing_type,paystack_plan_code,price_display,cadence,checkout_path,badge,featured,sort_order,features',
      )
      .eq('id', requestedPlan)
      .maybeSingle();

    if (planError) {
      throw planError;
    }

    if (!plan) {
      return jsonResponse({ error: 'Unknown plan selected.' }, 400);
    }

    if (plan.billing_type === 'free') {
      return jsonResponse({ error: 'Free plans do not use checkout.' }, 400);
    }

    const paystackPlanCode =
      plan.paystack_plan_code ??
      (plan.id === 'pro' ? Deno.env.get('PAYSTACK_PLAN_PRO') ?? null : null);

    if (plan.billing_type === 'subscription' && !paystackPlanCode) {
      return jsonResponse(
        {
          error:
            'Missing Paystack plan code for Pro. Add it to the pricing_plans table or set PAYSTACK_PLAN_PRO in Supabase secrets.',
        },
        500,
      );
    }

    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, status, paystack_subscription_code')
      .eq('user_id', user.id)
      .maybeSingle();

    const hasSamePlan =
      existingSubscription?.plan === plan.id && existingSubscription?.status !== 'canceled';

    if (hasSamePlan) {
      return jsonResponse({ error: 'This plan is already active on your account.' }, 409);
    }

    const siteUrl = Deno.env.get('SITE_URL') ?? (Deno.env.get('DENO_DEPLOYMENT_ID') ? 'https://composure.fikronix.co.za' : 'http://localhost:5173');
    const reference = `composure_${plan.id}_${crypto.randomUUID().replaceAll('-', '')}`;
    const metadata = {
      supabase_user_id: user.id,
      plan: plan.id,
      billing_type: plan.billing_type,
      paystack_plan_code: paystackPlanCode ?? undefined,
    };

    const initializeBody: Record<string, unknown> = {
      email: user.email,
      amount: plan.amount_cents,
      currency: plan.currency,
      reference,
      callback_url: `${siteUrl}/?view=success&plan=${plan.id}&reference=${reference}`,
      metadata,
      channels:
        plan.billing_type === 'subscription'
          ? ['card']
          : ['card', 'bank_transfer', 'eft', 'capitec_pay', 'apple_pay'],
    };

    if (plan.billing_type === 'subscription') {
      initializeBody.plan = paystackPlanCode;
    }

    const checkout = await paystackRequest<PaystackInitializeResponse>('/transaction/initialize', {
      method: 'POST',
      body: initializeBody,
    });

    if (!checkout.data?.authorization_url) {
      return jsonResponse({ error: 'Paystack did not return a checkout URL.' }, 502);
    }

    await supabaseAdmin.from('subscriptions').upsert(
      {
        user_id: user.id,
        paystack_reference: checkout.data.reference ?? reference,
        paystack_plan_code: paystackPlanCode ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    return jsonResponse({ url: checkout.data.authorization_url });
  } catch (error) {
    return jsonResponse({ error: errorMessage(error, 'Could not create Paystack checkout.') }, 500);
  }
});

async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
