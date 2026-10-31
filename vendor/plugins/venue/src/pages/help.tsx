import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('help.title') };
}

const STEPS = [
  's1',
  's2',
  's3',
  's4',
  's5',
  's6',
  's8',
  's9',
  's10',
  's11',
  's12',
  's13',
  's14',
  's15',
  's16',
  's17',
  's7',
];

/** The user manual (public). */
export default function Help({ ctx }: PluginPageProps) {
  const t = translator(localeOf(ctx), 'help');
  return (
    <article className="space-y-4">
      <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
      <p>{t('intro')}</p>
      <ol className="list-inside list-decimal space-y-2">
        {STEPS.map((k) => (
          <li key={k}>{t(k)}</li>
        ))}
      </ol>
    </article>
  );
}
