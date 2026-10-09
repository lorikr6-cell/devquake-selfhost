'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Button, cn, trackEvent, useT } from '@devquake/ui';
import { CATEGORIES, LIMITS, SPLIT_MODES, parseAmount } from '../lib/model';
import { splitExpense, toCents, type SplitMode } from '../lib/split';
import { callApi } from './call-api';
import { useMoney } from './group-form';
import { ErrorText, Field, Input, Select, TextArea } from './ui';
import { useAction } from './use-action';

export interface FormMember {
  id: number;
  name: string;
}

export interface ExpenseDraft {
  id: number;
  title: string;
  amount: number;
  paidBy: number;
  splitMode: SplitMode;
  category: string;
  spentOn: string;
  note: string | null;
  shares: Array<{ memberId: number; input: number | null }>;
}

const DEFAULT_VALUE: Record<SplitMode, string> = { equal: '', shares: '1', percent: '', exact: '' };

/**
 * Add or correct an expense: what, how much, who paid, for whom and how it is split. The parts
 * are previewed as you type with the same rules the server uses (lib/split.ts).
 */
export function ExpenseForm({
  groupId,
  currency,
  members,
  me,
  today,
  expense,
  onDone,
}: {
  groupId: number;
  currency: string;
  /** Active members, who can pay and take part. */
  members: FormMember[];
  /** The visitor's member id (the payer by default). */
  me: number;
  today: string;
  /** An expense to correct; without one the form adds a new expense. */
  expense?: ExpenseDraft;
  onDone?: () => void;
}) {
  const t = useT('expenseForm');
  const tModes = useT('splitModes');
  const tCats = useT('categories');
  const money = useMoney(currency);
  const { busy, error, act } = useAction();

  const [title, setTitle] = useState(expense?.title ?? '');
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [paidBy, setPaidBy] = useState(expense?.paidBy ?? me);
  const [mode, setMode] = useState<SplitMode>(expense?.splitMode ?? 'equal');
  const [category, setCategory] = useState(expense?.category ?? 'other');
  const [spentOn, setSpentOn] = useState(expense?.spentOn ?? today);
  const [note, setNote] = useState(expense?.note ?? '');
  const [included, setIncluded] = useState<Set<number>>(
    () => new Set(expense ? expense.shares.map((s) => s.memberId) : members.map((m) => m.id)),
  );
  const [values, setValues] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      (expense?.shares ?? []).map((s) => [s.memberId, s.input === null ? '' : String(s.input)]),
    ),
  );

  const people = members.filter((m) => included.has(m.id));
  const total = parseAmount(amount);
  const valueOf = (id: number) => {
    const raw = values[id] ?? DEFAULT_VALUE[mode];
    const n = Number(raw.trim().replace(',', '.'));
    return raw.trim() === '' || !Number.isFinite(n) ? 0 : n;
  };

  const preview = useMemo(() => {
    if (total === null || people.length === 0) return null;
    return splitExpense(
      toCents(total),
      mode,
      people.map((p) => ({ memberId: p.id, value: valueOf(p.id) })),
      paidBy,
    );
    // valueOf reads `values` and `mode`, listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, mode, people.map((p) => p.id).join(), values, paidBy]);
  const partOf = new Map(preview?.ok ? preview.parts.map((p) => [p.memberId, p.cents]) : []);

  // What is still to be shared out (exact amounts and percentages).
  const typedSum = people.reduce((a, p) => a + valueOf(p.id), 0);
  const left =
    mode === 'exact' && total !== null
      ? t('leftAmount', { amount: money((toCents(total) - toCents(typedSum)) / 100) })
      : mode === 'percent'
        ? t('leftPercent', { percent: Math.round((100 - typedSum) * 100) / 100 })
        : null;

  function toggle(id: number) {
    setIncluded((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const body = {
      title,
      amount,
      paidBy,
      splitMode: mode,
      category,
      spentOn,
      note,
      entries: people.map((p) => ({
        memberId: p.id,
        value: mode === 'equal' ? 1 : (values[p.id] ?? DEFAULT_VALUE[mode]),
      })),
    };
    act(
      async () => {
        if (expense) {
          await callApi(`/groups/${groupId}/expenses/${expense.id}`, 'PATCH', body);
        } else {
          await callApi(`/groups/${groupId}/expenses`, 'POST', body);
          trackEvent('expense_added', { mode, category });
          setTitle('');
          setAmount('');
          setNote('');
          setValues({});
        }
        onDone?.();
      },
      { success: expense ? t('saved') : t('added') },
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Field label={t('title')}>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={LIMITS.title}
            placeholder={t('titlePlaceholder')}
            required
          />
        </Field>
        <Field label={t('amount', { currency })}>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            required
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t('paidBy')}>
          <Select value={paidBy} onChange={(e) => setPaidBy(Number(e.target.value))}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id === me ? t('you', { name: m.name }) : m.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('category')}>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.icon} {tCats(c.code)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('date')}>
          <Input
            type="date"
            value={spentOn}
            onChange={(e) => setSpentOn(e.target.value)}
            required
          />
        </Field>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">{t('split')}</legend>
        <div
          role="radiogroup"
          aria-label={t('split')}
          className="inline-flex flex-wrap rounded-lg border border-ink/15 p-1 dark:border-paper/15"
        >
          {SPLIT_MODES.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium',
                mode === m
                  ? 'bg-ink text-paper dark:bg-paper dark:text-ink'
                  : 'text-ink/70 hover:text-ink dark:text-paper/70 dark:hover:text-paper',
              )}
            >
              {tModes(m)}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink/60 dark:text-paper/60">{t(`hints.${mode}`)}</p>
        <ul className="divide-y divide-ink/10 rounded-lg border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
          {members.map((m) => {
            const on = included.has(m.id);
            const cents = partOf.get(m.id);
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-quake"
                    checked={on}
                    onChange={() => toggle(m.id)}
                  />
                  <span className="truncate">
                    {m.id === me ? t('you', { name: m.name }) : m.name}
                  </span>
                </label>
                {on && mode !== 'equal' ? (
                  <Input
                    aria-label={t(`valueLabel.${mode}`, { name: m.name })}
                    value={values[m.id] ?? DEFAULT_VALUE[mode]}
                    onChange={(e) => setValues((v) => ({ ...v, [m.id]: e.target.value }))}
                    inputMode="decimal"
                    className="w-24"
                  />
                ) : null}
                <span className="w-24 text-right text-sm tabular-nums text-ink/70 dark:text-paper/70">
                  {on && cents !== undefined ? money(cents / 100) : '—'}
                </span>
              </li>
            );
          })}
        </ul>
        {left ? <p className="text-sm text-ink/70 dark:text-paper/70">{left}</p> : null}
        {preview && !preview.ok ? (
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {t(`problems.${preview.error}`)}
          </p>
        ) : null}
      </fieldset>

      <Field label={t('note')}>
        <TextArea value={note} onChange={(e) => setNote(e.target.value)} maxLength={LIMITS.note} />
      </Field>
      <ErrorText>{error}</ErrorText>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          {expense ? t('save') : t('add')}
        </Button>
        {onDone && expense ? (
          <Button type="button" variant="secondary" onClick={onDone}>
            {t('cancel')}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
