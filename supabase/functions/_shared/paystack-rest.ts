type PaystackBody = Record<string, unknown>;

const paystackApiBase = 'https://api.paystack.co';

function paystackSecretKey() {
  const key = Deno.env.get('PAYSTACK_SECRET_KEY');

  if (!key) {
    throw new Error('Missing PAYSTACK_SECRET_KEY');
  }

  return key;
}

export async function paystackRequest<T>(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: PaystackBody } = {},
) {
  const method = options.method ?? 'GET';
  const response = await fetch(`${paystackApiBase}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${paystackSecretKey()}`,
      ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
    },
    body: method === 'POST' ? JSON.stringify(options.body ?? {}) : undefined,
  });

  const data = await response.json();

  if (!response.ok || data?.status === false) {
    throw new Error(data?.message ?? 'Paystack request failed.');
  }

  return data as T;
}

export async function verifyPaystackWebhook(rawBody: string, signatureHeader: string | null) {
  if (!signatureHeader) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(paystackSecretKey()),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  );

  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const expected = Array.from(new Uint8Array(signed))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return timingSafeEqual(expected, signatureHeader);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return result === 0;
}
