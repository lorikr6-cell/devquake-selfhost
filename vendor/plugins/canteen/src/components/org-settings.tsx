'use client';

import { useState, type FormEvent } from 'react';
import { AutoCheckbox, Button, Link, useT } from '@devquake/ui';
import type { OrgPage } from '../lib/org-page';
import { callApi } from './call-api';
import { PictureUpload } from './picture-upload';
import { ErrorText, Field, TextArea } from './ui';
import { useAction } from './use-action';

/** Organisers: the logo, the description and whether visitors see the organisation's page. */
export function OrgPageSettings({ page }: { page: OrgPage }) {
  const t = useT();
  const [description, setDescription] = useState(page.description ?? '');
  const { busy, error, act } = useAction();
  const path = `/orgs/${page.id}/page`;

  async function save(e: FormEvent) {
    e.preventDefault();
    await act(() => callApi(path, 'PUT', { description }), { success: t('orgPage.saved') });
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
