import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { householdScope } from '../components/guard';
import { DeleteHousehold, Eaters, Members, SettingsForm } from '../components/household-forms';
import { Panel } from '../components/ui';
import { activeInvite, eatersOf, membersOf } from '../lib/data';

export async function generateMetadata({ ctx, params }: PluginPageProps) {
  const scope = await householdScope(ctx, params);
  const t = translator(localeOf(ctx));
  return {
    title: scope.ok ? t('meta.household', { name: scope.me.household.name }) : t('meta.home'),
  };
}

/** The household: who eats and how much, diet, allergens, dislikes, targets, members, invite. */
export default async function HouseholdPage({ ctx, params }: PluginPageProps) {
  const scope = await householdScope(ctx, params);
  if (!scope.ok) return scope.notice;
  const { db, me, user, locale } = scope;
  const h = me.household;
  const t = translator(locale, 'household');
  const tDiet = translator(locale, 'diets');
  const tAll = translator(locale, 'allergens');
  const [eaters, members] = await Promise.all([eatersOf(db, h.id), membersOf(db, h.id)]);

  return (
    <div className="space-y-8">
      <div>
        <BackLink
          href={`/h/${h.id}`}
          className="text-sm text-ink/60 hover:text-quake dark:text-paper/60"
        >
          {t('back')}
        </BackLink>
        <h1 className="font-display text-3xl font-bold">{h.name}</h1>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">{t('eatersTitle')}</h2>
        <p className="text-sm text-ink/70 dark:text-paper/70">{t('eatersIntro')}</p>
        <Eaters householdId={h.id} eaters={eaters} canEdit={me.isPlanner} />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">{t('settingsTitle')}</h2>
        {me.isPlanner ? (
          <Panel>
            <SettingsForm
              householdId={h.id}
              initial={{
                name: h.name,
                diet: h.diet ?? '',
                avoid: h.avoid,
                dislikes: h.dislikes ?? '',
                kcalTarget: String(h.kcalTarget),
                proteinTarget: String(h.proteinTarget),
              }}
            />
          </Panel>
        ) : (
          <Panel>
            <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[minmax(8rem,auto)_1fr]">
              <dt className="text-ink/60 dark:text-paper/60">{t('diet')}</dt>
              <dd>{h.diet ? tDiet(h.diet) : t('anyDiet')}</dd>
              <dt className="text-ink/60 dark:text-paper/60">{t('avoid')}</dt>
              <dd>{h.avoid.length ? h.avoid.map((a) => tAll(a)).join(', ') : '—'}</dd>
              <dt className="text-ink/60 dark:text-paper/60">{t('dislikes')}</dt>
              <dd className="whitespace-pre-wrap">{h.dislikes ?? '—'}</dd>
              <dt className="text-ink/60 dark:text-paper/60">{t('kcalTarget')}</dt>
              <dd>
                {h.kcalTarget} kcal · {h.proteinTarget} g
              </dd>
            </dl>
          </Panel>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">{t('membersTitle')}</h2>
        <p className="text-sm text-ink/70 dark:text-paper/70">{t('membersIntro')}</p>
        <Members
          householdId={h.id}
          members={members}
          meId={user.id}
          ownerId={h.ownerId}
          isPlanner={me.isPlanner}
          invite={me.isPlanner ? await activeInvite(db, h.id) : null}
          baseUrl={ctx.baseUrl}
        />
      </section>

      {me.isOwner ? (
        <section className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-6 dark:border-paper/10">
          <p className="text-xs text-ink/60 dark:text-paper/60">{t('deleteHint')}</p>
          <DeleteHousehold householdId={h.id} name={h.name} />
        </section>
      ) : null}
    </div>
  );
}
