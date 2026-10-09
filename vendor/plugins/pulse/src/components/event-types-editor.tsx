'use client';

import { useState } from 'react';
import { buttonClass, useT } from '@devquake/ui';
import { FIELD_TYPES, type EventType, type FieldType } from '../lib/envelope';
import { callApi } from './call-api';
import { useAction } from './use-action';
import { ErrorText, Input, fieldClass } from './ui';

/**
 * The member's own key:value structures: per event name, which keys `data` has, of which type,
 * and which are required. Saved all at once.
 */
export function EventTypesEditor({
  appId,
  initial,
  max,
}: {
  appId: number;
  initial: EventType[];
  max: number;
}) {
  const t = useT('types');
  const { busy, error, act } = useAction();
  const [types, setTypes] = useState<EventType[]>(initial);
  const [saved, setSaved] = useState(false);

  const change = (next: EventType[]) => {
    setTypes(next);
    setSaved(false);
  };
  const setType = (i: number, patch: Partial<EventType>) =>
    change(types.map((ty, j) => (j === i ? { ...ty, ...patch } : ty)));

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
      {types.length === 0 ? <p className="text-sm">{t('empty')}</p> : null}
      {types.map((type, i) => (
        <fieldset
          key={i}
          className="space-y-2 rounded-lg border border-ink/10 p-3 dark:border-paper/10"
        >
          <legend className="sr-only">{type.name || t('name')}</legend>
          <div className="flex flex-wrap items-end gap-2">
            <label className="block min-w-48 flex-1 text-sm">
              <span className="mb-1 block font-medium">{t('name')}</span>
              <Input
                value={type.name}
                placeholder="order.created"
                maxLength={64}
                onChange={(e) => setType(i, { name: e.target.value })}
              />
            </label>
            <button
              type="button"
              className="min-h-11 text-sm underline hover:text-quake"
              onClick={() => change(types.filter((_, j) => j !== i))}
            >
              {t('remove')}
            </button>
          </div>
          <p className="text-sm font-medium">{t('fields')}</p>
          {type.fields.map((f, k) => (
            <div key={k} className="flex flex-wrap items-center gap-2">
              <Input
                aria-label={t('key')}
                className="w-40 flex-1"
                value={f.key}
                placeholder="orderId"
                maxLength={40}
                onChange={(e) =>
                  setType(i, {
                    fields: type.fields.map((x, m) =>
                      m === k ? { ...x, key: e.target.value } : x,
                    ),
                  })
                }
              />
              <select
                aria-label={t('type')}
                className={`${fieldClass} w-auto`}
                value={f.type}
                onChange={(e) =>
                  setType(i, {
                    fields: type.fields.map((x, m) =>
                      m === k ? { ...x, type: e.target.value as FieldType } : x,
                    ),
                  })
                }
              >
                {FIELD_TYPES.map((ft) => (
                  <option key={ft} value={ft}>
                    {t(`typeNames.${ft}`)}
                  </option>
                ))}
              </select>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-5 accent-quake"
                  checked={f.required}
                  onChange={(e) =>
                    setType(i, {
                      fields: type.fields.map((x, m) =>
                        m === k ? { ...x, required: e.target.checked } : x,
                      ),
                    })
                  }
                />
                {t('required')}
              </label>
              <button
                type="button"
                aria-label={t('removeField')}
                title={t('removeField')}
                className="min-h-11 px-2 text-lg hover:text-quake"
                onClick={() => setType(i, { fields: type.fields.filter((_, m) => m !== k) })}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-medium text-quake underline"
            onClick={() =>
              setType(i, { fields: [...type.fields, { key: '', type: 'string', required: false }] })
            }
          >
            {t('addField')}
          </button>
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        {types.length < max ? (
          <button
            type="button"
            className={buttonClass('secondary', 'min-h-11')}
            onClick={() =>
              change([
                ...types,
                { name: '', fields: [{ key: '', type: 'string', required: true }] },
              ])
            }
          >
            {t('add')}
          </button>
        ) : (
          <span className="text-sm">{t('atLimit', { count: max })}</span>
        )}
        <button
          type="button"
          disabled={busy}
          className={buttonClass('primary', 'min-h-11')}
          onClick={() =>
            void act(async () => {
              await callApi(`/apps/${appId}/event-types`, 'PUT', { types });
              setSaved(true);
            })
          }
        >
          {t('save')}
        </button>
        {saved ? <span className="text-sm">✓ {t('saved')}</span> : null}
      </div>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
