import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink, Link, LOCALE_TAGS, buttonClass, cn } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope, requireProfile } from '../components/guard';
import { StatusBadge, statusTextClass } from '../components/status';
import { Panel } from '../components/ui';
import { DeleteUtilityButton, UtilityForm } from '../components/utility-form';
import { HttpError, utilityBills } from '../lib/data';
import { formatters } from '../lib/format';
import { category } from '../lib/model';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.utility') };
}

/** One utility: its bills (newest first) with their state, and the owner's settings. */
export default async function UtilityPage({ params, ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user } = scope;
  const utilityId = Number(params.id);
  if (!Number.isSafeInteger(utilityId) || utilityId <= 0) notFound();
  await requireProfile(ctx, db, user, `/utilities/${utilityId}`);
  const data = await utilityBills(db, utilityId, user.id).catch((err) => {
    if (err instanceof HttpError) notFound();
    throw err;
  });
  const { utility, bills, splits } = data;
  const locale = localeOf(ctx);
  const t = translator(locale, 'utility');
  const tRoot = translator(locale);
  const tStatus = translator(locale, 'status');
  const f = formatters(LOCALE_TAGS[locale]);
  const isOwner = utility.role === 'owner';
  const cat = category(utility.category);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <BackLink href="/" className="text-sm text-ink/60 hover:text-quake dark:text-paper/60">
            {t('back')}
          </BackLink>
          <h1 className="font-display text-3xl font-bold">
            <span aria-hidden>{cat.icon} </span>
            {utility.name}
          </h1>
          <p className="text-sm text-ink/60 dark:text-paper/60">
            {[
              tRoot(`categories.${utility.category}`),
              utility.provider,
              utility.meterRequired ? t('meterRequired') : t('equalSplit'),
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/utilities/${utility.id}/share`} className={buttonClass('secondary')}>
            {isOwner ? t('shareOwner') : t('shareMember')}
          </Link>
          {isOwner ? (
            <Link href={`/utilities/${utility.id}/bills/new`} className={buttonClass()}>
              {t('addBill')}
            </Link>
          ) : null}
        </div>
      </div>

      <Panel flush>
        {bills.length === 0 ? (
          <p className="p-5 text-sm text-ink/60 dark:text-paper/60">
            {isOwner ? t('noBillsOwner') : t('noBillsMember')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-ink/60 dark:text-paper/60">
                <tr>
                  <th className="px-4 py-2 font-medium">{t('period')}</th>
                  <th className="px-4 py-2 font-medium">{t('status')}</th>
                  <th className="px-4 py-2 text-right font-medium">{t('total')}</th>
                  <th className="px-4 py-2 text-right font-medium">{t('consumption')}</th>
                  <th className="px-4 py-2 text-right font-medium">{t('unitPrice')}</th>
                  <th className="px-4 py-2 text-right font-medium">{t('myShare')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 dark:divide-paper/10">
                {[...bills].reverse().map((b) => {
                  const split = splits.get(b.id)!;
                  const mine = split.lines.find((l) => l.userId === user.id);
                  return (
                    <tr key={b.id} className="hover:bg-ink/5 dark:hover:bg-paper/5">
                      <td className="px-4 py-2">
                        <Link
                          href={`/bills/${b.id}`}
                          className="font-medium capitalize hover:text-quake"
                        >
                          {f.month(b.period)}
                        </Link>
                        {b.fileName ? (
                          <span
                            className="ml-1 text-xs text-ink/50 dark:text-paper/50"
                            title={t('hasPdf')}
                          >
                            📄
                          </span>
                        ) : null}
                        {b.dueOn ? (
                          <span className="block text-xs text-ink/50 dark:text-paper/50">
                            {t('due', { day: f.day(b.dueOn) })}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={split.status} t={tStatus} />
                        {split.status === 'awaiting' ? (
                          <span className="block text-xs text-ink/50 dark:text-paper/50">
                            {t('missing', { count: split.missingReadings })}
                          </span>
                        ) : null}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-2 text-right tabular-nums',
                          statusTextClass(split.status),
                        )}
                      >
                        {f.money(b.total, utility.currency)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {b.consumption === null ? '—' : f.amount(b.consumption, utility.unit)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {split.unitPrice === null
                          ? '—'
                          : f.unitPrice(split.unitPrice, utility.currency, utility.unit)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {mine?.share === null || mine === undefined
                          ? '—'
                          : f.money(mine.share, utility.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {isOwner ? (
        <Panel>
          <h2 className="font-display text-lg font-semibold">{t('settings')}</h2>
          <UtilityForm
            utilityId={utility.id}
            initial={{
              name: utility.name,
              category: utility.category,
              provider: utility.provider,
              unit: utility.unit,
              currency: utility.currency,
              meterRequired: utility.meterRequired,
            }}
          />
          <div className="mt-6 border-t border-ink/10 pt-4 dark:border-paper/10">
            <DeleteUtilityButton utilityId={utility.id} name={utility.name} />
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
