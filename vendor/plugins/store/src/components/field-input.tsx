'use client';

import { useT } from '@devquake/ui';
import { FIELD_LIMITS, type FieldDef } from '../lib/fields';
import { Field, Input, Select, TextArea } from './ui';

/** One field of a product type in the product form, by its kind. */
export function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useT('productForm');
  const label = `${field.label}${field.unit ? ` (${field.unit})` : ''}${field.required ? ' *' : ''}`;
  switch (field.kind) {
    case 'textarea':
      return (
        <Field label={label} className="sm:col-span-2">
          <TextArea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={FIELD_LIMITS.value}
            rows={3}
            required={field.required}
          />
        </Field>
      );
    case 'number':
      return (
        <Field label={label}>
          <Input
            type="number"
            inputMode="decimal"
            step="any"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        </Field>
      );
    case 'boolean':
      return (
        <Field label={label}>
          <Select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          >
            <option value="">{t('notSet')}</option>
            <option value="1">{t('yes')}</option>
            <option value="0">{t('no')}</option>
          </Select>
        </Field>
      );
    case 'select':
      return (
        <Field label={label}>
          <Select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          >
            <option value="">{t('notSet')}</option>
            {field.choices.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      );
    case 'multiselect': {
      const picked = value ? value.split('\n') : [];
      return (
        <fieldset className="text-sm sm:col-span-2">
          <legend className="mb-1 font-medium">{label}</legend>
          <div className="flex flex-wrap gap-2">
            {field.choices.map((c) => (
              <label
                key={c}
                className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border border-ink/15 px-3 py-1 has-[:checked]:border-quake has-[:checked]:bg-quake/10 dark:border-paper/15"
              >
                <input
                  type="checkbox"
                  checked={picked.includes(c)}
                  onChange={(e) =>
                    onChange(
                      field.choices
                        .filter((x) => (x === c ? e.target.checked : picked.includes(x)))
                        .join('\n'),
                    )
                  }
                  className="accent-quake"
                />
                {c}
              </label>
            ))}
          </div>
        </fieldset>
      );
    }
    case 'color':
      return (
        <Field label={label}>
          <span className="flex items-center gap-2">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-ink/15 dark:border-paper/15"
              aria-label={field.label}
            />
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              pattern="#[0-9a-fA-F]{6}"
              required={field.required}
            />
          </span>
        </Field>
      );
    case 'date':
      return (
        <Field label={label}>
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        </Field>
      );
    case 'url':
      return (
        <Field label={label}>
          <Input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://"
            required={field.required}
          />
        </Field>
      );
    default:
      return (
        <Field label={label}>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={FIELD_LIMITS.value}
            required={field.required}
          />
        </Field>
      );
  }
}
