import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, buttonClass } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { GameList } from '../components/game-list';
import { pageScope } from '../components/guard';
import { ModeIcon } from '../components/icons';
import { JoinCodeForm } from '../components/join';
import { Panel, SectionTitle } from '../components/ui';
import { MODES } from '../lib/engine/games';
import { myGames } from '../lib/data/games';
import { myTournaments } from '../lib/data/tournaments';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.home') };
}

const HREF = { practice: '/practice', casual: '/casual', tournament: '/tournaments' } as const;

/** The start: the three ways to play, games to continue, a code to join, the statistics. */
export default async function Home({ ctx }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user, profile } = scope;
  const locale = localeOf(ctx);
  const t = translator(locale);
  const [active, tournaments] = await Promise.all([
    myGames(db, user.id, { active: true, limit: 10 }),
    myTournaments(db, user.id),
  ]);
  const myMatches = tournaments.filter((x) => x.myGameId !== null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">
          {t('home.hello', { name: profile!.nickname })}
        </h1>
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('home.intro')}</p>
      </div>

      {myMatches.length ? (
        <Panel className="border-quake bg-quake/10">
          {myMatches.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-3">
              <p>
                <span className="font-display text-lg font-bold">{t('home.yourMatch')}</span>
                <span className="block text-sm text-ink/70 dark:text-paper/70">
                  {m.name}
                  {m.myBoard
                    ? ` · ${t('home.onBoard', { board: m.myBoard })}`
                    : ` · ${t('home.waitingBoard')}`}
                </span>
              </p>
              <Link href={`/games/${m.myGameId}`} className={buttonClass('primary', 'min-h-11')}>
                {t('home.play')}
              </Link>
            </div>
          ))}
        </Panel>
      ) : null}

      <ul className="grid gap-3 sm:grid-cols-3">
        {MODES.map((mode) => (
          <li key={mode}>
            <Link
              href={HREF[mode]}
              className="flex h-full flex-col items-start gap-2 rounded-xl border border-ink/10 bg-white/70 p-5 transition-colors hover:border-quake dark:border-paper/10 dark:bg-paper/5"
            >
              <ModeIcon mode={mode} className="size-14 text-ink dark:text-paper" />
              <span className="font-display text-xl font-bold">{t(`modes.${mode}.title`)}</span>
              <span className="text-sm text-ink/70 dark:text-paper/70">
                {t(`modes.${mode}.body`)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {active.length ? (
        <section>
          <SectionTitle>{t('home.continue')}</SectionTitle>
          <GameList games={active} t={t} timeZone={ctx.timeZone ?? 'UTC'} locale={locale} />
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Panel>
          <JoinCodeForm label={t('home.joinLabel')} />
          <p className="mt-2 text-xs text-ink/60 dark:text-paper/60">{t('home.joinHint')}</p>
        </Panel>
        <Panel className="flex flex-col items-start gap-2">
          <p className="font-display text-lg font-bold">{t('home.statsTitle')}</p>
          <p className="text-sm text-ink/70 dark:text-paper/70">{t('home.statsBody')}</p>
          <Link href="/stats" className={buttonClass('secondary')}>
            {t('home.statsLink')}
          </Link>
        </Panel>
      </div>
    </div>
  );
}
