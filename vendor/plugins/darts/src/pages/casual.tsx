import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { GameList } from '../components/game-list';
import { pageScope } from '../components/guard';
import { JoinCodeForm } from '../components/join';
import { NewGame } from '../components/new-game';
import { Empty, PageTitle, Panel, SectionTitle } from '../components/ui';
import { myGames } from '../lib/data/games';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.casual') };
}

/** Casual games: start one and invite players with a code or QR code, or join one. */
export default async function Casual({ ctx }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const locale = localeOf(ctx);
  const t = translator(locale);
  const games = await myGames(scope.db, scope.user.id, { mode: 'casual', limit: 30 });
  return (
    <div className="space-y-8">
      <PageTitle title={t('modes.casual.title')} intro={t('casual.intro')} />
      <Panel>
        <JoinCodeForm label={t('casual.join')} />
      </Panel>
      <section>
        <SectionTitle>{t('casual.new')}</SectionTitle>
        <NewGame mode="casual" />
      </section>
      <section>
        <SectionTitle>{t('casual.games')}</SectionTitle>
        {games.length ? (
          <GameList games={games} t={t} timeZone={ctx.timeZone ?? 'UTC'} locale={locale} />
        ) : (
          <Empty>{t('casual.none')}</Empty>
        )}
      </section>
    </div>
  );
}
