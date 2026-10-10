import { cn, type Locale } from '@devquake/ui';
import { translator } from '../i18n';
import type { Order } from '../lib/data';
import type { OrderStatus } from '../lib/model';
import { moneyIn } from './guard';

// An order as both the buyer and the owner see it: its state and its sums.

const STATUS_TONE: Record<OrderStatus, string> = {
  awaiting_payment: 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200',
  paid: 'bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-200',
  shipped: 'bg-violet-100 text-violet-900 dark:bg-violet-500/15 dark:text-violet-200',
  delivered: 'bg-green-100 text-green-900 dark:bg-green-500/15 dark:text-green-200',
  cancelled: 'bg-ink/10 text-ink/70 dark:bg-paper/10 dark:text-paper/70',
};

export function StatusBadge({ status, locale }: { status: OrderStatus; locale: Locale }) {
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_TONE[status])}>
      {translator(locale, 'status')(status)}
    </span>
  );
}

export function OrderSums({ order, locale }: { order: Order; locale: Locale }) {
  const t = translator(locale, 'order');
  const tMethods = translator(locale, 'methods');
  const money = moneyIn(locale, order.currency);
  return (
    <div className="space-y-3">
      <ul className="divide-y divide-ink/10 text-sm dark:divide-paper/10">
        {order.items.map((i, n) => (
          <li key={n} className="flex justify-between gap-3 py-2">
            <span className="min-w-0">
              {i.quantity} × {i.name}
              {i.optionName ? (
                <span className="text-ink/60 dark:text-paper/60"> ({i.optionName})</span>
              ) : null}
            </span>
            <span className="shrink-0">{money(i.unitCents * i.quantity)}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-1 border-t border-ink/10 pt-3 text-sm dark:border-paper/10">
        <div className="flex justify-between">
          <dt>{t('subtotal')}</dt>
          <dd>{money(order.itemsCents)}</dd>
        </div>
        {order.autoDiscountCents > 0 ? (
          <div className="flex justify-between gap-3">
            <dt>{order.autoDiscountLabel ?? t('autoDiscount')}</dt>
            <dd className="shrink-0">−{money(order.autoDiscountCents)}</dd>
          </div>
        ) : null}
        {order.discountCents - order.autoDiscountCents > 0 ? (
          <div className="flex justify-between">
            <dt>{t('discount', { code: order.voucherCode ?? '' })}</dt>
            <dd>−{money(order.discountCents - order.autoDiscountCents)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt>{t('shipping', { zone: order.zoneName ?? '' })}</dt>
          <dd>{money(order.shippingCents)}</dd>
        </div>
        {order.feeCents > 0 ? (
          <div className="flex justify-between">
            <dt>{t('fee')}</dt>
            <dd>{money(order.feeCents)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between text-base font-bold">
          <dt>{t('total')}</dt>
          <dd>{money(order.totalCents)}</dd>
        </div>
        <div className="flex justify-between text-xs text-ink/60 dark:text-paper/60">
          <dt>
            {t('payment')}: {tMethods(order.method)}
          </dt>
          <dd>{t('vat', { amount: money(order.vatCents) })}</dd>
        </div>
      </dl>
    </div>
  );
}
