'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Button, Link, Sheet, cn, trackEvent, useT, ZoomableImage, thumbUrl } from '@devquake/ui';
import {
  computeTotals,
  formatQuantity,
  groupByStore,
  isOpen,
  lineTotal,
  type Item,
  type ListSnapshot,
  type Store,
} from '../lib/model';
import { storeType } from '../lib/store-types';
import { fold, usualProducts, type Suggestion } from '../lib/suggestions';
import { callApi, errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { NearbyStores } from './nearby-stores';
import { removePhoto, uploadPhoto } from './photo-upload';
import { ProductCombobox } from './product-combobox';
import { StoreFields, emptyStore, storePayload, type StoreDraft } from './store-fields';
import { ErrorText, Field, Input, Panel, Select } from './ui';
import { useFormat } from './use-format';

const POLL_MS = 4000;
const NEW_STORE = 'new';

/** The shared list: items grouped by store, live-ish updates by polling the list's version. */
export function ListView({ initial }: { initial: ListSnapshot }) {
  const t = useT('list');
  const { confirm: confirmDialog } = useFeedback();
  const tErr = useT('errors');
  const f = useFormat();
  const [list, setList] = useState(initial);
  const [shopping, setShopping] = useState(false);
  const [error, setError] = useState('');
  // The owner deleted the list (or removed this user) while it was open.
  const [gone, setGone] = useState(false);
  const version = useRef(initial.version);

  const load = useCallback(
    async (onlyIfChanged: boolean) => {
      const query = onlyIfChanged ? `?v=${version.current}` : '';
      const next = await callApi<ListSnapshot>(`/lists/${initial.id}${query}`).catch((err) => {
        if ((err as { status?: number }).status === 404) {
          setGone(true);
          return null;
        }
        throw err;
      });
      if (next) {
        version.current = next.version;
        setList(next);
      }
    },
    [initial.id],
  );

  useEffect(() => {
    if (gone) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load(true).catch(() => {});
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') load(true).catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load, gone]);

  /**
   * Runs a change, then reloads the list; errors are shown above the list. `optimistic` updates
   * the screen immediately (e.g. ticking an item in the shop); a failure reloads the real state.
   */
  const run = useCallback(
    async (change: () => Promise<unknown>, optimistic?: (l: ListSnapshot) => ListSnapshot) => {
      setError('');
      if (optimistic) setList(optimistic);
      try {
        await change();
        await load(false);
        return true;
      } catch (err) {
        setError(errorMessage(err, tErr));
        if (optimistic) await load(false).catch(() => {});
        return false;
      }
    },
    [load, tErr],
  );

  // The user's products from earlier lists, for the autocomplete and "Usual products".
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const loadSuggestions = useCallback(() => {
    callApi<{ suggestions: Suggestion[] }>('/suggestions')
      .then((res) => {
        if (res) setSuggestions(res.suggestions);
      })
      .catch(() => {});
  }, []);
  useEffect(() => loadSuggestions(), [loadSuggestions]);

  if (gone) {
    return (
      <Panel className="space-y-3 p-6 text-center">
        <h1 className="font-display text-2xl font-bold">{t('goneTitle', { name: list.name })}</h1>
        <p className="text-sm text-ink/70 dark:text-paper/70">{t('goneBody')}</p>
        <Link href="/" className="inline-block text-sm font-medium underline hover:text-quake">
          {t('back')}
        </Link>
      </Panel>
    );
  }

  const groups = groupByStore(list.stores, list.items);
  const totals = computeTotals(list.items);
  const open = computeTotals(list.items.filter(isOpen));
  const doneCount = list.items.filter((i) => i.done || i.dropped).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-ink/60 hover:text-quake dark:text-paper/60">
            {t('allLists')}
          </Link>
          <h1 className="font-display text-3xl font-bold">{list.name}</h1>
          <p className="text-sm text-ink/60 dark:text-paper/60">
            <span className="font-medium text-ink dark:text-paper">{f.day(list.shopDate)}</span>
            {' · '}
            {list.members.map((m) => m.displayName).join(', ')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={shopping ? 'primary' : 'secondary'}
            onClick={() => {
              if (!shopping) trackEvent('shopping_mode_started');
              setShopping((s) => !s);
            }}
            aria-pressed={shopping}
          >
            {shopping ? t('doneShopping') : t('goShopping')}
          </Button>
          <Link
            href={`/lists/${list.id}/share`}
            className="inline-flex items-center rounded-md border border-ink/20 px-4 py-2 text-sm font-medium hover:bg-ink/5 dark:border-paper/20 dark:hover:bg-paper/10"
          >
            {list.role === 'owner' ? t('shareSettings') : t('members')}
          </Link>
        </div>
      </div>

      <ErrorText>{error}</ErrorText>

      {!shopping ? (
        <>
          <UsualProducts
            list={list}
            run={run}
            suggestions={suggestions}
            onAdded={loadSuggestions}
          />
          <AddItemForm list={list} run={run} suggestions={suggestions} onAdded={loadSuggestions} />
          <div className="flex justify-end">
            <NearbyStores listId={list.id} onAdded={() => load(false)} />
          </div>
        </>
      ) : (
        // In the store the list comes first; adding something is one tap away.
        <details className="group rounded-xl border border-ink/10 bg-white/70 dark:border-paper/10 dark:bg-paper/5">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 py-2 font-medium [&::-webkit-details-marker]:hidden">
            <span>
              <span aria-hidden>＋ </span>
              {t('addWhileShopping')}
            </span>
            <span
              aria-hidden
              className="text-ink/50 transition-transform group-open:rotate-180 dark:text-paper/50"
            >
              ▾
            </span>
          </summary>
          <div className="border-t border-ink/10 dark:border-paper/10">
            <AddItemForm
              list={list}
              run={run}
              suggestions={suggestions}
              onAdded={loadSuggestions}
            />
          </div>
        </details>
      )}

      {groups.length === 0 ? (
        <Panel>
          <p className="text-sm text-ink/70 dark:text-paper/70">{t('empty')}</p>
        </Panel>
      ) : (
        groups.map((g) => (
          <Panel key={g.store?.id ?? 'none'} flush>
            <StoreHeader
              store={g.store}
              subtotal={g.total}
              unpriced={g.unpriced}
              currency={list.currency}
              listId={list.id}
              editable={!shopping}
              run={run}
            />
            <ul className="divide-y divide-ink/10 dark:divide-paper/10">
              {g.items.map((item) => (
                <ItemRow key={item.id} item={item} list={list} shopping={shopping} run={run} />
              ))}
            </ul>
          </Panel>
        ))
      )}

      <Panel className="flex flex-wrap items-center justify-between gap-3">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:flex sm:gap-8">
          <div>
            <dt className="text-ink/60 dark:text-paper/60">{t('stillToBuy')}</dt>
            <dd className="font-display text-xl font-bold">{f.money(open.total, list.currency)}</dd>
          </div>
          <div>
            <dt className="text-ink/60 dark:text-paper/60">{t('whole')}</dt>
            <dd className="font-display text-xl font-bold">
              {f.money(totals.total, list.currency)}
            </dd>
          </div>
          {totals.unpriced > 0 ? (
            <div className="col-span-2 self-end text-ink/60 dark:text-paper/60">
              {t('noPriceYet', { count: totals.unpriced })}
            </div>
          ) : null}
        </dl>
        {doneCount > 0 ? (
          <Button
            variant="ghost"
            onClick={async () => {
              const ok = await confirmDialog({
                title: t('clearConfirm', { count: doneCount }),
                confirmLabel: t('clear', { count: doneCount }),
              });
              if (ok) run(() => callApi(`/lists/${list.id}/clear-done`, 'POST'));
            }}
          >
            {t('clear', { count: doneCount })}
          </Button>
        ) : null}
      </Panel>
    </div>
  );
}

type Run = (
  change: () => Promise<unknown>,
  optimistic?: (l: ListSnapshot) => ListSnapshot,
) => Promise<boolean>;

function storeLabel(store: Store) {
  return store.location ? `${store.name} (${store.location})` : store.name;
}

// --- store header ------------------------------------------------------------------------

function StoreHeader({
  store,
  subtotal,
  unpriced,
  currency,
  listId,
  editable,
  run,
}: {
  store: Store | null;
  subtotal: number;
  unpriced: number;
  currency: string;
  listId: number;
  editable: boolean;
  run: Run;
}) {
  const t = useT('list');
  const { confirm: confirmDialog } = useFeedback();
  const tRoot = useT();
  const f = useFormat();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<StoreDraft>(emptyStore);

  if (store && editing) {
    return (
      <form
        className="space-y-3 border-b border-ink/10 p-4 dark:border-paper/10"
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await run(() =>
            callApi(`/lists/${listId}/stores/${store.id}`, 'PATCH', storePayload(draft)),
          );
          if (ok) setEditing(false);
        }}
      >
        <StoreFields value={draft} onChange={setDraft} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit">{t('saveStore')}</Button>
          <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="ml-auto text-red-700 dark:text-red-400"
            onClick={async () => {
              const ok = await confirmDialog({
                title: t('removeStoreConfirm', { name: store.name }),
                confirmLabel: t('removeStore'),
                danger: true,
              });
              if (ok) run(() => callApi(`/lists/${listId}/stores/${store.id}`, 'DELETE'));
            }}
          >
            {t('removeStore')}
          </Button>
        </div>
      </form>
    );
  }

  const type = store ? storeType(store.type) : null;
  return (
    <header className="flex flex-wrap items-start justify-between gap-2 border-b border-ink/10 px-4 py-3 dark:border-paper/10">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          {store?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- served by the app's own API
            <img
              src={store.logo}
              alt=""
              className="size-7 shrink-0 rounded-md border border-ink/10 bg-white object-contain p-0.5 dark:border-paper/20"
            />
          ) : null}
          {store ? store.name : t('anyStore')}
        </h2>
        {store && type ? (
          <p className="text-xs text-ink/60 dark:text-paper/60">
            <span className="rounded bg-quake/10 px-1.5 py-0.5 font-medium text-quake">
              {tRoot(`storeTypes.${type.code}.label`)}
            </span>
            {store.location ? <> · {store.location}</> : null}
            {store.description ? <> · {store.description}</> : null}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="font-medium">
          {f.money(subtotal, currency)}
          {unpriced > 0 ? (
            <span className="text-ink/50 dark:text-paper/50">
              {' '}
              {t('unpriced', { count: unpriced })}
            </span>
          ) : null}
        </span>
        {store && editable ? (
          <button
            type="button"
            className="text-ink/60 underline hover:text-quake dark:text-paper/60"
            onClick={() => {
              setDraft({
                name: store.name,
                type: store.type,
                location: store.location ?? '',
                description: store.description ?? '',
                typeTouched: true,
              });
              setEditing(true);
            }}
          >
            {t('edit')}
          </button>
        ) : null}
      </div>
    </header>
  );
}

// --- items --------------------------------------------------------------------------------

interface ItemDraft {
  name: string;
  quantity: string;
  unit: string;
  price: string;
  description: string;
  storeId: string;
}

const emptyItem: ItemDraft = {
  name: '',
  quantity: '',
  unit: '',
  price: '',
  description: '',
  storeId: '',
};

/** Photo of a new item: a file the user picked, or the photo of an earlier item (suggestion). */
interface PhotoDraft {
  file: File | null;
  fromItemId: number | null;
  preview: string | null;
}

const noPhoto: PhotoDraft = { file: null, fromItemId: null, preview: null };

const AUTOFILL_KEY = 'dq.shopping.autofill';

function ItemFields({
  draft,
  setDraft,
  stores,
  currency,
  allowNewStore,
  nameInput,
}: {
  draft: ItemDraft;
  setDraft: (d: ItemDraft) => void;
  stores: Store[];
  currency: string;
  allowNewStore: boolean;
  /** Replaces the plain name input (the add form uses the autocomplete). */
  nameInput?: ReactNode;
}) {
  const t = useT('list');
  const tRoot = useT();
  const unitsId = useId();
  return (
    <div className="grid gap-3 sm:grid-cols-6">
      <Field label={t('item')} className="sm:col-span-3">
        {nameInput ?? (
          <Input
            required
            maxLength={120}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder={t('itemPlaceholder')}
          />
        )}
      </Field>
      <Field label={t('quantity')}>
        <Input
          inputMode="decimal"
          value={draft.quantity}
          onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
          placeholder="2"
        />
      </Field>
      <Field label={t('unit')}>
        <Input
          required
          maxLength={16}
          list={unitsId}
          value={draft.unit}
          onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
          placeholder={t('unitPlaceholder')}
        />
        <datalist id={unitsId}>
          {t('units')
            .split('|')
            .map((u) => (
              <option key={u} value={u} />
            ))}
        </datalist>
      </Field>
      <Field label={t('pricePerUnit', { currency })}>
        <Input
          inputMode="decimal"
          value={draft.price}
          onChange={(e) => setDraft({ ...draft, price: e.target.value })}
          placeholder="0.00"
        />
      </Field>
      <Field label={t('store')} className="sm:col-span-3">
        <Select
          value={draft.storeId}
          onChange={(e) => setDraft({ ...draft, storeId: e.target.value })}
        >
          <option value="">{t('anyStore')}</option>
          {stores.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {storeLabel(s)} · {tRoot(`storeTypes.${storeType(s.type).code}.label`)}
            </option>
          ))}
          {allowNewStore ? <option value={NEW_STORE}>{t('newStoreOption')}</option> : null}
        </Select>
      </Field>
      <Field label={t('description')} className="sm:col-span-3">
        <Input
          maxLength={255}
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder={t('descriptionPlaceholder')}
        />
      </Field>
    </div>
  );
}

function itemPayload(draft: ItemDraft, storeId: number | null) {
  return {
    name: draft.name,
    quantity: draft.quantity,
    unit: draft.unit,
    price: draft.price,
    description: draft.description,
    storeId,
  };
}

/** A store of this list with the same name and location as the suggestion's, if any. */
function matchingStore(stores: Store[], store: Suggestion['store']): Store | undefined {
  if (!store) return undefined;
  return stores.find(
    (s) =>
      fold(s.name) === fold(store.name) && fold(s.location ?? '') === fold(store.location ?? ''),
  );
}

const numberText = (n: number | null) => (n === null ? '' : String(n));

/** Photo picker with a preview; the browser shrinks the photo before it is uploaded. */
function PhotoField({ photo, onChange }: { photo: PhotoDraft; onChange: (p: PhotoDraft) => void }) {
  const t = useT('list');
  const inputId = useId();
  useEffect(() => {
    // Free the preview of a picked file when it is replaced or removed.
    const url = photo.file ? photo.preview : null;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [photo]);
  return (
    <div className="flex items-center gap-3 text-sm">
      {photo.preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- local preview / API image
        <img src={photo.preview} alt={t('photoAlt')} className="size-14 rounded-md object-cover" />
      ) : (
        <span
          aria-hidden
          className="flex size-14 items-center justify-center rounded-md border border-dashed border-ink/25 text-ink/40 dark:border-paper/25 dark:text-paper/40"
        >
          📷
        </span>
      )}
      <div className="space-y-1">
        <label
          htmlFor={inputId}
          className="cursor-pointer font-medium underline decoration-quake/50 underline-offset-2 hover:decoration-quake"
        >
          {photo.preview ? t('changePhoto') : t('addPhotoOptional')}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onChange({ file, fromItemId: null, preview: URL.createObjectURL(file) });
          }}
        />
        {photo.preview ? (
          <button
            type="button"
            className="block text-xs text-ink/60 underline dark:text-paper/60"
            onClick={() => onChange(noPhoto)}
          >
            {t('removePhoto')}
          </button>
        ) : (
          <p className="text-xs text-ink/60 dark:text-paper/60">{t('photoHint')}</p>
        )}
      </div>
    </div>
  );
}

function AddItemForm({
  list,
  run,
  suggestions,
  onAdded,
}: {
  list: ListSnapshot;
  run: Run;
  suggestions: Suggestion[];
  onAdded: () => void;
}) {
  const t = useT('list');
  const tErr = useT('errors');
  const [draft, setDraft] = useState<ItemDraft>(emptyItem);
  const [store, setStore] = useState<StoreDraft>(emptyStore);
  const [photo, setPhoto] = useState<PhotoDraft>(noPhoto);
  const [autofill, setAutofill] = useState(true);
  /** The current row came from a suggestion (for analytics only). */
  const [fromSuggestion, setFromSuggestion] = useState(false);
  const [busy, setBusy] = useState(false);
  const newStore = draft.storeId === NEW_STORE;

  useEffect(() => {
    try {
      if (localStorage.getItem(AUTOFILL_KEY) === 'off') setAutofill(false);
    } catch {
      // storage unavailable: keep the default
    }
  }, []);

  function toggleAutofill(on: boolean) {
    setAutofill(on);
    try {
      localStorage.setItem(AUTOFILL_KEY, on ? 'on' : 'off');
    } catch {
      // not remembered, that is fine
    }
  }

  /** A suggestion was picked: always name and unit, the rest of the row when autofill is on. */
  function applySuggestion(s: Suggestion) {
    setFromSuggestion(true);
    if (!autofill) {
      setDraft({ ...draft, name: s.name, unit: s.unit ?? draft.unit });
      return;
    }
    const existing = matchingStore(list.stores, s.store);
    let storeId = draft.storeId;
    if (existing) storeId = String(existing.id);
    else if (s.store) {
      storeId = NEW_STORE;
      setStore({
        name: s.store.name,
        type: s.store.type,
        location: s.store.location ?? '',
        description: s.store.description ?? '',
        typeTouched: true,
      });
    }
    setDraft({
      name: s.name,
      unit: s.unit ?? '',
      quantity: numberText(s.quantity),
      price: numberText(s.price),
      description: s.description ?? '',
      storeId,
    });
    setPhoto(s.photoItemId ? { file: null, fromItemId: s.photoItemId, preview: s.photo } : noPhoto);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    await run(async () => {
      let storeId = draft.storeId && !newStore ? Number(draft.storeId) : null;
      if (newStore) {
        const res = await callApi<{ id: number }>(
          `/lists/${list.id}/stores`,
          'POST',
          storePayload(store),
        );
        storeId = res!.id;
      }
      const created = await callApi<{ id: number }>(`/lists/${list.id}/items`, 'POST', {
        ...itemPayload(draft, storeId),
        photoFrom: photo.file ? null : photo.fromItemId,
      });
      if (photo.file) await uploadPhoto(list.id, created!.id, photo.file, tErr);
      trackEvent('item_added', {
        source: fromSuggestion ? 'suggestion' : 'typed',
        autofill: fromSuggestion && autofill,
        with_photo: !!(photo.file || photo.fromItemId),
        new_store: newStore,
      });
      setFromSuggestion(false);
      // Keep the chosen store for the next item: people usually add several per shop.
      setDraft({ ...emptyItem, storeId: storeId === null ? '' : String(storeId) });
      setStore(emptyStore);
      setPhoto(noPhoto);
      onAdded();
    });
    setBusy(false);
  }

  return (
    <Panel>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">{t('addTitle')}</h2>
          <label className="flex items-center gap-2 text-xs text-ink/70 dark:text-paper/70">
            <input
              type="checkbox"
              className="accent-quake"
              checked={autofill}
              onChange={(e) => toggleAutofill(e.target.checked)}
            />
            {t('autofill')}
          </label>
        </div>
        <ItemFields
          draft={draft}
          setDraft={setDraft}
          stores={list.stores}
          currency={list.currency}
          allowNewStore
          nameInput={
            <ProductCombobox
              value={draft.name}
              onChange={(name) => setDraft({ ...draft, name })}
              onPick={applySuggestion}
              suggestions={suggestions}
              currency={list.currency}
            />
          }
        />
        {newStore ? (
          <div className="rounded-lg border border-dashed border-quake/40 p-3">
            <p className="mb-2 text-xs font-medium text-quake">{t('newStore')}</p>
            <StoreFields value={store} onChange={setStore} />
          </div>
        ) : null}
        <PhotoField photo={photo} onChange={setPhoto} />
        <Button type="submit" disabled={busy}>
          {busy ? t('adding') : t('addItem')}
        </Button>
      </form>
    </Panel>
  );
}

/** One-tap buttons for products the user buys often and that are not on this list yet. */
function UsualProducts({
  list,
  run,
  suggestions,
  onAdded,
}: {
  list: ListSnapshot;
  run: Run;
  suggestions: Suggestion[];
  onAdded: () => void;
}) {
  const t = useT('list');
  const f = useFormat();
  const usual = usualProducts(suggestions, list.items);
  if (usual.length === 0) return null;

  const add = (s: Suggestion) =>
    run(async () => {
      let storeId = matchingStore(list.stores, s.store)?.id ?? null;
      if (storeId === null && s.store) {
        // The server returns the existing store when one with this name and location exists.
        const res = await callApi<{ id: number }>(`/lists/${list.id}/stores`, 'POST', s.store);
        storeId = res!.id;
      }
      await callApi(`/lists/${list.id}/items`, 'POST', {
        name: s.name,
        unit: s.unit ?? t('defaultUnit'),
        quantity: numberText(s.quantity),
        price: numberText(s.price),
        description: s.description ?? '',
        storeId,
        photoFrom: s.photoItemId,
      });
      trackEvent('item_added', { source: 'usual', with_photo: !!s.photoItemId });
      onAdded();
    });

  return (
    <Panel>
      <h2 className="font-display text-lg font-semibold">{t('usualTitle')}</h2>
      <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">{t('usualHint')}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {usual.map((s) => (
          <button
            key={`${s.name}|${s.unit}`}
            type="button"
            onClick={() => add(s)}
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-sm hover:border-quake dark:border-paper/15 dark:bg-paper/5"
          >
            {s.photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- authenticated API image
              <img src={thumbUrl(s.photo)} alt="" className="size-5 rounded-full object-cover" />
            ) : (
              <span aria-hidden className="text-quake">
                +
              </span>
            )}
            <span className="font-medium">{s.name}</span>
            <span className="text-xs text-ink/60 dark:text-paper/60">
              {formatQuantity(s.quantity, s.unit)}
              {s.price === null ? '' : ` · ${f.money(s.price, list.currency)}`}
            </span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

/** The small photo; a tap opens the full one, fitted to the screen (ADR 0040). */
function PhotoThumb({ src, name, large }: { src: string; name: string; large: boolean }) {
  const t = useT('list');
  return (
    <ZoomableImage
      src={src}
      alt={t('photoOf', { name })}
      className={cn('shrink-0 overflow-hidden rounded-md', large ? 'size-14' : 'size-10')}
      imgClassName="size-full object-cover"
    />
  );
}

function ItemRow({
  item,
  list,
  shopping,
  run,
}: {
  item: Item;
  list: ListSnapshot;
  shopping: boolean;
  run: Run;
}) {
  const t = useT('list');
  const tErr = useT('errors');
  const f = useFormat();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ItemDraft>(emptyItem);
  const photoInput = useId();
  const line = lineTotal(item);
  const path = `/lists/${list.id}/items/${item.id}`;

  if (editing && !shopping) {
    return (
      <li className="p-4">
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const storeId = draft.storeId ? Number(draft.storeId) : null;
            const ok = await run(() => callApi(path, 'PATCH', itemPayload(draft, storeId)));
            if (ok) setEditing(false);
          }}
        >
          <ItemFields
            draft={draft}
            setDraft={setDraft}
            stores={list.stores}
            currency={list.currency}
            allowNewStore={false}
          />
          <div className="flex items-center gap-3 text-sm">
            {item.photo ? <PhotoThumb src={item.photo} name={item.name} large /> : null}
            <label
              htmlFor={photoInput}
              className="cursor-pointer font-medium underline decoration-quake/50 underline-offset-2 hover:decoration-quake"
            >
              {item.photo ? t('changePhoto') : t('addPhoto')}
            </label>
            <input
              id={photoInput}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) {
                  run(async () => {
                    await uploadPhoto(list.id, item.id, file, tErr);
                    trackEvent('photo_added');
                  });
                }
              }}
            />
            {item.photo ? (
              <button
                type="button"
                className="text-ink/60 underline dark:text-paper/60"
                onClick={() => run(() => removePhoto(list.id, item.id))}
              >
                {t('removePhoto')}
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit">{t('save')}</Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              {t('cancel')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="ml-auto text-red-700 dark:text-red-400"
              onClick={() => run(() => callApi(path, 'DELETE'))}
            >
              {t('deleteItem')}
            </Button>
          </div>
        </form>
      </li>
    );
  }

  const wasted = item.done && item.dropped;
  const toggleDropped = () =>
    run(
      async () => {
        await callApi(path, 'PATCH', { dropped: !item.dropped });
        if (!item.dropped) trackEvent('item_not_needed', { already_bought: item.done });
      },
      (l) => ({
        ...l,
        items: l.items.map((i) => (i.id === item.id ? { ...i, dropped: !item.dropped } : i)),
      }),
    );

  return (
    <li
      className={cn(
        'flex items-start gap-3 px-4 py-3',
        shopping && 'py-4',
        // Bought and then not needed: the money is spent, so the row stays visible but darker.
        wasted && 'bg-ink/10 dark:bg-black/40',
      )}
    >
      <input
        type="checkbox"
        checked={item.done}
        onChange={() =>
          run(
            async () => {
              await callApi(path, 'PATCH', { done: !item.done });
              if (!item.done) trackEvent('item_bought');
            },
            (l) => ({
              ...l,
              items: l.items.map((i) => (i.id === item.id ? { ...i, done: !item.done } : i)),
            }),
          )
        }
        aria-label={
          item.done ? t('putBack', { name: item.name }) : t('tickOff', { name: item.name })
        }
        className={cn('mt-1 accent-quake', shopping ? 'size-6' : 'size-4')}
      />
      {item.photo ? <PhotoThumb src={item.photo} name={item.name} large={shopping} /> : null}
      <div
        className={cn(
          'min-w-0 flex-1',
          item.done && !item.dropped && 'text-ink/45 dark:text-paper/45',
          item.dropped && 'text-ink/50 dark:text-paper/50',
        )}
      >
        <p
          className={cn(
            'font-medium',
            shopping && 'text-lg',
            item.dropped && 'line-through decoration-2',
          )}
        >
          {item.name}{' '}
          <span className="font-normal text-ink/60 dark:text-paper/60">
            {item.quantity === null ? '' : '× '}
            {formatQuantity(item.quantity, item.unit)}
          </span>
        </p>
        {item.description ? (
          <p className="text-sm text-ink/70 dark:text-paper/70">{item.description}</p>
        ) : null}
        {wasted ? (
          <p className="mt-0.5 inline-flex items-center gap-1 rounded bg-ink/10 px-1.5 py-0.5 text-xs font-medium text-ink/80 dark:bg-paper/10 dark:text-paper/80">
            <span aria-hidden title={t('wasted')}>
              🙃
            </span>
            {t('wasted')}
          </p>
        ) : null}
        <p className="text-xs text-ink/50 dark:text-paper/50">
          {item.dropped && item.droppedByName
            ? t('struckBy', { name: item.droppedByName })
            : item.done && item.doneByName
              ? t('pickedBy', { name: item.doneByName })
              : item.addedByName
                ? t('addedBy', { name: item.addedByName })
                : null}
        </p>
      </div>
      <div
        className={cn(
          'text-right text-sm',
          item.dropped && !item.done && 'text-ink/40 line-through dark:text-paper/40',
        )}
      >
        {line === null ? (
          <span className="text-ink/40 dark:text-paper/40">{t('noPrice')}</span>
        ) : (
          <>
            <span className="font-medium">{f.money(line, list.currency)}</span>
            {item.quantity !== null && item.quantity !== 1 ? (
              <span className="block text-xs text-ink/50 dark:text-paper/50">
                {t('each', { amount: f.money(item.price!, list.currency) })}
              </span>
            ) : null}
            {item.estimatedPrice !== null && item.estimatedPrice !== item.price ? (
              <span
                className="block text-xs text-ink/50 dark:text-paper/50"
                title={
                  item.priceCorrectedByName
                    ? t('correctedBy', { name: item.priceCorrectedByName })
                    : undefined
                }
              >
                {t('planned', { amount: f.money(item.estimatedPrice, list.currency) })}
              </span>
            ) : null}
          </>
        )}
        <button
          type="button"
          onClick={toggleDropped}
          aria-pressed={item.dropped}
          aria-label={
            item.dropped
              ? t('neededAgainLabel', { name: item.name })
              : t('notNeededLabel', { name: item.name })
          }
          className="mt-1 block w-full text-right text-xs text-ink/60 underline hover:text-quake dark:text-paper/60"
        >
          {item.dropped ? t('neededAgain') : t('notNeeded')}
        </button>
        {shopping ? <CorrectPriceButton item={item} list={list} run={run} /> : null}
        {!shopping ? (
          <button
            type="button"
            className="mt-1 block w-full text-right text-xs text-ink/60 underline hover:text-quake dark:text-paper/60"
            onClick={() => {
              setDraft({
                name: item.name,
                quantity: item.quantity === null ? '' : String(item.quantity),
                unit: item.unit ?? '',
                price: item.price === null ? '' : String(item.price),
                description: item.description ?? '',
                storeId: item.storeId === null ? '' : String(item.storeId),
              });
              setEditing(true);
            }}
          >
            {t('edit')}
          </button>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Shopping mode: the price on the shelf differs from the planned one. A small dialog takes the
 * real price (per unit, like the list); the planned one is kept as the estimate and both go into
 * the price history (statistics: prices over time).
 */
function CorrectPriceButton({ item, list, run }: { item: Item; list: ListSnapshot; run: Run }) {
  const t = useT('list');
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const titleId = useId();
  const close = useCallback(() => setOpen(false), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const price = Number(value.replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(price) || price < 0) return;
    setBusy(true);
    const ok = await run(
      async () => {
        await callApi(`/lists/${list.id}/items/${item.id}/price`, 'PUT', { price: value });
        trackEvent('price_corrected');
      },
      (l) => ({
        ...l,
        items: l.items.map((i) =>
          i.id === item.id
            ? {
                ...i,
                estimatedPrice: i.estimatedPrice ?? i.price,
                price: Math.round(price * 100) / 100,
              }
            : i,
        ),
      }),
    );
    setBusy(false);
    if (ok) setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="mt-2 block w-full rounded-md border border-ink/20 px-2 py-1.5 text-right text-xs font-medium hover:bg-ink/5 dark:border-paper/20 dark:hover:bg-paper/10"
        onClick={() => {
          setValue(item.price === null ? '' : String(item.price));
          setOpen(true);
        }}
        aria-label={t('correctPriceLabel', { name: item.name })}
      >
        {t('correctPrice')}
      </button>
      <Sheet open={open} onClose={close} labelledBy={titleId} className="sm:max-w-sm">
        <form onSubmit={submit} className="space-y-4">
          <h2 id={titleId} className="font-display text-lg font-bold">
            {t('correctPriceTitle', { name: item.name })}
          </h2>
          <p className="text-sm text-ink/70 dark:text-paper/70">
            {item.price === null
              ? t('correctPriceNone')
              : t('correctPriceNow', { amount: String(item.price), currency: list.currency })}
          </p>
          <Field
            label={t('correctPriceField', { currency: list.currency })}
            hint={t('correctPriceHint')}
          >
            <Input
              inputMode="decimal"
              required
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="text-lg"
            />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy} className="min-h-11 flex-1">
              {t('correctPriceSave')}
            </Button>
            <Button type="button" variant="secondary" onClick={close} className="min-h-11 flex-1">
              {t('cancel')}
            </Button>
          </div>
        </form>
      </Sheet>
    </>
  );
}
