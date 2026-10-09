import { redirect } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink, LOCALE_TAGS, localizePath } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { gameName, optionsLine } from '../components/game-text';
import { pageScope } from '../components/guard';
import { JoinButton } from '../components/join';
import { Notice } from '../components/ui';
import { loadGame, setupOf } from '../lib/data/common';
import { resolveCode } from '../lib/data/games';
import { isTournamentPlayer, matchOnBoard, tournamentPreview } from '../lib/data/tournaments';
import { CODE_PATTERN, cleanCode, formatMoney } from '../lib/model';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.join') };
}

/**
 * Where QR codes and invite links lead: a casual game to join, a tournament (or one of its
 * boards) to join, the match on a board during a tournament, or a game to watch.
 */
export default async function Join({ params, ctx }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user } = scope;
  const locale = localeOf(ctx);
  const t = translator(locale);
  const go: (path: string) => never = (path) => redirect(localizePath(path, locale));
  const code = cleanCode(params.code);
  const target = CODE_PATTERN.test(code) ? await resolveCode(db, code) : null;

  if (!target) {
    return (
      <Notice title={t('join.invalidTitle')}>
        <p>{t('join.invalidBody')}</p>
        <p className="mt-3">
          <BackLink href="/" className="font-medium text-quake underline">
            {t('join.back')}
          </BackLink>
        </p>
      </Notice>
    );
  }
  if (target.kind === 'watch') go(`/watch/${target.code}`);

  if (target.kind === 'game') {
    const loaded = await loadGame(db, target.id);
    if (loaded.players.some((p) => p.user_id === user.id)) go(`/games/${target.id}`);
    const { type, options } = setupOf(loaded.game, loaded.players);
    const host = loaded.players.find((p) => p.user_id === loaded.game.owner_user_id);
    if (loaded.game.status !== 'waiting') {
      return (
        <Notice title={t('join.startedTitle')}>
          <p>{t('join.startedBody')}</p>
        </Notice>
      );
    }
    return (
      <Notice title={t('join.gameTitle', { name: host?.display_name ?? '' })}>
        <p>
          {gameName(t, type, options)} · {optionsLine(t, type, options)}
        </p>
        <p className="mt-1">{t('join.playersSoFar', { count: loaded.players.length })}</p>
        <JoinButton code={code} label={t('join.joinGame')} />
      </Notice>
    );
  }

  const tournamentId = target.kind === 'tournament' ? target.id : target.tournamentId;
  const preview = await tournamentPreview(db, tournamentId);
  const playing = await isTournamentPlayer(db, tournamentId, user.id);
  // During the tournament a board's QR code opens the match on it.
  if (target.kind === 'board' && preview.status === 'running') {
    const match = await matchOnBoard(db, target.boardId);
    if (match) go(`/games/${match.id}`);
  }
  if (playing && (target.kind === 'tournament' || preview.status !== 'registration')) {
    go(`/tournaments/${tournamentId}`);
  }
  if (preview.status !== 'registration') {
    return (
      <Notice title={t('join.closedTitle', { name: preview.name })}>
        <p>{t('join.closedBody')}</p>
      </Notice>
    );
  }
  return (
    <Notice title={t('join.tournamentTitle', { name: preview.name })}>
      <p>
        {t('join.tournamentBody', {
          owner: preview.ownerName,
          game: t(`games.names.${preview.type}`),
          players: preview.players,
        })}
      </p>
      {preview.feeCents > 0 ? (
        <p className="mt-1">
          {t('join.fee', {
            fee: formatMoney(preview.feeCents, preview.currency, LOCALE_TAGS[locale]),
          })}
        </p>
      ) : null}
      <JoinButton
        code={code}
        label={target.kind === 'board' ? t('join.joinOnBoard') : t('join.joinTournament')}
      />
    </Notice>
  );
}
