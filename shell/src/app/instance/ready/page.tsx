import { localizePath } from '@devquake/ui';
import { APP } from '@/generated/app';
import { InstanceFrame } from '@/components/instance-frame';
import { getLocale } from '@/lib/context';
import { devquakeUrl } from '@/lib/funnel';
import { shellT } from '@/lib/texts';

export const metadata = { title: 'Ready' };

/** Right after the setup: what next, and the other DevQuake apps (the funnel, ADR 0054). */
export default async function ReadyPage() {
  const locale = await getLocale();
  const t = shellT(locale);
  return (
    <InstanceFrame title={t('readyTitle', { app: APP.name })}>
      <p>{t('readyBody')}</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={localizePath('/', locale)}
          className="rounded-md bg-quake px-4 py-2 font-semibold text-white hover:opacity-90"
        >
          {t('openApp', { app: APP.name })}
        </a>
        <a
          href={localizePath('/instance', locale)}
          className="rounded-md border border-ink/15 px-4 py-2 hover:border-quake dark:border-paper/20"
        >
          {t('instanceTitle')}
        </a>
        <a
          href={devquakeUrl('setup')}
          rel="noopener"
          className="rounded-md border border-ink/15 px-4 py-2 hover:border-quake dark:border-paper/20"
        >
          {t('moreLink')}
        </a>
      </div>
    </InstanceFrame>
  );
}
