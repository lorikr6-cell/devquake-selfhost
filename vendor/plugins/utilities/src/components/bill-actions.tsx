'use client';

import { useState, type FormEvent } from 'react';
import { Button, trackEvent, useT } from '@devquake/ui';
import { PAYMENT_METHODS } from '../lib/model';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Select } from './ui';
import { useAction } from './use-action';
import { useFormat } from './use-format';

/**
 * Manager: confirms what a participant paid for this bill (cash, card or other). A confirmed
 * payment is locked (only a DevQuake administrator can change or delete it) and the person gets
 * an email with the bill's details.
 */
export function PaymentForm({
  billId,
  userId,
  name,
  due,
  currency,
  initial,
  today,
  isAdmin,
}: {
  billId: number;
  userId: number;
  /** The person who paid. */
  name: string;
  /** What they owe for this bill (suggested amount). */
  due: number | null;
  currency: string;
  initial: { amount: number; method: string; receivedOn: string | null } | null;
  today: string;
  /** DevQuake administrator: may change or delete a confirmed payment. */
  isAdmin: boolean;
}) {
  const t = useT('payment');
  const f = useFormat();
  const { busy, error, act, confirm } = useAction();

  if (initial && !isAdmin) {
    return (
      <p className="flex items-start gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm">
        <span aria-hidden>🔒</span>
        <span>
          {t('locked', {
            amount: f.money(initial.amount, currency),
            method: t(`methods.${initial.method}`),
            day: initial.receivedOn ? f.day(initial.receivedOn) : '—',
          })}
        </span>
      </p>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const ok = await confirm({
      title: t('confirmLock', { name }),
      confirmLabel: initial ? t('saveAdmin') : t('save'),
    });
    if (!ok) return;
    act(async () => {
      await callApi(`/bills/${billId}/payments/${userId}`, 'PUT', {
        amount: data.get('amount'),
        method: data.get('method'),
        receivedOn: data.get('receivedOn'),
      });
      trackEvent('payment_recorded', { method: String(data.get('method')) });
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          label={t('amount', { currency })}
          hint={
            due !== null && due > 0 ? t('dueHint', { amount: f.money(due, currency) }) : undefined
          }
        >
          <Input
            name="amount"
            required
            inputMode="decimal"
            defaultValue={initial?.amount ?? (due !== null && due > 0 ? due.toFixed(2) : '')}
          />
        </Field>
        <Field label={t('method')}>
          <Select name="method" defaultValue={initial?.method ?? 'cash'}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {t(`methods.${m}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('receivedOn')}>
          <Input type="date" name="receivedOn" defaultValue={initial?.receivedOn ?? today} />
        </Field>
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? t('saving') : initial ? t('saveAdmin') : t('save')}
        </Button>
        {initial && isAdmin ? (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={async () => {
              const ok = await confirm({
                title: t('clearConfirm'),
                confirmLabel: t('clearAdmin'),
                danger: true,
              });
              if (ok) act(() => callApi(`/bills/${billId}/payments/${userId}`, 'DELETE'));
            }}
          >
            {t('clearAdmin')}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

/** Owner: "I have paid the provider" switch. */
export function ProviderPaidToggle({ billId, paid }: { billId: number; paid: boolean }) {
  const t = useT('billPage');
  const { busy, error, act } = useAction();
  return (
    <span className="inline-flex flex-col gap-1">
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={paid}
          disabled={busy}
          onChange={(e) =>
            act(() => callApi(`/bills/${billId}/provider-paid`, 'PUT', { paid: e.target.checked }))
          }
          className="size-4 accent-quake"
        />
        {t('providerPaid')}
      </label>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}

export function DeleteBillButton({ billId, utilityId }: { billId: number; utilityId: number }) {
  const t = useT('billPage');
  const { busy, error, act, router, confirm } = useAction();
  return (
    <span className="inline-flex flex-col gap-1">
      <Button
        type="button"
        variant="secondary"
        disabled={busy}
        className="text-red-700 dark:text-red-400"
        onClick={async () => {
          const ok = await confirm({
            title: t('deleteConfirm'),
            confirmLabel: t('delete'),
            danger: true,
          });
          if (!ok) return;
          act(
            () => callApi(`/bills/${billId}`, 'DELETE'),
            () => router.push(`/utilities/${utilityId}`),
          );
        }}
      >
        {t('delete')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}

export function DeleteReadingButton({ billId, userId }: { billId: number; userId: number }) {
  const t = useT('reading');
  const { busy, error, act, confirm } = useAction();
  return (
    <span className="inline-flex flex-col gap-1">
      <Button
        type="button"
        variant="ghost"
        disabled={busy}
        onClick={async () => {
          const ok = await confirm({
            title: t('deleteConfirm'),
            confirmLabel: t('delete'),
            danger: true,
          });
          if (ok) act(() => callApi(`/bills/${billId}/readings/${userId}`, 'DELETE'));
        }}
      >
        {t('delete')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </span>
  );
}

export function CommentForm({ billId }: { billId: number }) {
  const t = useT('comments');
  const { busy, error, act } = useAction();
  const [body, setBody] = useState('');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        act(async () => {
          await callApi(`/bills/${billId}/comments`, 'POST', { body });
          setBody('');
          trackEvent('comment_added');
        });
      }}
      className="space-y-2"
    >
      <label className="block text-sm">
        <span className="sr-only">{t('label')}</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          maxLength={2000}
          placeholder={t('placeholder')}
          className="min-h-20 w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-quake focus:outline-none focus:ring-2 focus:ring-quake/30 dark:border-paper/15 dark:bg-ink dark:text-paper dark:placeholder:text-paper/40"
        />
      </label>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy || !body.trim()}>
        {busy ? t('sending') : t('send')}
      </Button>
    </form>
  );
}

export function DeleteCommentButton({ billId, commentId }: { billId: number; commentId: number }) {
  const t = useT('comments');
  const { busy, act, confirm } = useAction();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        const ok = await confirm({
          title: t('deleteConfirm'),
          confirmLabel: t('delete'),
          danger: true,
        });
        if (ok) act(() => callApi(`/bills/${billId}/comments/${commentId}`, 'DELETE'));
      }}
      className="text-xs text-ink/50 underline hover:text-red-700 dark:text-paper/50 dark:hover:text-red-400"
    >
      {t('delete')}
    </button>
  );
}
