export type PlanId = 'pro' | 'premium';

type PlanConfig = {
  dbPlan: PlanId;
  mode: 'subscription' | 'payment';
  amountEnv: string;
  paystackPlanEnv?: string;
};

const plans: Record<PlanId, PlanConfig> = {
  pro: {
    dbPlan: 'pro',
    mode: 'subscription',
    amountEnv: 'PAYSTACK_AMOUNT_PRO',
    paystackPlanEnv: 'PAYSTACK_PLAN_PRO',
  },
  premium: {
    dbPlan: 'premium',
    mode: 'payment',
    amountEnv: 'PAYSTACK_AMOUNT_PREMIUM',
  },
};

export function getPlan(planId: string | null | undefined) {
  if (!planId || !(planId in plans)) {
    return null;
  }

  const plan = plans[planId as PlanId];
  const amount = Number(Deno.env.get(plan.amountEnv));
  const paystackPlanCode = plan.paystackPlanEnv ? Deno.env.get(plan.paystackPlanEnv) : null;

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`Missing or invalid Paystack amount env: ${plan.amountEnv}`);
  }

  if (plan.mode === 'subscription' && !paystackPlanCode) {
    throw new Error(`Missing Paystack plan env: ${plan.paystackPlanEnv}`);
  }

  return {
    id: planId as PlanId,
    dbPlan: plan.dbPlan,
    mode: plan.mode,
    amount,
    paystackPlanCode,
  };
}

export function getPlanFromPaystackPlanCode(planCode: string | null | undefined) {
  if (!planCode) {
    return null;
  }

  for (const [id, plan] of Object.entries(plans)) {
    if (plan.paystackPlanEnv && Deno.env.get(plan.paystackPlanEnv) === planCode) {
      return id as PlanId;
    }
  }

  return null;
}
