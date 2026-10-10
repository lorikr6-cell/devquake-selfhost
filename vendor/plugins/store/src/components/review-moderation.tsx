'use client';

import { useState } from 'react';
import { Button, Link, cn, useT } from '@devquake/ui';
import { REVIEW_LIMITS, REVIEW_MODES, type ReviewMode, type ReviewStatus } from '../lib/reviews';
import type { Review } from '../lib/reviews-data';
import { callApi } from './call-api';
import { Panel, Select, TextArea } from './ui';
import { useAction } from './use-action';

const TONE: Record<ReviewStatus, string> = {
  pending: 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200',
  published: 'bg-green-100 text-green-900 dark:bg-green-500/15 dark:text-green-200',
  hidden: 'bg-ink/10 text-ink/70 dark:bg-paper/10 dark:text-paper/70',
};

function ReviewCard({
  review: r,
  shopSlug,
}: {
  review: Review & { date: string };
  shopSlug: string;
}) {
  const t = useT('reviews');
  const { busy, act, confirm } = useAction();
  const [reply, setReply] = useState(r.reply ?? '');
  const [replying, setReplying] = useState(false);
  const patch = (body: object, success: string) =>
    act(() => callApi(`/reviews/${r.id}`, 'PATCH', body), { success });
  return (
    <Panel className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-quake" aria-label={t('stars', { count: r.rating })}>
          {'★'.repeat(r.rating)}
          <span className="opacity-25">{'★'.repeat(5 - r.rating)}</span>
        </span>
        {r.title ? <span className="font-semibold">{r.title}</span> : null}
        <span
          className={cn('ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold', TONE[r.status])}
        >
          {t(`status.${r.status}`)}
        </span>
      </div>
      <p className="text-xs text-ink/60 dark:text-paper/60">
        {r.author} · {r.date}
        {r.verified ? ` · ✓ ${t('verified')}` : ''} ·{' '}
        <Link
          href={`/s/${shopSlug}/p/${r.productSlug}#reviews`}
          className="underline hover:text-quake"
        >
          {r.productName}
        </Link>
      </p>
      {r.body ? <p className="text-sm whitespace-pre-line">{r.body}</p> : null}
      {replying ? (
        <div className="space-y-2">
          <TextArea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            maxLength={REVIEW_LIMITS.reply}
            rows={3}
            aria-label={t('reply')}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (await patch({ reply }, t('replied'))) setReplying(false);
              }}
            >
              {t('saveReply')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setReplying(false)}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      ) : r.reply ? (
        <p className="border-l-2 border-quake pl-3 text-sm whitespace-pre-line">
          <span className="block text-xs font-semibold">{t('yourReply')}</span>
          {r.reply}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {r.status !== 'published' ? (
          <Button
            type="button"
            disabled={busy}
            onClick={() => patch({ status: 'published' }, t('publishedDone'))}
          >
            {t('publish')}
          </Button>
        ) : null}
        {r.status !== 'hidden' ? (
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => patch({ status: 'hidden' }, t('hiddenDone'))}
          >
            {t('hide')}
          </Button>
        ) : null}
        {!replying ? (
          <Button type="button" variant="secondary" onClick={() => setReplying(true)}>
            {r.reply ? t('editReply') : t('reply')}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={async () => {
            const ok = await confirm({
              title: t('deleteTitle'),
              body: t('deleteBody'),
              confirmLabel: t('delete'),
              danger: true,
            });
            if (ok)
              await act(() => callApi(`/reviews/${r.id}`, 'DELETE'), { success: t('deleted') });
          }}
        >
          {t('delete')}
        </Button>
      </div>
    </Panel>
  );
}

export function ReviewModeration({
  mode,
  status,
  shopSlug,
  reviews,
}: {
  mode: ReviewMode;
  status: ReviewStatus | 'all';
  shopSlug: string;
  reviews: Array<Review & { date: string }>;
}) {
  const t = useT('reviews');
  const { busy, act, router } = useAction();
  return (
    <div className="space-y-4">
      <Panel className="flex flex-wrap items-end gap-3">
        <label className="min-w-64 flex-1 text-sm">
          <span className="mb-1 block font-medium">{t('mode')}</span>
          <Select
            value={mode}
            disabled={busy}
            onChange={(e) =>
              act(() => callApi('/store/reviews', 'PUT', { mode: e.target.value }), {
                success: t('modeSaved'),
              })
            }
          >
            {REVIEW_MODES.map((m) => (
              <option key={m} value={m}>
                {t(`modes.${m}`)}
              </option>
            ))}
          </Select>
        </label>
        <p className="text-xs text-ink/60 dark:text-paper/60 sm:max-w-sm">
          {t(`modeHint.${mode}`)}
        </p>
      </Panel>
      <nav aria-label={t('filter')} className="flex flex-wrap gap-2">
        {(['pending', 'published', 'hidden', 'all'] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-current={status === s ? 'page' : undefined}
            onClick={() => router.push(`/reviews?status=${s}`)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm',
              status === s
                ? 'border-quake bg-quake/10 font-semibold'
                : 'border-ink/15 hover:border-quake dark:border-paper/15',
            )}
          >
            {t(`filters.${s}`)}
          </button>
        ))}
      </nav>
      {reviews.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('empty')}</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id}>
              <ReviewCard review={r} shopSlug={shopSlug} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
