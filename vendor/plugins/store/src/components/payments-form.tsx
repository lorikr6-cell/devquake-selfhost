'use client';

import { useState, type ReactNode } from 'react';
import { Button, rich, useT } from '@devquake/ui';
import { centsToText } from '../lib/pricing';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Panel } from './ui';
import { useAction } from './use-action';

export interface PaymentsValue {
  cod: { enabled: boolean; feeCents: number };
  bank: { enabled: boolean; holder: string | null; iban: string | null; bankName: string | null };
  stripe: { enabled: boolean; hasSecret: boolean; hasWebhook: boolean };
  paypal: { enabled: boolean; live: boolean; clientId: string | null; hasSecret: boolean };
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (on: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-quake"
      />
      {label}
    </label>
  );
}

/**
 * A secret the server keeps encrypted and never sends back: empty keeps the saved one, a new
 * value replaces it, "remove" deletes it.
 */
function SecretField({
  label,
  hint,
  saved,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: ReactNode;
  saved: boolean;
  /** undefined: keep; '': remove; text: replace. */
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  placeholder: string;
}) {
  const t = useT('payments');
  const removing = value === '' && saved;
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={value ?? ''}
          placeholder={saved && !removing ? '••••••••' : placeholder}
          onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value)}
          className="min-w-0 flex-1 font-mono"
        />
        {saved ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange(removing ? undefined : '')}
            aria-pressed={removing}
          >
            {removing ? `✓ ${t('removeSecret')}` : t('removeSecret')}
          </Button>
        ) : null}
      </div>
      {saved && !removing ? (
        <span className="mt-1 block text-xs text-green-700 dark:text-green-400">{t('stored')}</span>
      ) : null}
    </Field>
  );
}

export function PaymentsForm({
  value,
  webhookUrl,
  canKeepSecrets,
}: {
  value: PaymentsValue;
  webhookUrl: string;
  canKeepSecrets: boolean;
}) {
  const t = useT('payments');
  const { busy, error, act } = useAction();
  const [cod, setCod] = useState({
    enabled: value.cod.enabled,
    fee: centsToText(value.cod.feeCents),
  });
  const [bank, setBank] = useState({
    enabled: value.bank.enabled,
    holder: value.bank.holder ?? '',
    iban: value.bank.iban ?? '',
    bankName: value.bank.bankName ?? '',
  });
  const [stripe, setStripe] = useState<{ enabled: boolean; secret?: string; webhook?: string }>({
    enabled: value.stripe.enabled,
  });
  const [paypal, setPaypal] = useState<{
    enabled: boolean;
    live: boolean;
    clientId: string;
    secret?: string;
  }>({
    enabled: value.paypal.enabled,
    live: value.paypal.live,
    clientId: value.paypal.clientId ?? '',
  });

  function save() {
    act(
      async () => {
        await callApi('/store/payments', 'PUT', { cod, bank, stripe, paypal });
        // Typed secrets are saved; the fields go back to "saved, hidden".
        setStripe((s) => ({ enabled: s.enabled }));
        setPaypal((p) => ({ enabled: p.enabled, live: p.live, clientId: p.clientId }));
      },
      { success: t('saved') },
    );
  }

  // Whether a secret is there after saving: typed now, or saved and not being removed.
  const willHave = (typed: string | undefined, saved: boolean) =>
    typed === undefined ? saved : typed !== '';
  const stripeIncomplete =
    stripe.enabled &&
    !(
      willHave(stripe.secret, value.stripe.hasSecret) &&
      willHave(stripe.webhook, value.stripe.hasWebhook)
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-4"
    >
      {!canKeepSecrets ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          {t('noMasterKey')}
        </p>
      ) : null}

      <Panel className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t('stripe.title')}</h2>
        <p className="text-sm text-ink/70 dark:text-paper/70">{t('stripe.hint')}</p>
        <Toggle
          checked={stripe.enabled}
          onChange={(on) => setStripe((s) => ({ ...s, enabled: on }))}
          label={t('stripe.enabled')}
        />
        {stripe.enabled ? (
          <div className="space-y-3">
            <SecretField
              label={t('stripe.secret')}
              hint={t('stripe.secretHint')}
              saved={value.stripe.hasSecret}
              value={stripe.secret}
              onChange={(secret) => setStripe((s) => ({ ...s, secret }))}
              placeholder="sk_live_…"
            />
            <SecretField
              label={t('stripe.webhook')}
              hint={rich(t('stripe.webhookHint'), {
                url: <code className="break-all select-all">{webhookUrl}</code>,
              })}
              saved={value.stripe.hasWebhook}
              value={stripe.webhook}
              onChange={(webhook) => setStripe((s) => ({ ...s, webhook }))}
              placeholder="whsec_…"
            />
            {stripeIncomplete ? <p className="text-xs text-quake">{t('notReady')}</p> : null}
          </div>
        ) : null}
      </Panel>

      <Panel className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t('paypal.title')}</h2>
        <p className="text-sm text-ink/70 dark:text-paper/70">{t('paypal.hint')}</p>
        <Toggle
          checked={paypal.enabled}
          onChange={(on) => setPaypal((p) => ({ ...p, enabled: on }))}
          label={t('paypal.enabled')}
        />
        {paypal.enabled ? (
          <div className="space-y-3">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={paypal.live}
                onChange={(e) => setPaypal((p) => ({ ...p, live: e.target.checked }))}
                className="mt-1 accent-quake"
              />
              <span>
                <span className="font-medium">{t('paypal.live')}</span>
                <span className="block text-xs text-ink/60 dark:text-paper/60">
                  {t('paypal.liveHint')}
                </span>
              </span>
            </label>
            <Field label={t('paypal.clientId')} hint={t('paypal.secretHint')}>
              <Input
                value={paypal.clientId}
                onChange={(e) => setPaypal((p) => ({ ...p, clientId: e.target.value }))}
                maxLength={120}
                spellCheck={false}
                className="font-mono"
              />
            </Field>
            <SecretField
              label={t('paypal.secret')}
              saved={value.paypal.hasSecret}
              value={paypal.secret}
              onChange={(secret) => setPaypal((p) => ({ ...p, secret }))}
              placeholder="E…"
            />
          </div>
        ) : null}
      </Panel>

      <Panel className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t('bank.title')}</h2>
        <p className="text-sm text-ink/70 dark:text-paper/70">{t('bank.hint')}</p>
        <Toggle
          checked={bank.enabled}
          onChange={(on) => setBank((b) => ({ ...b, enabled: on }))}
          label={t('bank.enabled')}
        />
        {bank.enabled ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('bank.holder')}>
              <Input
                value={bank.holder}
                onChange={(e) => setBank((b) => ({ ...b, holder: e.target.value }))}
                maxLength={120}
                required
              />
            </Field>
            <Field label={t('bank.iban')}>
              <Input
                value={bank.iban}
                onChange={(e) => setBank((b) => ({ ...b, iban: e.target.value }))}
                maxLength={50}
                spellCheck={false}
                className="font-mono"
                required
              />
            </Field>
            <Field label={t('bank.bankName')}>
              <Input
                value={bank.bankName}
                onChange={(e) => setBank((b) => ({ ...b, bankName: e.target.value }))}
                maxLength={80}
              />
            </Field>
          </div>
        ) : null}
      </Panel>

      <Panel className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t('cod.title')}</h2>
        <p className="text-sm text-ink/70 dark:text-paper/70">{t('cod.hint')}</p>
        <Toggle
          checked={cod.enabled}
          onChange={(on) => setCod((c) => ({ ...c, enabled: on }))}
          label={t('cod.enabled')}
        />
        {cod.enabled ? (
          <Field label={t('cod.fee')} className="max-w-xs">
            <Input
              inputMode="decimal"
              value={cod.fee}
              onChange={(e) => setCod((c) => ({ ...c, fee: e.target.value }))}
              pattern="\d+([.,]\d{1,2})?"
            />
          </Field>
        ) : null}
      </Panel>

      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy}>
        {t('save')}
      </Button>
    </form>
  );
}
