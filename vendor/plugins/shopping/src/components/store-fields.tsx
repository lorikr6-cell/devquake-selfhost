'use client';

import { useId } from 'react';
import { useT } from '@devquake/ui';
import { KNOWN_STORES, guessStoreType, storeType, storeTypesByCategory } from '../lib/store-types';
import { Field, Input, Select } from './ui';

export interface StoreDraft {
  name: string;
  type: string;
  location: string;
  description: string;
  /** Set once the user picks a type by hand, so typing the name no longer overrides it. */
  typeTouched: boolean;
}

export const emptyStore: StoreDraft = {
  name: '',
  type: 'other',
  location: '',
  description: '',
  typeTouched: false,
};

const TYPE_GROUPS = storeTypesByCategory();

/**
 * Store name (with suggestions of well-known chains), type, location and description. The type
 * is filled in automatically from the name (Kaufland → grocery, Dedeman → hardware and DIY)
 * until the user chooses one.
 */
export function StoreFields({
  value,
  onChange,
}: {
  value: StoreDraft;
  onChange: (next: StoreDraft) => void;
}) {
  const t = useT('storeFields');
  const tRoot = useT();
  const listId = useId();
  const type = storeType(value.type);

  function setName(name: string) {
    const guess = value.typeTouched ? null : guessStoreType(name);
    onChange({ ...value, name, type: value.typeTouched ? value.type : (guess ?? 'other') });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={t('store')}>
        <Input
          required
          maxLength={80}
          list={listId}
          value={value.name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Kaufland"
        />
        <datalist id={listId}>
          {KNOWN_STORES.map((s) => (
            <option key={s.name} value={s.name} />
          ))}
        </datalist>
      </Field>
      <Field label={t('type')} hint={tRoot(`storeTypes.${type.code}.description`)}>
        <Select
          value={value.type}
          onChange={(e) => onChange({ ...value, type: e.target.value, typeTouched: true })}
        >
          {TYPE_GROUPS.map((g) => (
            <optgroup key={g.group} label={tRoot(`storeCategories.${g.group}`)}>
              {g.types.map((st) => (
                <option key={st.code} value={st.code}>
                  {tRoot(`storeTypes.${st.code}.label`)}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </Field>
      <Field label={t('location')} hint={t('locationHint')}>
        <Input
          maxLength={160}
          value={value.location}
          onChange={(e) => onChange({ ...value, location: e.target.value })}
        />
      </Field>
      <Field label={t('description')} hint={t('descriptionHint')}>
        <Input
          maxLength={255}
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
        />
      </Field>
    </div>
  );
}

export function storePayload(draft: StoreDraft) {
  return {
    name: draft.name,
    type: draft.type,
    location: draft.location,
    description: draft.description,
  };
}
