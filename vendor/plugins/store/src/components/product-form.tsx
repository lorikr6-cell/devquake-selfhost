'use client';

import { useState, type FormEvent } from 'react';
import { Button, Link, trackEvent, useT } from '@devquake/ui';
import type { FieldDef } from '../lib/fields';
import { LIMITS, slugify } from '../lib/model';
import { IDEAL, SEO_LIMITS, productMeta, type ProductCheck } from '../lib/seo';
import { callApi } from './call-api';
import { FieldInput } from './field-input';
import { LengthHint, SnippetPreview } from './snippet-preview';
import { ErrorText, Field, Input, Panel, Select, TextArea } from './ui';
import { useAction } from './use-action';
import { emptyOption, type OptionValue, type ProductValue } from './product-value';

/**
 * A product: its texts, category, type with its fields, vendor, VAT, search engine texts, and
 * its options with prices, sales and stock.
 */
export function ProductForm({
  value,
  shopUrl,
  storeName,
  storeVatRate,
  categories,
  types,
  vendors,
  checks,
}: {
  value: ProductValue;
  /** "https://…/s/<slug>" for the address hint. */
  shopUrl: string;
  storeName: string;
  storeVatRate: number;
  categories: string[];
  types: Array<{ id: number; name: string; fields: FieldDef[] }>;
  vendors: Array<{ id: number; name: string }>;
  /** The saved product's search engine checklist (null for a new one). */
  checks: { score: number; issues: ProductCheck[] } | null;
}) {
  const t = useT('productForm');
  const tSeo = useT('seo');
  const { busy, error, act, router, confirm } = useAction();
  const [p, setP] = useState(value);
  const [slugTouched, setSlugTouched] = useState(value.id !== null);
  const slug = slugTouched ? p.slug : slugify(p.name, 80);
  const set = <K extends keyof ProductValue>(k: K, v: ProductValue[K]) =>
    setP((x) => ({ ...x, [k]: v }));
  const setOption = (i: number, change: Partial<OptionValue>) =>
    setP((x) => ({ ...x, options: x.options.map((o, n) => (n === i ? { ...o, ...change } : o)) }));
  const type = types.find((x) => String(x.id) === p.typeId) ?? null;
  const meta = productMeta(
    {
      name: p.name || '…',
      summary: p.summary || null,
      description: p.description || null,
      seoTitle: p.seoTitle || null,
      seoDescription: p.seoDescription || null,
    },
    storeName,
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    const body = {
      name: p.name,
      slug,
      summary: p.summary,
      description: p.description,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      gtin: p.gtin,
      category: p.category,
      typeId: p.typeId || null,
      vendorId: p.vendorId || null,
      values: type ? Object.fromEntries(type.fields.map((f) => [f.id, p.values[f.id] ?? ''])) : {},
      vatRate: p.vatRate,
      published: p.published,
      variants: p.options.map((o) => ({
        id: o.id,
        name: o.name,
        sku: o.sku,
        price: o.price,
        sale: o.sale,
        saleFrom: o.sale ? o.saleFrom : '',
        saleUntil: o.sale ? o.saleUntil : '',
        stock: o.stock,
      })),
    };
    if (p.id !== null) {
      act(
        async () => {
          const res = await callApi<{ variantIds: number[] }>(`/products/${p.id}`, 'PUT', body);
          const ids = res?.variantIds ?? [];
          setP((x) => ({ ...x, options: x.options.map((o, n) => ({ ...o, id: ids[n] ?? o.id })) }));
        },
        { success: t('saved') },
      );
      return;
    }
    act(
      async () => {
        const res = await callApi<{ id: number }>('/products', 'POST', body);
        trackEvent('store_product_created');
        router.push(`/products/${res!.id}`);
      },
      { success: t('created'), after: () => undefined },
    );
  }

  async function remove() {
    const ok = await confirm({
      title: t('deleteTitle'),
      body: t('deleteBody'),
      confirmLabel: t('delete'),
      danger: true,
    });
    if (!ok) return;
    act(
      async () => {
        await callApi(`/products/${p.id}`, 'DELETE');
        router.push('/products');
      },
      { success: t('deleted'), after: () => undefined },
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Panel className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('name')}>
            <Input
              value={p.name}
              onChange={(e) => set('name', e.target.value)}
              maxLength={LIMITS.productName}
              required
            />
          </Field>
          <Field label={t('slug')} hint={t('slugHint', { url: `${shopUrl}/p/${slug || '…'}` })}>
            <Input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                set('slug', e.target.value.toLowerCase());
              }}
              maxLength={80}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
            />
          </Field>
        </div>
        <Field label={t('summary')} hint={t('summaryHint')}>
          <Input
            value={p.summary}
            onChange={(e) => set('summary', e.target.value)}
            maxLength={LIMITS.summary}
          />
        </Field>
        <Field label={t('description')} hint={t('descriptionHint')}>
          <TextArea
            value={p.description}
            onChange={(e) => set('description', e.target.value)}
            maxLength={LIMITS.description}
            rows={6}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('category')} hint={t('categoryHint')}>
            <Input
              value={p.category}
              onChange={(e) => set('category', e.target.value)}
              maxLength={LIMITS.category}
              list="store-categories"
            />
            <datalist id="store-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label={t('vatRate')} hint={t('vatHint', { rate: storeVatRate })}>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              max={50}
              step="0.01"
              value={p.vatRate}
              onChange={(e) => set('vatRate', e.target.value)}
            />
          </Field>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={p.published}
            onChange={(e) => set('published', e.target.checked)}
            className="mt-1 accent-quake"
          />
          <span>
            <span className="font-medium">{t('published')}</span>
            <span className="block text-xs text-ink/60 dark:text-paper/60">
              {t('publishedHint')}
            </span>
          </span>
        </label>
      </Panel>

      <Panel className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-semibold">{t('details')}</h2>
          <p className="text-sm text-ink/60 dark:text-paper/60">{t('detailsHint')}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            label={t('type')}
            hint={
              <Link href="/products/types" className="underline">
                {t('manageTypes')}
              </Link>
            }
          >
            <Select value={p.typeId} onChange={(e) => set('typeId', e.target.value)}>
              <option value="">{t('noType')}</option>
              {types.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label={t('vendor')}
            hint={
              <Link href="/vendors" className="underline">
                {t('manageVendors')}
              </Link>
            }
          >
            <Select value={p.vendorId} onChange={(e) => set('vendorId', e.target.value)}>
              <option value="">{t('noVendor')}</option>
              {vendors.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('gtin')} hint={t('gtinHint')}>
            <Input
              inputMode="numeric"
              value={p.gtin}
              onChange={(e) => set('gtin', e.target.value)}
              maxLength={20}
              pattern="[0-9 ]{8,20}"
            />
          </Field>
        </div>
        {type && type.fields.length > 0 ? (
          <div className="grid gap-3 border-t border-ink/10 pt-3 sm:grid-cols-2 dark:border-paper/10">
            {type.fields.map((f) => (
              <FieldInput
                key={f.id}
                field={f}
                value={p.values[f.id] ?? ''}
                onChange={(v) => setP((x) => ({ ...x, values: { ...x.values, [f.id]: v } }))}
              />
            ))}
          </div>
        ) : type ? (
          <p className="text-sm text-ink/60 dark:text-paper/60">{t('typeNoFields')}</p>
        ) : null}
      </Panel>

      <Panel className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-semibold">{t('seo')}</h2>
          <p className="text-sm text-ink/60 dark:text-paper/60">{t('seoHint')}</p>
        </div>
        <Field
          label={t('seoTitle')}
          hint={<LengthHint length={meta.title.length} min={IDEAL.titleMin} max={IDEAL.titleMax} />}
        >
          <Input
            value={p.seoTitle}
            onChange={(e) => set('seoTitle', e.target.value)}
            maxLength={SEO_LIMITS.title}
            placeholder={`${p.name || '…'} · ${storeName}`}
          />
        </Field>
        <Field
          label={t('seoDescription')}
          hint={
            <LengthHint
              length={meta.description.length}
              min={IDEAL.descriptionMin}
              max={IDEAL.descriptionMax}
            />
          }
        >
          <TextArea
            value={p.seoDescription}
            onChange={(e) => set('seoDescription', e.target.value)}
            maxLength={SEO_LIMITS.description}
            rows={2}
            placeholder={p.summary || p.description.slice(0, 160)}
          />
        </Field>
        <SnippetPreview
          url={`${shopUrl}/p/${slug || '…'}`}
          title={meta.title}
          description={meta.description}
        />
        {checks ? (
          <div className="space-y-1 text-sm">
            <p className="font-medium">{tSeo('score', { score: checks.score })}</p>
            {checks.issues.length > 0 ? (
              <ul className="list-inside list-disc text-ink/70 dark:text-paper/70">
                {checks.issues.map((i) => (
                  <li key={i}>{tSeo(`check.${i}`)}</li>
                ))}
              </ul>
            ) : (
              <p className="text-green-700 dark:text-green-400">{tSeo('allGood')}</p>
            )}
          </div>
        ) : null}
      </Panel>

      <Panel className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-semibold">{t('options')}</h2>
          <p className="text-sm text-ink/60 dark:text-paper/60">{t('optionsHint')}</p>
        </div>
        {p.options.map((o, i) => (
          <div
            key={o.id ?? `new-${i}`}
            className="space-y-3 rounded-lg border border-ink/10 p-3 dark:border-paper/10"
          >
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label={t('optionName')} className="sm:col-span-2">
                <Input
                  value={o.name}
                  onChange={(e) => setOption(i, { name: e.target.value })}
                  maxLength={LIMITS.variantName}
                  placeholder={t('optionNamePlaceholder')}
                  required={p.options.length > 1}
                />
              </Field>
              <Field label={t('price')}>
                <Input
                  inputMode="decimal"
                  value={o.price}
                  onChange={(e) => setOption(i, { price: e.target.value })}
                  pattern="\d+([.,]\d{1,2})?"
                  required
                />
              </Field>
              <Field label={t('stock')} hint={t('stockHint')}>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={o.stock}
                  onChange={(e) => setOption(i, { stock: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label={t('sku')}>
                <Input
                  value={o.sku}
                  onChange={(e) => setOption(i, { sku: e.target.value })}
                  maxLength={LIMITS.sku}
                />
              </Field>
              <Field label={t('salePrice')}>
                <Input
                  inputMode="decimal"
                  value={o.sale}
                  onChange={(e) => setOption(i, { sale: e.target.value })}
                  pattern="\d+([.,]\d{1,2})?"
                />
              </Field>
              {o.sale ? (
                <>
                  <Field label={t('saleFrom')}>
                    <Input
                      type="datetime-local"
                      value={o.saleFrom}
                      onChange={(e) => setOption(i, { saleFrom: e.target.value })}
                    />
                  </Field>
                  <Field label={t('saleUntil')}>
                    <Input
                      type="datetime-local"
                      value={o.saleUntil}
                      onChange={(e) => setOption(i, { saleUntil: e.target.value })}
                    />
                  </Field>
                </>
              ) : null}
            </div>
            {o.sale ? (
              <p className="text-xs text-ink/60 dark:text-paper/60">{t('saleHint')}</p>
            ) : null}
            {p.options.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setP((x) => ({ ...x, options: x.options.filter((_, n) => n !== i) }))
                }
              >
                {t('removeOption')}
              </Button>
            ) : null}
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={p.options.length >= LIMITS.variantsPerProduct}
          onClick={() => setP((x) => ({ ...x, options: [...x.options, emptyOption()] }))}
        >
          {t('addOption')}
        </Button>
      </Panel>

      <ErrorText>{error}</ErrorText>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          {p.id !== null ? t('save') : t('create')}
        </Button>
        {p.id !== null ? (
          <Button type="button" variant="ghost" disabled={busy} onClick={remove}>
            {t('delete')}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
