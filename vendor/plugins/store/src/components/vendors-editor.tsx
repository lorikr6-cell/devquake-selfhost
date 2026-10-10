'use client';

import { useId, useState } from 'react';
import { Button, Link, Sheet, useT } from '@devquake/ui';
import type { Vendor } from '../lib/catalog-data';
import { callApi } from './call-api';
import { ErrorText, Field, Input, TextArea } from './ui';
import { useAction } from './use-action';

type Draft = Omit<Vendor, 'id' | 'products'> & { id: number | null };

const empty = (): Draft => ({
  id: null,
  name: '',
  contactName: '',
  email: '',
  phone: '',
  website: '',
  notes: '',
  isBrand: true,
});

/** The store's vendors: a list with their products, and a dialog to add or change one. */
export function VendorsEditor({ vendors }: { vendors: Vendor[] }) {
  const t = useT('vendors');
  const { busy, error, setError, act, confirm } = useAction();
  const [draft, setDraft] = useState<Draft | null>(null);
  const heading = useId();
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  async function save() {
    if (!draft) return;
    const { id, ...body } = draft;
    const ok = await act(
      () =>
        id === null ? callApi('/vendors', 'POST', body) : callApi(`/vendors/${id}`, 'PUT', body),
      { success: id === null ? t('created') : t('saved') },
    );
    if (ok) setDraft(null);
  }

  async function remove(v: Vendor) {
    const ok = await confirm({
      title: t('deleteTitle', { name: v.name }),
      body: t('deleteBody', { count: v.products }),
      confirmLabel: t('delete'),
      danger: true,
    });
    if (ok) await act(() => callApi(`/vendors/${v.id}`, 'DELETE'), { success: t('deleted') });
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        onClick={() => {
          setError('');
          setDraft(empty());
        }}
      >
        {t('new')}
      </Button>
      {vendors.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('empty')}</p>
      ) : (
        <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
          {vendors.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {v.name}
                  {v.isBrand ? (
                    <span className="ml-2 rounded-full bg-ink/5 px-2 py-0.5 text-xs dark:bg-paper/10">
                      {t('brand')}
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-ink/60 dark:text-paper/60">
                  {[v.contactName, v.email, v.phone].filter(Boolean).join(' · ') || t('noContact')}
                </p>
              </div>
              <Link
                href={`/products?vendor=${v.id}`}
                className="text-sm underline hover:text-quake"
              >
                {t('products', { count: v.products })}
              </Link>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setError('');
                  setDraft({
                    id: v.id,
                    name: v.name,
                    contactName: v.contactName ?? '',
                    email: v.email ?? '',
                    phone: v.phone ?? '',
                    website: v.website ?? '',
                    notes: v.notes ?? '',
                    isBrand: v.isBrand,
                  });
                }}
              >
                {t('edit')}
              </Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={() => remove(v)}>
                {t('delete')}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Sheet
        open={draft !== null}
        onClose={() => setDraft(null)}
        labelledBy={heading}
        header={
          <h2 id={heading} className="font-display text-lg font-semibold">
            {draft?.id === null ? t('new') : t('editTitle')}
          </h2>
        }
        footer={
          <div className="flex gap-2">
            <Button type="button" disabled={busy} onClick={save}>
              {t('save')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
              {t('cancel')}
            </Button>
          </div>
        }
        bodyClassName="space-y-3"
      >
        {draft ? (
          <>
            <Field label={t('name')}>
              <Input
                value={draft.name}
                onChange={(e) => set('name', e.target.value)}
                maxLength={80}
                required
              />
            </Field>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.isBrand}
                onChange={(e) => set('isBrand', e.target.checked)}
                className="mt-1 accent-quake"
              />
              <span>
                <span className="font-medium">{t('isBrand')}</span>
                <span className="block text-xs text-ink/60 dark:text-paper/60">
                  {t('isBrandHint')}
                </span>
              </span>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('contactName')}>
                <Input
                  value={draft.contactName ?? ''}
                  onChange={(e) => set('contactName', e.target.value)}
                  maxLength={80}
                />
              </Field>
              <Field label={t('email')}>
                <Input
                  type="email"
                  value={draft.email ?? ''}
                  onChange={(e) => set('email', e.target.value)}
                  maxLength={160}
                />
              </Field>
              <Field label={t('phone')}>
                <Input
                  type="tel"
                  value={draft.phone ?? ''}
                  onChange={(e) => set('phone', e.target.value)}
                  maxLength={40}
                />
              </Field>
              <Field label={t('website')}>
                <Input
                  type="url"
                  value={draft.website ?? ''}
                  onChange={(e) => set('website', e.target.value)}
                  maxLength={300}
                  placeholder="https://"
                />
              </Field>
            </div>
            <Field label={t('notes')} hint={t('notesHint')}>
              <TextArea
                value={draft.notes ?? ''}
                onChange={(e) => set('notes', e.target.value)}
                maxLength={2000}
                rows={3}
              />
            </Field>
            <ErrorText>{error}</ErrorText>
          </>
        ) : null}
      </Sheet>
    </div>
  );
}
