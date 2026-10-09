import { Fragment, type ReactNode } from 'react';

/**
 * Puts elements into a translated sentence: rich(t('invited'), { name: <strong>Ana</strong> })
 * for "{name} invited you". Word order stays the translator's. Works in server and client code.
 */
export function rich(text: string, values: Record<string, ReactNode>): ReactNode {
  const parts = text.split(/\{(\w+)\}/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <Fragment key={i}>{values[part] ?? `{${part}}`}</Fragment> : part,
  );
}
