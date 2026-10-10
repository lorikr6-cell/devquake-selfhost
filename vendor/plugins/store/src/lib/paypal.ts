// PayPal with the shop owner's own app credentials (ADR 0057): Orders v2. Create an order, send
// the buyer to PayPal to approve it, then capture it when they come back. Sandbox or live.

type Fetch = typeof fetch;

export const paypalApi = (live: boolean) =>
  live ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

export type PaypalResult<T> = { ok: true; value: T } | { ok: false; error: string };

async function token(
  live: boolean,
  clientId: string,
  secret: string,
  fetchImpl: Fetch,
): Promise<string | null> {
  const res = await fetchImpl(`${paypalApi(live)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string };
  return res.ok && data.access_token ? data.access_token : null;
}

/** "12.50" for PayPal (cents as a decimal string); zero-decimal currencies have no cents. */
export function paypalAmount(cents: number, currency: string): string {
  return ['HUF', 'JPY', 'TWD'].includes(currency)
    ? String(Math.round(cents / 100))
    : (cents / 100).toFixed(2);
}

export interface PaypalOrderInput {
  orderCode: string;
  /** Tells payment attempts of one order apart (their request ids). */
  attempt?: string;
  currency: string;
  totalCents: number;
  storeName: string;
  returnUrl: string;
  cancelUrl: string;
}

/** Creates the PayPal order; the buyer approves it at `approveUrl`. */
export async function createPaypalOrder(
  creds: { live: boolean; clientId: string; secret: string },
  input: PaypalOrderInput,
  fetchImpl: Fetch = fetch,
): Promise<PaypalResult<{ id: string; approveUrl: string }>> {
  try {
    const bearer = await token(creds.live, creds.clientId, creds.secret, fetchImpl);
    if (!bearer) return { ok: false, error: 'paypal credentials refused' };
    const res = await fetchImpl(`${paypalApi(creds.live)}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bearer}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `order-${input.orderCode}${input.attempt ? `-${input.attempt}` : ''}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: input.orderCode,
            custom_id: input.orderCode,
            description: input.storeName.slice(0, 120),
            amount: {
              currency_code: input.currency,
              value: paypalAmount(input.totalCents, input.currency),
            },
          },
        ],
        application_context: {
          brand_name: input.storeName.slice(0, 120),
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
          return_url: input.returnUrl,
          cancel_url: input.cancelUrl,
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      links?: Array<{ rel?: string; href?: string }>;
      message?: string;
    };
    const approve = data.links?.find((l) => l.rel === 'approve' || l.rel === 'payer-action')?.href;
    if (!res.ok || !data.id || !approve)
      return { ok: false, error: data.message ?? `paypal ${res.status}` };
    return { ok: true, value: { id: data.id, approveUrl: approve } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'paypal unreachable' };
  }
}

/** Captures an approved order; paid only when PayPal says COMPLETED for the expected amount. */
export async function capturePaypalOrder(
  creds: { live: boolean; clientId: string; secret: string },
  paypalOrderId: string,
  expected: { totalCents: number; currency: string },
  fetchImpl: Fetch = fetch,
): Promise<PaypalResult<{ captureId: string }>> {
  if (!/^[A-Z0-9]{5,40}$/.test(paypalOrderId)) return { ok: false, error: 'bad paypal order id' };
  try {
    const bearer = await token(creds.live, creds.clientId, creds.secret, fetchImpl);
    if (!bearer) return { ok: false, error: 'paypal credentials refused' };
    const res = await fetchImpl(
      `${paypalApi(creds.live)}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15_000),
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      status?: string;
      purchase_units?: Array<{
        payments?: {
          captures?: Array<{
            id?: string;
            status?: string;
            amount?: { value?: string; currency_code?: string };
          }>;
        };
      }>;
    };
    const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
    const amountOk =
      capture?.amount?.currency_code === expected.currency &&
      capture.amount.value === paypalAmount(expected.totalCents, expected.currency);
    if (
      data.status !== 'COMPLETED' ||
      capture?.status !== 'COMPLETED' ||
      !capture.id ||
      !amountOk
    ) {
      return { ok: false, error: `paypal capture ${data.status ?? res.status}` };
    }
    return { ok: true, value: { captureId: capture.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'paypal unreachable' };
  }
}
