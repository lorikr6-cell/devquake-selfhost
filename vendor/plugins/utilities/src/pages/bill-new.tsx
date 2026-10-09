import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink, Link } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { BillForm } from '../components/bill-form';
import { pageScope, requireProfile } from '../components/guard';
import { Panel } from '../components/ui';
import { HttpError, billContext, requireOwner } from '../lib/data';
import { todayIn } from '../lib/dates';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.newBill') };
}

/** Owner: add a bill to a utility (from the provider's PDF, or typed). */
export async function NewBillPage({ params, ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user } = scope;
  const utilityId = Number(params.id);
  if (!Number.isSafeInteger(utilityId) || utilityId <= 0) notFound();
  await requireProfile(ctx, db, user, `/utilities/${utilityId}/bills/new`);
  const utility = await requireOwner(db, utilityId, user.id).catch((err) => {
    if (err instanceof HttpError) notFound();
    throw err;
  });
  const t = translator(localeOf(ctx), 'billForm');
  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/utilities/${utility.id}`}
          className="text-sm text-ink/60 hover:text-quake dark:text-paper/60"
        >
          {t('back', { name: utility.name })}
        </Link>
        <h1 className="font-display text-3xl font-bold">{t('newTitle', { name: utility.name })}</h1>
      </div>
      <Panel>
        <BillForm
          utilityId={utility.id}
          unit={utility.unit}
          currency={utility.currency}
          meterRequired={utility.meterRequired}
          initial={{
            period: todayIn(ctx.timeZone).slice(0, 7),
            dueOn: null,
            total: null,
            consumption: null,
            unitPrice: null,
            providerPaid: false,
            note: null,
            fileName: null,
          }}
        />
      </Panel>
    </div>
  );
}

/** Owner: edit a bill. */
export async function EditBillPage({ params, ctx }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user } = scope;
  const billId = Number(params.id);
  if (!Number.isSafeInteger(billId) || billId <= 0) notFound();
  await requireProfile(ctx, db, user, `/bills/${billId}/edit`);
  const { utility, bill } = await billContext(db, billId, user.id).catch((err) => {
    if (err instanceof HttpError) notFound();
    throw err;
  });
  if (utility.role !== 'owner') notFound();
  const t = translator(localeOf(ctx), 'billForm');
  return (
    <div className="space-y-4">
      <div>
        <BackLink
          href={`/bills/${bill.id}`}
          className="text-sm text-ink/60 hover:text-quake dark:text-paper/60"
        >
          {t('backToBill')}
        </BackLink>
        <h1 className="font-display text-3xl font-bold">
          {t('editTitle', { name: utility.name })}
        </h1>
      </div>
      <Panel>
        <BillForm
          utilityId={utility.id}
          billId={bill.id}
          unit={utility.unit}
          currency={utility.currency}
          meterRequired={utility.meterRequired}
          initial={{
            period: bill.period,
            dueOn: bill.dueOn,
            total: bill.total,
            consumption: bill.consumption,
            unitPrice: bill.unitPrice,
            providerPaid: bill.providerPaid,
            note: bill.note,
            fileName: bill.fileName,
          }}
        />
      </Panel>
    </div>
  );
}

export default NewBillPage;
