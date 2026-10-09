import type { Translate } from '@devquake/ui';
import { BULL } from '../lib/engine/darts';
import type {
  AtcOptions,
  CheckoutOptions,
  CountupOptions,
  CricketOptions,
  DrillTarget,
  GameOptions,
  GameType,
  KillerOptions,
  ShanghaiOptions,
  TargetsOptions,
  X01Options,
} from '../lib/engine/games';

// How games and their options read on the screens. `t` is the app translator (root keys).

/** "D16", "T20", "20", "25", "BULL". */
export function targetLabel(target: DrillTarget): string {
  if (target.n === BULL) return target.m === 2 ? 'BULL' : '25';
  return `${target.m === 3 ? 'T' : target.m === 2 ? 'D' : ''}${target.n}`;
}

/** The game's name: "501", "Cricket", "Around the Clock"... */
export function gameName(t: Translate, type: GameType, options: GameOptions): string {
  if (type === 'x01') return String((options as X01Options).start);
  return t(`games.names.${type}`);
}

/** The options that differ between games of a type, as a short line. */
export function optionsLine(t: Translate, type: GameType, options: GameOptions): string {
  const parts: string[] = [];
  switch (type) {
    case 'x01': {
      const o = options as X01Options;
      if (o.in === 'double') parts.push(t('games.options.inDouble'));
      parts.push(t(`games.options.out.${o.out}`));
      if (o.legs > 1) parts.push(t('games.options.firstTo', { count: o.legs }));
      break;
    }
    case 'cricket': {
      const o = options as CricketOptions;
      parts.push(t(`games.options.variant.${o.variant}`));
      if (o.legs > 1) parts.push(t('games.options.firstTo', { count: o.legs }));
      break;
    }
    case 'shanghai':
      parts.push(t('games.options.roundsCount', { count: (options as ShanghaiOptions).rounds }));
      break;
    case 'atc':
      parts.push(t(`games.options.hit.${(options as AtcOptions).hit}`));
      break;
    case 'killer':
      parts.push(t('games.options.livesCount', { count: (options as KillerOptions).lives }));
      break;
    case 'countup':
      parts.push(t('games.options.roundsCount', { count: (options as CountupOptions).rounds }));
      break;
    case 'targets': {
      const o = options as TargetsOptions;
      parts.push(o.targets.map(targetLabel).join(', '));
      parts.push(t('games.options.dartsEach', { count: o.dartsPerTarget }));
      break;
    }
    case 'checkout': {
      const o = options as CheckoutOptions;
      parts.push(o.finishes.join(', '));
      parts.push(t('games.options.dartsEach', { count: o.dartsPerFinish }));
      break;
    }
  }
  return parts.join(' · ');
}
