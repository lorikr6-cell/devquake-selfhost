'use client';

import { useState, type FormEvent } from 'react';
import { Link, cn, trackEvent, useT } from '@devquake/ui';
import type { InterestOption, InterestVote as Vote } from '../lib/interest';
import { centsToText } from '../lib/pricing';
import { errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { S } from './shop-style';
import { ErrorText, Field, Input, Select } from './ui';

// The vote on a product that is not sold yet (ADR 0060): do you want it, what would you pay,
// which version. One vote per person (a DevQuake member or the shop's signed-in buyer).

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as
    ({ error?: string } & { mine: Vote | null; interested: number }) | null;
  if (!res.ok || !data) throw Object.assign(new Error(data?.error ?? ''), { status: res.status });
  return data;
}

export function InterestVote({
  slug,
  product,
  currency,
  options,
  initial,
  canVote,
  signInHref,
}: {
  slug: string;
  product: string;
  currency: string;
  options: InterestOption[];
  initial: { mine: Vote | null; interested: number };
  canVote: boolean;
  signInHref: string;
}) {
  const t = useT('interest');
  const tErr = useT('errors');
  const { toast } = useFeedback();
  const [state, setState] = useState(initial);
  const mine = state.mine;
  const [min, setMin] = useState(mine?.minCents != null ? centsToText(mine.minCents) : '');
  const [max, setMax] = useState(mine?.maxCents != null ? centsToText(mine.maxCents) : '');
  const [choices, setChoices] = useState<Record<string, string>>(mine?.choices ?? {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const url = `/api/s/${slug}/p/${product}/interest`;

  async function vote(interested: boolean, event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError('');
    try {
      const next = await send(url, 'POST', {
        interested,
        priceMin: interested ? min : null,
        priceMax: interested ? max : null,
        choices: interested ? choices : {},
      });
      setState(next);
      trackEvent(interested ? 'store_interest_yes' : 'store_interest_no');
      toast(t('thanks'));
    } catch (err) {
      setError(errorMessage(err, tErr));
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    setBusy(true);
    try {
      setState(await send(url, 'DELETE'));
      toast(t('withdrawn'));
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="interest-title" className={cn('space-y-3', S.panel)}>
      <p className={S.badge}>{t('notSold')}</p>
      <h2 id="interest-title" className={cn('text-lg font-semibold', S.heading)}>
        {t('title')}
      </h2>
      <p className="text-sm">{t('intro')}</p>
      <p className={cn('text-sm font-medium')}>{t('count', { count: state.interested })}</p>
      {!canVote ? (
        <p className="text-sm">
          {t('signIn')}{' '}
          <Link href={signInHref} className="underline">
            {t('signInLink')}
          </Link>
        </p>
      ) : (
        <form onSubmit={(e) => vote(true, e)} className="space-y-3">
          {mine ? (
            <p className={cn('text-sm', S.muted)}>
              {mine.interested ? t('votedYes') : t('votedNo')}
            </p>
          ) : null}
          {options.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {options.map((o) => (
                <Field key={o.label} label={o.label}>
                  <Select
                    value={choices[o.label] ?? ''}
                    onChange={(e) =>
                      setChoices((c) => {
                        const next = { ...c };
                        if (e.target.value) next[o.label] = e.target.value;
                        else delete next[o.label];
                        return next;
                      })
                    }
                  >
                    <option value="">{t('any')}</option>
                    {o.values.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </Field>
              ))}
            </div>
          ) : null}
          <fieldset className="space-y-1">
            <legend className="text-sm">{t('priceRange', { currency })}</legend>
            <div className="flex flex-wrap gap-2">
              <Field label={t('priceMin')} className="w-32">
                <Input inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} />
              </Field>
              <Field label={t('priceMax')} className="w-32">
                <Input inputMode="decimal" value={max} onChange={(e) => setMax(e.target.value)} />
              </Field>
            </div>
          </fieldset>
          <ErrorText>{error}</ErrorText>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={S.button} disabled={busy}>
              {mine?.interested ? t('update') : t('yes')}
            </button>
            <button
              type="button"
              className={S.buttonSecondary}
              disabled={busy}
              onClick={() => vote(false)}
            >
              {t('no')}
            </button>
            {mine ? (
              <button
                type="button"
                className="min-h-11 px-3 text-sm underline"
                disabled={busy}
                onClick={withdraw}
              >
                {t('withdraw')}
              </button>
            ) : null}
          </div>
        </form>
      )}
    </section>
  );
}
