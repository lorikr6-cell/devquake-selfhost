'use client';

import { useState, type FormEvent } from 'react';
import { Button, cn, trackEvent, useT } from '@devquake/ui';
import type { Eater, Member } from '../lib/data';
import { ALLERGENS, DIETS, PORTIONS } from '../lib/plan';
import { callApi, errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { ErrorText, Field, Input, Select, TextArea } from './ui';
import { useAppRouter } from './use-app-router';

/** Runs an API call with a toast for success or failure, then refreshes (or `after`). */
function useRun() {
  const tErr = useT('errors');
  const router = useAppRouter();
  const { toast } = useFeedback();
  const [busy, setBusy] = useState(false);
  async function run(action: () => Promise<unknown>, done: string, after?: () => void) {
    setBusy(true);
    try {
      await action();
      toast(done);
      if (after) after();
      else router.refresh();
      return true;
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, run, router };
}

export function NewHousehold() {
  const t = useT('home');
  const tErr = useT('errors');
  const router = useAppRouter();
  const { toast } = useFeedback();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await callApi<{ id: number }>('/households', 'POST', { name });
      trackEvent('household_created');
      toast(t('created', { name: name.trim() }));
      router.push(`/h/${res!.id}/household`);
    } catch (err) {
      setError(errorMessage(err, tErr));
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <Field label={t('name')} hint={t('nameHint')} className="min-w-56 flex-1">
        <Input required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Button type="submit" disabled={busy}>
        {t('create')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </form>
  );
}

export interface SettingsDraft {
  name: string;
  diet: string;
  avoid: string[];
  dislikes: string;
  kcalTarget: string;
  proteinTarget: string;
}

/** The household's name, diet, allergens to avoid, dislikes and daily targets (planners). */
export function SettingsForm({
  householdId,
  initial,
}: {
  householdId: number;
  initial: SettingsDraft;
}) {
  const t = useT('household');
  const tDiet = useT('diets');
  const tAll = useT('allergens');
  const { busy, run } = useRun();
  const [d, setD] = useState(initial);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => callApi(`/households/${householdId}`, 'PATCH', d), t('saved'));
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('name')}>
          <Input
            required
            maxLength={60}
            value={d.name}
            onChange={(e) => setD({ ...d, name: e.target.value })}
          />
        </Field>
        <Field label={t('diet')} hint={t('dietHint')}>
          <Select value={d.diet} onChange={(e) => setD({ ...d, diet: e.target.value })}>
            <option value="">{t('anyDiet')}</option>
            {DIETS.map((x) => (
              <option key={x} value={x}>
                {tDiet(x)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('kcalTarget')} hint={t('targetsHint')}>
          <Input
            inputMode="numeric"
            value={d.kcalTarget}
            onChange={(e) => setD({ ...d, kcalTarget: e.target.value.replace(/\D/g, '') })}
          />
        </Field>
        <Field label={t('proteinTarget')}>
          <Input
            inputMode="numeric"
            value={d.proteinTarget}
            onChange={(e) => setD({ ...d, proteinTarget: e.target.value.replace(/\D/g, '') })}
          />
        </Field>
      </div>
      <fieldset>
        <legend className="mb-1 text-sm font-medium">{t('avoid')}</legend>
        <p className="mb-2 text-xs text-ink/60 dark:text-paper/60">{t('avoidHint')}</p>
        <div className="flex flex-wrap gap-1">
          {ALLERGENS.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={d.avoid.includes(a)}
              onClick={() =>
                setD({
                  ...d,
                  avoid: d.avoid.includes(a) ? d.avoid.filter((x) => x !== a) : [...d.avoid, a],
                })
              }
              className={cn(
                'rounded-full border px-3 py-1 text-xs',
                d.avoid.includes(a)
                  ? 'border-quake bg-quake/10'
                  : 'border-ink/15 dark:border-paper/15',
              )}
            >
              {tAll(a)}
            </button>
          ))}
        </div>
      </fieldset>
      <Field label={t('dislikes')} hint={t('dislikesHint')}>
        <TextArea
          maxLength={500}
          value={d.dislikes}
          onChange={(e) => setD({ ...d, dislikes: e.target.value })}
        />
      </Field>
      <Button type="submit" disabled={busy}>
        {t('save')}
      </Button>
    </form>
  );
}

/** Who eats: name and portion; planners add, change and remove. */
export function Eaters({
  householdId,
  eaters,
  canEdit,
}: {
  householdId: number;
  eaters: Eater[];
  canEdit: boolean;
}) {
  const t = useT('household');
  const tPortion = useT('portions');
  const { confirm } = useFeedback();
  const { busy, run } = useRun();
  const [name, setName] = useState('');
  const [portion, setPortion] = useState('1');
  const label = (p: number) => tPortion(String(p).replace('.', '_'));
  return (
    <div className="space-y-3">
      <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 text-sm dark:divide-paper/10 dark:border-paper/10">
        {eaters.map((e) => (
          <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
            <span className="font-medium">{e.name}</span>
            {canEdit ? (
              <span className="flex items-center gap-1">
                <Select
                  aria-label={t('portionOf', { name: e.name })}
                  className="w-auto"
                  value={String(e.portion)}
                  onChange={(ev) =>
                    run(
                      () =>
                        callApi(`/households/${householdId}/eaters/${e.id}`, 'PATCH', {
                          name: e.name,
                          portion: Number(ev.target.value),
                        }),
                      t('eaterSaved'),
                    )
                  }
                >
                  {PORTIONS.map((p) => (
                    <option key={p} value={String(p)}>
                      {label(p)}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={t('removeEater', { name: e.name })}
                  disabled={busy}
                  onClick={async () => {
                    const ok = await confirm({
                      title: t('removeEaterTitle', { name: e.name }),
                      body: t('removeEaterBody'),
                      confirmLabel: t('remove'),
                      danger: true,
                    });
                    if (ok)
                      await run(
                        () => callApi(`/households/${householdId}/eaters/${e.id}`, 'DELETE'),
                        t('eaterRemoved'),
                      );
                  }}
                >
                  ✕
                </Button>
              </span>
            ) : (
              <span className="text-xs text-ink/60 dark:text-paper/60">{label(e.portion)}</span>
            )}
          </li>
        ))}
      </ul>
      {canEdit ? (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={async (ev) => {
            ev.preventDefault();
            const ok = await run(
              () =>
                callApi(`/households/${householdId}/eaters`, 'POST', {
                  name,
                  portion: Number(portion),
                }),
              t('eaterAdded'),
            );
            if (ok) setName('');
          }}
        >
          <Field label={t('eaterName')}>
            <Input required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label={t('portion')}>
            <Select value={portion} onChange={(e) => setPortion(e.target.value)}>
              {PORTIONS.map((p) => (
                <option key={p} value={String(p)}>
                  {label(p)}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" disabled={busy}>
            {t('addEater')}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

/** Members with an account, the invite link, roles, leaving and deleting. */
export function Members({
  householdId,
  members,
  meId,
  ownerId,
  isPlanner,
  invite,
  baseUrl,
}: {
  householdId: number;
  members: Member[];
  meId: number;
  ownerId: number;
  isPlanner: boolean;
  invite: string | null;
  baseUrl: string;
}) {
  const t = useT('household');
  const tRole = useT('roles');
  const { confirm, toast } = useFeedback();
  const { busy, run, router } = useRun();
  const link = invite ? `${baseUrl}/join/${invite}` : null;
  return (
    <div className="space-y-4">
      <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 text-sm dark:divide-paper/10 dark:border-paper/10">
        {members.map((m) => (
          <li
            key={m.userId}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-2"
          >
            <span>
              <span className="font-medium">{m.name}</span>
              {m.userId === meId ? (
                <span className="text-ink/50 dark:text-paper/50"> {t('you')}</span>
              ) : null}
              <span className="ml-2 text-xs text-ink/60 dark:text-paper/60">{tRole(m.role)}</span>
            </span>
            <span className="flex gap-1">
              {isPlanner && m.userId !== ownerId ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () =>
                        callApi(`/households/${householdId}/members/${m.userId}`, 'PATCH', {
                          role: m.role === 'planner' ? 'member' : 'planner',
                        }),
                      t('roleSaved'),
                    )
                  }
                >
                  {m.role === 'planner' ? t('makeMember') : t('makePlanner')}
                </Button>
              ) : null}
              {m.userId !== ownerId && (isPlanner || m.userId === meId) ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={async () => {
                    const self = m.userId === meId;
                    const ok = await confirm({
                      title: self ? t('leaveTitle') : t('removeMemberTitle', { name: m.name }),
                      body: self ? t('leaveBody') : t('removeMemberBody'),
                      confirmLabel: self ? t('leave') : t('remove'),
                      danger: true,
                    });
                    if (ok)
                      await run(
                        () => callApi(`/households/${householdId}/members/${m.userId}`, 'DELETE'),
                        self ? t('left') : t('memberRemoved', { name: m.name }),
                        self ? () => router.push('/?all') : undefined,
                      );
                  }}
                >
                  {m.userId === meId ? t('leave') : t('remove')}
                </Button>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      {isPlanner ? (
        <div className="space-y-2 rounded-xl border border-ink/10 p-4 text-sm dark:border-paper/10">
          <p className="font-medium">{t('inviteTitle')}</p>
          <p className="text-xs text-ink/60 dark:text-paper/60">{t('inviteIntro')}</p>
          {link ? (
            <p className="rounded-md bg-ink/5 px-3 py-2 font-mono break-all dark:bg-paper/10">
              {link}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {link ? (
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  await navigator.clipboard.writeText(link).catch(() => undefined);
                  toast(t('copied'));
                }}
              >
                {t('copy')}
              </Button>
            ) : null}
            <Button
              type="button"
              disabled={busy}
              onClick={() =>
                run(() => callApi(`/households/${householdId}/invite`, 'POST'), t('linkMade'))
              }
            >
              {link ? t('newLink') : t('makeLink')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DeleteHousehold({ householdId, name }: { householdId: number; name: string }) {
  const t = useT('household');
  const { confirm } = useFeedback();
  const { busy, run, router } = useRun();
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={busy}
      className="text-red-700 dark:text-red-400"
      onClick={async () => {
        const ok = await confirm({
          title: t('deleteTitle', { name }),
          body: t('deleteBody'),
          confirmLabel: t('delete'),
          danger: true,
        });
        if (ok)
          await run(
            () => callApi(`/households/${householdId}`, 'DELETE'),
            t('deleted'),
            () => router.push('/'),
          );
      }}
    >
      {t('delete')}
    </Button>
  );
}

export function JoinButton({ code, name }: { code: string; name: string }) {
  const t = useT('join');
  const tErr = useT('errors');
  const router = useAppRouter();
  const { toast } = useFeedback();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div className="mt-4 space-y-2">
      <Button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            const res = await callApi<{ id: number }>('/join', 'POST', { code });
            toast(t('joined', { name }));
            router.push(`/h/${res!.id}`);
          } catch (err) {
            setError(errorMessage(err, tErr));
            setBusy(false);
          }
        }}
      >
        {busy ? t('joining') : t('join')}
      </Button>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
