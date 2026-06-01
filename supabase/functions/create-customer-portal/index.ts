import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { paystackRequest } from '../_shared/paystack-rest.ts';

type PaystackManageLinkResponse = {
  data?: {
    link?: string;
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
      return jsonResponse({ error: 'Sign in before managing billing.' }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      return jsonResponse({ error: 'Invalid session.' }, 401);
    }

    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('paystack_subscription_code')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!subscription?.paystack_subscription_code) {
      return jsonResponse({ error: 'No Paystack subscription found for this account.' }, 404);
    }

    const manageLink = await paystackRequest<PaystackManageLinkResponse>(
      `/subscription/${subscription.paystack_subscription_code}/manage/link`,
    );

    if (!manageLink.data?.link) {
      return jsonResponse({ error: 'Paystack did not return a billing management link.' }, 502);
    }

    return jsonResponse({ url: manageLink.data.link });
  } catch (error) {
    return jsonResponse({ error: errorMessage(error, 'Could not create billing management link.') }, 500);
  }
});

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
