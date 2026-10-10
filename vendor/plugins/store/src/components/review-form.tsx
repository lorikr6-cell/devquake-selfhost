'use client';

import { useId, useState, type FormEvent } from 'react';
import { cn, trackEvent, useT } from '@devquake/ui';
import { REVIEW_LIMITS } from '../lib/reviews';
import { errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { S } from './shop-style';
import { ErrorText, Field, Input, TextArea } from './ui';

/** Stars to pick a rating with (radio buttons, so keyboards and screen readers can use them). */
function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const t = useT('reviewsShop');
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">{t('rating')}</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="peer sr-only"
              required
            />
            <span
              aria-hidden
              className={cn(
                'block text-3xl leading-none peer-focus-visible:outline-2 peer-focus-visible:[outline-color:var(--shop-accent)]',
                n <= value ? '[color:var(--shop-accent)]' : 'opacity-25',
              )}
            >
              ★
            </span>
            <span className="sr-only">{t('stars', { count: n })}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * A review: stars, a title, a comment and a name. From the product page it waits for the
 * owner (`moderated`); from an order page it is a verified purchase (`extra` names the product).
 */
export function ReviewForm({
  action,
  moderated,
  extra,
  defaultName = '',
  onDone,
}: {
  action: string;
  moderated: boolean;
  extra?: Record<string, unknown>;
  defaultName?: string;
  onDone?: () => void;
}) {
  const t = useT('reviewsShop');
  const tErr = useT('errors');
  const { toast } = useFeedback();
  const [open, setOpen] = useState(Boolean(extra));
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState(defaultName);
  const [trap, setTrap] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState<null | 'pending' | 'published'>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...extra, rating, title, body, author, website: trap }),
      });
      const data = (await res.json().catch(() => null)) as {
        status?: 'pending' | 'published';
        error?: string;
      } | null;
      if (!res.ok) throw Object.assign(new Error(data?.error ?? ''), { status: res.status });
      trackEvent('store_review_sent');
      setSent(data?.status ?? 'pending');
      toast(t('thanks'));
      onDone?.();
    } catch (err) {
      const message = errorMessage(err, tErr);
      setError(message);
      toast(message, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <p className={cn('text-sm', S.panel)}>
        {sent === 'published' ? t('published') : t('pending')}
      </p>
    );
  }
  if (!open) {
    return (
      <button type="button" className={S.buttonSecondary} onClick={() => setOpen(true)}>
        {t('write')}
      </button>
    );
  }
  return (
    <form onSubmit={submit} className={cn('space-y-3', S.panel)}>
      {!extra ? <h3 className="font-semibold">{t('write')}</h3> : null}
      <StarPicker value={rating} onChange={setRating} />
      <Field label={t('titleField')}>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={REVIEW_LIMITS.title}
        />
      </Field>
      <Field label={t('body')}>
        <TextArea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={REVIEW_LIMITS.body}
          rows={4}
        />
      </Field>
      <Field label={t('author')} hint={t('authorHint')}>
        <Input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={REVIEW_LIMITS.author}
          required
        />
      </Field>
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={trap}
        onChange={(e) => setTrap(e.target.value)}
        className="hidden"
        name="website"
      />
      <p className={cn('text-xs', S.muted)}>{moderated ? t('moderatedHint') : t('verifiedHint')}</p>
      <ErrorText>{error}</ErrorText>
      <button type="submit" className={S.button} disabled={busy || rating === 0}>
        {t('send')}
      </button>
    </form>
  );
}
