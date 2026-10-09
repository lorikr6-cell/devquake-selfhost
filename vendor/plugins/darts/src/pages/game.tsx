import { notFound, redirect } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localizePath } from '@devquake/ui';
import { brandedQrSvg } from '@devquake/ui/qr';
import { localeOf, translator } from '../i18n';
import { GameScreen, type ShareInfo } from '../components/game-screen';
import { pageScope } from '../components/guard';
import { HttpError } from '../lib/http';
import { gameView, habitVisits } from '../lib/data/games';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.game') };
}

/** A game for its players; a tournament's organiser and players are sent to watch it. */
export default async function GamePage({ params, ctx }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const { view, access } = await gameView(scope.db, id, scope.user.id).catch((err) => {
    if (err instanceof HttpError) notFound();
    throw err;
  });
  if (access === 'spectator') redirect(localizePath(`/watch/${view.watchCode}`, localeOf(ctx)));
  const habits =
    view.status === 'finished' ? [] : await habitVisits(scope.db, scope.user.id).catch(() => []);
  const share = (path: string, code: string): ShareInfo => {
    const url = `${ctx.baseUrl}${path}`;
    return { url, code, qr: brandedQrSvg(url, { margin: 1 }) };
  };
  return (
    <GameScreen
      initial={view}
      pollPath={`/games/${view.id}`}
      join={view.joinCode ? share(`/join/${view.joinCode}`, view.joinCode) : null}
      watch={view.watchCode ? share(`/watch/${view.watchCode}`, view.watchCode) : null}
      entryMode={scope.profile!.entryMode}
      favorite={scope.profile!.favoriteDouble}
      habits={habits}
    />
  );
}
