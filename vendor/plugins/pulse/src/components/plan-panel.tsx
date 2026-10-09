import type { Locale } from '@devquake/ui';
import { LOCALE_TAGS, rich } from '@devquake/ui';
import { translator } from '../i18n';
import { LIMITS, SHOWN_LIMITS, type Plan } from '../lib/limits';
import { Panel } from './panel';

/** One limit as a sentence, e.g. "10,000 events a day per service". */
export function limitText(locale: Locale, plan: Plan, key: (typeof SHOWN_LIMITS)[number]): string {
  const t = translator(locale, 'plan.limits');
  const value = LIMITS[plan][key];
  const n = (v: number) => new Intl.NumberFormat(LOCALE_TAGS[locale]).format(v);
  if (key === 'deliveryDelayMs') {
    return value === 0 ? t('instant') : t('delayed', { count: value / 1000, n: n(value / 1000) });
  }
  if (key === 'historyMinutes') {
    return value < 120
      ? t('historyMinutes', { count: value, n: n(value) })
      : t('historyHours', { count: value / 60, n: n(value / 60) });
  }
  return t(key, { count: value, n: n(value) });
}

/** The member's plan, what it allows, and how to get more. */
export function PlanPanel({
  locale,
  plan,
  hostUrl,
}: {
  locale: Locale;
  plan: Plan;
  hostUrl: string;
}) {
  const t = translator(locale, 'plan');
  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-xl font-bold">{t('title')}</h2>
        <span className="rounded-full bg-quake/10 px-2.5 py-0.5 text-xs font-semibold dark:bg-quake/20">
          {t(`names.${plan}`)}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t(`about.${plan}`)}</p>
      <ul className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {SHOWN_LIMITS.map((key) => (
          <li key={key} className="flex gap-2">
            <span aria-hidden className="text-quake">
              •
            </span>
            {limitText(locale, plan, key)}
          </li>
        ))}
      </ul>
      {plan !== 'full' ? (
        <p className="mt-3 text-sm">
          {rich(t('more'), {
            link: (
              <a className="font-medium text-quake underline" href={`${hostUrl}/#contact`}>
                {t('moreLink')}
              </a>
            ),
          })}
        </p>
      ) : null}
    </Panel>
  );
}
