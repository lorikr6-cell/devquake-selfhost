import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink, buttonClass } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { AddSetToPlan, OwnerControls, RecommendSet, SetComments } from '../components/set-actions';
import { cookbookLink } from '../lib/cookbook';
import { commentsOf, householdsOf, recommendedBy, setById } from '../lib/data';
import { todayIn } from '../lib/dates';
import { mealNutrition, slotIcon } from '../lib/plan';

export async function generateMetadata({ ctx, params }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const set =
    ctx.user && ctx.db && /^\d+$/.test(params.id ?? '')
      ? await setById(ctx.db, Number(params.id), ctx.user.id)
      : null;
  return { title: set ? t('meta.set', { title: set.title }) : t('meta.sets') };
}

/**
 * A saved meal: its parts (cookbook recipes open in the cookbook), nutrition per person, "Add to
 * my plan"; for public ones recommendations and comments; for the owner public/private, rename
 * and delete.
 */
export default async function SetPage({ ctx, params }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user, locale } = scope;
  const setId = Number(params.id);
  const set = Number.isSafeInteger(setId) && setId > 0 ? await setById(db, setId, user.id) : null;
  if (!set) notFound();
  const t = translator(locale, 'set');
  const tSlot = translator(locale, 'slots');
  const isOwner = set.ownerId === user.id;
  const timeZone = ctx.timeZone || 'UTC';
  const n = mealNutrition(set.items);
  const households = (await householdsOf(db, user.id)).map((h) => ({ id: h.id, name: h.name }));
  const comments = set.isPublic ? await commentsOf(db, set.id) : [];
  const recommended = set.isPublic && !isOwner ? await recommendedBy(db, set.id, user.id) : false;
  const cookbook = await cookbookLink(ctx.links);
  const deepLink = (ref: string) =>
    ctx.links && cookbook?.state === 'connected'
      ? ctx.links.deepLink('cookbook', 'recipe', { id: ref }, { returnTo: `/meals/${set.id}` })
      : null;

  return (
    <article className="space-y-6">
      <div>
        <BackLink href="/meals" className="text-sm text-ink/60 hover:text-quake dark:text-paper/60">
          {t('back')}
        </BackLink>
        <h1 className="font-display text-3xl font-bold">
          <span aria-hidden>{slotIcon(set.slot)} </span>
          {set.title}
        </h1>
        <p className="text-sm text-ink/70 dark:text-paper/70">
          {[
            tSlot(set.slot),
            t('servings', { count: set.servings }),
            isOwner ? null : t('by', { name: set.ownerName }),
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {set.description ? <p className="mt-2 whitespace-pre-wrap">{set.description}</p> : null}
        {set.isPublic ? (
          <div className="mt-3">
            <RecommendSet
              setId={set.id}
              initial={recommended}
              count={set.recommendations}
              canRecommend={!isOwner}
            />
          </div>
        ) : null}
      </div>

      <section className="space-y-2">
        <h2 className="font-display text-xl font-bold">{t('parts')}</h2>
        <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 text-sm dark:divide-paper/10 dark:border-paper/10">
          {set.items.map((i, index) => {
            const url = i.recipeRef ? deepLink(i.recipeRef) : null;
            return (
              <li
                key={index}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2"
              >
                <span>
                  <span aria-hidden>{i.recipeRef ? '📖 ' : '• '}</span>
                  {url ? (
                    <a href={url} className="font-medium underline-offset-2 hover:underline">
                      {i.name}
                    </a>
                  ) : (
                    <span className="font-medium">{i.name}</span>
                  )}
                  {i.qty !== null ? (
                    <span className="text-ink/60 dark:text-paper/60">
                      {' '}
                      · {i.qty}
                      {i.unit ? ` ${i.unit}` : ''}
                    </span>
                  ) : null}
                </span>
                {i.kcal !== null ? (
                  <span className="text-xs text-ink/60 dark:text-paper/60">
                    {t('kcal', { kcal: Math.round(i.kcal) })}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
        {n.kcal !== null ? (
          <p className="text-sm text-ink/70 dark:text-paper/70">
            {t('perPerson', { kcal: Math.round(n.kcal), protein: Math.round(n.protein ?? 0) })}
          </p>
        ) : null}
        {cookbook && cookbook.state !== 'connected' && set.items.some((i) => i.recipeRef) ? (
          <p className="text-sm">
            <a
              href={cookbook.state === 'available' ? cookbook.connectUrl : cookbook.openUrl}
              className={buttonClass('secondary')}
            >
              {cookbook.state === 'available' ? t('connectCookbook') : t('getCookbook')}
            </a>
          </p>
        ) : null}
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl font-bold">{t('addToPlanTitle')}</h2>
        <AddSetToPlan
          setId={set.id}
          households={households}
          today={todayIn(timeZone)}
          slot={set.slot}
        />
      </section>

      {set.isPublic ? (
        <SetComments
          setId={set.id}
          comments={comments}
          meId={user.id}
          isOwner={isOwner}
          timeZone={timeZone}
        />
      ) : null}

      {isOwner ? (
        <OwnerControls
          setId={set.id}
          title={set.title}
          description={set.description}
          isPublic={set.isPublic}
        />
      ) : null}
    </article>
  );
}
