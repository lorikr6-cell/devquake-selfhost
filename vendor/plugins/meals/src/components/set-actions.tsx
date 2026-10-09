'use client';

import { useState, type FormEvent } from 'react';
import { Button, LOCALE_TAGS, cn, formatDateTime, useLocale, useT } from '@devquake/ui';
import type { Comment } from '../lib/data';
import { SLOTS } from '../lib/plan';
import { callApi, errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { ErrorText, Field, Input, Select, TextArea } from './ui';
import { useAppRouter } from './use-app-router';

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
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
    } finally {
      setBusy(false);
    }
  }
  return { busy, run, router };
}

/** "Add to my plan": a household, a day and a meal slot; the saved meal is copied there. */
export function AddSetToPlan({
  setId,
  households,
  today,
  slot,
}: {
  setId: number;
  households: { id: number; name: string }[];
  today: string;
  slot: string;
}) {
  const t = useT('set');
  const tSlot = useT('slots');
  const tag = LOCALE_TAGS[useLocale()];
  const { busy, run } = useRun();
  const [householdId, setHouseholdId] = useState(households[0] ? String(households[0].id) : '');
  const [day, setDay] = useState(today);
  const [chosen, setChosen] = useState(slot);
  if (households.length === 0)
    return <p className="text-sm text-ink/60 dark:text-paper/60">{t('noHouseholds')}</p>;
  return (
    <div className="grid gap-2 rounded-xl border border-ink/10 p-4 text-sm sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end dark:border-paper/10">
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
        <Input type="date" min={today} value={day} onChange={(e) => setDay(e.target.value)} />
      </Field>
      <Field label={t('slot')}>
        <Select value={chosen} onChange={(e) => setChosen(e.target.value)}>
          {SLOTS.map((s) => (
            <option key={s.code} value={s.code}>
              {s.icon} {tSlot(s.code)}
            </option>
          ))}
        </Select>
      </Field>
      <Button
        type="button"
        disabled={busy || !householdId || !day}
        onClick={() =>
          run(
            () => callApi(`/households/${householdId}/meals`, 'POST', { setId, day, slot: chosen }),
            t('planned', {
              day: new Date(`${day}T12:00:00Z`).toLocaleDateString(tag, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                timeZone: 'UTC',
              }),
            }),
          )
        }
      >
        {t('addToPlan')}
      </Button>
    </div>
  );
}

/** The owner's controls: public or private, rename, delete. */
export function OwnerControls({
  setId,
  title,
  description,
  isPublic,
}: {
  setId: number;
  title: string;
  description: string | null;
  isPublic: boolean;
}) {
  const t = useT('set');
  const { confirm } = useFeedback();
  const { busy, run, router } = useRun();
  const [name, setName] = useState(title);
  const [text, setText] = useState(description ?? '');
  return (
    <div className="space-y-4 border-t border-ink/10 pt-6 dark:border-paper/10">
      <div className="space-y-2 rounded-xl border border-ink/10 p-4 text-sm dark:border-paper/10">
        <p className="font-medium">{isPublic ? t('publicTitle') : t('privateTitle')}</p>
        <p className="text-xs text-ink/60 dark:text-paper/60">
          {isPublic ? t('publicIntro') : t('privateIntro')}
        </p>
        {isPublic ? (
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => run(() => callApi(`/sets/${setId}/publish`, 'DELETE'), t('unpublished'))}
          >
            {t('unpublish')}
          </Button>
        ) : (
          <Button
            type="button"
            disabled={busy}
            onClick={() => run(() => callApi(`/sets/${setId}/publish`, 'POST'), t('published'))}
          >
            {t('publish')}
          </Button>
        )}
      </div>
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run(
            () => callApi(`/sets/${setId}`, 'PATCH', { title: name, description: text }),
            t('saved'),
          );
        }}
      >
        <Field label={t('title')}>
          <Input required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t('description')} hint={t('descriptionHint')}>
          <TextArea maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="secondary" disabled={busy}>
            {t('save')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            className="text-red-700 dark:text-red-400"
            onClick={async () => {
              const ok = await confirm({
                title: t('deleteTitle', { title }),
                body: t('deleteBody'),
                confirmLabel: t('delete'),
                danger: true,
              });
              if (ok)
                await run(
                  () => callApi(`/sets/${setId}`, 'DELETE'),
                  t('deleted'),
                  () => router.push('/meals'),
                );
            }}
          >
            {t('delete')}
          </Button>
        </div>
      </form>
    </div>
  );
}

/** "Recommend" for someone else's public meal (like a like), with the count. */
export function RecommendSet({
  setId,
  initial,
  count,
  canRecommend,
}: {
  setId: number;
  initial: boolean;
  count: number;
  canRecommend: boolean;
}) {
  const t = useT('set');
  const tErr = useT('errors');
  const { toast } = useFeedback();
  const [on, setOn] = useState(initial);
  const [n, setN] = useState(count);
  if (!canRecommend)
    return (
      <span className="text-sm text-ink/70 dark:text-paper/70">
        👍 {t('recommendations', { count: n })}
      </span>
    );
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
            `/sets/${setId}/recommend`,
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

/** Comments under a public meal: the list, a form, Remove for the writer or the owner. */
export function SetComments({
  setId,
  comments,
  meId,
  isOwner,
  timeZone,
}: {
  setId: number;
  comments: Comment[];
  meId: number;
  isOwner: boolean;
  timeZone: string;
}) {
  const t = useT('set');
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
      await callApi(`/sets/${setId}/comments`, 'POST', { body });
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
      ) : null}
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
                    title: t('removeCommentTitle'),
                    body: t('removeCommentBody'),
                    confirmLabel: t('remove'),
                    danger: true,
                  });
                  if (!ok) return;
                  try {
                    await callApi(`/sets/${setId}/comments/${c.id}`, 'DELETE');
                    toast(t('commentRemoved'));
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
