'use client';

import { useState, type FormEvent } from 'react';
import { Button, LOCALE_TAGS, trackEvent, useLocale, useT } from '@devquake/ui';
import {
  CURRENCIES,
  GROUP_KINDS,
  KIND_ICONS,
  LIMITS,
  formatMoney,
  type GroupKind,
} from '../lib/model';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Select } from './ui';
import { useAction } from './use-action';

/** Money in the page language and a group's currency, for client components. */
export function useMoney(currency: string) {
  const tag = LOCALE_TAGS[useLocale()];
  return (amount: number) => formatMoney(amount, currency, tag);
}

/** A sensible first currency from the page language (the owner can change it). */
const LOCALE_CURRENCY: Record<string, string> = { en: 'EUR', de: 'EUR', ro: 'RON', hu: 'HUF' };

/** New group (home page) or the group's settings (owner, members page). */
export function GroupForm({
  group,
  currencyLocked = false,
}: {
  group?: { id: number; name: string; kind: GroupKind; currency: string };
  /** The currency cannot change once there are expenses or payments. */
  currencyLocked?: boolean;
}) {
  const t = useT('groupForm');
  const tKinds = useT('kinds');
  const locale = useLocale();
  const { busy, error, act, router } = useAction();
  const [name, setName] = useState(group?.name ?? '');
  const [kind, setKind] = useState<GroupKind>(group?.kind ?? 'trip');
  const [currency, setCurrency] = useState(group?.currency ?? LOCALE_CURRENCY[locale] ?? 'EUR');
  const currencies = CURRENCIES.includes(currency as (typeof CURRENCIES)[number])
    ? CURRENCIES
    : [currency, ...CURRENCIES];

  function submit(event: FormEvent) {
    event.preventDefault();
    const body = { name, kind, currency };
    if (group) {
      act(() => callApi(`/groups/${group.id}`, 'PATCH', body), { success: t('saved') });
      return;
    }
    act(
      async () => {
        const res = await callApi<{ id: number }>('/groups', 'POST', body);
        trackEvent('expenses_group_created', { kind });
        router.push(`/groups/${res!.id}`);
      },
      { success: t('created'), after: () => undefined },
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label={t('name')}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={LIMITS.groupName}
          placeholder={t('namePlaceholder')}
          required
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('kind')}>
          <Select value={kind} onChange={(e) => setKind(e.target.value as GroupKind)}>
            {GROUP_KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_ICONS[k]} {tKinds(k)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('currency')} hint={currencyLocked ? t('currencyLocked') : undefined}>
          <Select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={currencyLocked}
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy}>
        {group ? t('save') : t('create')}
      </Button>
    </form>
  );
}
