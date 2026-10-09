'use client';

import { useState, type FormEvent } from 'react';
import { Button, Sheet, trackEvent, useT } from '@devquake/ui';
import { useId } from 'react';
import { LIMITS } from '../lib/model';
import { callApi } from './call-api';
import type { FormMember } from './expense-form';
import { useMoney } from './group-form';
import { ErrorText, Field, Input, Select } from './ui';
import { useAction } from './use-action';

interface PaymentProps {
  groupId: number;
  currency: string;
  /** Everyone who can pay or be paid (former members too, to settle what is left). */
  members: FormMember[];
  today: string;
}

function PaymentForm({
  groupId,
  currency,
  members,
  today,
  initial,
  onDone,
}: PaymentProps & {
  initial: { from: number; to: number; amount: string };
  onDone: () => void;
}) {
  const t = useT('payments');
  const { busy, error, act } = useAction();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [amount, setAmount] = useState(initial.amount);
  const [paidOn, setPaidOn] = useState(today);
  const [note, setNote] = useState('');
  function submit(event: FormEvent) {
    event.preventDefault();
    act(
      async () => {
        await callApi(`/groups/${groupId}/payments`, 'POST', { from, to, amount, paidOn, note });
        trackEvent('expenses_payment_recorded');
        onDone();
      },
      { success: t('recorded') },
    );
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('from')}>
          <Select value={from} onChange={(e) => setFrom(Number(e.target.value))}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('to')}>
          <Select value={to} onChange={(e) => setTo(Number(e.target.value))}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('amount', { currency })}>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            required
          />
        </Field>
        <Field label={t('date')}>
          <Input type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} required />
        </Field>
      </div>
      <Field label={t('note')}>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={LIMITS.paymentNote}
        />
      </Field>
      <ErrorText>{error}</ErrorText>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          {t('save')}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  );
}

/** "Record a payment": in a sheet, prefilled from a suggested transfer when there is one. */
export function RecordPayment(
  props: PaymentProps & {
    from?: number;
    to?: number;
    /** Prefilled amount (cents). */
    cents?: number;
    label?: string;
    variant?: 'primary' | 'secondary';
  },
) {
  const t = useT('payments');
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const first = props.members[0]?.id ?? 0;
  const second = props.members[1]?.id ?? first;
  return (
    <>
      <Button type="button" variant={props.variant ?? 'secondary'} onClick={() => setOpen(true)}>
        {props.label ?? t('record')}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} labelledBy={titleId}>
        <div className="space-y-4">
          <h2 id={titleId} className="font-display text-xl font-bold">
            {t('recordTitle')}
          </h2>
          {open ? (
            <PaymentForm
              {...props}
              initial={{
                from: props.from ?? first,
                to: props.to ?? second,
                amount: props.cents ? (props.cents / 100).toFixed(2) : '',
              }}
              onDone={() => setOpen(false)}
            />
          ) : null}
        </div>
      </Sheet>
    </>
  );
}

/** Removes a recorded payment (any member; the feed says who). */
export function DeletePayment({
  groupId,
  paymentId,
  line,
}: {
  groupId: number;
  paymentId: number;
  /** "Ana paid Bob 20 €", for the question. */
  line: string;
}) {
  const t = useT('payments');
  const { busy, act, confirm } = useAction();
  return (
    <Button
      type="button"
      variant="ghost"
      className="px-2 py-1 text-xs text-red-700 dark:text-red-400"
      disabled={busy}
      onClick={async () => {
        const ok = await confirm({
          title: t('deleteTitle'),
          body: t('deleteBody', { payment: line }),
          confirmLabel: t('delete'),
          danger: true,
        });
        if (ok) {
          act(() => callApi(`/groups/${groupId}/payments/${paymentId}`, 'DELETE'), {
            success: t('deleted'),
          });
        }
      }}
    >
      {t('delete')}
    </Button>
  );
}

/** A money amount in the group's currency (client side). */
export function Money({ amount, currency }: { amount: number; currency: string }) {
  return <>{useMoney(currency)(amount)}</>;
}
