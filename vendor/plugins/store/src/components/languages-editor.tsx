'use client';

import { useState } from 'react';
import { Button, LOCALES, LOCALE_NAMES, isLocale, trackEvent, useT } from '@devquake/ui';
import { callApi, errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { ErrorText, Field, Input, Panel, Select, TextArea } from './ui';
import { useAction } from './use-action';

interface Language {
  code: string;
  name: string;
  labels: number;
  updated: string;
}

/**
 * Copying the shop's labels, pasting a translation back (a new language or changes to a
 * built-in one), the list of the shop's languages, and the language buyers see first.
 */
export function LanguagesEditor({
  languages,
  defaultLanguage,
  total,
}: {
  languages: Language[];
  defaultLanguage: string | null;
  /** Labels in the export, to show how complete each language is. */
  total: number;
}) {
  const t = useT('languages');
  const tErr = useT('errors');
  const { toast } = useFeedback();
  const { busy, error, act, confirm } = useAction();
  const [base, setBase] = useState<string>('en');
  const [exported, setExported] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', text: '' });
  const [report, setReport] = useState<{
    applied: number;
    missing: number;
    rejected: string[];
    rejectedCount: number;
  } | null>(null);
  const overrides = isLocale(form.code);

  /** Fetches labels into the copy box or (to change a saved language) the paste box. */
  async function load(path: string, into: (text: string) => void = setExported) {
    setLoading(true);
    try {
      const res = await fetch(`/api${path}`, { cache: 'no-store' });
      if (!res.ok) throw Object.assign(new Error(''), { status: res.status });
      into(await res.text());
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard?.writeText(exported).catch(() => undefined);
    trackEvent('store_labels_copied');
    toast(t('copied'));
  }

  return (
    <div className="space-y-6">
      <Panel className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t('step1')}</h2>
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('step1Hint')}</p>
        <div className="flex flex-wrap items-end gap-2">
          <Field label={t('base')} className="w-48">
            <Select value={base} onChange={(e) => setBase(e.target.value)}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_NAMES[l]}
                </option>
              ))}
            </Select>
          </Field>
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={() => load(`/store/languages?base=${base}`)}
          >
            {t('show')}
          </Button>
          <a
            href={`/api/store/languages?base=${base}`}
            download
            className="inline-flex min-h-11 items-center px-2 text-sm underline hover:text-quake"
          >
            {t('download')}
          </a>
        </div>
        {exported ? (
          <>
            <TextArea
              readOnly
              value={exported}
              rows={10}
              className="font-mono text-xs"
              aria-label={t('labels')}
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button type="button" onClick={copy}>
              {t('copy')}
            </Button>
          </>
        ) : null}
        <p className="rounded-lg bg-ink/5 p-3 text-xs dark:bg-paper/5">{t('translatorTip')}</p>
      </Panel>

      <Panel className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t('step2')}</h2>
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('step2Hint')}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('code')} hint={t('codeHint')}>
            <Input
              value={form.code}
              onChange={(e) => {
                const code = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z]/g, '')
                  .slice(0, 3);
                setForm({
                  ...form,
                  code,
                  name: isLocale(code) && !form.name ? LOCALE_NAMES[code] : form.name,
                });
              }}
              placeholder="fr"
              required
            />
          </Field>
          <Field label={t('name')} hint={t('nameHint')}>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={40}
              placeholder="Français"
              required
            />
          </Field>
        </div>
        {overrides ? (
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {t('overrides', { language: LOCALE_NAMES[form.code as (typeof LOCALES)[number]] })}
          </p>
        ) : null}
        <Field label={t('paste')}>
          <TextArea
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            rows={10}
            className="font-mono text-xs"
            spellCheck={false}
            placeholder={'{ "shop": { … } }'}
          />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button
          type="button"
          disabled={busy || !form.code || !form.name || !form.text}
          onClick={() =>
            act(
              async () => {
                const res = await callApi<{
                  applied: number;
                  missing: number;
                  rejected: string[];
                  rejectedCount: number;
                }>('/store/languages', 'POST', { ...form, base });
                setReport(res);
                trackEvent('store_language_saved');
              },
              { success: t('saved') },
            )
          }
        >
          {t('save')}
        </Button>
        {report ? (
          <div className="space-y-1 rounded-lg border border-ink/10 p-3 text-sm dark:border-paper/10">
            <p className="font-medium">
              {t('report', {
                applied: report.applied,
                missing: report.missing,
                rejected: report.rejectedCount,
              })}
            </p>
            {report.rejected.length > 0 ? (
              <>
                <p className="text-xs text-ink/60 dark:text-paper/60">{t('rejectedHint')}</p>
                <p className="font-mono text-xs break-all">{report.rejected.join(', ')}</p>
              </>
            ) : null}
          </div>
        ) : null}
      </Panel>

      <Panel className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t('yours')}</h2>
        {languages.length === 0 ? (
          <p className="text-sm text-ink/60 dark:text-paper/60">{t('empty')}</p>
        ) : (
          <ul className="divide-y divide-ink/10 text-sm dark:divide-paper/10">
            {languages.map((l) => (
              <li key={l.code} className="flex flex-wrap items-center gap-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{l.name}</span>{' '}
                  <span className="font-mono text-xs text-ink/60 dark:text-paper/60">{l.code}</span>
                  <span className="block text-xs text-ink/60 dark:text-paper/60">
                    {isLocale(l.code) ? t('kindChanges') : t('kindNew')} ·{' '}
                    {t('complete', {
                      percent: Math.min(100, Math.round((l.labels / Math.max(1, total)) * 100)),
                    })}{' '}
                    · {l.updated}
                  </span>
                </span>
                <button
                  type="button"
                  className="text-xs underline hover:text-quake"
                  onClick={() => {
                    void load(`/store/languages/${l.code}`, (text) =>
                      setForm({ code: l.code, name: l.name, text }),
                    );
                  }}
                >
                  {t('edit')}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={async () => {
                    const ok = await confirm({
                      title: t('deleteTitle', { name: l.name }),
                      body: t('deleteBody'),
                      confirmLabel: t('delete'),
                      danger: true,
                    });
                    if (ok)
                      await act(() => callApi(`/store/languages/${l.code}`, 'DELETE'), {
                        success: t('deleted'),
                      });
                  }}
                >
                  {t('delete')}
                </Button>
              </li>
            ))}
          </ul>
        )}
        <Field label={t('default')} hint={t('defaultHint')}>
          <Select
            value={defaultLanguage ?? ''}
            disabled={busy}
            onChange={(e) =>
              act(
                () =>
                  callApi('/store/languages', 'PUT', { defaultLanguage: e.target.value || null }),
                {
                  success: t('defaultSaved'),
                },
              )
            }
          >
            <option value="">{t('visitor')}</option>
            {languages
              .filter((l) => !isLocale(l.code))
              .map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
          </Select>
        </Field>
      </Panel>
    </div>
  );
}
