'use client';

import { useState, type FormEvent } from 'react';
import { Button, LOCALE_TAGS, cn, useLocale, useT } from '@devquake/ui';
import { formatTime } from '../lib/meals';
import { timesText, type DoseStatus, DOSE_STATUSES } from '../lib/medical';
import type { HospitalStay, MedicalProfile, Medication, RoundPerson } from '../lib/medical-data';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Panel, TextArea } from './ui';
import { useAction } from './use-action';

function useDay() {
  const tag = LOCALE_TAGS[useLocale()];
  return (day: string | null) =>
    day
      ? new Date(`${day}T12:00:00Z`).toLocaleDateString(tag, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          timeZone: 'UTC',
        })
      : '';
}

/** Conditions, allergies, family doctor, blood type and notes (stored encrypted). */
export function ProfileForm({ path, profile }: { path: string; profile: MedicalProfile }) {
  const t = useT();
  const [v, setV] = useState(profile);
  const { busy, error, act } = useAction();
  const set = (key: keyof MedicalProfile) => (e: { target: { value: string } }) =>
    setV({ ...v, [key]: e.target.value });

  async function save(e: FormEvent) {
    e.preventDefault();
    await act(() => callApi(path, 'PUT', v), { success: t('medical.saved') });
  }

  return (
    <Panel>
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">{t('medical.profile')}</h2>
        <Field label={t('fields.conditions')} className="sm:col-span-2">
          <TextArea value={v.conditions ?? ''} onChange={set('conditions')} />
        </Field>
        <Field label={t('fields.allergies')} className="sm:col-span-2">
          <TextArea value={v.allergies ?? ''} onChange={set('allergies')} />
        </Field>
        <Field label={t('fields.familyDoctor')}>
          <Input value={v.familyDoctor ?? ''} onChange={set('familyDoctor')} maxLength={200} />
        </Field>
        <Field label={t('fields.bloodType')}>
          <Input value={v.bloodType ?? ''} onChange={set('bloodType')} maxLength={10} />
        </Field>
        <Field label={t('fields.notes')} className="sm:col-span-2">
          <TextArea value={v.notes ?? ''} onChange={set('notes')} />
        </Field>
        <div className="flex items-center gap-3 sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {t('person.save')}
          </Button>
          <ErrorText>{error}</ErrorText>
        </div>
      </form>
    </Panel>
  );
}

const EMPTY_MED = {
  id: 0,
  name: '',
  dose: '',
  times: '08:00',
  startsOn: '',
  endsOn: '',
  notes: '',
};

/** The person's medicines with their times and course; add, change, end, remove. */
export function Medications({
  path,
  medications,
  today,
}: {
  path: string;
  medications: Medication[];
  today: string;
}) {
  const t = useT();
  const day = useDay();
  const [form, setForm] = useState({ ...EMPTY_MED, startsOn: today });
  const { busy, error, act, confirm } = useAction();

  async function save(e: FormEvent) {
    e.preventDefault();
    const body = {
      name: form.name,
      dose: form.dose,
      times: form.times,
      startsOn: form.startsOn,
      endsOn: form.endsOn || null,
      notes: form.notes,
    };
    const ok = await act(
      () => (form.id ? callApi(`${path}/${form.id}`, 'PATCH', body) : callApi(path, 'POST', body)),
      { success: t('medical.medSaved') },
    );
    if (ok) setForm({ ...EMPTY_MED, startsOn: today });
  }

  async function remove(m: Medication) {
    const ok = await confirm({
      title: t('medical.removeMedTitle', { name: m.name }),
      body: t('medical.removeMedBody'),
      confirmLabel: t('staff.remove'),
      danger: true,
    });
    if (ok)
      await act(() => callApi(`${path}/${m.id}`, 'DELETE'), { success: t('medical.medRemoved') });
  }

  const current = medications.filter((m) => !m.endsOn || m.endsOn >= today);
  const past = medications.filter((m) => m.endsOn && m.endsOn < today);

  const row = (m: Medication) => (
    <li key={m.id} className="flex flex-wrap items-start gap-2 py-2 text-sm">
      <span className="min-w-0 flex-1">
        <span className="font-medium">{m.name}</span> · {m.dose}
        <span className="block text-xs text-ink/60 dark:text-paper/60">
          {timesText(m.times)} · {day(m.startsOn)}
          {m.endsOn ? ` – ${day(m.endsOn)}` : ` – ${t('medical.ongoing')}`}
        </span>
        {m.notes ? <span className="block text-xs whitespace-pre-line">{m.notes}</span> : null}
      </span>
      <Button
        type="button"
        variant="ghost"
        onClick={() =>
          setForm({
            id: m.id,
            name: m.name,
            dose: m.dose,
            times: timesText(m.times),
            startsOn: m.startsOn,
            endsOn: m.endsOn ?? '',
            notes: m.notes ?? '',
          })
        }
      >
        {t('person.edit')}
      </Button>
      <Button type="button" variant="ghost" disabled={busy} onClick={() => remove(m)}>
        {t('staff.remove')}
      </Button>
    </li>
  );

  return (
    <Panel>
      <h2 className="font-semibold">{t('medical.medications')}</h2>
      {current.length ? (
        <ul className="mt-2 divide-y divide-ink/10 dark:divide-paper/10">{current.map(row)}</ul>
      ) : (
        <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">{t('medical.noMeds')}</p>
      )}
      {past.length ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm">
            {t('medical.pastMeds', { count: past.length })}
          </summary>
          <ul className="divide-y divide-ink/10 opacity-70 dark:divide-paper/10">
            {past.map(row)}
          </ul>
        </details>
      ) : null}
      <form
        onSubmit={save}
        className="mt-4 grid gap-3 border-t border-ink/10 pt-4 sm:grid-cols-2 dark:border-paper/10"
      >
        <Field label={t('fields.medName')}>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            maxLength={200}
          />
        </Field>
        <Field label={t('fields.dose')}>
          <Input
            value={form.dose}
            onChange={(e) => setForm({ ...form, dose: e.target.value })}
            required
            maxLength={200}
          />
        </Field>
        <Field label={t('fields.medTimes')} hint={t('medical.timesHint')}>
          <Input
            value={form.times}
            onChange={(e) => setForm({ ...form, times: e.target.value })}
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('fields.startsOn')}>
            <Input
              type="date"
              value={form.startsOn}
              onChange={(e) => setForm({ ...form, startsOn: e.target.value })}
              required
            />
          </Field>
          <Field label={t('fields.endsOn')}>
            <Input
              type="date"
              value={form.endsOn}
              onChange={(e) => setForm({ ...form, endsOn: e.target.value })}
            />
          </Field>
        </div>
        <Field label={t('fields.notes')} className="sm:col-span-2">
          <TextArea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {form.id ? t('person.save') : t('medical.addMed')}
          </Button>
          {form.id ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setForm({ ...EMPTY_MED, startsOn: today })}
            >
              {t('feedback.cancel')}
            </Button>
          ) : null}
          <ErrorText>{error}</ErrorText>
        </div>
      </form>
    </Panel>
  );
}

const EMPTY_STAY = {
  id: 0,
  leftOn: '',
  returnedOn: '',
  hospital: '',
  cause: '',
  verdict: '',
  recommendations: '',
  recommendationsActive: true,
};

/** Hospital stays: why they went, when they came back, the verdict and what to do from now on. */
export function HospitalStays({
  path,
  stays,
  today,
}: {
  path: string;
  stays: HospitalStay[];
  today: string;
}) {
  const t = useT();
  const day = useDay();
  const [form, setForm] = useState({ ...EMPTY_STAY, leftOn: today });
  const { busy, error, act } = useAction();
  const text = (key: keyof typeof EMPTY_STAY) => (e: { target: { value: string } }) =>
    setForm({ ...form, [key]: e.target.value });

  async function save(e: FormEvent) {
    e.preventDefault();
    const body = { ...form, returnedOn: form.returnedOn || null };
    const ok = await act(
      () => (form.id ? callApi(`${path}/${form.id}`, 'PATCH', body) : callApi(path, 'POST', body)),
      { success: t('medical.staySaved') },
    );
    if (ok) setForm({ ...EMPTY_STAY, leftOn: today });
  }

  return (
    <Panel>
      <h2 className="font-semibold">{t('medical.stays')}</h2>
      <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">{t('medical.staysIntro')}</p>
      {stays.length ? (
        <ul className="mt-3 space-y-3">
          {stays.map((s) => (
            <li key={s.id} className="border-l-2 border-quake/60 pl-3 text-sm">
              <p className="font-medium">
                {day(s.leftOn)} – {s.returnedOn ? day(s.returnedOn) : t('medical.stillThere')}
                {s.hospital ? ` · ${s.hospital}` : ''}
              </p>
              <p className="whitespace-pre-line">
                <span className="text-ink/60 dark:text-paper/60">{t('fields.cause')}: </span>
                {s.cause}
              </p>
              {s.verdict ? (
                <p className="whitespace-pre-line">
                  <span className="text-ink/60 dark:text-paper/60">{t('fields.verdict')}: </span>
                  {s.verdict}
                </p>
              ) : null}
              {s.recommendations ? (
                <p
                  className={cn(
                    'whitespace-pre-line',
                    !s.recommendationsActive && 'line-through opacity-60',
                  )}
                >
                  <span className="text-ink/60 dark:text-paper/60">
                    {t('fields.recommendations')}:{' '}
                  </span>
                  {s.recommendations}
                </p>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setForm({
                    id: s.id,
                    leftOn: s.leftOn,
                    returnedOn: s.returnedOn ?? '',
                    hospital: s.hospital ?? '',
                    cause: s.cause,
                    verdict: s.verdict ?? '',
                    recommendations: s.recommendations ?? '',
                    recommendationsActive: s.recommendationsActive,
                  })
                }
              >
                {t('person.edit')}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink/70 dark:text-paper/70">{t('medical.noStays')}</p>
      )}
      <form
        onSubmit={save}
        className="mt-4 grid gap-3 border-t border-ink/10 pt-4 sm:grid-cols-2 dark:border-paper/10"
      >
        <Field label={t('fields.leftOn')}>
          <Input type="date" value={form.leftOn} onChange={text('leftOn')} required />
        </Field>
        <Field label={t('fields.returnedOn')} hint={t('medical.returnHint')}>
          <Input type="date" value={form.returnedOn} onChange={text('returnedOn')} />
        </Field>
        <Field label={t('fields.hospital')} className="sm:col-span-2">
          <Input value={form.hospital} onChange={text('hospital')} maxLength={200} />
        </Field>
        <Field label={t('fields.cause')} className="sm:col-span-2">
          <TextArea value={form.cause} onChange={text('cause')} required />
        </Field>
        <Field label={t('fields.verdict')} className="sm:col-span-2">
          <TextArea value={form.verdict} onChange={text('verdict')} />
        </Field>
        <Field label={t('fields.recommendations')} className="sm:col-span-2">
          <TextArea value={form.recommendations} onChange={text('recommendations')} />
        </Field>
        <label className="inline-flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            className="size-4 accent-[var(--dq-quake)]"
            checked={form.recommendationsActive}
            onChange={(e) => setForm({ ...form, recommendationsActive: e.target.checked })}
          />
          {t('medical.recommendationsActive')}
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {form.id ? t('person.save') : t('medical.addStay')}
          </Button>
          {form.id ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setForm({ ...EMPTY_STAY, leftOn: today })}
            >
              {t('feedback.cancel')}
            </Button>
          ) : null}
          <ErrorText>{error}</ErrorText>
        </div>
      </form>
    </Panel>
  );
}

/** The day's doses per person: record each as given, refused or missed. */
export function MedicationRound({
  orgId,
  day,
  people,
}: {
  orgId: number;
  day: string;
  people: RoundPerson[];
}) {
  const t = useT();
  const { busy, act } = useAction();

  const record = (medicationId: number, timeMin: number, status: DoseStatus) =>
    act(
      () =>
        callApi(`/orgs/${orgId}/doses`, 'PUT', {
          medicationId,
          day,
          time: formatTime(timeMin),
          status,
        }),
      { success: t(`medical.status.${status}`) },
    );

  if (people.length === 0) {
    return <p className="text-sm text-ink/70 dark:text-paper/70">{t('medical.noDoses')}</p>;
  }
  return (
    <div className="space-y-4">
      {people.map((p) => (
        <Panel key={p.personId}>
          <h2 className="font-semibold">
            {p.name}
            {p.inHospital ? (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-normal text-amber-950 dark:bg-amber-900/60 dark:text-amber-100">
                {t('medical.inHospital')}
              </span>
            ) : null}
          </h2>
          <ul className="mt-2 divide-y divide-ink/10 dark:divide-paper/10">
            {p.doses.map((d) => (
              <li
                key={`${d.medicationId}-${d.timeMin}`}
                className="flex flex-wrap items-center gap-2 py-2 text-sm"
              >
                <span className="w-12 font-mono tabular-nums">{formatTime(d.timeMin)}</span>
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{d.name}</span> · {d.dose}
                  {d.status && d.by ? (
                    <span className="block text-xs text-ink/60 dark:text-paper/60">
                      {t(`medical.status.${d.status}`)} · {d.by}
                    </span>
                  ) : null}
                </span>
                {DOSE_STATUSES.map((s) => (
                  <Button
                    key={s}
                    type="button"
                    variant={d.status === s ? 'primary' : 'ghost'}
                    disabled={busy}
                    aria-pressed={d.status === s}
                    onClick={() => record(d.medicationId, d.timeMin, s)}
                  >
                    {t(`medical.action.${s}`)}
                  </Button>
                ))}
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </div>
  );
}
