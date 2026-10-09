'use client';

import { useState, type FormEvent } from 'react';
import {
  Button,
  LOCALE_TAGS,
  buttonClass,
  cn,
  formatDateTime,
  useLocale,
  useT,
} from '@devquake/ui';
import type { Comment } from '../lib/data';
import type { Check } from '../lib/guide';
import { callApi, errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { ErrorText, Field, Input, Select, TextArea } from './ui';
import { useAppRouter } from './use-app-router';

/** The checklist: required items and tips, ticked or with what is missing. */
export function Checklist({ checks }: { checks: Check[] }) {
  const t = useT('checks');
  return (
    <ul className="space-y-1 text-sm">
      {checks.map((c) => (
        <li key={c.key} className="flex gap-2">
          <span
            aria-hidden
            className={
              c.ok
                ? 'text-emerald-700 dark:text-emerald-400'
                : c.level === 'required'
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-amber-700 dark:text-amber-400'
            }
          >
            {c.ok ? '✔' : c.level === 'required' ? '✖' : '⚠'}
          </span>
          <span>
            {t(`${c.key}.${c.ok ? 'ok' : 'todo'}`, c.values)}
            {!c.ok && c.level === 'required' ? (
              <span className="ml-1 text-xs text-red-700 dark:text-red-400">{t('required')}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The author's switch between private and public (with the checklist when it is not ready). */
export function PublishControls({
  recipeId,
  isPublic,
  checks,
  ready,
}: {
  recipeId: number;
  isPublic: boolean;
  checks: Check[];
  ready: boolean;
}) {
  const t = useT('publish');
  const tErr = useT('errors');
  const router = useAppRouter();
  const { confirm, toast } = useFeedback();
  const [busy, setBusy] = useState(false);
  async function run(method: 'POST' | 'DELETE', done: string) {
    setBusy(true);
    try {
      await callApi(`/recipes/${recipeId}/publish`, method);
      toast(done);
      router.refresh();
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-3 rounded-xl border border-ink/10 p-4 text-sm dark:border-paper/10">
      <p className="font-medium">{isPublic ? t('publicTitle') : t('privateTitle')}</p>
      <p className="text-xs text-ink/60 dark:text-paper/60">
        {isPublic ? t('publicIntro') : t('privateIntro')}
      </p>
      {!isPublic ? <Checklist checks={checks} /> : null}
      {isPublic ? (
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={async () => {
            const ok = await confirm({
              title: t('unpublishTitle'),
              body: t('unpublishBody'),
              confirmLabel: t('unpublish'),
            });
            if (ok) await run('DELETE', t('unpublished'));
          }}
        >
          {t('unpublish')}
        </Button>
      ) : (
        <Button type="button" disabled={busy || !ready} onClick={() => run('POST', t('published'))}>
          {t('publish')}
        </Button>
      )}
    </div>
  );
}

/** "Recommend": like a like; shows how many members recommend the recipe. */
export function RecommendButton({
  recipeId,
  initial,
  count,
  canRecommend,
}: {
  recipeId: number;
  initial: boolean;
  count: number;
  /** False for the author (they cannot recommend their own recipe). */
  canRecommend: boolean;
}) {
  const t = useT('community');
  const tErr = useT('errors');
  const { toast } = useFeedback();
  const [on, setOn] = useState(initial);
  const [n, setN] = useState(count);
  if (!canRecommend) {
    return (
      <span className="text-sm text-ink/70 dark:text-paper/70">
        👍 {t('recommendations', { count: n })}
      </span>
    );
  }
  return (
    <Button
      type="button"
      variant="secondary"
      aria-pressed={on}
      className={cn(on && 'border-quake bg-quake/10')}
      onClick={async () => {
        const next = !on;
        setOn(next);
        setN(n + (next ? 1 : -1));
        try {
          const res = await callApi<{ recommendations: number }>(
            `/recipes/${recipeId}/recommend`,
            'POST',
            { on: next },
          );
          if (res) setN(res.recommendations);
          if (next) toast(t('recommended'));
        } catch (err) {
          setOn(!next);
          setN(n);
          toast(errorMessage(err, tErr), 'error');
        }
      }}
    >
      👍 {on ? t('recommendedLabel') : t('recommend')} · {n}
    </Button>
  );
}

/** Comments under a public recipe: the list, a form, and Remove for the writer or the author. */
export function Comments({
  recipeId,
  comments,
  meId,
  isOwner,
  timeZone,
}: {
  recipeId: number;
  comments: Comment[];
  meId: number;
  isOwner: boolean;
  timeZone: string;
}) {
  const t = useT('community');
  const tErr = useT('errors');
  const locale = useLocale();
  const router = useAppRouter();
  const { confirm, toast } = useFeedback();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await callApi(`/recipes/${recipeId}/comments`, 'POST', { body });
      setBody('');
      toast(isOwner ? t('replied') : t('commented'));
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, tErr));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="comments" className="scroll-mt-20 space-y-3">
      <h2 className="font-display text-xl font-bold">
        {t('commentsTitle', { count: comments.length })}
      </h2>
      {comments.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('noComments')}</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-ink/10 p-3 text-sm dark:border-paper/10"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium">
                  {c.name}
                  {c.userId === meId ? (
                    <span className="text-ink/50 dark:text-paper/50"> {t('you')}</span>
                  ) : null}
                </span>
                <span className="text-xs text-ink/60 dark:text-paper/60">
                  {formatDateTime(c.at, timeZone, 'datetime', locale)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
              {c.userId === meId || isOwner ? (
                <button
                  type="button"
                  className="mt-1 text-xs text-red-700 underline dark:text-red-400"
                  onClick={async () => {
                    const ok = await confirm({
                      title: t('removeTitle'),
                      body: t('removeBody'),
                      confirmLabel: t('remove'),
                      danger: true,
                    });
                    if (!ok) return;
                    try {
                      await callApi(`/recipes/${recipeId}/comments/${c.id}`, 'DELETE');
                      toast(t('removed'));
                      router.refresh();
                    } catch (err) {
                      toast(errorMessage(err, tErr), 'error');
                    }
                  }}
                >
                  {t('remove')}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="space-y-2">
        <Field
          label={isOwner ? t('reply') : t('leaveComment')}
          hint={isOwner ? undefined : t('commentHint')}
        >
          <TextArea maxLength={1000} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" disabled={busy || !body.trim()}>
          {busy ? t('sending') : t('send')}
        </Button>
      </form>
    </section>
  );
}

export interface Household {
  id: number;
  name: string;
}

/**
 * "Plan this recipe" in the meal planner (ADR 0035): a household, a day, a meal and the servings.
 * Without the connection, a suggestion to connect (or get) the meal planner.
 */
export function PlanCard({
  recipeRef,
  households,
  connectUrl,
  connectLabel,
  today,
  servings,
}: {
  recipeRef: string;
  /** The member's households, or null when the apps are not connected. */
  households: Household[] | null;
  connectUrl: string | null;
  connectLabel: 'connect' | 'getIt';
  today: string;
  servings: number;
}) {
  const t = useT('plan');
  const tErr = useT('errors');
  const tag = LOCALE_TAGS[useLocale()];
  const { toast } = useFeedback();
  const [householdId, setHouseholdId] = useState(households?.[0] ? String(households[0].id) : '');
  const [day, setDay] = useState(today);
  const [slot, setSlot] = useState('dinner');
  const [count, setCount] = useState(String(servings));
  const [busy, setBusy] = useState(false);

  if (!households) {
    if (!connectUrl) return null;
    return (
      <div className="space-y-2 rounded-xl border border-ink/10 p-4 text-sm dark:border-paper/10">
        <p className="font-medium">{t('title')}</p>
        <p className="text-ink/70 dark:text-paper/70">{t('connectIntro')}</p>
        <a href={connectUrl} className={buttonClass('secondary')}>
          {connectLabel === 'connect' ? t('connect') : t('getIt')}
        </a>
      </div>
    );
  }
  return (
    <div className="space-y-3 rounded-xl border border-ink/10 p-4 text-sm dark:border-paper/10">
      <p className="font-medium">{t('title')}</p>
      {households.length === 0 ? (
        <p className="text-ink/70 dark:text-paper/70">{t('noHouseholds')}</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label={t('household')}>
            <Select value={householdId} onChange={(e) => setHouseholdId(e.target.value)}>
              {households.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('day')}>
            <Input type="date" value={day} min={today} onChange={(e) => setDay(e.target.value)} />
          </Field>
          <Field label={t('slot')}>
            <Select value={slot} onChange={(e) => setSlot(e.target.value)}>
              {['breakfast', 'lunch', 'dinner', 'snack'].map((s) => (
                <option key={s} value={s}>
                  {t(`slots.${s}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('servings')}>
            <Input
              inputMode="numeric"
              value={count}
              onChange={(e) => setCount(e.target.value.replace(/\D/g, ''))}
            />
          </Field>
          <Button
            type="button"
            className="sm:col-span-2"
            disabled={busy || !householdId || !day}
            onClick={async () => {
              setBusy(true);
              try {
                await callApi('/plan', 'POST', {
                  ref: recipeRef,
                  householdId: Number(householdId),
                  day,
                  slot,
                  servings: Number(count) || servings,
                });
                const date = new Date(`${day}T12:00:00Z`).toLocaleDateString(tag, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  timeZone: 'UTC',
                });
                toast(t('planned', { day: date }));
              } catch (err) {
                toast(errorMessage(err, tErr), 'error');
              } finally {
                setBusy(false);
              }
            }}
          >
            {t('add')}
          </Button>
        </div>
      )}
    </div>
  );
}
