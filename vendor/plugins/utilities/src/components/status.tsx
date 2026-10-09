import { cn, type Translate } from '@devquake/ui';
import type { BillStatus, LineState } from '../lib/split';

// Bill and payment states: always an icon AND a label, never colour alone.

const STATUS_STYLE: Record<BillStatus, { icon: string; className: string }> = {
  paid: { icon: '✔', className: 'text-emerald-700 dark:text-emerald-400' },
  open: { icon: '⚠', className: 'text-amber-700 dark:text-amber-400' },
  awaiting: { icon: '⏳', className: 'text-ink/60 dark:text-paper/60' },
};

/** The bill's state: green check when fully paid, warning when payments do not cover it. */
export function StatusBadge({
  status,
  t,
  compact = false,
}: {
  status: BillStatus;
  /** translator for the `status` namespace */
  t: Translate;
  compact?: boolean;
}) {
  const style = STATUS_STYLE[status];
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-sm font-medium', style.className)}
      title={compact ? t(status) : undefined}
    >
      <span aria-hidden>{style.icon}</span>
      <span className={compact ? 'sr-only' : undefined}>{t(status)}</span>
    </span>
  );
}

/** Text colour for money of a bill in this state (warning colour when not covered). */
export function statusTextClass(status: BillStatus) {
  return status === 'open' ? STATUS_STYLE.open.className : undefined;
}

const LINE_STYLE: Record<LineState, string> = {
  owner: 'text-ink/60 dark:text-paper/60',
  pending: 'text-ink/60 dark:text-paper/60',
  unpaid: 'text-amber-700 dark:text-amber-400',
  underpaid: 'text-amber-700 dark:text-amber-400',
  paid: 'text-emerald-700 dark:text-emerald-400',
  overpaid: 'text-emerald-700 dark:text-emerald-400',
};

const LINE_ICON: Record<LineState, string> = {
  owner: '★',
  pending: '⏳',
  unpaid: '⚠',
  underpaid: '⚠',
  paid: '✔',
  overpaid: '✔',
};

export function LineBadge({ state, t }: { state: LineState; t: Translate }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', LINE_STYLE[state])}>
      <span aria-hidden>{LINE_ICON[state]}</span>
      {t(state)}
    </span>
  );
}
