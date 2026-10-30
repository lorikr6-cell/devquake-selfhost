import type { PluginPageProps } from '@devquake/plugin-sdk';
import { GuestBill } from '../components/guest-bill';
import { localeOf, translator } from '../i18n';
import { BILL_CODE } from '../lib/bill';
import { billView } from '../lib/bill-view';
import { venueById } from '../lib/data';
import { billByCode } from '../lib/floor';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return {
    title: translator(localeOf(ctx))('guest.title'),
    robots: { index: false, follow: false },
  };
}

/** The guests' bill (/b/:code, an open route): no account needed, nothing about other guests. */
export default async function BillPage({ ctx, params }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const code = params.code ?? '';
  const bill = ctx.db && BILL_CODE.test(code) ? await billByCode(ctx.db, code) : null;
  const venue = bill && ctx.db ? await venueById(ctx.db, bill.venueId) : null;
  if (!bill || !venue)
    return (
      <section className="space-y-3">
        <h1 className="font-display text-3xl font-bold">{t('guest.goneTitle')}</h1>
        <p>{t('guest.goneBody')}</p>
      </section>
    );
  return (
    <GuestBill
      initial={billView(bill, venue)}
      venueName={venue.name}
      currency={venue.currency}
      decimals={venue.decimals}
      tips={venue.tips}
      joinUrl={`${ctx.hostUrl}/?utm_source=venue&utm_medium=bill#account`}
    />
  );
}
