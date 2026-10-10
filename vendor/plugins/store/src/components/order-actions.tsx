'use client';

import { useState } from 'react';
import { Button, useT } from '@devquake/ui';
import { CARRIERS, type CarrierCode, type OrderStatus } from '../lib/model';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Select } from './ui';
import { useAction } from './use-action';

/** The owner moves the order on: paid, shipped, delivered, or cancelled (after a confirmation). */
export function OrderStatusButtons({ orderId, next }: { orderId: number; next: OrderStatus[] }) {
  const t = useT('order');
  const { busy, act, confirm } = useAction();
  if (next.length === 0) return null;
  async function move(to: OrderStatus) {
    if (to === 'cancelled') {
      const ok = await confirm({
        title: t('cancelTitle'),
        body: t('cancelBody'),
        confirmLabel: t('moveTo.cancelled'),
        danger: true,
      });
      if (!ok) return;
    }
    act(() => callApi(`/orders/${orderId}`, 'PATCH', { status: to }), { success: t('moved') });
  }
  return (
    <div className="flex flex-wrap gap-2">
      {next.map((to) => (
        <Button
          key={to}
          type="button"
          variant={to === 'cancelled' ? 'ghost' : 'primary'}
          disabled={busy}
          onClick={() => move(to)}
        >
          {t(`moveTo.${to}`)}
        </Button>
      ))}
    </div>
  );
}

/** The courier and tracking number (or the owner's own tracking link). */
export function TrackingForm({
  orderId,
  carrier,
  number,
  url,
}: {
  orderId: number;
  carrier: CarrierCode | null;
  number: string | null;
  url: string | null;
}) {
  const t = useT('order');
  const { busy, error, act } = useAction();
  const [c, setC] = useState<string>(carrier ?? '');
  const [n, setN] = useState(number ?? '');
  const [u, setU] = useState(url ?? '');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        act(
          () =>
            callApi(`/orders/${orderId}`, 'PATCH', {
              tracking: { carrier: c || null, number: n, url: c === 'other' ? u : null },
            }),
          { success: t('trackingSaved') },
        );
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('carrier')}>
          <Select value={c} onChange={(e) => setC(e.target.value)}>
            <option value="">{t('carrierNone')}</option>
            {CARRIERS.map((x) => (
              <option key={x.code} value={x.code}>
                {x.code === 'other' ? t('carrierOther') : x.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('trackingNumber')}>
          <Input
            value={n}
            onChange={(e) => setN(e.target.value)}
            maxLength={80}
            spellCheck={false}
          />
        </Field>
      </div>
      {c === 'other' ? (
        <Field label={t('trackingUrl')} hint={t('trackingUrlHint')}>
          <Input
            type="url"
            value={u}
            onChange={(e) => setU(e.target.value)}
            maxLength={500}
            placeholder="https://"
          />
        </Field>
      ) : null}
      <ErrorText>{error}</ErrorText>
      <Button type="submit" variant="secondary" disabled={busy}>
        {t('saveTracking')}
      </Button>
    </form>
  );
}
