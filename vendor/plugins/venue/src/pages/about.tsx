import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link } from '@devquake/ui';
import { about } from '../about';
import { localeOf, translator } from '../i18n';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('appName') };
}

/** What the app is for, in the visitor's language. */
export default function About({ ctx }: PluginPageProps) {
  const locale = localeOf(ctx);
  const t = translator(locale);
  const features = about.features?.[locale] ?? about.features?.en ?? [];
  return (
    <article className="space-y-4">
      <h1 className="font-display text-3xl font-bold">{t('appName')}</h1>
      <p>{about.description[locale] ?? about.description.en}</p>
      <ul className="list-inside list-disc">
        {features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <Link href="/" className="font-medium text-quake underline">
        {t('nav.home')}
      </Link>
    </article>
  );
}
