import { cookies } from 'next/headers';
import { cache } from 'react';
import type { PluginContext } from '@devquake/plugin-sdk';
import type { Locale } from '@devquake/ui';
import { SHOWN_CURRENCIES, chosenCurrency, convertCents } from '../lib/fx';
import { currentRates } from '../lib/fx-data';
import type { ShopFx } from './currency-client';

// The buyer's display currency for this request (ADR 0061), decided once by the shop's pages
// (shopScope, the root shop) and read by the frame and server-rendered prices.

const state = cache(() => ({ fx: null as ShopFx | null }));

/** Off unless the owner turned on "showCurrencies" in /admin-cp (DevQuake only). */
export async function prepareCurrency(
  ctx: PluginContext,
  base: string,
  locale: Locale,
): Promise<void> {
  state().fx = null;
  if (!ctx.settings || !(await ctx.settings.enabled('showCurrencies').catch(() => false))) return;
  const fetched = await currentRates();
  if (!fetched || !fetched.rates[base]) return;
  const options = SHOWN_CURRENCIES.filter((c) => c === base || fetched.rates[c]);
  const picked = (await cookies()).get('dq_store_currency')?.value;
  const wanted = chosenCurrency(picked, locale, base);
  const code = options.includes(wanted as (typeof options)[number]) ? wanted : base;
  // Units of `code` per unit of `base`, from a large amount for precision.
  const factor = (convertCents(1_000_000, base, code, fetched.rates) ?? 1_000_000) / 1_000_000;
  state().fx = { base, code, factor, date: fetched.date, options: [...options] };
}

/** The display currency of this request, or null when prices show only the shop's currency. */
export const shopFx = () => state().fx;
