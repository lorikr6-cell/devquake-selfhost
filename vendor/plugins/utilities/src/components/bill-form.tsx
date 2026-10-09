'use client';

import { useState, type FormEvent } from 'react';
import { Button, trackEvent, useT } from '@devquake/ui';
import type { BillFields } from '../lib/pdf-fields';
import { MAX_PDF_BYTES } from '../lib/files';
import { callApi, errorMessage } from './call-api';
import { ErrorText, Field, Input, TextArea } from './ui';
import { useAction } from './use-action';
import { useFormat } from './use-format';

export interface BillValues {
  period: string;
  dueOn: string | null;
  total: number | null;
  consumption: number | null;
  unitPrice: number | null;
  providerPaid: boolean;
  note: string | null;
  fileName: string | null;
}

type ReadState =
  | { kind: 'idle' }
  | { kind: 'reading' }
  | { kind: 'found'; fields: string[] }
  | { kind: 'nothing' }
  | { kind: 'failed'; message: string };

const text = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n));

async function uploadPdf(
  billId: number,
  file: File,
  t: (key: string, p?: Record<string, string | number>) => string,
) {
  const res = await fetch(`/api/bills/${billId}/file`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/pdf', 'X-File-Name': encodeURIComponent(file.name) },
    body: file,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? t('pdfSave', { status: res.status }));
  }
}

/**
 * The bill form: pick the provider's PDF and the app tries to read the total, consumption, unit
 * price and due date from it; whatever it cannot read is typed in the same form.
 */
export function BillForm({
  utilityId,
  billId,
  initial,
  unit,
  currency,
  meterRequired,
}: {
  utilityId: number;
  billId?: number;
  initial: BillValues;
  unit: string | null;
  currency: string;
  meterRequired: boolean;
}) {
  const t = useT('billForm');
  const tErr = useT('errors');
  const f = useFormat();
  const { busy, error, setError, act, router } = useAction();
  const [file, setFile] = useState<File | null>(null);
  const [read, setRead] = useState<ReadState>({ kind: 'idle' });
  const [values, setValues] = useState({
    period: initial.period,
    dueOn: initial.dueOn ?? '',
    total: text(initial.total),
    consumption: text(initial.consumption),
    unitPrice: text(initial.unitPrice),
  });
  const set = (key: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  async function pick(chosen: File | null) {
    setFile(chosen);
    setError('');
    if (!chosen) {
      setRead({ kind: 'idle' });
      return;
    }
    if (chosen.size > MAX_PDF_BYTES) {
      setFile(null);
      setRead({ kind: 'failed', message: tErr('pdfTooLarge') });
      return;
    }
    setRead({ kind: 'reading' });
    try {
      const res = await fetch(`/api/utilities/${utilityId}/read-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/pdf' },
        body: chosen,
      });
      const data = (await res.json().catch(() => null)) as
        (BillFields & { text: boolean; error?: string }) | null;
      if (!res.ok || !data) throw new Error(data?.error ?? tErr('generic', { status: res.status }));
      const found: string[] = [];
      setValues((v) => {
        const next = { ...v };
        if (data.total !== null) {
          next.total = String(data.total);
          found.push(t('total'));
        }
        if (data.consumption !== null) {
          next.consumption = String(data.consumption);
          found.push(t('consumption'));
        }
        if (data.unitPrice !== null) {
          next.unitPrice = String(data.unitPrice);
          found.push(t('unitPrice'));
        }
        if (data.dueOn !== null) {
          next.dueOn = data.dueOn;
          found.push(t('dueOn'));
        }
        return next;
      });
      setRead(found.length ? { kind: 'found', fields: found } : { kind: 'nothing' });
      trackEvent('bill_pdf_read', { found: found.length });
    } catch (err) {
      setRead({ kind: 'failed', message: errorMessage(err, tErr) });
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = {
      period: values.period,
      dueOn: values.dueOn,
      total: values.total,
      consumption: values.consumption,
      unitPrice: values.unitPrice,
      providerPaid: data.get('providerPaid') === 'on',
      note: data.get('note'),
    };
    act(
      async () => {
        let id = billId;
        if (id) await callApi(`/bills/${id}`, 'PATCH', body);
        else {
          const res = await callApi<{ id: number }>(`/utilities/${utilityId}/bills`, 'POST', body);
          id = res!.id;
          trackEvent('bill_created', { pdf: file ? 1 : 0 });
        }
        if (file) await uploadPdf(id, file, tErr);
        router.push(`/bills/${id}`);
      },
      () => undefined,
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-lg border border-dashed border-ink/20 p-4 dark:border-paper/20">
        <Field
          label={t('pdf')}
          hint={initial.fileName ? t('pdfCurrent', { name: initial.fileName }) : t('pdfHint')}
        >
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-ink file:px-3 file:py-2 file:text-paper dark:file:bg-paper dark:file:text-ink"
          />
        </Field>
        <p role="status" className="mt-2 text-sm">
          {read.kind === 'reading' ? (
            <span className="text-ink/60 dark:text-paper/60">{t('reading')}</span>
          ) : read.kind === 'found' ? (
            <span className="text-emerald-700 dark:text-emerald-400">
              {t('found', { fields: read.fields.join(', ') })}
            </span>
          ) : read.kind === 'nothing' ? (
            <span className="text-amber-700 dark:text-amber-400">{t('nothingFound')}</span>
          ) : read.kind === 'failed' ? (
            <span className="text-amber-700 dark:text-amber-400">
              {read.message} {t('typeInstead')}
            </span>
          ) : null}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('period')}>
          <Input type="month" required value={values.period} onChange={set('period')} />
        </Field>
        <Field label={t('dueOn')}>
          <Input type="date" value={values.dueOn} onChange={set('dueOn')} />
        </Field>
        <Field label={t('totalIn', { currency })}>
          <Input
            required
            inputMode="decimal"
            value={values.total}
            onChange={set('total')}
            placeholder="0.00"
          />
        </Field>
        <Field
          label={unit ? t('consumptionIn', { unit }) : t('consumption')}
          hint={meterRequired ? t('consumptionHintMeter') : t('consumptionHint')}
        >
          <Input inputMode="decimal" value={values.consumption} onChange={set('consumption')} />
        </Field>
        <Field
          label={t('unitPriceIn', { unit: unit ? `${currency}/${unit}` : currency })}
          hint={t('unitPriceHint')}
        >
          <Input inputMode="decimal" value={values.unitPrice} onChange={set('unitPrice')} />
        </Field>
        <Derived values={values} currency={currency} unit={unit} f={f} t={t} />
      </div>

      <Field label={t('note')}>
        <TextArea name="note" maxLength={255} defaultValue={initial.note ?? ''} />
      </Field>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="providerPaid"
          defaultChecked={initial.providerPaid}
          className="mt-1 size-4 accent-quake"
        />
        <span>
          <span className="block font-medium">{t('providerPaid')}</span>
          <span className="block text-xs text-ink/60 dark:text-paper/60">
            {t('providerPaidHint')}
          </span>
        </span>
      </label>

      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy || read.kind === 'reading'}>
        {busy ? t('saving') : billId ? t('save') : t('create')}
      </Button>
    </form>
  );
}

/** The unit price the app will use when none is typed (total ÷ consumption). */
function Derived({
  values,
  currency,
  unit,
  f,
  t,
}: {
  values: { total: string; consumption: string; unitPrice: string };
  currency: string;
  unit: string | null;
  f: ReturnType<typeof useFormat>;
  t: (key: string, p?: Record<string, string | number>) => string;
}) {
  const parse = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.'));
  const total = parse(values.total);
  const consumption = parse(values.consumption);
  if (values.unitPrice.trim() || !(total > 0) || !(consumption > 0)) return null;
  return (
    <p className="self-end pb-2 text-sm text-ink/60 dark:text-paper/60">
      {t('derived', { price: f.unitPrice(total / consumption, currency, unit) })}
    </p>
  );
}
