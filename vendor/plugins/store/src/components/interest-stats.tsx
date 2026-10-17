import { LOCALE_TAGS, Link, cn, type Locale } from '@devquake/ui';
import { translator } from '../i18n';
import { INTEREST_LIMITS, type InterestVerdict } from '../lib/interest';
import type { InterestRow } from '../lib/interest-data';
import { Panel } from './ui';

const VERDICT_STYLE: Record<InterestVerdict, string> = {
  early: 'border-ink/15 bg-ink/5 dark:border-paper/15 dark:bg-paper/5',
  noCosts: 'border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10',
  loss: 'border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10',
  thin: 'border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10',
  good: 'border-green-300 bg-green-50 dark:border-green-500/40 dark:bg-green-500/10',
};

const VERDICT_ICON: Record<InterestVerdict, string> = {
  early: '⏳',
  noCosts: '✎',
  loss: '✕',
  thin: '!',
  good: '✓',
};

/**
 * The interest votes on Statistics (ADR 0060): per product the demand, what voters would pay,
 * the price that earns most, the expected revenue, profit and return, and preferred options.
 */
export function InterestStats({
  rows,
  locale,
  money,
}: {
  rows: InterestRow[];
  locale: Locale;
  money: (cents: number) => string;
}) {
  const t = translator(locale, 'interestStats');
  const tag = LOCALE_TAGS[locale];
  const n = (v: number) => v.toLocaleString(tag);
  const total = rows.reduce(
    (s, r) => ({
      interested: s.interested + r.report.interested,
      revenue: s.revenue + r.report.revenueCents,
      profit: s.profit + (r.report.profitCents ?? 0),
    }),
    { interested: 0, revenue: 0, profit: 0 },
  );
  return (
    <section id="interest" className="scroll-mt-24 space-y-3">
      <h2 className="font-display text-xl font-semibold">{t('title')}</h2>
      <p className="max-w-3xl text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-ink/60 dark:text-paper/60">{t('empty')}</p>
      ) : (
        <>
          <p className="text-sm font-medium">
            {t('total', {
              interested: n(total.interested),
              revenue: money(total.revenue),
              profit: money(total.profit),
            })}
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {rows.map(({ productId, name, unitCents, setupCents, report: r }) => (
              <Panel key={productId} className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold">
                    <Link href={`/products/${productId}`} className="hover:text-quake">
                      {name}
                    </Link>
                  </h3>
                  <span className="text-sm tabular-nums">
                    {t('votes', { yes: n(r.interested), no: n(r.notInterested) })}
                  </span>
                </div>
                <p className={cn('rounded-lg border px-3 py-2 text-sm', VERDICT_STYLE[r.verdict])}>
                  <span aria-hidden className="me-2 font-bold">
                    {VERDICT_ICON[r.verdict]}
                  </span>
                  {t(`verdict.${r.verdict}`, {
                    min: INTEREST_LIMITS.minVotes,
                    roi: INTEREST_LIMITS.thinRoiPercent,
                  })}
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <dt className="text-ink/60 dark:text-paper/60">{t('range')}</dt>
                  <dd className="text-right tabular-nums">
                    {r.medianMinCents !== null && r.medianMaxCents !== null
                      ? `${money(r.medianMinCents)} – ${money(r.medianMaxCents)}`
                      : '—'}
                    <span className="block text-xs text-ink/60 dark:text-paper/60">
                      {t('priced', { count: r.priced })}
                    </span>
                  </dd>
                  <dt className="text-ink/60 dark:text-paper/60">{t('suggested')}</dt>
                  <dd className="text-right font-semibold tabular-nums">
                    {r.suggestedCents === null ? '—' : money(r.suggestedCents)}
                  </dd>
                  <dt className="text-ink/60 dark:text-paper/60">{t('units')}</dt>
                  <dd className="text-right tabular-nums">{n(r.units)}</dd>
                  <dt className="text-ink/60 dark:text-paper/60">{t('revenue')}</dt>
                  <dd className="text-right tabular-nums">{money(r.revenueCents)}</dd>
                  <dt className="text-ink/60 dark:text-paper/60">{t('costs')}</dt>
                  <dd className="text-right tabular-nums">
                    {unitCents === null ? (
                      <Link href={`/products/${productId}`} className="underline">
                        {t('addCosts')}
                      </Link>
                    ) : (
                      t('costLine', { unit: money(unitCents), setup: money(setupCents ?? 0) })
                    )}
                  </dd>
                  <dt className="text-ink/60 dark:text-paper/60">{t('investment')}</dt>
                  <dd className="text-right tabular-nums">
                    {r.investmentCents === null ? '—' : money(r.investmentCents)}
                  </dd>
                  <dt className="text-ink/60 dark:text-paper/60">{t('profit')}</dt>
                  <dd
                    className={cn(
                      'text-right font-semibold tabular-nums',
                      r.profitCents !== null &&
                        r.profitCents < 0 &&
                        'text-red-700 dark:text-red-400',
                    )}
                  >
                    {r.profitCents === null ? '—' : money(r.profitCents)}
                  </dd>
                  <dt className="text-ink/60 dark:text-paper/60">{t('roi')}</dt>
                  <dd className="text-right tabular-nums">
                    {r.roiPercent === null ? '—' : `${n(r.roiPercent)} %`}
                  </dd>
                  <dt className="text-ink/60 dark:text-paper/60">{t('breakEven')}</dt>
                  <dd className="text-right tabular-nums">
                    {r.breakEvenUnits === null
                      ? r.investmentCents === null
                        ? '—'
                        : t('never')
                      : t('pieces', { count: r.breakEvenUnits })}
                  </dd>
                </dl>
                {r.preferences.length > 0 ? (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{t('preferences')}</p>
                    <ul className="space-y-1">
                      {r.preferences.map((p) => (
                        <li key={p.label}>
                          <span className="text-ink/60 dark:text-paper/60">{p.label}: </span>
                          {p.counts.map((c) => `${c.value} (${n(c.count)})`).join(', ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Panel>
            ))}
          </div>
          <p className="text-xs text-ink/60 dark:text-paper/60">{t('note')}</p>
        </>
      )}
    </section>
  );
}
