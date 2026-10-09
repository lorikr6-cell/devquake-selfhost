import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { GameScreen } from '../components/game-screen';
import { pageScope } from '../components/guard';
import { HttpError } from '../lib/http';
import { watchView } from '../lib/data/games';
import { CODE_PATTERN, cleanCode } from '../lib/model';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.watch') };
}

/**
 * Watching a game with its watch code, read-only and live. Any signed-in DevQuake member may
 * open it (a signed-in route, ADR 0022): the code is what was shared.
 */
export default async function Watch({ params, ctx }: PluginPageProps) {
  const scope = await pageScope(ctx, false);
  if (!scope.ok) return scope.notice;
  const code = cleanCode(params.code);
  if (!CODE_PATTERN.test(code)) notFound();
  const view = await watchView(scope.db, code).catch((err) => {
    if (err instanceof HttpError) notFound();
    throw err;
  });
  return (
    <GameScreen
      initial={view}
      pollPath={`/watch/${code}`}
      join={null}
      watch={null}
      entryMode="board"
      favorite={null}
    />
  );
}
