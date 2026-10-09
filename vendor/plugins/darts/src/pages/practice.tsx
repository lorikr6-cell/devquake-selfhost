import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { DrillCards } from '../components/drill-cards';
import { GameList } from '../components/game-list';
import { pageScope } from '../components/guard';
import { NewGame } from '../components/new-game';
import { Empty, PageTitle, SectionTitle } from '../components/ui';
import { listDrills } from '../lib/data/drills';
import { myGames } from '../lib/data/games';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.practice') };
}

/** Practice alone: any game or drill, the drills made for you, your sessions. */
export default async function Practice({ ctx }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const locale = localeOf(ctx);
  const t = translator(locale);
  const [drills, games] = await Promise.all([
    listDrills(scope.db, scope.user.id),
    myGames(scope.db, scope.user.id, { mode: 'practice', limit: 20 }),
  ]);
  return (
    <div className="space-y-8">
      <PageTitle title={t('modes.practice.title')} intro={t('practice.intro')} />
      <section>
        <SectionTitle>{t('practice.drills')}</SectionTitle>
        <p className="mb-3 text-sm text-ink/70 dark:text-paper/70">{t('practice.drillsIntro')}</p>
        <DrillCards drills={drills} />
      </section>
      <section>
        <SectionTitle>{t('practice.new')}</SectionTitle>
        <NewGame mode="practice" />
      </section>
      <section>
        <SectionTitle>{t('practice.sessions')}</SectionTitle>
        {games.length ? (
          <GameList games={games} t={t} timeZone={ctx.timeZone ?? 'UTC'} locale={locale} />
        ) : (
          <Empty>{t('practice.none')}</Empty>
        )}
      </section>
    </div>
  );
}
