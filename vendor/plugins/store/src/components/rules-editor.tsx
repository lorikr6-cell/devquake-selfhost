'use client';

import { useId, useState } from 'react';
import { Button, Sheet, cn, useT } from '@devquake/ui';
import { RULE_KINDS, type RuleKind } from '../lib/rules';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Select } from './ui';
import { useAction } from './use-action';

export interface RuleValue {
  id: number | null;
  kind: RuleKind;
  /** An amount ("50.00") or a number of pieces ("5"). */
  threshold: string;
  percentOff: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  state?: 'off' | 'scheduled' | 'live' | 'ended';
  summary?: string;
}

const STATE_TONE = {
  live: 'bg-green-100 text-green-900 dark:bg-green-500/15 dark:text-green-200',
  scheduled: 'bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-200',
  ended: 'bg-ink/10 text-ink/70 dark:bg-paper/10 dark:text-paper/70',
  off: 'bg-ink/10 text-ink/70 dark:bg-paper/10 dark:text-paper/70',
} as const;

/**
 * Automatic discounts and free shipping: from an amount spent or a number of pieces in the
 * cart. Buyers see them in the cart and at checkout, with what is missing for the next step.
 */
export function RulesEditor({ rules, currency }: { rules: RuleValue[]; currency: string }) {
  const t = useT('rules');
  const tState = useT('marketing.state');
  const { busy, error, setError, act, confirm } = useAction();
  const [draft, setDraft] = useState<RuleValue | null>(null);
  const heading = useId();
  const set = (change: Partial<RuleValue>) => setDraft((d) => (d ? { ...d, ...change } : d));

  async function save() {
    if (!draft) return;
    const { id, ...body } = draft;
    const ok = await act(
      () => (id === null ? callApi('/rules', 'POST', body) : callApi(`/rules/${id}`, 'PUT', body)),
      { success: id === null ? t('created') : t('saved') },
    );
    if (ok) setDraft(null);
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-semibold">{t('title')}</h2>
          <p className="text-sm text-ink/60 dark:text-paper/60">{t('intro')}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setError('');
            setDraft({
              id: null,
              kind: 'quantity',
              threshold: '3',
              percentOff: '10',
              startsAt: '',
              endsAt: '',
              active: true,
            });
          }}
        >
          {t('new')}
        </Button>
      </div>
      {rules.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('empty')}</p>
      ) : (
        <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
          {rules.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 p-3">
              <span className="min-w-0 flex-1 font-medium">{r.summary}</span>
              {r.state ? (
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    STATE_TONE[r.state],
                  )}
                >
                  {tState(r.state)}
                </span>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setError('');
                  setDraft(r);
                }}
              >
                {t('edit')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={async () => {
                  const ok = await confirm({
                    title: t('deleteTitle'),
                    body: t('deleteBody'),
                    confirmLabel: t('delete'),
                    danger: true,
                  });
                  if (ok)
                    await act(() => callApi(`/rules/${r.id}`, 'DELETE'), { success: t('deleted') });
                }}
              >
                {t('delete')}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-ink/60 dark:text-paper/60">{t('note')}</p>

      <Sheet
        open={draft !== null}
        onClose={() => setDraft(null)}
        labelledBy={heading}
        header={
          <h2 id={heading} className="font-display text-lg font-semibold">
            {draft?.id === null ? t('new') : t('editTitle')}
          </h2>
        }
        footer={
          <div className="flex gap-2">
            <Button type="button" disabled={busy} onClick={save}>
              {t('save')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
              {t('cancel')}
            </Button>
          </div>
        }
        bodyClassName="space-y-3"
      >
        {draft ? (
          <>
            <Field label={t('kindLabel')}>
              <Select
                value={draft.kind}
                onChange={(e) => {
                  const kind = e.target.value as RuleKind;
                  set({ kind, threshold: kind === 'quantity' ? '3' : '50' });
                }}
              >
                {RULE_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(`kinds.${k}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label={draft.kind === 'quantity' ? t('pieces') : t('amount', { currency })}
                hint={draft.kind === 'quantity' ? t('piecesHint') : t('amountHint')}
              >
                <Input
                  inputMode={draft.kind === 'quantity' ? 'numeric' : 'decimal'}
                  value={draft.threshold}
                  onChange={(e) => set({ threshold: e.target.value })}
                  required
                />
              </Field>
              {draft.kind !== 'free_shipping' ? (
                <Field label={t('percentOff')} hint={t('percentHint')}>
                  <Input
                    type="number"
                    min={1}
                    max={90}
                    value={draft.percentOff}
                    onChange={(e) => set({ percentOff: e.target.value })}
                    required
                  />
                </Field>
              ) : null}
              <Field label={t('startsAt')}>
                <Input
                  type="datetime-local"
                  value={draft.startsAt}
                  onChange={(e) => set({ startsAt: e.target.value })}
                />
              </Field>
              <Field label={t('endsAt')}>
                <Input
                  type="datetime-local"
                  value={draft.endsAt}
                  onChange={(e) => set({ endsAt: e.target.value })}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => set({ active: e.target.checked })}
                className="accent-quake"
              />
              <span className="font-medium">{t('active')}</span>
            </label>
            <ErrorText>{error}</ErrorText>
          </>
        ) : null}
      </Sheet>
    </section>
  );
}
