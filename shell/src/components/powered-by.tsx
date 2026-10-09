import { APP } from '@/generated/app';
import { getLocale } from '@/lib/context';
import { hostedUrl, showPoweredBy } from '@/lib/funnel';
import { shellT } from '@/lib/texts';

/** The footer line back to DevQuake on every page (SHOW_POWERED_BY=false hides it). */
export async function PoweredBy() {
  if (!showPoweredBy()) return null;
  const t = shellT(await getLocale());
  return (
    <p className="px-4 py-4 text-center text-xs text-ink/50 dark:text-paper/50">
      {t('poweredBy', { app: APP.name })} ·{' '}
      <a href={hostedUrl('footer')} rel="noopener" className="underline hover:text-quake">
        {t('tryHosted')}
      </a>
    </p>
  );
}
