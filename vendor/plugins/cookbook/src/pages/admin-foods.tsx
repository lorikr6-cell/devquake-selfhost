import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, buttonClass, cn } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { FoodThumbImage } from '../components/food-icon';
import { pageScope } from '../components/guard';
import { Input, Panel, Select } from '../components/ui';
import { FOOD_KINDS, allFoods, thumbOf, type FoodKind } from '../lib/foods';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('foodAdmin.metaList') };
}

const fold = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * The food catalogue for DevQuake staff (others get a 404): every food with its thumbnail, kind
 * and energy, filtered by name and kind (a plain GET form, works without JS), and a way to edit
 * or add one.
 */
export default async function AdminFoods({ ctx, searchParams }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  if (!scope.user.isAdmin) notFound();
  const { locale } = scope;
  const t = translator(locale, 'foodAdmin');
  const tKind = translator(locale, 'foodKinds');
  const sp = (await searchParams) ?? {};
  const one = (v: unknown) => (Array.isArray(v) ? v[0] : v) as string | undefined;
  const q = (one(sp.q) ?? '').slice(0, 60);
  const kind = (FOOD_KINDS as readonly string[]).includes(one(sp.kind) ?? '')
    ? (one(sp.kind) as FoodKind)
    : '';

  const all = allFoods();
  const foods = all.filter(
    (f) =>
      (!kind || f.kind === kind) &&
      (!q ||
        f.id.includes(fold(q)) ||
        Object.values(f.name).some((name) => fold(name).includes(fold(q)))),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
          <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
        </div>
        <Link href="/admin/new-food" className={buttonClass('primary')}>
          {t('newFood')}
        </Link>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <Input
          name="q"
          defaultValue={q}
          aria-label={t('search')}
          placeholder={t('search')}
          className="sm:w-64"
        />
        <Select name="kind" defaultValue={kind} aria-label={t('kind')} className="sm:w-56">
          <option value="">{t('allKinds')}</option>
          {FOOD_KINDS.map((k) => (
            <option key={k} value={k}>
              {tKind(k)}
            </option>
          ))}
        </Select>
        <button type="submit" className={buttonClass('secondary')}>
          {t('search')}
        </button>
      </form>

      <p className="text-sm text-ink/60 dark:text-paper/60">
        {t('count', { count: foods.length })}
      </p>

      <Panel flush>
        <ul className="divide-y divide-ink/10 dark:divide-paper/10">
          {foods.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-4 py-2 text-sm">
              <FoodThumbImage thumb={thumbOf(f)} className="size-8" />
              <span className={cn('min-w-0 flex-1', f.active === false && 'opacity-60')}>
                <span className="font-medium">{f.name[locale]}</span>
                {locale !== 'en' ? (
                  <span className="text-ink/60 dark:text-paper/60"> · {f.name.en}</span>
                ) : null}
                <span className="block text-xs text-ink/60 dark:text-paper/60">
                  {tKind(f.kind)} · {f.id} · {Math.round(f.per100.kcal)} kcal
                  {f.active === false ? ` · ${t('inactive')}` : ''}
                </span>
              </span>
              <Link
                href={`/admin/foods/${f.id}`}
                className="shrink-0 text-quake underline-offset-2 hover:underline"
              >
                {t('edit')}
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
