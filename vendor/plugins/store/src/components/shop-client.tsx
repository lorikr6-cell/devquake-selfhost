'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { LOCALE_TAGS, Link, cn, trackEvent, useLocale, useT } from '@devquake/ui';
import { LIMITS } from '../lib/model';
import { formatCents } from '../lib/pricing';
import { applyRules, ruleHints, ruleLabel, type PublicRule } from '../lib/rules';
import { errorMessage } from './call-api';
import { useCart, type CartItem } from './cart';
import { COMPARE_MAX, useCompare } from './compare';
import { useFeedback } from './feedback';
import { S } from './shop-style';

/** Money in the page language, for client components. */
export function useMoney(currency: string) {
  const tag = LOCALE_TAGS[useLocale()];
  return (cents: number) => formatCents(cents, currency, tag);
}

/** The cart in the shop's header, with the number of pieces in it. */
export function CartLink({ slug, label }: { slug: string; label: string }) {
  const { count } = useCart(slug);
  return (
    <Link href={`/s/${slug}/cart`} className={S.buttonSecondary}>
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2" />
        <circle cx="9" cy="20" r="1.3" />
        <circle cx="17" cy="20" r="1.3" />
      </svg>
      <span>{label}</span>
      {count > 0 ? <span className={S.badge}>{count}</span> : null}
    </Link>
  );
}

/** The comparison in the shop's header, once something is picked. */
export function CompareLink({ slug, label }: { slug: string; label: string }) {
  const { list } = useCompare(slug);
  if (list.length === 0) return null;
  return (
    <Link href={`/s/${slug}/compare?p=${list.join(',')}`} className={S.buttonSecondary}>
      <span>{label}</span>
      <span className={S.badge}>{list.length}</span>
    </Link>
  );
}

/** Adds a product to the comparison or takes it out. */
export function CompareToggle({
  slug,
  product,
  className,
  withLabel = false,
}: {
  slug: string;
  product: string;
  className?: string;
  withLabel?: boolean;
}) {
  const t = useT('compare');
  const { toast } = useFeedback();
  const { ready, list, toggle } = useCompare(slug);
  const on = list.includes(product);
  if (!ready) return null;
  return (
    <button
      type="button"
      aria-pressed={on}
      title={on ? t('remove') : t('add')}
      onClick={() => {
        const result = toggle(product);
        if (result === 'full') toast(t('full', { max: COMPARE_MAX }), 'error');
        else if (result === 'added') {
          trackEvent('store_compare_add');
          toast(t('added'));
        }
      }}
      className={cn(
        withLabel
          ? S.buttonSecondary
          : 'grid size-9 place-items-center rounded-full border bg-white/90 text-ink shadow-sm backdrop-blur hover:[border-color:var(--shop-accent)]',
        on && !withLabel && '[background-color:var(--shop-accent)] [color:var(--shop-on-accent)]',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 3v18M16 3v18M3 8h5M16 16h5" />
      </svg>
      {withLabel ? (
        <span>{on ? t('remove') : t('add')}</span>
      ) : (
        <span className="sr-only">{on ? t('remove') : t('add')}</span>
      )}
    </button>
  );
}

/** A voucher code with a button that copies it. */
export function CopyCode({ code }: { code: string }) {
  const t = useT('shop');
  const { toast } = useFeedback();
  return (
    <span className="inline-flex items-center gap-2">
      <span className="rounded-md border border-dashed border-current px-2 py-0.5 font-mono font-semibold tracking-wider">
        {code}
      </span>
      <button
        type="button"
        className="text-sm underline"
        onClick={async () => {
          await navigator.clipboard?.writeText(code).catch(() => undefined);
          toast(t('codeCopied', { code }));
        }}
      >
        {t('copyCode')}
      </button>
    </span>
  );
}

/** The newsletter form (double opt-in: the email holds a link to confirm). */
export function NewsletterSignup({ slug, source }: { slug: string; source: 'shop' | 'account' }) {
  const t = useT('newsletterForm');
  const tErr = useT('errors');
  const { toast } = useFeedback();
  const [email, setEmail] = useState('');
  const [trap, setTrap] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/s/${slug}/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, website: trap }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw Object.assign(new Error(data?.error ?? ''), { status: res.status });
      trackEvent('store_newsletter_signup');
      setDone(true);
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
    } finally {
      setBusy(false);
    }
  }

  if (done) return <p className="text-sm font-medium">{t('checkInbox')}</p>;
  return (
    <form onSubmit={submit} className="space-y-2">
      <p className="text-sm font-semibold [color:var(--shop-text,inherit)]">{t('title')}</p>
      <p>{t('body')}</p>
      <div className="flex max-w-md flex-wrap gap-2">
        <label className="sr-only" htmlFor={`newsletter-${source}`}>
          {t('email')}
        </label>
        <input
          id={`newsletter-${source}`}
          type="email"
          required
          maxLength={160}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('email')}
          className="min-h-11 min-w-0 flex-1 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
        />
        {/* People never see this field; bots fill it in. */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
          className="hidden"
          name="website"
        />
        <button type="submit" className={S.button} disabled={busy}>
          {t('submit')}
        </button>
      </div>
      <p>{t('privacy')}</p>
    </form>
  );
}

export interface BuyableOption {
  id: number;
  name: string;
  cents: number;
  regularCents: number;
  onSale: boolean;
  stock: number | null;
}

/** Choose an option and a quantity, and put them in the cart. */
export function AddToCart({
  slug,
  currency,
  options,
}: {
  slug: string;
  currency: string;
  options: BuyableOption[];
}) {
  const t = useT('shop');
  const money = useMoney(currency);
  const { toast } = useFeedback();
  const { add } = useCart(slug);
  const firstInStock = options.find((o) => o.stock === null || o.stock > 0) ?? options[0];
  const [optionId, setOptionId] = useState(firstInStock?.id ?? 0);
  const [quantity, setQuantity] = useState(1);
  const option = options.find((o) => o.id === optionId) ?? options[0];
  if (!option) return null;
  const soldOut = option.stock !== null && option.stock <= 0;
  const max = Math.min(LIMITS.quantity, option.stock ?? LIMITS.quantity);

  return (
    <div className="space-y-4">
      <p className="flex flex-wrap items-baseline gap-x-3">
        <span className={cn('text-2xl font-bold', option.onSale && S.accent)}>
          {money(option.cents)}
        </span>
        {option.onSale ? <s className={S.muted}>{money(option.regularCents)}</s> : null}
      </p>
      {options.length > 1 ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t('option')}</legend>
          <div className="flex flex-wrap gap-2">
            {options.map((o) => {
              const out = o.stock !== null && o.stock <= 0;
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={o.id === optionId}
                  onClick={() => {
                    setOptionId(o.id);
                    setQuantity(1);
                  }}
                  className={cn(
                    'min-h-11 border px-3 py-2 text-sm [border-radius:var(--shop-button-radius)]',
                    o.id === optionId
                      ? 'font-semibold [border-color:var(--shop-accent)] [background-color:color-mix(in_srgb,var(--shop-accent)_12%,transparent)]'
                      : cn(S.line, 'hover:[border-color:var(--shop-accent)]'),
                    out && cn(S.muted, 'line-through'),
                  )}
                >
                  {o.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      {option.stock !== null && option.stock > 0 && option.stock <= 5 ? (
        <p className={cn('text-sm font-medium', S.accent)}>
          {t('fewLeft', { count: option.stock })}
        </p>
      ) : null}
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium">{t('quantity')}</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={max}
            value={quantity}
            disabled={soldOut}
            onChange={(e) => setQuantity(Math.max(1, Math.min(max, Number(e.target.value) || 1)))}
            className="min-h-11 w-24 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm dark:border-paper/15 dark:bg-ink"
          />
        </label>
        <button
          type="button"
          className={S.button}
          disabled={soldOut}
          onClick={() => {
            add(option.id, quantity);
            trackEvent('store_add_to_cart');
            toast(t('added'));
          }}
        >
          {soldOut ? t('soldOut') : t('addToCart')}
        </button>
      </div>
    </div>
  );
}

/** The cart's lines as they are now in the shop (prices, sales, stock). */
export function useCartItems(slug: string) {
  const cart = useCart(slug);
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [round, setRound] = useState(0);
  const ids = useMemo(() => cart.lines.map((l) => l.variantId).join(','), [cart.lines]);
  useEffect(() => {
    if (!cart.ready) return;
    if (!ids) {
      setItems([]);
      return;
    }
    let live = true;
    fetch(`/api/s/${slug}/cart?v=${ids}`, { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<{ items: CartItem[] }>) : { items: [] }))
      .then((d) => live && setItems(d.items))
      .catch(() => live && setItems([]));
    return () => {
      live = false;
    };
  }, [slug, ids, cart.ready, round]);
  return { cart, items, reload: () => setRound((r) => r + 1) };
}

export function CartView({
  slug,
  currency,
  photoBase,
  rules = [],
}: {
  slug: string;
  currency: string;
  /** Where photos come from: "/api/s/<slug>/photos" (or the owner's preview). */
  photoBase: string | null;
  /** The shop's live automatic discounts and free shipping. */
  rules?: PublicRule[];
}) {
  const t = useT('cart');
  const tRules = useT('rules');
  const money = useMoney(currency);
  const { cart, items } = useCartItems(slug);
  if (!cart.ready || items === null) return <p className="text-sm">{t('loading')}</p>;
  const lines = cart.lines
    .map((l) => ({ line: l, item: items.find((i) => i.variantId === l.variantId) }))
    .filter((x) => x.item);
  if (lines.length === 0) {
    return (
      <div className="space-y-3">
        <p>{t('empty')}</p>
        <Link href={`/s/${slug}`} className={S.button}>
          {t('browse')}
        </Link>
      </div>
    );
  }
  const subtotal = lines.reduce(
    (s, { line, item }) => s + (item!.available ? item!.cents * line.quantity : 0),
    0,
  );
  const pieces = lines.reduce((s, { line, item }) => s + (item!.available ? line.quantity : 0), 0);
  const auto = applyRules(rules, subtotal, pieces);
  const blocked = lines.some(
    ({ line, item }) => !item!.available || (item!.stock !== null && item!.stock < line.quantity),
  );

  return (
    <div className="space-y-6">
      <ul className={cn('divide-y divide-[var(--shop-line)]', S.card)}>
        {lines.map(({ line, item }) => {
          const i = item!;
          const short = i.stock !== null && i.stock < line.quantity;
          return (
            <li key={i.variantId} className="flex flex-wrap items-center gap-3 p-3">
              {photoBase && i.photoId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${photoBase}/${i.photoId}?size=thumb`}
                  alt=""
                  className="size-16 rounded-lg object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="grid size-16 place-items-center rounded-lg text-2xl [background-color:var(--shop-surface)]"
                >
                  🛍️
                </span>
              )}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/s/${slug}/p/${i.slug}`}
                  className="font-medium hover:[color:var(--shop-accent)]"
                >
                  {i.name}
                </Link>
                {i.optionName ? <p className={cn('text-sm', S.muted)}>{i.optionName}</p> : null}
                {!i.available ? (
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    {t('unavailable')}
                  </p>
                ) : short ? (
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    {t('onlyLeft', { count: Math.max(0, i.stock ?? 0) })}
                  </p>
                ) : null}
              </div>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={LIMITS.quantity}
                value={line.quantity}
                aria-label={i.name}
                onChange={(e) =>
                  cart.setQuantity(i.variantId, Math.max(0, Number(e.target.value) || 0))
                }
                className="min-h-11 w-20 rounded-md border border-ink/15 bg-white px-2 py-2 text-sm dark:border-paper/15 dark:bg-ink"
              />
              <span className="w-24 text-right font-semibold">
                {money(i.cents * line.quantity)}
              </span>
              <button
                type="button"
                className="min-h-11 px-2 text-sm underline"
                onClick={() => cart.setQuantity(i.variantId, 0)}
              >
                {t('remove')}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {auto.discount ? (
            <>
              <p className={cn('text-sm font-medium', S.accent)}>
                {ruleLabel(tRules, auto.discount, money)}: −{money(auto.discountCents)}
              </p>
              <p className="text-lg">
                {t('subtotal')}: <s className={cn('text-sm', S.muted)}>{money(subtotal)}</s>{' '}
                <span className="font-bold">{money(subtotal - auto.discountCents)}</span>
              </p>
            </>
          ) : (
            <p className="text-lg">
              {t('subtotal')}: <span className="font-bold">{money(subtotal)}</span>
            </p>
          )}
          {auto.freeShipping ? (
            <p className={cn('text-sm font-medium', S.accent)}>{tRules('freeShipping')}</p>
          ) : (
            <p className={cn('text-sm', S.muted)}>{t('shippingNote')}</p>
          )}
          {ruleHints(tRules, auto, money).map((hint) => (
            <p key={hint} className="text-sm font-medium">
              {hint}
            </p>
          ))}
        </div>
        {blocked ? (
          <span className={cn(S.button, 'pointer-events-none opacity-50')} aria-disabled>
            {t('checkout')}
          </span>
        ) : (
          <Link href={`/s/${slug}/checkout`} className={S.button}>
            {t('checkout')}
          </Link>
        )}
      </div>
    </div>
  );
}

/** "Pay now" on an order awaiting a card or PayPal payment. */
export function PayNow({ slug, code }: { slug: string; code: string }) {
  const t = useT('orderPage');
  const tErr = useT('errors');
  const { toast } = useFeedback();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className={S.button}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await fetch(`/api/s/${slug}/orders/${code}/pay`, { method: 'POST' });
          const data = (await res.json().catch(() => null)) as {
            redirect?: string;
            error?: string;
          } | null;
          if (!res.ok || !data?.redirect) {
            throw Object.assign(new Error(data?.error ?? ''), { status: res.status });
          }
          window.location.assign(data.redirect);
        } catch (err) {
          toast(errorMessage(err, tErr), 'error');
          setBusy(false);
        }
      }}
    >
      {busy ? t('paying') : t('payNow')}
    </button>
  );
}

/** Copies the order page's address (the buyer's only way back to it). */
export function CopyLink() {
  const t = useT('orderPage');
  const { toast } = useFeedback();
  return (
    <button
      type="button"
      className={S.buttonSecondary}
      onClick={async () => {
        await navigator.clipboard
          ?.writeText(window.location.href.split('?')[0]!)
          .catch(() => undefined);
        toast(t('copied'));
      }}
    >
      {t('copyLink')}
    </button>
  );
}
