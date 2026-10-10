'use client';

import { useState, type FormEvent } from 'react';
import { cn, trackEvent, useT } from '@devquake/ui';
import { MESSAGE_LIMITS } from '../lib/buyers-data-limits';
import { LIMITS } from '../lib/model';
import { errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { S } from './shop-style';
import { ErrorText, Field, Input, Select, TextArea } from './ui';
import { useAppRouter } from './use-app-router';

// The buyer's account in the shop (ADR 0058): signing in with an emailed link, messages, the
// newsletter, their name, signing out and deleting the account. Calls the shop's key routes.

async function post(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as
    ({ error?: string } & Record<string, unknown>) | null;
  if (!res.ok) throw Object.assign(new Error(data?.error ?? ''), { status: res.status });
  return data;
}

export function SignInForm({ slug }: { slug: string }) {
  const t = useT('account');
  const tErr = useT('errors');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await post(`/api/s/${slug}/account/signin`, 'POST', { email });
      trackEvent('store_buyer_signin_link');
      setSent(true);
    } catch (err) {
      setError(errorMessage(err, tErr));
    } finally {
      setBusy(false);
    }
  }

  if (sent) return <p className={S.panel}>{t('linkSent', { email })}</p>;
  return (
    <form onSubmit={submit} className={cn('max-w-md space-y-3', S.panel)}>
      <Field label={t('email')}>
        <Input
          type="email"
          required
          autoComplete="email"
          maxLength={160}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <ErrorText>{error}</ErrorText>
      <button type="submit" className={S.button} disabled={busy}>
        {t('sendLink')}
      </button>
      <p className={cn('text-xs', S.muted)}>{t('linkHint')}</p>
    </form>
  );
}

/**
 * "Continue with DevQuake" (ADR 0059): the signed-in member's account in this shop, filled in
 * from their DevQuake profile. The first time, DevQuake asks them to allow their email address.
 */
export function ConnectButton({ slug }: { slug: string }) {
  const t = useT('account');
  const tErr = useT('errors');
  const router = useAppRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function connect() {
    setBusy(true);
    setError('');
    try {
      const data = await post(`/api/s/${slug}/account/connect`, 'POST');
      if (typeof data?.consentUrl === 'string') {
        window.location.assign(data.consentUrl);
        return;
      }
      trackEvent('store_buyer_connected');
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, tErr));
    }
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <button type="button" className={S.button} disabled={busy} onClick={connect}>
        {t('connect')}
      </button>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

type Details = {
  phone: string | null;
  addressLine: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
};

/** The buyer's saved delivery details, which fill in the checkout (ADR 0059). */
export function DetailsForm({
  slug,
  details,
  countries,
}: {
  slug: string;
  details: Details;
  countries: Array<{ code: string; name: string }>;
}) {
  const t = useT('account');
  const tErr = useT('errors');
  const router = useAppRouter();
  const { toast } = useFeedback();
  const [value, setValue] = useState({
    phone: details.phone ?? '',
    addressLine: details.addressLine ?? '',
    city: details.city ?? '',
    postalCode: details.postalCode ?? '',
    country: details.country ?? '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof value) => (v: string) => setValue((d) => ({ ...d, [k]: v }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await post(`/api/s/${slug}/account`, 'PUT', value);
      toast(t('detailsSaved'));
      router.refresh();
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={cn('max-w-2xl space-y-3', S.panel)}>
      <h3 className={cn('font-semibold', S.heading)}>{t('deliveryTitle')}</h3>
      <p className={cn('text-xs', S.muted)}>{t('deliveryHint')}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('phone')}>
          <Input
            type="tel"
            autoComplete="tel"
            maxLength={LIMITS.phone}
            value={value.phone}
            onChange={(e) => set('phone')(e.target.value)}
          />
        </Field>
        <Field label={t('addressLine')}>
          <Input
            autoComplete="street-address"
            maxLength={LIMITS.addressLine}
            value={value.addressLine}
            onChange={(e) => set('addressLine')(e.target.value)}
          />
        </Field>
        <Field label={t('city')}>
          <Input
            autoComplete="address-level2"
            maxLength={LIMITS.city}
            value={value.city}
            onChange={(e) => set('city')(e.target.value)}
          />
        </Field>
        <Field label={t('postalCode')}>
          <Input
            autoComplete="postal-code"
            maxLength={LIMITS.postalCode}
            value={value.postalCode}
            onChange={(e) => set('postalCode')(e.target.value)}
          />
        </Field>
        <Field label={t('country')}>
          <Select value={value.country} onChange={(e) => set('country')(e.target.value)}>
            <option value="">{t('noCountry')}</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <button type="submit" className={S.buttonSecondary} disabled={busy}>
        {t('saveDetails')}
      </button>
    </form>
  );
}

export function NewThreadForm({
  slug,
  orders,
}: {
  slug: string;
  orders: Array<{ id: number; label: string }>;
}) {
  const t = useT('account');
  const tErr = useT('errors');
  const router = useAppRouter();
  const { toast } = useFeedback();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [orderId, setOrderId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await post(`/api/s/${slug}/account/messages`, 'POST', {
        subject,
        body,
        orderId: orderId || null,
      });
      toast(t('messageSent'));
      router.push(`/s/${slug}/account/messages/${String(data?.id)}`);
    } catch (err) {
      const message = errorMessage(err, tErr);
      setError(message);
      toast(message, 'error');
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className={S.button} onClick={() => setOpen(true)}>
        {t('newMessage')}
      </button>
    );
  }
  return (
    <form onSubmit={submit} className={cn('space-y-3', S.panel)}>
      <Field label={t('subject')}>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={MESSAGE_LIMITS.subject}
          required
        />
      </Field>
      {orders.length > 0 ? (
        <Field label={t('aboutOrder')}>
          <Select value={orderId} onChange={(e) => setOrderId(e.target.value)}>
            <option value="">{t('noOrder')}</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <Field label={t('message')}>
        <TextArea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={MESSAGE_LIMITS.body}
          rows={5}
          required
        />
      </Field>
      <ErrorText>{error}</ErrorText>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={S.button} disabled={busy}>
          {t('send')}
        </button>
        <button type="button" className={S.buttonSecondary} onClick={() => setOpen(false)}>
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}

/** Answering in a conversation (the buyer's side). */
export function ReplyForm({ action, label }: { action: string; label: string }) {
  const t = useT('account');
  const tErr = useT('errors');
  const router = useAppRouter();
  const { toast } = useFeedback();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await post(action, 'POST', { body });
      setBody('');
      toast(t('messageSent'));
      router.refresh();
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="sr-only" htmlFor="reply">
        {label}
      </label>
      <TextArea
        id="reply"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={MESSAGE_LIMITS.body}
        rows={4}
        required
        placeholder={label}
      />
      <button type="submit" className={S.button} disabled={busy}>
        {t('send')}
      </button>
    </form>
  );
}

export function AccountActions({ slug, name }: { slug: string; name: string | null }) {
  const t = useT('account');
  const tErr = useT('errors');
  const router = useAppRouter();
  const { toast, confirm } = useFeedback();
  const [value, setValue] = useState(name ?? '');
  const [busy, setBusy] = useState(false);

  async function run(change: () => Promise<unknown>, success: string, after: () => void) {
    setBusy(true);
    try {
      await change();
      toast(success);
      after();
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        className="flex max-w-md flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run(
            () => post(`/api/s/${slug}/account`, 'PATCH', { name: value }),
            t('nameSaved'),
            () => router.refresh(),
          );
        }}
      >
        <Field label={t('name')} className="min-w-48 flex-1">
          <Input value={value} onChange={(e) => setValue(e.target.value)} maxLength={120} />
        </Field>
        <button type="submit" className={S.buttonSecondary} disabled={busy}>
          {t('save')}
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={S.buttonSecondary}
          disabled={busy}
          onClick={() =>
            run(
              () => post(`/api/s/${slug}/account`, 'POST'),
              t('signedOut'),
              () => router.refresh(),
            )
          }
        >
          {t('signOut')}
        </button>
        <button
          type="button"
          className="min-h-11 px-3 text-sm text-red-700 underline dark:text-red-400"
          disabled={busy}
          onClick={async () => {
            const ok = await confirm({
              title: t('deleteTitle'),
              body: t('deleteBody'),
              confirmLabel: t('delete'),
              danger: true,
            });
            if (ok)
              await run(
                () => post(`/api/s/${slug}/account`, 'DELETE'),
                t('deleted'),
                () => router.refresh(),
              );
          }}
        >
          {t('delete')}
        </button>
      </div>
    </div>
  );
}

/** Confirming or leaving the newsletter from its page (buttons, so mail scanners do nothing). */
export function NewsletterAction({
  slug,
  token,
  kind,
}: {
  slug: string;
  token: string;
  kind: 'confirm' | 'unsubscribe';
}) {
  const t = useT('newsletterPage');
  const tErr = useT('errors');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function act() {
    setBusy(true);
    setError('');
    try {
      await post(
        kind === 'confirm'
          ? `/api/s/${slug}/newsletter/confirm`
          : `/api/s/${slug}/newsletter/unsubscribe`,
        'POST',
        { token },
      );
      trackEvent(kind === 'confirm' ? 'store_newsletter_confirmed' : 'store_newsletter_left');
      setDone(true);
    } catch (err) {
      setError(errorMessage(err, tErr));
    } finally {
      setBusy(false);
    }
  }

  if (done) return <p className="font-medium">{kind === 'confirm' ? t('confirmed') : t('left')}</p>;
  return (
    <div className="space-y-2">
      <button type="button" className={S.button} disabled={busy} onClick={act}>
        {kind === 'confirm' ? t('confirm') : t('unsubscribe')}
      </button>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
