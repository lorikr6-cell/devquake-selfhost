'use client';

import { useState, type FormEvent } from 'react';
import { AutoCheckbox, Button, Link, useT } from '@devquake/ui';
import {
  CONTACT_EMAIL_MAX,
  CONTACT_EMAIL_PATTERN,
  DEFAULT_CONTACT_EMAIL,
} from '../lib/contact-email';
import {
  HEADER_ALIGN,
  HEADER_FONTS,
  HEADER_FONT_IDS,
  HEADER_TEXT,
  type HeaderAlign,
  type HeaderFont,
  type HeaderLook,
  type HeaderText,
} from '../lib/header-style';
import type { OrgPage } from '../lib/org-page';
import { callApi } from './call-api';
import { PictureUpload } from './picture-upload';
import { OrgHeader } from './org-header';
import { ErrorText, Field, Input, Select, TextArea } from './ui';
import { useAction } from './use-action';

/** Organisers: the logo, the description and whether visitors see the organisation's page. */
export function OrgPageSettings({ page }: { page: OrgPage }) {
  const t = useT();
  const [description, setDescription] = useState(page.description ?? '');
  // Empty = DevQuake's address (shown as the placeholder).
  const [contact, setContact] = useState(page.ownContact ? page.contactEmail : '');
  const { busy, error, act } = useAction();
  const path = `/orgs/${page.id}/page`;

  async function save(e: FormEvent) {
    e.preventDefault();
    await act(() => callApi(path, 'PUT', { description, contactEmail: contact }), {
      success: t('orgPage.saved'),
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-sm font-medium">{t('orgPage.logo')}</p>
        <PictureUpload
          path={`/orgs/${page.id}/logo`}
          hasPicture={Boolean(page.logoVersion)}
          what={t('orgPage.logo')}
        />
      </div>
      <form onSubmit={save} className="space-y-2">
        <Field label={t('fields.description')} hint={t('orgPage.descriptionHint')}>
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={4}
          />
        </Field>
        <Field label={t('fields.contactEmail')} hint={t('orgPage.contactHint')}>
          <Input
            type="email"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={DEFAULT_CONTACT_EMAIL}
            pattern={CONTACT_EMAIL_PATTERN}
            maxLength={CONTACT_EMAIL_MAX}
            autoComplete="email"
          />
        </Field>
        <div className="flex items-center gap-3">
          <Button type="submit" variant="secondary" disabled={busy}>
            {t('person.save')}
          </Button>
          <ErrorText>{error}</ErrorText>
        </div>
      </form>
      <AutoCheckbox
        checked={page.publicPage}
        label={t('orgPage.public')}
        hint={t('orgPage.publicHint')}
        messages={{
          on: t('orgPage.publicOn'),
          off: t('orgPage.publicOff'),
          failed: t('orgPage.publicFailed'),
        }}
        onSave={async (on) => {
          await callApi(path, 'PUT', { publicPage: on });
        }}
      />
      <Link href={`/o/${page.id}`} className="inline-block text-sm underline hover:text-quake">
        {t('orgPage.view')}
      </Link>
    </div>
  );
}

/**
 * Organisers: how the header looks (font, background colour, text colour, alignment, a
 * background picture), with a live preview. The same header tops the screen and every printout.
 */
export function HeaderLookSettings({ page }: { page: OrgPage }) {
  const t = useT();
  const [font, setFont] = useState<HeaderFont>(page.look.font);
  const [useBg, setUseBg] = useState(page.look.bg !== null);
  const [bg, setBg] = useState(page.look.bg ?? '#1f6feb');
  const [text, setText] = useState<HeaderText>(page.look.text);
  const [align, setAlign] = useState<HeaderAlign>(page.look.align);
  const { busy, error, act } = useAction();
  const look: HeaderLook = { ...page.look, font, bg: useBg ? bg : null, text, align };

  async function save(e: FormEvent) {
    e.preventDefault();
    await act(
      () => callApi(`/orgs/${page.id}/header`, 'PUT', { font, bg: useBg ? bg : null, text, align }),
      { success: t('orgHeader.saved') },
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">{t('orgHeader.title')}</p>
        <p className="text-xs text-ink/60 dark:text-paper/60">{t('orgHeader.intro')}</p>
      </div>
      <OrgHeader
        page={{ ...page, look }}
        logoUrl={`/api/orgs/${page.id}/logo`}
        imageUrl={`/api/orgs/${page.id}/header-image`}
      />
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        <Field label={t('orgHeader.font')}>
          <Select value={font} onChange={(e) => setFont(e.target.value as HeaderFont)}>
            {HEADER_FONT_IDS.map((f) => (
              <option key={f} value={f} style={{ fontFamily: HEADER_FONTS[f] }}>
                {t(`orgHeader.fonts.${f}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('orgHeader.text')}>
          <Select value={text} onChange={(e) => setText(e.target.value as HeaderText)}>
            {HEADER_TEXT.map((v) => (
              <option key={v} value={v}>
                {t(`orgHeader.texts.${v}`)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="text-sm">
          <label className="flex items-center gap-2 font-medium">
            <input type="checkbox" checked={useBg} onChange={(e) => setUseBg(e.target.checked)} />
            {t('orgHeader.background')}
          </label>
          {useBg ? (
            <input
              type="color"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              aria-label={t('orgHeader.background')}
              className="mt-1 h-9 w-20 cursor-pointer rounded border border-ink/15 dark:border-paper/20"
            />
          ) : null}
        </div>
        <Field label={t('orgHeader.align')}>
          <Select value={align} onChange={(e) => setAlign(e.target.value as HeaderAlign)}>
            {HEADER_ALIGN.map((v) => (
              <option key={v} value={v}>
                {t(`orgHeader.aligns.${v}`)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-center gap-3 sm:col-span-2">
          <Button type="submit" variant="secondary" disabled={busy}>
            {t('person.save')}
          </Button>
          <ErrorText>{error}</ErrorText>
        </div>
      </form>
      <div>
        <p className="mb-1 text-sm font-medium">{t('orgHeader.picture')}</p>
        <p className="mb-2 text-xs text-ink/60 dark:text-paper/60">{t('orgHeader.pictureHint')}</p>
        <PictureUpload
          path={`/orgs/${page.id}/header-image`}
          hasPicture={Boolean(page.look.imageVersion)}
          what={t('orgHeader.picture')}
        />
      </div>
    </div>
  );
}
