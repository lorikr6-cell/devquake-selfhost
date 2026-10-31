'use client';

import { useState, type FormEvent } from 'react';
import { Button, connectBlocked, connectLabel, useT } from '@devquake/ui';
import type { ShoppingItem } from '../lib/dishes';
import { callApi } from './call-api';
import { ErrorText, Input, Panel } from './ui';
import { useAction } from './use-action';

/** How another app stands for the visitor: connected, or the page to connect it. */
export interface AppLink {
  state: 'connected' | 'available' | 'needs-access';
  connectUrl: string;
  /** NPS points connecting costs (ADR 0082). */
  npsCost?: number;
  affordable?: boolean;
}

export interface DishSummary {
  id: number;
  title: string;
  allergens: string[];
  ingredients: number;
}

/** The connect suggestion shown instead of a feature while the app is not connected. */
function Connect({ link, text }: { link: AppLink | null; text: string }) {
  const t = useT('kitchenApps');
  if (!link) return null;
  return (
    <p className="text-sm text-ink/70 dark:text-paper/70">
      {text}{' '}
      {connectBlocked(link) ? (
        <span className="font-medium">{connectLabel(link, t('connect'))}</span>
      ) : (
        <a href={link.connectUrl} className="font-medium text-quake underline underline-offset-2">
          {connectLabel(link, t('connect')) ??
            (link.state === 'needs-access' ? t('getIt') : t('connect'))}
        </a>
      )}
    </p>
  );
}

/**
 * The organisation's dishes: picked from the visitor's Cookbook (a copy the organisation keeps),
 * each used by writing its name as a line of a menu.
 */
export function Dishes({
  orgId,
  dishes,
  cookbook,
}: {
  orgId: number;
  dishes: DishSummary[];
  cookbook: AppLink | null;
}) {
  const t = useT('kitchenApps');
  const ta = useT('allergens');
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<{ ref: string; title: string; servings: number }[] | null>(null);
  const { busy, error, act } = useAction();

  async function search(e: FormEvent) {
    e.preventDefault();
    await act(
      async () => {
        const res = await callApi<{ recipes: { ref: string; title: string; servings: number }[] }>(
          `/orgs/${orgId}/recipes?q=${encodeURIComponent(query)}`,
        );
        setHits(res?.recipes ?? []);
      },
      { after: () => undefined },
    );
  }

  return (
    <Panel>
      <h2 className="font-semibold">{t('dishesTitle')}</h2>
      <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('dishesIntro')}</p>
      {dishes.length ? (
        <ul className="mt-3 divide-y divide-ink/10 text-sm dark:divide-paper/10">
          {dishes.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                <span className="font-medium">{d.title}</span>
                <span className="ml-2 text-xs text-ink/60 dark:text-paper/60">
                  {t('ingredientsCount', { count: d.ingredients })}
                  {d.allergens.length ? ` · ${d.allergens.map((a) => ta(a)).join(', ')}` : ''}
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() =>
                  act(() => callApi(`/orgs/${orgId}/dishes/${d.id}`, 'DELETE'), {
                    success: t('removed'),
                  })
                }
              >
                {t('remove')}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink/60 dark:text-paper/60">{t('noDishes')}</p>
      )}
      <div className="mt-4">
        {cookbook?.state === 'connected' ? (
          <>
            <form onSubmit={search} className="flex flex-wrap gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                className="min-w-48 flex-1"
                maxLength={80}
              />
              <Button type="submit" variant="secondary" disabled={busy}>
                {t('search')}
              </Button>
            </form>
            {hits ? (
              hits.length ? (
                <ul className="mt-3 space-y-1 text-sm">
                  {hits.map((h) => (
                    <li key={h.ref} className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        {h.title}{' '}
                        <span className="text-xs text-ink/60 dark:text-paper/60">
                          {t('servings', { count: h.servings })}
                        </span>
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busy}
                        onClick={() =>
                          act(() => callApi(`/orgs/${orgId}/dishes`, 'POST', { ref: h.ref }), {
                            success: t('added', { name: h.title }),
                          })
                        }
                      >
                        {t('add')}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-ink/60 dark:text-paper/60">{t('noRecipes')}</p>
              )
            ) : null}
          </>
        ) : (
          <Connect link={cookbook} text={t('cookbookOffer')} />
        )}
      </div>
      <ErrorText>{error}</ErrorText>
    </Panel>
  );
}

interface WeekPreview {
  items: ShoppingItem[];
  lists: { id: number; name: string }[];
  chosen: { id: number; name: string } | null;
}

/** "Send the week's ingredients to Shopping": preview, pick the purchasing list, send. */
export function ShoppingWeek({
  orgId,
  week,
  shopping,
}: {
  orgId: number;
  week: string;
  shopping: AppLink | null;
}) {
  const t = useT('kitchenApps');
  const [preview, setPreview] = useState<WeekPreview | null>(null);
  const [listId, setListId] = useState<number | null>(null);
  const [again, setAgain] = useState(false);
  const { busy, error, act, confirm } = useAction();

  if (shopping?.state !== 'connected') {
    return (
      <Panel>
        <h2 className="font-semibold">{t('shoppingTitle')}</h2>
        <div className="mt-1">
          <Connect link={shopping} text={t('shoppingOffer')} />
        </div>
      </Panel>
    );
  }

  async function load() {
    await act(
      async () => {
        const res = await callApi<WeekPreview>(`/orgs/${orgId}/shopping?week=${week}`);
        setPreview(res);
        setListId(res?.chosen?.id ?? res?.lists[0]?.id ?? null);
        setAgain(false);
      },
      { after: () => undefined },
    );
  }

  async function send(force: boolean) {
    const list = preview?.lists.find((l) => l.id === listId) ?? preview?.chosen;
    if (!list) return;
    await act(
      async () => {
        const res = await callApi<{ sent: number; again: boolean }>(
          `/orgs/${orgId}/shopping`,
          'POST',
          { week, listId: list.id, listName: list.name, force },
        );
        if (res?.again) {
          setAgain(true);
          throw new Error(t('alreadySent'));
        }
      },
      { success: t('sent', { list: list.name }), after: () => setPreview(null) },
    );
  }

  return (
    <Panel>
      <h2 className="font-semibold">{t('shoppingTitle')}</h2>
      <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('shoppingIntro')}</p>
      {!preview ? (
        <Button type="button" variant="secondary" className="mt-3" disabled={busy} onClick={load}>
          {t('prepare')}
        </Button>
      ) : preview.items.length === 0 ? (
        <p className="mt-3 text-sm text-ink/60 dark:text-paper/60">{t('nothingToBuy')}</p>
      ) : (
        <div className="mt-3 space-y-3">
          <ul className="max-h-72 overflow-y-auto rounded-md border border-ink/10 p-2 text-sm dark:border-paper/10">
            {preview.items.map((i, n) => (
              <li key={n} className="flex justify-between gap-3 py-0.5">
                <span>{i.name}</span>
                <span className="text-ink/70 tabular-nums dark:text-paper/70">
                  {i.quantity === null ? '—' : `${i.quantity} ${i.unit ?? ''}`}
                </span>
              </li>
            ))}
          </ul>
          {preview.lists.length ? (
            <label className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{t('list')}</span>
              <select
                value={listId ?? ''}
                onChange={(e) => setListId(Number(e.target.value))}
                className="rounded-md border border-ink/15 bg-white px-2 py-1.5 dark:border-paper/15 dark:bg-ink"
              >
                {preview.lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                    {preview.chosen?.id === l.id ? ` · ${t('purchasing')}` : ''}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="text-sm text-amber-800 dark:text-amber-300">{t('noLists')}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy || listId === null}
              onClick={async () => {
                if (
                  again &&
                  !(await confirm({
                    title: t('alreadySent'),
                    body: t('sendAgainBody'),
                    confirmLabel: t('sendAgain'),
                  }))
                ) {
                  return;
                }
                await send(again);
              }}
            >
              {again ? t('sendAgain') : t('send', { count: preview.items.length })}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setPreview(null)}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      )}
      <ErrorText>{error}</ErrorText>
    </Panel>
  );
}

/** "Insert a dish" in the menu editor: adds the dish's name as a line. */
export function DishPicker({
  dishes,
  onPick,
}: {
  dishes: string[];
  onPick: (title: string) => void;
}) {
  const t = useT('kitchenApps');
  if (dishes.length === 0) return null;
  return (
    <select
      value=""
      aria-label={t('insertDish')}
      onChange={(e) => e.target.value && onPick(e.target.value)}
      className="rounded-md border border-ink/15 bg-white px-2 py-1 text-sm dark:border-paper/15 dark:bg-ink"
    >
      <option value="">{t('insertDish')}</option>
      {dishes.map((d) => (
        <option key={d} value={d}>
          {d}
        </option>
      ))}
    </select>
  );
}
