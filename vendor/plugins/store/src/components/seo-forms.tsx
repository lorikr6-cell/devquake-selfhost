'use client';

import { useState } from 'react';
import { Button, useT } from '@devquake/ui';
import { IDEAL, SEO_LIMITS } from '../lib/seo';
import { TRACKING_LIMITS, type Tracking } from '../lib/tracking';
import { callApi } from './call-api';
import { LengthHint, SnippetPreview } from './snippet-preview';
import { ErrorText, Field, Input, TextArea } from './ui';
import { useAction } from './use-action';

/** The shop's own title and description for search engines, with a preview. */
export function SeoForm({
  url,
  value,
  fallback,
}: {
  url: string;
  value: { seoTitle: string; seoDescription: string };
  /** What search engines get when the fields are empty. */
  fallback: { title: string; description: string };
}) {
  const t = useT('seo');
  const { busy, error, act } = useAction();
  const [v, setV] = useState(value);
  const title = v.seoTitle || fallback.title;
  const description = v.seoDescription || fallback.description;
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void act(() => callApi('/store/seo', 'PUT', v), { success: t('saved') });
      }}
    >
      <Field
        label={t('titleField')}
        hint={<LengthHint length={title.length} min={IDEAL.titleMin} max={IDEAL.titleMax} />}
      >
        <Input
          value={v.seoTitle}
          onChange={(e) => setV({ ...v, seoTitle: e.target.value })}
          maxLength={SEO_LIMITS.title}
          placeholder={fallback.title}
        />
      </Field>
      <Field
        label={t('descriptionField')}
        hint={
          <LengthHint
            length={description.length}
            min={IDEAL.descriptionMin}
            max={IDEAL.descriptionMax}
          />
        }
      >
        <TextArea
          value={v.seoDescription}
          onChange={(e) => setV({ ...v, seoDescription: e.target.value })}
          maxLength={SEO_LIMITS.description}
          rows={2}
          placeholder={fallback.description}
        />
      </Field>
      <SnippetPreview url={url} title={title} description={description} />
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy}>
        {t('save')}
      </Button>
    </form>
  );
}

type Text = { [K in keyof Tracking]: string };
const toText = (v: Tracking): Text =>
  Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x ?? ''])) as Text;

/**
 * Tracking tags and verification codes (the owner's alone). IDs are checked; the free
 * snippets run after the buyer agrees to cookies, in <head> or at the end of <body>.
 */
export function TrackingForm({ value }: { value: Tracking }) {
  const t = useT('seo.trackingForm');
  const { busy, error, act } = useAction();
  const [v, setV] = useState(toText(value));
  const set = (k: keyof Text) => (e: { target: { value: string } }) =>
    setV((x) => ({ ...x, [k]: e.target.value }));
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void act(() => callApi('/store/tracking', 'PUT', v), { success: t('saved') });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('ga4')} hint={t('ga4Hint')}>
          <Input value={v.ga4} onChange={set('ga4')} placeholder="G-XXXXXXXXXX" maxLength={20} />
        </Field>
        <Field label={t('googleAds')} hint={t('googleAdsHint')}>
          <Input
            value={v.googleAds}
            onChange={set('googleAds')}
            placeholder="AW-123456789"
            maxLength={20}
          />
        </Field>
        <Field label={t('gtm')} hint={t('gtmHint')}>
          <Input value={v.gtm} onChange={set('gtm')} placeholder="GTM-XXXXXXX" maxLength={20} />
        </Field>
        <Field label={t('metaPixel')} hint={t('metaPixelHint')}>
          <Input
            value={v.metaPixel}
            onChange={set('metaPixel')}
            inputMode="numeric"
            maxLength={20}
          />
        </Field>
        <Field label={t('googleVerification')} hint={t('verificationHint')}>
          <Input
            value={v.googleVerification}
            onChange={set('googleVerification')}
            maxLength={TRACKING_LIMITS.verification * 2}
          />
        </Field>
        <Field label={t('bingVerification')} hint={t('verificationHint')}>
          <Input
            value={v.bingVerification}
            onChange={set('bingVerification')}
            maxLength={TRACKING_LIMITS.verification * 2}
          />
        </Field>
      </div>
      <Field label={t('headSnippet')} hint={t('headSnippetHint')}>
        <TextArea
          value={v.headSnippet}
          onChange={set('headSnippet')}
          maxLength={TRACKING_LIMITS.snippet}
          rows={5}
          className="font-mono text-xs"
          spellCheck={false}
          placeholder={'<script>…</script>'}
        />
      </Field>
      <Field label={t('bodySnippet')} hint={t('bodySnippetHint')}>
        <TextArea
          value={v.bodySnippet}
          onChange={set('bodySnippet')}
          maxLength={TRACKING_LIMITS.snippet}
          rows={4}
          className="font-mono text-xs"
          spellCheck={false}
        />
      </Field>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
        {t('warning')}
      </p>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy}>
        {t('save')}
      </Button>
    </form>
  );
}
