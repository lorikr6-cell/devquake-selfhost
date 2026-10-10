'use client';

import { useState, type FormEvent } from 'react';
import { Link, cn, rich, trackEvent, useT } from '@devquake/ui';
import { quote, type ItemSnapshot } from '../lib/checkout';
import type { PublicVoucher } from '../lib/marketing';
import { ruleHints, ruleLabel, type PublicRule } from '../lib/rules';
import { LIMITS, type PaymentMethod } from '../lib/model';
import type { Zone } from '../lib/pricing';
import { errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { useCartItems, useMoney } from './shop-client';
import { S } from './shop-style';
import { ErrorText, Field, Input, Select, TextArea } from './ui';

/**
 * The buyer's details, delivery country and payment method, with the sums the server will
 * charge (the same pure `quote` it uses). The server checks everything again and refuses when
 * the total differs from the one shown here.
 */
export function CheckoutForm({
  slug,
  currency,
  zones,
  methods,
  codFeeCents,
  storeVatRate,
  countries,
  newsletter,
  rules,
}: {
  slug: string;
  currency: string;
  zones: Zone[];
  methods: PaymentMethod[];
  codFeeCents: number;
  storeVatRate: number;
  countries: Array<{ code: string; name: string }>;
  /** The shop can send its newsletter (offer to join it). */
  newsletter: boolean;
  /** The shop's live automatic discounts and free shipping. */
  rules: PublicRule[];
}) {
  const tRules = useT('rules');
  const t = useT('checkout');
  const tCart = useT('cart');
  const tMethods = useT('methods');
  const tErr = useT('errors');
  const money = useMoney(currency);
  const { toast } = useFeedback();
  const { cart, items, reload } = useCartItems(slug);
  const [buyer, setBuyer] = useState({
    name: '',
    email: '',
    phone: '',
    addressLine: '',
    city: '',
    postalCode: '',
    country: countries[0]?.code ?? '',
    note: '',
  });
  const [method, setMethod] = useState<PaymentMethod | ''>(methods[0] ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [voucher, setVoucher] = useState<PublicVoucher | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [checking, setChecking] = useState(false);
  const [join, setJoin] = useState(false);

  async function applyVoucher() {
    setChecking(true);
    setVoucherError('');
    try {
      const res = await fetch(`/api/s/${slug}/voucher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json().catch(() => null)) as {
        voucher?: PublicVoucher;
        error?: string;
      } | null;
      if (!res.ok || !data?.voucher) {
        throw Object.assign(new Error(data?.error ?? ''), { status: res.status });
      }
      setVoucher(data.voucher);
      trackEvent('store_voucher_applied');
      toast(t('voucherApplied', { code: data.voucher.code }));
    } catch (err) {
      setVoucher(null);
      setVoucherError(errorMessage(err, tErr));
    } finally {
      setChecking(false);
    }
  }

  if (!cart.ready || items === null) return <p className="text-sm">{tCart('loading')}</p>;
  const snapshot: ItemSnapshot[] = cart.lines.flatMap((l) => {
    const i = items.find((x) => x.variantId === l.variantId);
    return i && i.available
      ? [
          {
            productId: i.productId,
            variantId: i.variantId,
            name: i.name,
            optionName: i.optionName,
            unitCents: i.cents,
            // The VAT does not change the total (prices include it); the server computes it.
            vatRate: storeVatRate,
            quantity: l.quantity,
          },
        ]
      : [];
  });
  if (snapshot.length === 0) {
    return (
      <div className="space-y-3">
        <p>{tCart('empty')}</p>
        <Link href={`/s/${slug}`} className={S.button}>
          {tCart('browse')}
        </Link>
      </div>
    );
  }
  if (methods.length === 0 || zones.length === 0) return <p>{t('noMethods')}</p>;

  const q = method
    ? quote({
        items: snapshot,
        zones,
        country: buyer.country,
        method,
        codFeeCents,
        storeVatRate,
        voucher,
        rules,
      })
    : null;
  const set = (field: keyof typeof buyer) => (value: string) =>
    setBuyer((b) => ({ ...b, [field]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!q || !q.ok || !method) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/s/${slug}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart: cart.lines,
          buyer,
          method,
          voucher: voucher?.code ?? null,
          newsletter: join,
          expectedTotal: q.totals.totalCents,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        redirect?: string;
        error?: string;
        code?: string;
      } | null;
      if (!res.ok || !data?.redirect) {
        if (data?.code === 'totalChanged' || data?.code === 'cartChanged') reload();
        throw Object.assign(new Error(data?.error ?? ''), { status: res.status });
      }
      trackEvent('store_order_placed', { method });
      cart.clear();
      window.location.assign(data.redirect);
    } catch (err) {
      const message = errorMessage(err, tErr);
      setError(message);
      toast(message, 'error');
      setBusy(false);
    }
  }

  const onlineMethod = method === 'stripe' || method === 'paypal';

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <fieldset className="space-y-3">
          <legend className={cn('text-lg font-semibold', S.heading)}>{t('contact')}</legend>
          <Field label={t('name')}>
            <Input
              value={buyer.name}
              onChange={(e) => set('name')(e.target.value)}
              autoComplete="name"
              maxLength={LIMITS.buyerName}
              required
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('email')}>
              <Input
                type="email"
                value={buyer.email}
                onChange={(e) => set('email')(e.target.value)}
                autoComplete="email"
                maxLength={LIMITS.email}
                required
              />
            </Field>
            <Field label={t('phone')} hint={t('phoneHint')}>
              <Input
                type="tel"
                value={buyer.phone}
                onChange={(e) => set('phone')(e.target.value)}
                autoComplete="tel"
                maxLength={LIMITS.phone}
                required
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className={cn('text-lg font-semibold', S.heading)}>{t('address')}</legend>
          <Field label={t('addressLine')}>
            <Input
              value={buyer.addressLine}
              onChange={(e) => set('addressLine')(e.target.value)}
              autoComplete="street-address"
              maxLength={LIMITS.addressLine}
              required
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={t('city')}>
              <Input
                value={buyer.city}
                onChange={(e) => set('city')(e.target.value)}
                autoComplete="address-level2"
                maxLength={LIMITS.city}
                required
              />
            </Field>
            <Field label={t('postalCode')}>
              <Input
                value={buyer.postalCode}
                onChange={(e) => set('postalCode')(e.target.value)}
                autoComplete="postal-code"
                maxLength={LIMITS.postalCode}
              />
            </Field>
            <Field label={t('country')}>
              <Select
                value={buyer.country}
                onChange={(e) => set('country')(e.target.value)}
                autoComplete="country"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label={t('note')}>
            <TextArea
              value={buyer.note}
              onChange={(e) => set('note')(e.target.value)}
              maxLength={LIMITS.note}
            />
          </Field>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className={cn('text-lg font-semibold', S.heading)}>{t('method')}</legend>
          {methods.map((m) => (
            <label
              key={m}
              className={cn(
                'flex min-h-11 cursor-pointer items-center gap-3 border px-3 py-2 has-[:checked]:[border-color:var(--shop-accent)] has-[:checked]:[background-color:color-mix(in_srgb,var(--shop-accent)_8%,transparent)]',
                S.line,
                S.radius,
              )}
            >
              <input
                type="radio"
                name="method"
                value={m}
                checked={method === m}
                onChange={() => setMethod(m)}
                className="[accent-color:var(--shop-accent)]"
              />
              <span className="font-medium">{tMethods(m)}</span>
              {m === 'cod' && codFeeCents > 0 ? (
                <span className={cn('text-sm', S.muted)}>+ {money(codFeeCents)}</span>
              ) : null}
            </label>
          ))}
        </fieldset>

        {newsletter ? (
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={join}
              onChange={(e) => setJoin(e.target.checked)}
              className="mt-1 [accent-color:var(--shop-accent)]"
            />
            <span>
              <span className="font-medium">{t('joinNewsletter')}</span>
              <span className={cn('block text-xs', S.muted)}>{t('joinNewsletterHint')}</span>
            </span>
          </label>
        ) : null}
      </div>

      <aside className={cn('h-fit space-y-3 lg:sticky lg:top-4', S.panel)}>
        <h2 className={cn('text-lg font-semibold', S.heading)}>{t('summary')}</h2>
        <ul className="space-y-1 text-sm">
          {snapshot.map((i) => (
            <li key={i.variantId} className="flex justify-between gap-3">
              <span className="min-w-0">
                {i.quantity} × {i.name}
                {i.optionName ? ` (${i.optionName})` : ''}
              </span>
              <span className="shrink-0">{money(i.unitCents * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t pt-3 [border-color:var(--shop-line)]">
          {voucher ? (
            <p className="flex items-center justify-between gap-2 text-sm">
              <span>
                {t('voucherUsed', { code: voucher.code })}
                {voucher.description ? (
                  <span className={cn('block text-xs', S.muted)}>{voucher.description}</span>
                ) : null}
              </span>
              <button
                type="button"
                className="text-xs underline"
                onClick={() => {
                  setVoucher(null);
                  setCode('');
                }}
              >
                {t('voucherRemove')}
              </button>
            </p>
          ) : (
            <div className="flex gap-2">
              <label className="sr-only" htmlFor="voucher-code">
                {t('voucher')}
              </label>
              <Input
                id="voucher-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={t('voucher')}
                maxLength={30}
                autoComplete="off"
                className="min-h-11"
              />
              <button
                type="button"
                className={S.buttonSecondary}
                disabled={checking || code.trim().length < 3}
                onClick={applyVoucher}
              >
                {t('voucherApply')}
              </button>
            </div>
          )}
          {voucherError ? (
            <p role="alert" className="text-xs text-red-700 dark:text-red-400">
              {voucherError}
            </p>
          ) : null}
        </div>
        {q && q.ok ? (
          <dl className="space-y-1 border-t pt-3 text-sm [border-color:var(--shop-line)]">
            <div className="flex justify-between">
              <dt>{t('subtotal')}</dt>
              <dd>{money(q.totals.itemsCents)}</dd>
            </div>
            {q.auto.discount ? (
              <div className={cn('flex justify-between gap-3 font-medium', S.accent)}>
                <dt>{ruleLabel(tRules, q.auto.discount, money)}</dt>
                <dd className="shrink-0">−{money(q.auto.discountCents)}</dd>
              </div>
            ) : null}
            {q.voucherCents > 0 ? (
              <div className={cn('flex justify-between font-medium', S.accent)}>
                <dt>{t('discount')}</dt>
                <dd>−{money(q.voucherCents)}</dd>
              </div>
            ) : null}
            {ruleHints(tRules, q.auto, money).map((hint) => (
              <p key={hint} className={cn('text-xs', S.muted)}>
                {hint}
              </p>
            ))}
            <div className="flex justify-between">
              <dt>{t('shipping')}</dt>
              <dd>
                {q.totals.shippingCents === 0 ? t('shippingFree') : money(q.totals.shippingCents)}
              </dd>
            </div>
            {q.totals.feeCents > 0 ? (
              <div className="flex justify-between">
                <dt>{t('fee')}</dt>
                <dd>{money(q.totals.feeCents)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t pt-2 text-base font-bold [border-color:var(--shop-line)]">
              <dt>{t('total')}</dt>
              <dd>{money(q.totals.totalCents)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            {q && !q.ok && q.reason === 'voucherMin' && voucher?.minOrderCents
              ? t('voucherMin', { amount: money(voucher.minOrderCents) })
              : t('noShipping')}
          </p>
        )}
        <p className={cn('text-xs', S.muted)}>
          {rich(t('agree'), {
            terms: (
              <Link href={`/s/${slug}/info`} className="underline">
                {t('termsLink')}
              </Link>
            ),
          })}
        </p>
        <ErrorText>{error}</ErrorText>
        <button type="submit" className={cn(S.button, 'w-full')} disabled={busy || !q || !q.ok}>
          {busy ? t('placing') : onlineMethod ? t('placeAndPay') : t('place')}
        </button>
        <p className={cn('text-xs', S.muted)}>{newsletter ? t('keepNoteMail') : t('keepNote')}</p>
      </aside>
    </form>
  );
}
