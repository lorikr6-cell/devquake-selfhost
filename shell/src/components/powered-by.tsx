import { APP } from '@/generated/app';
import { getLocale } from '@/lib/context';
import { devquakeUrl, hostedUrl, showPoweredBy } from '@/lib/funnel';
import { shellT } from '@/lib/texts';

/**
 * The footer back to DevQuake on every page, at the bottom of the window: "Self-hosted <app> ·
 * Powered by <DevQuake logo>" (the logo links to devquake.com) and the hosted version. Owners may
 * hide it (SHOW_POWERED_BY=false) or remove it; README.md asks them kindly to keep it.
 */
export async function PoweredBy() {
  if (!showPoweredBy()) return null;
  const t = shellT(await getLocale());
  // "{logo}" sits where each language puts the name ("Powered by {logo}", "{logo} alapokon").
  const [before = '', after = ''] = t('poweredBy').split('{logo}');
  return (
    <footer className="mt-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-3 text-xs text-ink/50 dark:text-paper/50">
      <span>{t('selfHosted', { app: APP.name })}</span>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1.5">
        {before.trim() ? <span>{before.trim()}</span> : null}
        <a
          href={devquakeUrl('footer')}
          rel="noopener"
          // The image has empty space after the wordmark: show only the logo part (75 of 90 px).
          className="inline-flex w-[75px] overflow-hidden rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quake"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/devquake-logo.png"
            alt="DevQuake"
            width={90}
            height={18}
            className="h-4.5 w-[90px] max-w-none"
          />
        </a>
        {after.trim() ? <span>{after.trim()}</span> : null}
      </span>
      <span aria-hidden>·</span>
      <a href={hostedUrl('footer')} rel="noopener" className="underline hover:text-quake">
        {t('tryHosted')}
      </a>
    </footer>
  );
}
