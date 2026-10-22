'use client';

import { useState, type FormEvent } from 'react';
import { Button, LOCALE_TAGS, useLocale, useT } from '@devquake/ui';
import { formatTime } from '../lib/meals';
import { DIETS, LIMITS, PERSON_KINDS, STATUSES } from '../lib/model';
import { BIRTH_FROM_YEAR } from '../lib/validate';
import type { Person } from '../lib/data';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Select, TextArea } from './ui';
import { useAction } from './use-action';

/** A new organisation, or renaming one (with `org`). */
export function OrgForm({ org }: { org?: { id: number; name: string } }) {
  const t = useT();
  const [name, setName] = useState(org?.name ?? '');
  const { busy, error, act, router } = useAction();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (org) {
      await act(() => callApi(`/orgs/${org.id}`, 'PATCH', { name }), {
        success: t('org.renamed'),
      });
      return;
    }
    let id = 0;
    await act(
      async () => {
        id = (await callApi<{ id: number }>('/orgs', 'POST', { name }))!.id;
      },
      { success: t('home.created'), after: () => router.push(`/orgs/${id}`) },
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <Field label={org ? t('fields.orgName') : t('home.orgName')} className="min-w-60 flex-1">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={LIMITS.orgName}
          required
        />
      </Field>
      <Button type="submit" disabled={busy}>
        {org ? t('org.rename') : t('home.create')}
      </Button>
      <div className="w-full">
        <ErrorText>{error}</ErrorText>
      </div>
    </form>
  );
}

type PersonFields = Pick<
  Person,
  | 'firstName'
  | 'lastName'
  | 'birthDate'
  | 'kind'
  | 'status'
  | 'address'
  | 'phone'
  | 'contactName'
  | 'contactPhone'
  | 'diet'
  | 'allergies'
  | 'observation'
  | 'deliveryDays'
> & { windowFrom: string; windowTo: string };

const EMPTY: PersonFields = {
  firstName: '',
  lastName: '',
  birthDate: null,
  kind: 'delivery',
  status: 'active',
  address: '',
  phone: '',
  contactName: '',
  contactPhone: '',
  diet: 'normal',
  allergies: '',
  observation: '',
  deliveryDays: [1, 2, 3, 4, 5],
  windowFrom: '',
  windowTo: '',
};

const fieldsOf = (p: Person): PersonFields => ({
  ...p,
  windowFrom: p.windowFromMin === null ? '' : formatTime(p.windowFromMin),
  windowTo: p.windowToMin === null ? '' : formatTime(p.windowToMin),
});

/** Adds a person (without `person`) or changes their profile. */
export function PersonForm({ orgId, person }: { orgId: number; person?: Person }) {
  const t = useT();
  const tag = LOCALE_TAGS[useLocale()];
  // 19 October 2026 is a Monday: day d of the week is the 18th + d.
  const weekday = (d: number) =>
    new Date(Date.UTC(2026, 9, 18 + d)).toLocaleDateString(tag, {
      weekday: 'short',
      timeZone: 'UTC',
    });
  const [v, setV] = useState<PersonFields>(person ? fieldsOf(person) : EMPTY);
  const { busy, error, act, router } = useAction();
  const set =
    <K extends keyof PersonFields>(key: K) =>
    (e: { target: { value: string } }) =>
      setV((old) => ({ ...old, [key]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const body = { ...v, birthDate: v.birthDate || null };
    if (person) {
      await act(() => callApi(`/orgs/${orgId}/people/${person.id}`, 'PATCH', body), {
        success: t('person.saved'),
        after: () => router.push(`/orgs/${orgId}/people/${person.id}`),
      });
      return;
    }
    let id = 0;
    await act(
      async () => {
        id = (await callApi<{ id: number }>(`/orgs/${orgId}/people`, 'POST', body))!.id;
      },
      { success: t('person.created'), after: () => router.push(`/orgs/${orgId}/people/${id}`) },
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field label={t('fields.lastName')}>
        <Input
          value={v.lastName}
          onChange={set('lastName')}
          maxLength={LIMITS.lastName}
          required
          autoComplete="off"
        />
      </Field>
      <Field label={t('fields.firstName')}>
        <Input
          value={v.firstName}
          onChange={set('firstName')}
          maxLength={LIMITS.firstName}
          required
          autoComplete="off"
        />
      </Field>
      <Field label={t('fields.birthDate')}>
        <Input
          type="date"
          value={v.birthDate ?? ''}
          onChange={set('birthDate')}
          min={`${BIRTH_FROM_YEAR}-01-01`}
          max={new Date().toISOString().slice(0, 10)}
        />
      </Field>
      <Field label={t('fields.kind')}>
        <Select value={v.kind} onChange={set('kind')}>
          {PERSON_KINDS.map((k) => (
            <option key={k} value={k}>
              {t(`kinds.${k}`)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t('fields.address')} className="sm:col-span-2">
        <Input
          value={v.address ?? ''}
          onChange={set('address')}
          maxLength={LIMITS.address}
          required={v.kind === 'delivery'}
          autoComplete="off"
        />
      </Field>
      <Field label={t('fields.phone')}>
        <Input type="tel" value={v.phone ?? ''} onChange={set('phone')} maxLength={LIMITS.phone} />
      </Field>
      <Field label={t('fields.status')}>
        <Select value={v.status} onChange={set('status')}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`statuses.${s}`)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t('fields.contactName')}>
        <Input
          value={v.contactName ?? ''}
          onChange={set('contactName')}
          maxLength={LIMITS.contactName}
        />
      </Field>
      <Field label={t('fields.contactPhone')}>
        <Input
          type="tel"
          value={v.contactPhone ?? ''}
          onChange={set('contactPhone')}
          maxLength={LIMITS.phone}
        />
      </Field>
      <Field label={t('fields.diet')}>
        <Select value={v.diet} onChange={set('diet')}>
          {DIETS.map((d) => (
            <option key={d} value={d}>
              {t(`diets.${d}`)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t('fields.allergies')}>
        <Input value={v.allergies ?? ''} onChange={set('allergies')} maxLength={LIMITS.allergies} />
      </Field>
      {v.kind === 'delivery' ? (
        <fieldset className="sm:col-span-2">
          <legend className="mb-1 text-sm font-medium">{t('fields.deliveryDays')}</legend>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <label key={d} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-[var(--dq-quake)]"
                  checked={v.deliveryDays.includes(d)}
                  onChange={(e) =>
                    setV((old) => ({
                      ...old,
                      deliveryDays: e.target.checked
                        ? [...old.deliveryDays, d].sort((a, b) => a - b)
                        : old.deliveryDays.filter((x) => x !== d),
                    }))
                  }
                />
                {weekday(d)}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      {v.kind === 'delivery' ? (
        <>
          <Field label={t('fields.windowFrom')} hint={t('person.windowHint')}>
            <Input type="time" value={v.windowFrom} onChange={set('windowFrom')} />
          </Field>
          <Field label={t('fields.windowTo')}>
            <Input type="time" value={v.windowTo} onChange={set('windowTo')} />
          </Field>
        </>
      ) : null}
      <Field
        label={t('fields.observation')}
        hint={t('person.observationHint')}
        className="sm:col-span-2"
      >
        <TextArea
          value={v.observation ?? ''}
          onChange={set('observation')}
          maxLength={LIMITS.observation}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {t('person.save')}
        </Button>
        <ErrorText>{error}</ErrorText>
      </div>
    </form>
  );
}

/** Deletes a person after a confirmation (organisers). */
export function DeletePerson({
  orgId,
  personId,
  name,
}: {
  orgId: number;
  personId: number;
  name: string;
}) {
  const t = useT('person');
  const { busy, act, router, confirm } = useAction();
  async function remove() {
    const ok = await confirm({
      title: t('deleteTitle', { name }),
      body: t('deleteBody'),
      confirmLabel: t('delete'),
      danger: true,
    });
    if (!ok) return;
    await act(() => callApi(`/orgs/${orgId}/people/${personId}`, 'DELETE'), {
      success: t('deleted'),
      after: () => router.push(`/orgs/${orgId}`),
    });
  }
  return (
    <Button type="button" variant="secondary" disabled={busy} onClick={remove}>
      {t('delete')}
    </Button>
  );
}
