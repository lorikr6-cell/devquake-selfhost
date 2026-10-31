'use client';

import { useState, type FormEvent } from 'react';
import { Button, Link, formatDateTime, useLocale, useT } from '@devquake/ui';
import { DIETS } from '../lib/model';
import { QUESTIONS, VISIT_KINDS, type Answers } from '../lib/social';
import type { Assessment, Places, SocialOverview, Visit, WaitingPerson } from '../lib/social-data';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Panel, Select, TextArea } from './ui';
import { useAction } from './use-action';

const PRIORITY_STYLE: Record<string, string> = {
  urgent: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100',
  high: 'bg-amber-100 text-amber-950 dark:bg-amber-900/60 dark:text-amber-100',
  medium: 'bg-sky-100 text-sky-950 dark:bg-sky-900/60 dark:text-sky-100',
  low: 'bg-ink/10 text-ink/70 dark:bg-paper/15 dark:text-paper/70',
};

/** Places per kind: used of the limit, left, waiting; organisers change the limits. */
export function PlacesPanel({
  orgId,
  places,
  canEdit,
}: {
  orgId: number;
  places: Places[];
  canEdit: boolean;
}) {
  const t = useT();
  const limitOf = (k: string) => places.find((p) => p.kind === k)?.limit ?? null;
  const [residents, setResidents] = useState(String(limitOf('resident') ?? ''));
  const [delivery, setDelivery] = useState(String(limitOf('delivery') ?? ''));
  const { busy, error, act } = useAction();
  return (
    <Panel>
      <h2 className="font-semibold">{t('social.placesTitle')}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {places.map((p) => (
          <div key={p.kind} className="rounded-lg border border-ink/10 p-3 dark:border-paper/10">
            <p className="text-sm font-medium">{t(`kinds.${p.kind}`)}</p>
            <p className="mt-1 font-display text-2xl">
              {p.used}
              <span className="text-base text-ink/60 dark:text-paper/60"> / {p.limit ?? '∞'}</span>
            </p>
            <p className="text-xs text-ink/70 dark:text-paper/70">
              {p.left === null ? t('social.noLimit') : t('social.left', { count: p.left })} ·{' '}
              {t('social.waitingCount', { count: p.waiting })}
            </p>
          </div>
        ))}
      </div>
      {canEdit ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void act(
              () =>
                callApi(`/orgs/${orgId}/social/limits`, 'PUT', {
                  maxResidents: residents,
                  maxDelivery: delivery,
                }),
              { success: t('social.limitsSaved') },
            );
          }}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <Field label={t('social.maxResidents')}>
            <Input
              type="number"
              min={0}
              max={9999}
              value={residents}
              onChange={(e) => setResidents(e.target.value)}
              className="w-28"
            />
          </Field>
          <Field label={t('social.maxDelivery')}>
            <Input
              type="number"
              min={0}
              max={9999}
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
              className="w-28"
            />
          </Field>
          <Button type="submit" variant="secondary" disabled={busy}>
            {t('person.save')}
          </Button>
          <p className="w-full text-xs text-ink/60 dark:text-paper/60">{t('social.limitHint')}</p>
        </form>
      ) : null}
      <ErrorText>{error}</ErrorText>
    </Panel>
  );
}

/** The waiting list, oldest first: admit when a place is free, or take someone off the list. */
export function WaitingList({
  orgId,
  waiting,
  places,
  workers,
  myUserId,
}: {
  orgId: number;
  waiting: WaitingPerson[];
  places: Places[];
  workers: { userId: number; name: string }[];
  myUserId: number;
}) {
  const t = useT();
  const { busy, error, act, confirm } = useAction();
  const [mine, setMine] = useState(false);
  const shown = mine ? waiting.filter((w) => w.socialWorker === myUserId) : waiting;
  const free = (kind: string) => {
    const p = places.find((x) => x.kind === kind);
    return !p || p.left === null || p.left > 0;
  };
  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">
          {t('social.waitingTitle')}{' '}
          <span className="font-normal text-ink/60 dark:text-paper/60">({shown.length})</span>
        </h2>
        <MineSwitch mine={mine} onChange={setMine} />
      </div>
      {shown.length === 0 ? (
        <p className="mt-2 text-sm text-ink/60 dark:text-paper/60">{t('social.waitingNone')}</p>
      ) : (
        <ul className="mt-3 divide-y divide-ink/10 text-sm dark:divide-paper/10">
          {shown.map((w) => (
            <li key={w.id} className="flex flex-wrap items-center gap-2 py-2">
              <span className="min-w-0 flex-1">
                <Link href={`/orgs/${orgId}/people/${w.id}`} className="font-medium underline">
                  {w.name}
                </Link>
                {w.priority ? (
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${PRIORITY_STYLE[w.priority] ?? ''}`}
                  >
                    {t(`assessment.priority.${w.priority}`)}
                  </span>
                ) : null}
                <span className="block text-xs text-ink/60 dark:text-paper/60">
                  {t(`kinds.${w.kind}`)}
                  {w.waitingSince ? ` · ${t('social.since', { date: w.waitingSince })}` : ''}
                  {w.address ? ` · ${w.address}` : ''}
                </span>
              </span>
              <WorkerPicker
                orgId={orgId}
                personId={w.id}
                worker={w.socialWorker}
                workers={workers}
              />
              <Button
                type="button"
                disabled={busy || !free(w.kind)}
                title={free(w.kind) ? undefined : t('social.noPlace')}
                onClick={() =>
                  act(
                    () => callApi(`/orgs/${orgId}/social/people/${w.id}`, 'PUT', { to: 'admit' }),
                    {
                      success: t('social.admitted', { name: w.name }),
                    },
                  )
                }
              >
                {t('social.admit')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={async () => {
                  const ok = await confirm({
                    title: t('social.removeTitle', { name: w.name }),
                    body: t('social.removeBody'),
                    confirmLabel: t('social.remove'),
                    danger: true,
                  });
                  if (ok) {
                    await act(
                      () => callApi(`/orgs/${orgId}/social/people/${w.id}`, 'PUT', { to: 'end' }),
                      { success: t('social.removed') },
                    );
                  }
                }}
              >
                {t('social.remove')}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <ErrorText>{error}</ErrorText>
    </Panel>
  );
}

/** "Mine" or "Everyone": a social worker's own people and visits, or all of them. */
export function MineSwitch({ mine, onChange }: { mine: boolean; onChange: (v: boolean) => void }) {
  const t = useT();
  return (
    <div role="group" aria-label={t('social.showLabel')} className="flex gap-1 text-xs">
      {[false, true].map((v) => (
        <button
          key={String(v)}
          type="button"
          aria-pressed={mine === v}
          onClick={() => onChange(v)}
          className="rounded-full border border-ink/15 px-2.5 py-0.5 aria-pressed:border-quake aria-pressed:bg-quake/10 dark:border-paper/20"
        >
          {v ? t('social.mine') : t('social.everyone')}
        </button>
      ))}
    </div>
  );
}

/** The social worker responsible for a person; saved when chosen. */
export function WorkerPicker({
  orgId,
  personId,
  worker,
  workers,
}: {
  orgId: number;
  personId: number;
  worker: number | null;
  workers: { userId: number; name: string }[];
}) {
  const t = useT();
  const { busy, act } = useAction();
  return (
    <Select
      value={worker ?? ''}
      disabled={busy}
      aria-label={t('social.responsible')}
      onChange={(e) =>
        act(
          () =>
            callApi(`/orgs/${orgId}/social/people/${personId}`, 'PUT', {
              socialWorker: e.target.value === '' ? null : Number(e.target.value),
            }),
          { success: t('social.responsibleSaved') },
        )
      }
      className="w-auto text-xs"
    >
      <option value="">{t('social.nobodyResponsible')}</option>
      {workers.map((w) => (
        <option key={w.userId} value={w.userId}>
          {w.name}
        </option>
      ))}
    </Select>
  );
}

/** A new applicant: straight onto the waiting list, ready for an assessment visit. */
export function NewApplicant({ orgId }: { orgId: number }) {
  const t = useT();
  const [form, setForm] = useState({
    lastName: '',
    firstName: '',
    kind: 'delivery',
    address: '',
    phone: '',
    diet: 'normal',
  });
  const { busy, error, act } = useAction();
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [k]: e.target.value });
  async function save(e: FormEvent) {
    e.preventDefault();
    const ok = await act(
      () =>
        callApi(`/orgs/${orgId}/social/applicants`, 'POST', {
          ...form,
          deliveryDays: [1, 2, 3, 4, 5],
        }),
      { success: t('social.applicantAdded') },
    );
    if (ok) setForm({ ...form, lastName: '', firstName: '', address: '', phone: '' });
  }
  return (
    <Panel>
      <h2 className="font-semibold">{t('social.applicantTitle')}</h2>
      <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('social.applicantIntro')}</p>
      <form onSubmit={save} className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label={t('fields.lastName')}>
          <Input value={form.lastName} onChange={set('lastName')} required maxLength={60} />
        </Field>
        <Field label={t('fields.firstName')}>
          <Input value={form.firstName} onChange={set('firstName')} required maxLength={60} />
        </Field>
        <Field label={t('fields.kind')}>
          <Select value={form.kind} onChange={set('kind')}>
            <option value="delivery">{t('kinds.delivery')}</option>
            <option value="resident">{t('kinds.resident')}</option>
          </Select>
        </Field>
        <Field label={t('fields.diet')}>
          <Select value={form.diet} onChange={set('diet')}>
            {DIETS.map((d) => (
              <option key={d} value={d}>
                {t(`diets.${d}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('fields.address')}>
          <Input
            value={form.address}
            onChange={set('address')}
            required={form.kind === 'delivery'}
            maxLength={255}
          />
        </Field>
        <Field label={t('fields.phone')}>
          <Input value={form.phone} onChange={set('phone')} maxLength={40} />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {t('social.addApplicant')}
          </Button>
          <ErrorText>{error}</ErrorText>
        </div>
      </form>
    </Panel>
  );
}

/** Plan a visit to someone (served or waiting). */
export function PlanVisit({
  orgId,
  people,
  workers,
  personId,
  myUserId,
}: {
  orgId: number;
  people?: { id: number; name: string }[];
  workers: { userId: number; name: string }[];
  personId?: number;
  myUserId: number;
}) {
  const t = useT();
  const [who, setWho] = useState(personId ? String(personId) : '');
  const [at, setAt] = useState('');
  const [kind, setKind] = useState('assessment');
  const [assigned, setAssigned] = useState(
    workers.some((w) => w.userId === myUserId) ? String(myUserId) : '',
  );
  const { busy, error, act } = useAction();
  async function save(e: FormEvent) {
    e.preventDefault();
    const ok = await act(
      () =>
        callApi(`/orgs/${orgId}/visits`, 'POST', {
          personId: Number(who),
          plannedAt: at,
          kind,
          assignedTo: assigned || null,
        }),
      { success: t('social.visitPlanned') },
    );
    if (ok) setAt('');
  }
  return (
    <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
      {people ? (
        <Field label={t('social.visitWho')}>
          <Select value={who} onChange={(e) => setWho(e.target.value)} required>
            <option value="">—</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <Field label={t('social.visitWhen')}>
        <Input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} required />
      </Field>
      <Field label={t('social.visitKind')}>
        <Select value={kind} onChange={(e) => setKind(e.target.value)}>
          {VISIT_KINDS.map((k) => (
            <option key={k} value={k}>
              {t(`social.visitKinds.${k}`)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t('social.visitBy')}>
        <Select value={assigned} onChange={(e) => setAssigned(e.target.value)}>
          <option value="">—</option>
          {workers.map((w) => (
            <option key={w.userId} value={w.userId}>
              {w.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" variant="secondary" disabled={busy}>
          {t('social.planVisit')}
        </Button>
        <ErrorText>{error}</ErrorText>
      </div>
    </form>
  );
}

/** Visits: planned ones first, then the last two months; mark done with notes or cancel. */
export function VisitList({
  orgId,
  visits: all,
  timeZone,
  showPerson,
  myUserId,
}: {
  orgId: number;
  visits: Visit[];
  timeZone: string;
  showPerson: boolean;
  /** With it, a "Mine / Everyone" switch (the visits assigned to me). */
  myUserId?: number;
}) {
  const t = useT();
  const locale = useLocale();
  const [open, setOpen] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [mine, setMine] = useState(false);
  const { busy, error, act } = useAction();
  const visits = mine ? all.filter((v) => v.assignedTo === myUserId) : all;
  const header =
    myUserId === undefined ? null : (
      <div className="mb-2 flex justify-end">
        <MineSwitch mine={mine} onChange={setMine} />
      </div>
    );
  if (visits.length === 0) {
    if (header) {
      return (
        <>
          {header}
          <p className="text-sm text-ink/60 dark:text-paper/60">{t('social.visitsNone')}</p>
        </>
      );
    }
    return <p className="text-sm text-ink/60 dark:text-paper/60">{t('social.visitsNone')}</p>;
  }
  return (
    <>
      {header}
      <ul className="divide-y divide-ink/10 text-sm dark:divide-paper/10">
        {visits.map((v) => (
          <li key={v.id} className="py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1">
                <span className="font-medium">
                  {formatDateTime(v.plannedAt, timeZone, 'datetime', locale)}
                </span>{' '}
                · {t(`social.visitKinds.${v.kind}`)}
                {showPerson ? (
                  <>
                    {' · '}
                    <Link href={`/orgs/${orgId}/people/${v.personId}`} className="underline">
                      {v.personName}
                    </Link>
                  </>
                ) : null}
                <span className="block text-xs text-ink/60 dark:text-paper/60">
                  {t(`social.visitStatus.${v.status}`)}
                  {v.assignedName ? ` · ${v.assignedName}` : ''}
                </span>
              </span>
              {v.status === 'planned' ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setOpen(open === v.id ? null : v.id);
                      setNotes(v.notes ?? '');
                    }}
                  >
                    {t('social.markDone')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() =>
                      act(
                        () =>
                          callApi(`/orgs/${orgId}/visits/${v.id}`, 'PATCH', {
                            status: 'cancelled',
                          }),
                        { success: t('social.visitCancelled') },
                      )
                    }
                  >
                    {t('social.cancelVisit')}
                  </Button>
                </>
              ) : null}
            </div>
            {v.notes && open !== v.id ? (
              <p className="mt-1 text-xs whitespace-pre-line text-ink/80 dark:text-paper/80">
                {v.notes}
              </p>
            ) : null}
            {open === v.id ? (
              <form
                className="mt-2 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void act(
                    () =>
                      callApi(`/orgs/${orgId}/visits/${v.id}`, 'PATCH', {
                        status: 'done',
                        notes,
                      }),
                    { success: t('social.visitDone'), after: () => setOpen(null) },
                  );
                }}
              >
                <TextArea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  maxLength={4000}
                  placeholder={t('social.visitNotes')}
                  aria-label={t('social.visitNotes')}
                />
                <Button type="submit" disabled={busy} data-dq-submit="always">
                  {t('social.saveDone')}
                </Button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
      <ErrorText>{error}</ErrorText>
    </>
  );
}

/** The social assessment questionnaire: fill it in (a new one each time) and read the past ones. */
export function Questionnaire({
  orgId,
  personId,
  assessments,
  canEdit,
  timeZone,
}: {
  orgId: number;
  personId: number;
  assessments: Assessment[];
  canEdit: boolean;
  timeZone: string;
}) {
  const t = useT();
  const locale = useLocale();
  const latest = assessments[0];
  const [filling, setFilling] = useState(false);
  const [answers, setAnswers] = useState<Answers>(latest?.answers ?? {});
  const { busy, error, act } = useAction();
  const answerText = (q: (typeof QUESTIONS)[number], a: Answers) => {
    const v = a[q.id];
    if (!v) return '—';
    return q.type === 'choice' ? t(`assessment.${q.id}.${v}`) : v;
  };
  return (
    <div>
      {latest && !filling ? (
        <>
          <p className="text-xs text-ink/60 dark:text-paper/60">
            {t('assessment.filledBy', {
              date: formatDateTime(latest.createdAt, timeZone, 'date', locale),
              name: latest.author ?? '—',
            })}
          </p>
          <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
            {QUESTIONS.map((q) => (
              <div key={q.id} className="contents">
                <dt className="text-ink/60 dark:text-paper/60">{t(`assessment.${q.id}.label`)}</dt>
                <dd className="whitespace-pre-line">{answerText(q, latest.answers)}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : null}
      {!latest && !filling ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('assessment.none')}</p>
      ) : null}
      {canEdit && !filling ? (
        <Button type="button" variant="secondary" className="mt-3" onClick={() => setFilling(true)}>
          {latest ? t('assessment.again') : t('assessment.fill')}
        </Button>
      ) : null}
      {filling ? (
        <form
          className="mt-2 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void act(
              () => callApi(`/orgs/${orgId}/people/${personId}/social`, 'POST', { answers }),
              { success: t('assessment.saved'), after: () => setFilling(false) },
            );
          }}
        >
          {QUESTIONS.map((q) =>
            q.type === 'choice' ? (
              <Field key={q.id} label={t(`assessment.${q.id}.label`)}>
                <Select
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                >
                  <option value="">—</option>
                  {q.options.map((o) => (
                    <option key={o} value={o}>
                      {t(`assessment.${q.id}.${o}`)}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <div key={q.id} className="sm:col-span-2">
                <Field label={t(`assessment.${q.id}.label`)}>
                  <TextArea
                    value={answers[q.id] ?? ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    rows={q.id === 'notes' ? 4 : 2}
                    maxLength={q.max}
                  />
                </Field>
              </div>
            ),
          )}
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {t('assessment.save')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setFilling(false)}>
              {t('feedback.cancel')}
            </Button>
          </div>
        </form>
      ) : null}
      {assessments.length > 1 ? (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer">
            {t('assessment.history', { count: assessments.length - 1 })}
          </summary>
          <ul className="mt-2 space-y-3">
            {assessments.slice(1).map((a) => (
              <li key={a.id}>
                <p className="text-xs text-ink/60 dark:text-paper/60">
                  {t('assessment.filledBy', {
                    date: formatDateTime(a.createdAt, timeZone, 'date', locale),
                    name: a.author ?? '—',
                  })}
                </p>
                <p className="text-xs">
                  {QUESTIONS.filter((q) => a.answers[q.id])
                    .map((q) => `${t(`assessment.${q.id}.label`)}: ${answerText(q, a.answers)}`)
                    .join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

/** The social work section of a profile: status in the service, the questionnaire, visits. */
export function PersonSocial({
  orgId,
  personId,
  status,
  data,
  canEdit,
  timeZone,
  myUserId,
}: {
  orgId: number;
  personId: number;
  status: string;
  data: {
    assessments: Assessment[];
    visits: Visit[];
    workers: { userId: number; name: string }[];
    socialWorker: number | null;
  };
  canEdit: boolean;
  timeZone: string;
  myUserId: number;
}) {
  const t = useT();
  const { busy, error, act } = useAction();
  const move = (to: 'admit' | 'wait' | 'end', success: string) =>
    act(() => callApi(`/orgs/${orgId}/social/people/${personId}`, 'PUT', { to }), { success });
  return (
    <Panel>
      <h2 className="font-semibold">{t('social.personTitle')}</h2>
      {canEdit ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span>{t('social.responsible')}</span>
          <WorkerPicker
            orgId={orgId}
            personId={personId}
            worker={data.socialWorker}
            workers={data.workers}
          />
        </div>
      ) : null}
      {canEdit ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {status === 'waiting' || status === 'ended' ? (
            <Button
              type="button"
              disabled={busy}
              onClick={() => move('admit', t('social.admittedShort'))}
            >
              {t('social.admit')}
            </Button>
          ) : null}
          {status === 'active' || status === 'paused' ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => move('wait', t('social.toWaitingDone'))}
            >
              {t('social.toWaiting')}
            </Button>
          ) : null}
          {status !== 'ended' ? (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => move('end', t('social.removed'))}
            >
              {t('social.endService')}
            </Button>
          ) : null}
        </div>
      ) : null}
      <ErrorText>{error}</ErrorText>
      <h3 className="mt-5 mb-2 text-sm font-semibold">{t('assessment.title')}</h3>
      <Questionnaire
        orgId={orgId}
        personId={personId}
        assessments={data.assessments}
        canEdit={canEdit}
        timeZone={timeZone}
      />
      <h3 className="mt-6 mb-2 text-sm font-semibold">{t('social.visitsTitle')}</h3>
      <VisitList orgId={orgId} visits={data.visits} timeZone={timeZone} showPerson={false} />
      {canEdit ? (
        <div className="mt-3">
          <PlanVisit orgId={orgId} workers={data.workers} personId={personId} myUserId={myUserId} />
        </div>
      ) : null}
    </Panel>
  );
}

export type { SocialOverview };
