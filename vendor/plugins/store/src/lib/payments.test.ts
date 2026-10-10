import { createHmac, randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { capturePaypalOrder, createPaypalOrder, paypalAmount } from './paypal';
import { canKeepSecrets, openSecret, sealSecret } from './secrets';
import {
  checkoutSessionBody,
  createCheckoutSession,
  formEncode,
  paidSessionOf,
  verifyStripeSignature,
} from './stripe';

const key = randomBytes(32).toString('base64');

describe('secrets', () => {
  it('seals and opens with the same key only', () => {
    const sealed = sealSecret('sk_live_123', key);
    expect(sealed.startsWith('v1.')).toBe(true);
    expect(sealed).not.toContain('sk_live');
    expect(openSecret(sealed, key)).toBe('sk_live_123');
    expect(openSecret(sealed, randomBytes(32).toString('base64'))).toBeNull();
    // A changed authentication tag (its first character: every bit of it counts).
    const [v, iv, tag, data] = sealed.split('.');
    const forged = `${v}.${iv}.${tag![0] === 'A' ? 'B' : 'A'}${tag!.slice(1)}.${data}`;
    expect(openSecret(forged, key)).toBeNull();
    expect(openSecret(null, key)).toBeNull();
    expect(canKeepSecrets(key)).toBe(true);
    expect(canKeepSecrets('short')).toBe(false);
  });
});

describe('Stripe', () => {
  const input = {
    orderCode: 'AbcdEfgh2345Jkmn6789',
    currency: 'RON',
    email: 'buyer@example.com',
    lines: [
      { name: 'Mug', unitCents: 4990, quantity: 2 },
      { name: 'Shipping', unitCents: 1500, quantity: 1 },
    ],
    successUrl: 'https://shop.example.com/s/x/orders/AbcdEfgh2345Jkmn6789?paid=1',
    cancelUrl: 'https://shop.example.com/s/x/orders/AbcdEfgh2345Jkmn6789',
  };

  it('encodes a checkout session the way Stripe reads forms', () => {
    const body = new URLSearchParams(formEncode(checkoutSessionBody(input)));
    expect(body.get('mode')).toBe('payment');
    expect(body.get('client_reference_id')).toBe(input.orderCode);
    expect(body.get('line_items[0][price_data][unit_amount]')).toBe('4990');
    expect(body.get('line_items[0][price_data][currency]')).toBe('ron');
    expect(body.get('line_items[1][price_data][product_data][name]')).toBe('Shipping');
    expect(body.get('line_items[0][quantity]')).toBe('2');
  });

  it('creates the session with the owner key and an idempotency key', async () => {
    let seen: RequestInit | undefined;
    const fake = (async (_url: string, init: RequestInit) => {
      seen = init;
      return new Response(
        JSON.stringify({ id: 'cs_1', url: 'https://checkout.stripe.com/c/cs_1' }),
      );
    }) as unknown as typeof fetch;
    const r = await createCheckoutSession('sk_test_1', input, fake);
    expect(r).toEqual({
      ok: true,
      value: { id: 'cs_1', url: 'https://checkout.stripe.com/c/cs_1' },
    });
    const headers = seen!.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer sk_test_1');
    expect(headers['Idempotency-Key']).toBe(`order-${input.orderCode}`);
  });

  it('reports Stripe errors', async () => {
    const fake = (async () =>
      new Response(JSON.stringify({ error: { message: 'Invalid API Key' } }), {
        status: 401,
      })) as unknown as typeof fetch;
    expect(await createCheckoutSession('sk_bad', input, fake)).toEqual({
      ok: false,
      error: 'Invalid API Key',
    });
  });

  it('accepts only correctly signed, recent webhooks', () => {
    const secret = 'whsec_test';
    const payload = '{"id":"evt_1"}';
    const t = 1_800_000_000;
    const sig = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
    expect(verifyStripeSignature(payload, `t=${t},v1=${sig}`, secret, t + 10)).toBe(true);
    expect(verifyStripeSignature(payload, `t=${t},v1=${'0'.repeat(64)},v1=${sig}`, secret, t)).toBe(
      true,
    );
    expect(verifyStripeSignature(payload + ' ', `t=${t},v1=${sig}`, secret, t)).toBe(false);
    expect(verifyStripeSignature(payload, `t=${t},v1=${sig}`, 'whsec_other', t)).toBe(false);
    expect(verifyStripeSignature(payload, `t=${t},v1=${sig}`, secret, t + 301)).toBe(false);
    expect(verifyStripeSignature(payload, null, secret, t)).toBe(false);
  });

  it('reads a paid session from the event', () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_1',
          client_reference_id: 'X',
          amount_total: 11480,
          currency: 'ron',
          payment_status: 'paid',
        },
      },
    };
    expect(paidSessionOf(event)).toEqual({
      sessionId: 'cs_1',
      orderCode: 'X',
      amountCents: 11480,
      currency: 'RON',
    });
    expect(
      paidSessionOf({
        ...event,
        data: { object: { ...event.data.object, payment_status: 'unpaid' } },
      }),
    ).toBeNull();
    expect(paidSessionOf({ ...event, type: 'charge.refunded' })).toBeNull();
  });
});

describe('PayPal', () => {
  const creds = { live: false, clientId: 'cid', secret: 'sec' };
  const fakePaypal = (capture: { status: string; value: string; currency: string }) =>
    (async (url: string) => {
      if (url.endsWith('/v1/oauth2/token'))
        return new Response(JSON.stringify({ access_token: 'tok' }));
      if (url.endsWith('/v2/checkout/orders')) {
        return new Response(
          JSON.stringify({
            id: 'PP123ABC',
            links: [
              { rel: 'approve', href: 'https://www.sandbox.paypal.com/checkoutnow?token=PP123ABC' },
            ],
          }),
        );
      }
      return new Response(
        JSON.stringify({
          status: capture.status,
          purchase_units: [
            {
              payments: {
                captures: [
                  {
                    id: 'CAP1',
                    status: capture.status,
                    amount: { value: capture.value, currency_code: capture.currency },
                  },
                ],
              },
            },
          ],
        }),
      );
    }) as unknown as typeof fetch;

  it('writes amounts PayPal reads', () => {
    expect(paypalAmount(1250, 'EUR')).toBe('12.50');
    expect(paypalAmount(150000, 'HUF')).toBe('1500');
  });

  it('creates an order to approve and captures it for the right amount only', async () => {
    const created = await createPaypalOrder(
      creds,
      {
        orderCode: 'X',
        currency: 'EUR',
        totalCents: 1250,
        storeName: 'Shop',
        returnUrl: 'https://s/r',
        cancelUrl: 'https://s/c',
      },
      fakePaypal({ status: 'COMPLETED', value: '12.50', currency: 'EUR' }),
    );
    expect(created).toEqual({
      ok: true,
      value: { id: 'PP123ABC', approveUrl: expect.stringContaining('PP123ABC') },
    });
    expect(
      await capturePaypalOrder(
        creds,
        'PP123ABC',
        { totalCents: 1250, currency: 'EUR' },
        fakePaypal({ status: 'COMPLETED', value: '12.50', currency: 'EUR' }),
      ),
    ).toEqual({ ok: true, value: { captureId: 'CAP1' } });
    expect(
      (
        await capturePaypalOrder(
          creds,
          'PP123ABC',
          { totalCents: 1250, currency: 'EUR' },
          fakePaypal({ status: 'COMPLETED', value: '1.00', currency: 'EUR' }),
        )
      ).ok,
    ).toBe(false);
    expect(
      (await capturePaypalOrder(creds, 'bad id!', { totalCents: 1250, currency: 'EUR' })).ok,
    ).toBe(false);
  });
});
