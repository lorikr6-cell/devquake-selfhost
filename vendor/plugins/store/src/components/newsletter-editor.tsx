'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, cn, trackEvent, useT } from '@devquake/ui';
import type { NewsletterSection } from '../lib/newsletter-data-types';
import { callApi, errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { ErrorText, Field, Input, Panel, Select, TextArea } from './ui';
import { useAction } from './use-action';

interface Value {
  id: number | null;
  subject: string;
  preheader: string;
  heading: string;
  intro: string;
  voucherId: string;
  products: Array<{ productId: number; section: NewsletterSection }>;
}

interface PickProduct {
  id: number;
  name: string;
  photo: string | null;
  price: string;
  onSale: boolean;
  isNew: boolean;
}

const MAX = 24;

/**
 * An email campaign: texts, a voucher, products picked for "On offer" and "New in the shop"
 * (quick picks: everything on sale, the newest), a preview of the email, a test email, and
 * sending in batches while the page shows the progress.
 */
export function NewsletterEditor({
  value,
  status,
  progress,
  products,
  vouchers,
  preview,
  subscribers,
  canSend,
}: {
  value: Value;
  status: 'draft' | 'sending' | 'sent';
  progress: { recipients: number; sent: number; failed: number } | null;
  products: PickProduct[];
  vouchers: Array<{ id: number; code: string }>;
  preview: string | null;
  subscribers: number;
  canSend: boolean;
}) {
  const t = useT('newsletters');
  const tErr = useT('errors');
  const { toast } = useFeedback();
  const { busy, error, act, router, confirm } = useAction();
  const [v, setV] = useState(value);
  const [filter, setFilter] = useState('');
  const [testTo, setTestTo] = useState('');
  const [sending, setSending] = useState(status === 'sending');
  const [state, setState] = useState(progress);
  const draft = status === 'draft';
  const stop = useRef(false);

  const sectionOf = (id: number) => v.products.find((p) => p.productId === id)?.section ?? null;
  function toggle(id: number, section: NewsletterSection) {
    setV((x) => {
      const current = x.products.find((p) => p.productId === id);
      if (current?.section === section)
        return { ...x, products: x.products.filter((p) => p.productId !== id) };
      if (current)
        return {
          ...x,
          products: x.products.map((p) => (p.productId === id ? { ...p, section } : p)),
        };
      if (x.products.length >= MAX) {
        toast(t('tooMany', { max: MAX }), 'error');
        return x;
      }
      return { ...x, products: [...x.products, { productId: id, section }] };
    });
  }
  function pick(list: PickProduct[], section: NewsletterSection) {
    setV((x) => {
      const taken = new Set(x.products.map((p) => p.productId));
      const add = list
        .filter((p) => !taken.has(p.id))
        .slice(0, MAX - x.products.length)
        .map((p) => ({ productId: p.id, section }));
      return { ...x, products: [...x.products, ...add] };
    });
  }

  async function save(): Promise<number | null> {
    const body = { ...v, voucherId: v.voucherId || null };
    let id = v.id;
    const ok = await act(
      async () => {
        if (id === null) {
          const res = await callApi<{ id: number }>('/newsletters', 'POST', body);
          id = res!.id;
        } else await callApi(`/newsletters/${id}`, 'PUT', body);
      },
      {
        success: t('saved'),
        after: () =>
          v.id === null && id !== null ? router.push(`/newsletters/${id}`) : router.refresh(),
      },
    );
    return ok ? id : null;
  }

  // Sends the queue batch by batch while the page is open (the hourly job finishes otherwise).
  useEffect(() => {
    if (!sending || v.id === null) return;
    stop.current = false;
    let timer: ReturnType<typeof setTimeout>;
    const step = async () => {
      try {
        const res = await callApi<{
          recipients: number;
          sent: number;
          failed: number;
          status: string;
        }>(`/newsletters/${v.id}/batch`, 'POST');
        if (res) setState({ recipients: res.recipients, sent: res.sent, failed: res.failed });
        if (res?.status === 'sent') {
          setSending(false);
          toast(t('done'));
          router.refresh();
          return;
        }
        if (!stop.current) timer = setTimeout(step, 1500);
      } catch (err) {
        toast(errorMessage(err, tErr), 'error');
        setSending(false);
      }
    };
    timer = setTimeout(step, 500);
    return () => {
      stop.current = true;
      clearTimeout(timer);
    };
  }, [sending, v.id, router, t, tErr, toast]);

  async function send() {
    const id = await save();
    if (id === null) return;
    const ok = await confirm({
      title: t('sendTitle'),
      body: t('sendBody', { count: subscribers }),
      confirmLabel: t('send'),
    });
    if (!ok) return;
    await act(
      async () => {
        const res = await callApi<{ recipients: number; sent: number; failed: number }>(
          `/newsletters/${id}/send`,
          'POST',
        );
        if (res) setState({ recipients: res.recipients, sent: res.sent, failed: res.failed });
        trackEvent('store_newsletter_sent');
        setSending(true);
      },
      { success: t('started'), after: () => undefined },
    );
  }

  async function remove() {
    const ok = await confirm({
      title: t('deleteTitle'),
      body: t('deleteBody'),
      confirmLabel: t('delete'),
      danger: true,
    });
    if (ok && v.id !== null)
      await act(() => callApi(`/newsletters/${v.id}`, 'DELETE'), {
        success: t('deleted'),
        after: () => router.push('/newsletters'),
      });
  }

  const shown = products.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-4">
      {state && status !== 'draft' ? (
        <Panel className="space-y-2">
          <p className="font-medium">
            {sending ? t('sending') : t('sentState')}{' '}
            {t('progress', { sent: state.sent, total: state.recipients })}
            {state.failed ? ` · ${t('failed', { count: state.failed })}` : ''}
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-ink/10 dark:bg-paper/10">
            <div
              className="h-full bg-quake transition-all"
              style={{
                width: `${state.recipients ? ((state.sent + state.failed) / state.recipients) * 100 : 0}%`,
              }}
            />
          </div>
          {sending ? (
            <p className="text-xs text-ink/60 dark:text-paper/60">{t('keepOpen')}</p>
          ) : null}
        </Panel>
      ) : null}

      <fieldset disabled={!draft} className="space-y-4">
        <Panel className="space-y-3">
          <Field label={t('subject')}>
            <Input
              value={v.subject}
              onChange={(e) => setV({ ...v, subject: e.target.value })}
              maxLength={150}
              required
            />
          </Field>
          <Field label={t('preheader')} hint={t('preheaderHint')}>
            <Input
              value={v.preheader}
              onChange={(e) => setV({ ...v, preheader: e.target.value })}
              maxLength={150}
            />
          </Field>
          <Field label={t('heading')}>
            <Input
              value={v.heading}
              onChange={(e) => setV({ ...v, heading: e.target.value })}
              maxLength={150}
            />
          </Field>
          <Field label={t('introField')} hint={t('introHint')}>
            <TextArea
              value={v.intro}
              onChange={(e) => setV({ ...v, intro: e.target.value })}
              maxLength={5000}
              rows={5}
            />
          </Field>
          <Field label={t('voucher')} hint={t('voucherHint')}>
            <Select value={v.voucherId} onChange={(e) => setV({ ...v, voucherId: e.target.value })}>
              <option value="">{t('noVoucher')}</option>
              {vouchers.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.code}
                </option>
              ))}
            </Select>
          </Field>
        </Panel>

        <Panel className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold">{t('products')}</h2>
              <p className="text-sm text-ink/60 dark:text-paper/60">
                {t('productsHint', { count: v.products.length, max: MAX })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  pick(
                    products.filter((p) => p.onSale),
                    'promo',
                  )
                }
              >
                {t('pickSale')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => pick(products.filter((p) => p.isNew).slice(0, 6), 'new')}
              >
                {t('pickNew')}
              </Button>
              {v.products.length > 0 ? (
                <Button type="button" variant="ghost" onClick={() => setV({ ...v, products: [] })}>
                  {t('clear')}
                </Button>
              ) : null}
            </div>
          </div>
          <Input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('find')}
            aria-label={t('find')}
          />
          <ul className="grid max-h-[28rem] gap-2 overflow-y-auto sm:grid-cols-2">
            {shown.map((p) => {
              const section = sectionOf(p.id);
              return (
                <li
                  key={p.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-2',
                    section ? 'border-quake bg-quake/5' : 'border-ink/10 dark:border-paper/10',
                  )}
                >
                  {p.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photo} alt="" className="size-12 rounded object-cover" />
                  ) : (
                    <span
                      aria-hidden
                      className="grid size-12 place-items-center rounded bg-ink/5 dark:bg-paper/5"
                    >
                      🛍️
                    </span>
                  )}
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="text-xs text-ink/60 dark:text-paper/60">
                      {p.price}
                      {p.onSale ? ` · ${t('onSale')}` : ''}
                      {p.isNew ? ` · ${t('isNew')}` : ''}
                    </span>
                  </span>
                  <span className="flex flex-col gap-1">
                    {(['promo', 'new'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={section === s}
                        onClick={() => toggle(p.id, s)}
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-xs',
                          section === s
                            ? 'border-quake bg-quake text-white'
                            : 'border-ink/20 hover:border-quake dark:border-paper/20',
                        )}
                      >
                        {t(`section.${s}`)}
                      </button>
                    ))}
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </fieldset>

      <ErrorText>{error}</ErrorText>
      {draft ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy} onClick={() => save()}>
            {t('saveAndPreview')}
          </Button>
          {v.id !== null ? (
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={busy || !canSend || subscribers === 0}
                onClick={send}
              >
                {t('sendTo', { count: subscribers })}
              </Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={remove}>
                {t('delete')}
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
      {!canSend ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('cannotSend')}</p>
      ) : null}

      {v.id !== null && canSend ? (
        <Panel className="flex flex-wrap items-end gap-2">
          <Field label={t('testTo')} className="min-w-56 flex-1">
            <Input
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              maxLength={160}
            />
          </Field>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || !testTo}
            onClick={() =>
              act(() => callApi(`/newsletters/${v.id}/test`, 'POST', { email: testTo }), {
                success: t('testSent', { email: testTo }),
                after: () => undefined,
              })
            }
          >
            {t('sendTest')}
          </Button>
        </Panel>
      ) : null}

      {preview ? (
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold">{t('preview')}</h2>
          <p className="text-sm text-ink/60 dark:text-paper/60">{t('previewHint')}</p>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <iframe
              title={t('preview')}
              srcDoc={preview}
              sandbox=""
              className="h-[42rem] w-full rounded-xl border border-ink/10 bg-white dark:border-paper/10"
            />
            <iframe
              title={t('previewPhone')}
              srcDoc={preview}
              sandbox=""
              className="mx-auto h-[42rem] w-[22rem] rounded-[2rem] border-8 border-ink/80 bg-white"
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

/** The subscribers, by status, with a way to remove an address entirely. */
export function SubscriberList({
  subscribers,
}: {
  subscribers: Array<{
    id: number;
    email: string;
    status: string;
    source: string | null;
    date: string;
  }>;
}) {
  const t = useT('newsletters');
  const { busy, act, confirm } = useAction();
  const [status, setStatus] = useState('confirmed');
  const [q, setQ] = useState('');
  const list = subscribers.filter(
    (s) => (status === 'all' || s.status === status) && s.email.includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Select
          aria-label={t('filter')}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-auto"
        >
          {['confirmed', 'pending', 'unsubscribed', 'all'].map((s) => (
            <option key={s} value={s}>
              {t(`counts.${s}`)}
            </option>
          ))}
        </Select>
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('findSubscriber')}
          aria-label={t('findSubscriber')}
          className="w-auto flex-1"
        />
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('noSubscribers')}</p>
      ) : (
        <ul className="max-h-96 divide-y divide-ink/10 overflow-y-auto text-sm dark:divide-paper/10">
          {list.slice(0, 500).map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 py-2">
              <span className="min-w-0 flex-1 truncate">{s.email}</span>
              <span className="text-xs text-ink/60 dark:text-paper/60">
                {t(`counts.${s.status}`)} · {s.date}
              </span>
              <button
                type="button"
                className="text-xs underline hover:text-quake"
                disabled={busy}
                onClick={async () => {
                  const ok = await confirm({
                    title: t('removeTitle', { email: s.email }),
                    body: t('removeBody'),
                    confirmLabel: t('remove'),
                    danger: true,
                  });
                  if (ok)
                    await act(() => callApi(`/subscribers/${s.id}`, 'DELETE'), {
                      success: t('removed'),
                    });
                }}
              >
                {t('remove')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
