'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { Button, Link, cn, photoUpload, trackEvent, useT } from '@devquake/ui';
import {
  CARD_STYLES,
  FONT_IDS,
  FONTS,
  GRID_COLUMNS,
  HEADER_STYLES,
  PRESETS,
  PRESET_IDS,
  RADIUS_IDS,
  themeVars,
  themeWarnings,
  type Theme,
} from '../lib/theme';
import { callApi, errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { S, SHOP_ROOT } from './shop-style';
import { Field, Panel, Select } from './ui';
import { useAction } from './use-action';

/** Uploading or removing the logo or the banner (shrunk in the browser first). */
function AssetPicker({
  kind,
  url,
  label,
  hint,
}: {
  kind: 'logo' | 'banner';
  url: string | null;
  label: string;
  hint: string;
}) {
  const t = useT('design');
  const tErr = useT('errors');
  const { toast } = useFeedback();
  const { busy, act, confirm } = useAction();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const body = await photoUpload(file).catch(() => {
        throw new Error(tErr('photoPrepare'));
      });
      const res = await fetch(`/api/store/assets/${kind}`, { method: 'POST', body });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? tErr('photoSave', { status: res.status }));
      }
      trackEvent('store_asset_uploaded', { kind });
      toast(t('uploaded'));
      window.location.reload();
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
    } finally {
      setUploading(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-ink/60 dark:text-paper/60">{hint}</p>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className={cn(
            'rounded-lg border border-ink/10 bg-white object-contain dark:border-paper/10',
            kind === 'logo' ? 'max-h-20 max-w-56 p-2' : 'aspect-[3/1] w-full object-cover',
          )}
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => upload(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={uploading}
          onClick={() => input.current?.click()}
        >
          {uploading ? t('uploading') : url ? t('replace') : t('upload')}
        </Button>
        {url ? (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={async () => {
              const ok = await confirm({
                title: t('removeTitle'),
                body: t('removeBody'),
                confirmLabel: t('remove'),
                danger: true,
              });
              if (ok)
                await act(() => callApi(`/store/assets/${kind}`, 'DELETE'), {
                  success: t('removed'),
                  after: () => window.location.reload(),
                });
            }}
          >
            {t('remove')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded border border-ink/15 dark:border-paper/15"
          aria-label={label}
        />
        <input
          value={value}
          onChange={(e) =>
            /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value.toLowerCase())
          }
          className="w-24 rounded-md border border-ink/15 bg-white px-2 py-2 font-mono text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
          aria-label={label}
          maxLength={7}
        />
      </span>
    </Field>
  );
}

export function DesignEditor({
  storeName,
  tagline,
  shopPath,
  theme,
  logo,
  banner,
}: {
  storeName: string;
  tagline: string | null;
  shopPath: string;
  theme: Theme | null;
  logo: string | null;
  banner: string | null;
}) {
  const t = useT('design');
  const { busy, act } = useAction();
  const [on, setOn] = useState(theme !== null);
  const [v, setV] = useState<Theme>(theme ?? PRESETS.classic!);
  const set = <K extends keyof Theme>(k: K, value: Theme[K]) => setV((x) => ({ ...x, [k]: value }));
  const complete =
    /^#[0-9a-f]{6}$/.test(v.accent) &&
    /^#[0-9a-f]{6}$/.test(v.background) &&
    /^#[0-9a-f]{6}$/.test(v.text);
  const warnings = complete ? themeWarnings(v) : [];
  const preview = on && complete ? (themeVars(v) as CSSProperties) : undefined;

  return (
    <div className="space-y-6">
      <Panel className="grid gap-6 md:grid-cols-2">
        <AssetPicker kind="logo" url={logo} label={t('logo')} hint={t('logoHint')} />
        <AssetPicker kind="banner" url={banner} label={t('banner')} hint={t('bannerHint')} />
      </Panel>

      <Panel className="space-y-4">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={on}
            onChange={(e) => setOn(e.target.checked)}
            className="mt-1 accent-quake"
          />
          <span>
            <span className="font-medium">{t('useOwn')}</span>
            <span className="block text-xs text-ink/60 dark:text-paper/60">{t('useOwnHint')}</span>
          </span>
        </label>

        {on ? (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('presets')}</p>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {PRESET_IDS.map((id) => {
                  const p = PRESETS[id]!;
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => setV(p)}
                        className="w-full overflow-hidden rounded-lg border border-ink/15 text-left text-xs hover:border-quake dark:border-paper/15"
                      >
                        <span
                          className="flex h-10 items-center gap-1 px-2"
                          style={{ background: p.background, color: p.text }}
                        >
                          <span className="size-4 rounded-full" style={{ background: p.accent }} />
                          <span style={{ fontFamily: FONTS[p.headingFont] }}>Aa</span>
                        </span>
                        <span className="block px-2 py-1">{t(`preset.${id}`)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <ColorField label={t('accent')} value={v.accent} onChange={(x) => set('accent', x)} />
              <ColorField
                label={t('background')}
                value={v.background}
                onChange={(x) => set('background', x)}
              />
              <ColorField label={t('text')} value={v.text} onChange={(x) => set('text', x)} />
            </div>
            {warnings.length > 0 ? (
              <ul className="space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                {warnings.map((w) => (
                  <li key={w}>⚠ {t(`warn.${w}`)}</li>
                ))}
              </ul>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={t('font')}>
                <Select
                  value={v.font}
                  onChange={(e) => set('font', e.target.value as Theme['font'])}
                >
                  {FONT_IDS.map((f) => (
                    <option key={f} value={f}>
                      {t(`fonts.${f}`)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('headingFont')}>
                <Select
                  value={v.headingFont}
                  onChange={(e) => set('headingFont', e.target.value as Theme['font'])}
                >
                  {FONT_IDS.map((f) => (
                    <option key={f} value={f}>
                      {t(`fonts.${f}`)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('radius')}>
                <Select
                  value={v.radius}
                  onChange={(e) => set('radius', e.target.value as Theme['radius'])}
                >
                  {RADIUS_IDS.map((r) => (
                    <option key={r} value={r}>
                      {t(`radii.${r}`)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('cards')}>
                <Select
                  value={v.cards}
                  onChange={(e) => set('cards', e.target.value as Theme['cards'])}
                >
                  {CARD_STYLES.map((c) => (
                    <option key={c} value={c}>
                      {t(`cardStyles.${c}`)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('header')}>
                <Select
                  value={v.header}
                  onChange={(e) => set('header', e.target.value as Theme['header'])}
                >
                  {HEADER_STYLES.map((h) => (
                    <option key={h} value={h}>
                      {t(`headers.${h}`)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('columns')}>
                <Select
                  value={String(v.columns)}
                  onChange={(e) => set('columns', Number(e.target.value) as Theme['columns'])}
                >
                  {GRID_COLUMNS.map((c) => (
                    <option key={c} value={c}>
                      {t('columnCount', { count: c })}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={busy || (on && !complete)}
            onClick={() =>
              act(() => callApi('/store/theme', 'PUT', { theme: on ? v : null }), {
                success: t('saved'),
              })
            }
          >
            {t('save')}
          </Button>
          <Link
            href={shopPath}
            className="inline-flex min-h-11 items-center px-3 text-sm underline hover:text-quake"
          >
            {t('open')}
          </Link>
        </div>
      </Panel>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold">{t('preview')}</h2>
        <div
          style={preview ? { ...preview, background: v.background, color: v.text } : undefined}
          className={cn(
            SHOP_ROOT,
            'space-y-4 rounded-xl border border-ink/10 p-5 dark:border-paper/10',
          )}
        >
          <div
            className={cn(
              'flex flex-wrap items-end justify-between gap-3 border-b pb-3',
              S.line,
              on && v.header === 'center' && 'flex-col items-center text-center',
            )}
          >
            <div>
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="max-h-10 max-w-40 object-contain" />
              ) : (
                <p className={cn('text-2xl font-bold', S.heading)}>{storeName}</p>
              )}
              {tagline ? <p className={cn('text-sm', S.muted)}>{tagline}</p> : null}
            </div>
            <span className={S.buttonSecondary}>{t('sampleCart')}</span>
          </div>
          <div className={cn('grid gap-3', on && v.columns === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
            {[1, 2, 3].slice(0, on && v.columns === 2 ? 2 : 3).map((n) => (
              <div key={n} className={S.card}>
                <div className="aspect-square [background-color:color-mix(in_srgb,var(--shop-accent)_18%,transparent)]" />
                <div className="space-y-1 p-3">
                  <p className="text-sm font-medium">{t('sampleProduct', { n })}</p>
                  <p className={cn('text-sm font-semibold', n === 2 && S.accent)}>
                    {n === 2 ? '€19.90' : '€24.90'}
                    {n === 2 ? (
                      <s className={cn('ml-2 text-xs font-normal', S.muted)}>€24.90</s>
                    ) : null}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <span className={S.button}>{t('sampleButton')}</span>
        </div>
      </section>
    </div>
  );
}
