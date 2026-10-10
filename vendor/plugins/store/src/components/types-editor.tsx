'use client';

import { useId, useState } from 'react';
import { Button, Sheet, trackEvent, useT } from '@devquake/ui';
import { FIELD_KINDS, FIELD_LIMITS, type FieldDef, type FieldKind } from '../lib/fields';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Panel, Select, TextArea } from './ui';
import { useAction } from './use-action';

interface TypeValue {
  id: number;
  name: string;
  products: number;
  fields: FieldDef[];
}

interface FieldDraft {
  key: string;
  id: number | null;
  label: string;
  kind: FieldKind;
  unit: string;
  choices: string;
  required: boolean;
  inCompare: boolean;
}

let next = 0;
const draftOf = (f: FieldDef): FieldDraft => ({
  key: `f${f.id}`,
  id: f.id,
  label: f.label,
  kind: f.kind,
  unit: f.unit ?? '',
  choices: f.choices.join('\n'),
  required: f.required,
  inCompare: f.inCompare,
});
const emptyField = (): FieldDraft => ({
  key: `new${next++}`,
  id: null,
  label: '',
  kind: 'text',
  unit: '',
  choices: '',
  required: false,
  inCompare: true,
});

/** The store's product types: make one from a template or from scratch, edit its fields. */
export function TypesEditor({
  types,
  templates,
}: {
  types: TypeValue[];
  templates: Array<{ id: string; icon: string; name: string; fields: number }>;
}) {
  const t = useT('types');
  const tKinds = useT('types.kinds');
  const { busy, error, setError, act, confirm } = useAction();
  const [editing, setEditing] = useState<{
    id: number | null;
    name: string;
    fields: FieldDraft[];
  } | null>(null);
  const heading = useId();

  function open(type: TypeValue | null) {
    setError('');
    setEditing(
      type
        ? { id: type.id, name: type.name, fields: type.fields.map(draftOf) }
        : { id: null, name: '', fields: [emptyField()] },
    );
  }

  const setField = (key: string, change: Partial<FieldDraft>) =>
    setEditing((e) =>
      e ? { ...e, fields: e.fields.map((f) => (f.key === key ? { ...f, ...change } : f)) } : e,
    );

  function move(key: string, by: -1 | 1) {
    setEditing((e) => {
      if (!e) return e;
      const i = e.fields.findIndex((f) => f.key === key);
      const j = i + by;
      if (j < 0 || j >= e.fields.length) return e;
      const fields = [...e.fields];
      [fields[i], fields[j]] = [fields[j]!, fields[i]!];
      return { ...e, fields };
    });
  }

  async function save() {
    if (!editing) return;
    const body = {
      name: editing.name,
      fields: editing.fields.map((f) => ({
        id: f.id,
        label: f.label,
        kind: f.kind,
        unit: f.unit,
        choices: f.choices,
        required: f.required,
        inCompare: f.inCompare,
      })),
    };
    const ok = await act(
      () =>
        editing.id === null
          ? callApi('/types', 'POST', body)
          : callApi(`/types/${editing.id}`, 'PUT', body),
      { success: editing.id === null ? t('created') : t('saved') },
    );
    if (ok) setEditing(null);
  }

  async function remove(type: TypeValue) {
    const ok = await confirm({
      title: t('deleteTitle', { name: type.name }),
      body: t('deleteBody', { count: type.products }),
      confirmLabel: t('delete'),
      danger: true,
    });
    if (ok) await act(() => callApi(`/types/${type.id}`, 'DELETE'), { success: t('deleted') });
  }

  const taken = new Set(types.map((x) => x.name.toLowerCase()));

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">{t('templates')}</h2>
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('templatesHint')}</p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {templates.map((tpl) => (
            <li key={tpl.id}>
              <button
                type="button"
                disabled={busy || taken.has(tpl.name.toLowerCase())}
                onClick={() =>
                  act(
                    async () => {
                      await callApi('/types', 'POST', { template: tpl.id });
                      trackEvent('store_type_template', { template: tpl.id });
                    },
                    { success: t('addedTemplate', { name: tpl.name }) },
                  )
                }
                className="flex h-full w-full items-center gap-3 rounded-xl border border-ink/10 bg-white/70 p-3 text-left text-sm hover:border-quake disabled:opacity-50 dark:border-paper/10 dark:bg-paper/5"
              >
                <span aria-hidden className="text-2xl">
                  {tpl.icon}
                </span>
                <span>
                  <span className="block font-medium">{tpl.name}</span>
                  <span className="block text-xs text-ink/60 dark:text-paper/60">
                    {taken.has(tpl.name.toLowerCase())
                      ? t('templateAdded')
                      : t('fieldCount', { count: tpl.fields })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">{t('yours')}</h2>
          <Button type="button" variant="secondary" onClick={() => open(null)}>
            {t('new')}
          </Button>
        </div>
        {types.length === 0 ? (
          <p className="text-sm text-ink/60 dark:text-paper/60">{t('empty')}</p>
        ) : (
          <ul className="space-y-3">
            {types.map((type) => (
              <li key={type.id}>
                <Panel className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{type.name}</h3>
                      <p className="text-xs text-ink/60 dark:text-paper/60">
                        {t('productCount', { count: type.products })} ·{' '}
                        {t('fieldCount', { count: type.fields.length })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="secondary" onClick={() => open(type)}>
                        {t('edit')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => remove(type)}
                      >
                        {t('delete')}
                      </Button>
                    </div>
                  </div>
                  {type.fields.length > 0 ? (
                    <p className="flex flex-wrap gap-1 text-xs">
                      {type.fields.map((f) => (
                        <span
                          key={f.id}
                          className="rounded-full bg-ink/5 px-2 py-0.5 dark:bg-paper/10"
                        >
                          {f.label}
                          {f.unit ? ` (${f.unit})` : ''} · {tKinds(f.kind)}
                        </span>
                      ))}
                    </p>
                  ) : null}
                </Panel>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        labelledBy={heading}
        className="sm:max-w-2xl"
        header={
          <h2 id={heading} className="font-display text-lg font-semibold">
            {editing?.id === null ? t('new') : t('editTitle', { name: editing?.name ?? '' })}
          </h2>
        }
        footer={
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy} onClick={save}>
              {t('save')}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              {t('cancel')}
            </Button>
          </div>
        }
        bodyClassName="space-y-4"
      >
        {editing ? (
          <>
            <Field label={t('name')}>
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                maxLength={FIELD_LIMITS.typeName}
                required
              />
            </Field>
            <ol className="space-y-3">
              {editing.fields.map((f, i) => (
                <li
                  key={f.key}
                  className="space-y-2 rounded-lg border border-ink/10 p-3 dark:border-paper/10"
                >
                  <div className="grid gap-2 sm:grid-cols-[1fr_10rem_6rem]">
                    <Field label={t('fieldLabel')}>
                      <Input
                        value={f.label}
                        onChange={(e) => setField(f.key, { label: e.target.value })}
                        maxLength={FIELD_LIMITS.label}
                        required
                      />
                    </Field>
                    <Field label={t('fieldKind')}>
                      <Select
                        value={f.kind}
                        onChange={(e) => setField(f.key, { kind: e.target.value as FieldKind })}
                      >
                        {FIELD_KINDS.map((k) => (
                          <option key={k} value={k}>
                            {tKinds(k)}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    {f.kind === 'number' || f.kind === 'text' ? (
                      <Field label={t('unit')}>
                        <Input
                          value={f.unit}
                          onChange={(e) => setField(f.key, { unit: e.target.value })}
                          maxLength={FIELD_LIMITS.unit}
                          placeholder="cm"
                        />
                      </Field>
                    ) : (
                      <span />
                    )}
                  </div>
                  {f.kind === 'select' || f.kind === 'multiselect' ? (
                    <Field label={t('choices')} hint={t('choicesHint')}>
                      <TextArea
                        value={f.choices}
                        onChange={(e) => setField(f.key, { choices: e.target.value })}
                        rows={3}
                      />
                    </Field>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={f.required}
                        onChange={(e) => setField(f.key, { required: e.target.checked })}
                        className="accent-quake"
                      />
                      {t('required')}
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={f.inCompare}
                        onChange={(e) => setField(f.key, { inCompare: e.target.checked })}
                        className="accent-quake"
                      />
                      {t('inCompare')}
                    </label>
                    <span className="ml-auto flex gap-1">
                      <button
                        type="button"
                        className="rounded px-2 py-1 hover:bg-ink/5 disabled:opacity-30 dark:hover:bg-paper/10"
                        disabled={i === 0}
                        onClick={() => move(f.key, -1)}
                        aria-label={t('moveUp')}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="rounded px-2 py-1 hover:bg-ink/5 disabled:opacity-30 dark:hover:bg-paper/10"
                        disabled={i === editing.fields.length - 1}
                        onClick={() => move(f.key, 1)}
                        aria-label={t('moveDown')}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="rounded px-2 py-1 text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            fields: editing.fields.filter((x) => x.key !== f.key),
                          })
                        }
                      >
                        {t('removeField')}
                      </button>
                    </span>
                  </div>
                </li>
              ))}
            </ol>
            <Button
              type="button"
              variant="secondary"
              disabled={editing.fields.length >= FIELD_LIMITS.fieldsPerType}
              onClick={() => setEditing({ ...editing, fields: [...editing.fields, emptyField()] })}
            >
              {t('addField')}
            </Button>
            {editing.id !== null ? (
              <p className="text-xs text-ink/60 dark:text-paper/60">{t('removeHint')}</p>
            ) : null}
            <ErrorText>{error}</ErrorText>
          </>
        ) : null}
      </Sheet>
    </div>
  );
}
