import { createHmac, timingSafeEqual } from 'node:crypto';

// Stripe with the shop owner's own account (ADR 0057): a hosted Checkout Session over Stripe's
// REST API (no SDK), and the webhook's signature checked as Stripe documents it
// (https://docs.stripe.com/webhooks#verify-manually). Card data never reaches this server.

const API = 'https://api.stripe.com/v1';

type Fetch = typeof fetch;

/** Nested values as Stripe's form encoding: a[b][0][c]=x. */
export function formEncode(value: Record<string, unknown>): string {
  const out = new URLSearchParams();
  const walk = (prefix: string, v: unknown) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) v.forEach((x, i) => walk(`${prefix}[${i}]`, x));
    else if (typeof v === 'object') {
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
        walk(prefix ? `${prefix}[${k}]` : k, x);
      }
    } else out.append(prefix, String(v));
  };
  walk('', value);
  return out.toString();
}

export interface CheckoutInput {
  orderCode: string;
  /** Tells payment attempts of one order apart (their idempotency keys). */
  attempt?: string;
  currency: string;
  email: string;
  /** Lines as charged, in cents (shipping and fees as their own lines). */
  lines: Array<{ name: string; unitCents: number; quantity: number }>;
  successUrl: string;
  cancelUrl: string;
}

export function checkoutSessionBody(input: CheckoutInput): Record<string, unknown> {
  return {
    mode: 'payment',
    customer_email: input.email,
    client_reference_id: input.orderCode,
    metadata: { order: input.orderCode },
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    line_items: input.lines.map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency: input.currency.toLowerCase(),
        unit_amount: l.unitCents,
        product_data: { name: l.name.slice(0, 250) },
      },
    })),
  };
}

export type StripeResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** Creates the Checkout Session; the buyer goes to `url` to pay. */
export async function createCheckoutSession(
  secretKey: string,
  input: CheckoutInput,
  fetchImpl: Fetch = fetch,
): Promise<StripeResult<{ id: string; url: string }>> {
  try {
    const res = await fetchImpl(`${API}/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        // A retried request never makes a second session for the same attempt.
        'Idempotency-Key': `order-${input.orderCode}${input.attempt ? `-${input.attempt}` : ''}`,
      },
      body: formEncode(checkoutSessionBody(input)),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      url?: string;
      error?: { message?: string };
    };
    if (!res.ok || !data.id || !data.url) {
      return { ok: false, error: data.error?.message ?? `stripe ${res.status}` };
    }
    return { ok: true, value: { id: data.id, url: data.url } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'stripe unreachable' };
  }
}

/**
 * Whether a webhook payload is really from Stripe: `Stripe-Signature: t=<time>,v1=<hmac>…`, the
 * HMAC-SHA256 of "<t>.<payload>" with the endpoint's signing secret, at most `tolerance` seconds
 * old (replays are refused).
 */
export function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
  tolerance = 300,
): boolean {
  if (!header || !secret) return false;
  const parts = header.split(',').map((p) => p.trim().split('='));
  const t = Number(parts.find(([k]) => k === 't')?.[1]);
  const signatures = parts.filter(([k]) => k === 'v1').map(([, v]) => v ?? '');
  if (!Number.isFinite(t) || signatures.length === 0) return false;
  if (Math.abs(nowSeconds - t) > tolerance) return false;
  const expected = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
  const a = Buffer.from(expected, 'hex');
  return signatures.some((s) => {
    const b = Buffer.from(s, 'hex');
    return b.length === a.length && timingSafeEqual(a, b);
  });
}

export interface PaidSession {
  sessionId: string;
  orderCode: string;
  amountCents: number;
  currency: string;
}

/** A completed and paid Checkout Session from a webhook event, or null for anything else. */
export function paidSessionOf(event: unknown): PaidSession | null {
  const e = event as {
    type?: string;
    data?: {
      object?: {
        id?: string;
        client_reference_id?: string;
        amount_total?: number;
        currency?: string;
        payment_status?: string;
      };
    };
  };
  const s = e?.data?.object;
  if (
    !s ||
    (e.type !== 'checkout.session.completed' &&
      e.type !== 'checkout.session.async_payment_succeeded')
  ) {
    return null;
  }
  if (s.payment_status !== 'paid' || !s.id || !s.client_reference_id) return null;
  if (typeof s.amount_total !== 'number' || typeof s.currency !== 'string') return null;
  return {
    sessionId: s.id,
    orderCode: s.client_reference_id,
    amountCents: s.amount_total,
    currency: s.currency.toUpperCase(),
  };
}
