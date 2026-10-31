'use client';

import { useState } from 'react';
import { useT } from '@devquake/ui';
import { ALLERGENS, STATIONS, allergensOf, formatMinor, type Station } from '../lib/model';
import { call, dangerLink, errorText, fieldClass, primaryButton } from './client';
import { CookbookPicker, type RecipeItem } from './cookbook-picker';
import { RecipeEditor } from './recipe-editor';
import { Status } from './status';

interface Category {
  id: number;
  name: string;
}

interface Item {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  priceMinor: number;
  vatRate: number;
  station: Station;
  allergens: number;
  available: boolean;
  /** Ingredients that are short now (the stock cannot make it). */
  short?: string[];
}

interface Menu {
  categories: Category[];
  items: Item[];
}

interface VenueMoney {
  currency: string;
  decimals: number;
  vatRates: number[];
}

/** The menu: categories in order, each with its items (price, VAT, station, allergens). */
export function MenuEditor({
  initial,
  venue,
  cookbook = false,
}: {
  initial: Menu;
  venue: VenueMoney;
  /** The cookbook is connected: offer "Add from your cookbook". */
  cookbook?: boolean;
}) {
  const t = useT('menu');
  const [menu, setMenu] = useState(initial);
  const [newCategory, setNewCategory] = useState('');
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [q, setQ] = useState('');
  const [prefill, setPrefill] = useState<RecipeItem | null>(null);
  const [formKey, setFormKey] = useState(0);
  const query = q.trim().toLowerCase();
  const matches = (i: Item, category: string) =>
    !query ||
    i.name.toLowerCase().includes(query) ||
    (i.description ?? '').toLowerCase().includes(query) ||
    category.toLowerCase().includes(query);

  async function run(url: string, method: 'POST' | 'PUT' | 'DELETE', body: unknown, ok: string) {
    setBusy(true);
    setMessage(null);
    try {
      setMenu(await call<Menu>(url, method, body, t('failed')));
      setMessage({ text: ok, ok: true });
      return true;
    } catch (err) {
      setMessage({ text: errorText(err, t('failed')), ok: false });
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {menu.categories.length ? null : (
        <p className="text-ink/70 dark:text-paper/70">{t('empty')}</p>
      )}
      {menu.items.length > 5 ? (
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search')}
          aria-label={t('search')}
          className={`${fieldClass} max-w-sm`}
        />
      ) : null}
      {menu.categories.map((c) => {
        const items = menu.items.filter((i) => i.categoryId === c.id && matches(i, c.name));
        if (query && !items.length) return null;
        return (
          <section key={c.id} className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-xl font-bold">{c.name}</h2>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const name = window.prompt(t('renamePrompt'), c.name);
                  if (name && name !== c.name)
                    void run(`/api/categories/${c.id}`, 'PUT', { name }, t('saved'));
                }}
                className="text-sm underline"
              >
                {t('rename')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (window.confirm(t('removeCategoryConfirm', { name: c.name })))
                    void run(`/api/categories/${c.id}`, 'DELETE', undefined, t('removed'));
                }}
                className={dangerLink}
              >
                {t('removeCategory')}
              </button>
            </div>
            <ul className="divide-y divide-ink/10 rounded-lg border border-ink/10 dark:divide-paper/10 dark:border-paper/10">
              {items.map((i) => (
                <li key={i.id} className="p-3">
                  {editing === i.id ? (
                    <ItemForm
                      item={i}
                      categories={menu.categories}
                      venue={venue}
                      busy={busy}
                      onSave={async (body) => {
                        if (await run(`/api/items/${i.id}`, 'PUT', body, t('saved')))
                          setEditing(null);
                      }}
                      onCancel={() => setEditing(null)}
                      onRemove={() => {
                        if (window.confirm(t('removeItemConfirm', { name: i.name })))
                          void run(`/api/items/${i.id}`, 'DELETE', undefined, t('removed'));
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditing(i.id)}
                      className="flex w-full flex-wrap items-baseline gap-x-3 text-left"
                    >
                      <span className={i.available ? 'font-medium' : 'font-medium line-through'}>
                        {i.name}
                      </span>
                      <span className="text-sm text-ink/60 dark:text-paper/60">
                        {t(`stations.${i.station}`)}
                        {i.allergens
                          ? ` · ${allergensOf(i.allergens)
                              .map((a) => t(`allergens.${a}`))
                              .join(', ')}`
                          : ''}
                        {i.available ? '' : ` · ${t('soldOut')}`}
                        {i.short?.length
                          ? ` · ⚠️ ${t('shortOf', { names: i.short.join(', ') })}`
                          : ''}
                      </span>
                      <span className="ml-auto tabular-nums">
                        {formatMinor(i.priceMinor, venue.decimals)} {venue.currency}
                      </span>
                    </button>
                  )}
                </li>
              ))}
              {items.length ? null : (
                <li className="p-3 text-sm text-ink/60 dark:text-paper/60">{t('noItems')}</li>
              )}
            </ul>
          </section>
        );
      })}

      {menu.categories.length ? (
        editing === 'new' ? (
          <section className="rounded-lg border border-ink/10 p-4 dark:border-paper/10">
            <h2 className="mb-3 font-semibold">{t('newItem')}</h2>
            {cookbook ? (
              <CookbookPicker
                onPick={(r) => {
                  setPrefill(r);
                  setFormKey((k) => k + 1);
                }}
              />
            ) : null}
            <ItemForm
              key={formKey}
              prefill={prefill}
              categories={menu.categories}
              venue={venue}
              busy={busy}
              onSave={async (body) => {
                if (await run('/api/items', 'POST', body, t('added'))) setEditing(null);
              }}
              onCancel={() => {
                setEditing(null);
                setPrefill(null);
              }}
            />
          </section>
        ) : (
          <button type="button" onClick={() => setEditing('new')} className={primaryButton}>
            {t('newItem')}
          </button>
        )
      ) : null}

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run('/api/categories', 'POST', { name: newCategory }, t('added')))
            setNewCategory('');
        }}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-ink/10 p-4 dark:border-paper/10"
      >
        <label className="grow text-sm font-medium">
          {t('newCategory')}
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            required
            maxLength={80}
            placeholder={t('categoryPlaceholder')}
            className={fieldClass}
          />
        </label>
        <button type="submit" disabled={busy} className={primaryButton}>
          {t('addCategory')}
        </button>
      </form>
      <Status message={message} />
    </div>
  );
}

/** One item's fields; Save sends them, the checkboxes go with the form. */
function ItemForm({
  item,
  prefill,
  categories,
  venue,
  busy,
  onSave,
  onCancel,
  onRemove,
}: {
  item?: Item;
  /** A recipe picked from the cookbook: its name, ingredients and allergens. */
  prefill?: RecipeItem | null;
  categories: Category[];
  venue: VenueMoney;
  busy: boolean;
  onSave: (body: Record<string, unknown>) => void;
  onCancel: () => void;
  onRemove?: () => void;
}) {
  const t = useT('menu');
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? categories[0]?.id ?? 0);
  const [name, setName] = useState(item?.name ?? prefill?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? prefill?.description ?? '');
  const [price, setPrice] = useState(item ? formatMinor(item.priceMinor, venue.decimals) : '');
  const [vatRate, setVatRate] = useState(item?.vatRate ?? venue.vatRates[0] ?? 0);
  const [station, setStation] = useState<Station>(item?.station ?? 'kitchen');
  const [allergens, setAllergens] = useState<string[]>(
    item ? allergensOf(item.allergens) : prefill ? allergensOf(prefill.allergens) : [],
  );
  const [available, setAvailable] = useState(item?.available ?? true);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ categoryId, name, description, price, vatRate, station, allergens, available });
      }}
      className="grid gap-3 sm:grid-cols-2"
    >
      <label className="text-sm font-medium">
        {t('itemName')}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
          className={fieldClass}
        />
      </label>
      <label className="text-sm font-medium">
        {t('category')}
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(Number(e.target.value))}
          className={fieldClass}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium sm:col-span-2">
        {t('description')}
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={400}
          className={fieldClass}
        />
      </label>
      <label className="text-sm font-medium">
        {t('price', { currency: venue.currency })}
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          inputMode="decimal"
          placeholder={venue.decimals ? '4.50' : '1200'}
          className={fieldClass}
        />
      </label>
      <label className="text-sm font-medium">
        {t('vatRate')}
        <select
          value={vatRate}
          onChange={(e) => setVatRate(Number(e.target.value))}
          className={fieldClass}
        >
          {venue.vatRates.map((r) => (
            <option key={r} value={r}>
              {r / 100} %
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium">
        {t('station')}
        <select
          value={station}
          onChange={(e) => setStation(e.target.value as Station)}
          className={fieldClass}
        >
          {STATIONS.map((s) => (
            <option key={s} value={s}>
              {t(`stations.${s}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 self-end text-sm">
        <input
          type="checkbox"
          checked={available}
          onChange={(e) => setAvailable(e.target.checked)}
        />
        {t('available')}
      </label>
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-medium">{t('allergensTitle')}</legend>
        <div className="mt-1 grid grid-cols-2 gap-1 text-sm sm:grid-cols-4">
          {ALLERGENS.map((a) => (
            <label key={a} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allergens.includes(a)}
                onChange={(e) =>
                  setAllergens((list) =>
                    e.target.checked ? [...list, a] : list.filter((x) => x !== a),
                  )
                }
              />
              {t(`allergens.${a}`)}
            </label>
          ))}
        </div>
      </fieldset>
      {item ? <RecipeEditor itemId={item.id} /> : null}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={busy} className={primaryButton}>
          {item ? t('save') : t('add')}
        </button>
        <button type="button" onClick={onCancel} className="text-sm underline">
          {t('cancel')}
        </button>
        {onRemove ? (
          <button type="button" disabled={busy} onClick={onRemove} className={dangerLink}>
            {t('removeItem')}
          </button>
        ) : null}
      </div>
    </form>
  );
}
