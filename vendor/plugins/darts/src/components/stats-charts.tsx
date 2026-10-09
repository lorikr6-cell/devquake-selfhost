'use client';

import { useT } from '@devquake/ui';
import type { Skill } from '../lib/stats';

// The statistics page's charts: one measure each, one hue (the DevQuake orange), values written
// next to the bars and a hover title on each, so nothing depends on colour alone.

const BAR = '#ea580c';

/** Six skills, 0–100, as horizontal bars; skills without enough darts say so. */
export function SkillBars({ skills }: { skills: Skill[] }) {
  const t = useT('stats');
  const tSkill = useT('skills');
  return (
    <ul className="space-y-3">
      {skills.map((s) => (
        <li key={s.key}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-medium">{tSkill(s.key)}</span>
            <span className="tabular-nums text-ink/70 dark:text-paper/70">
              {s.score === null ? t('notEnough') : t('scoreOf', { score: s.score })}
            </span>
          </div>
          <svg
            viewBox="0 0 100 10"
            preserveAspectRatio="none"
            className="mt-1 h-3 w-full"
            role="img"
            aria-label={`${tSkill(s.key)}: ${s.score === null ? t('notEnough') : t('scoreOf', { score: s.score })}`}
          >
            <title>
              {s.score === null
                ? t('notEnough')
                : t(`skillValue.${s.key}`, { value: formatValue(s) })}
            </title>
            <rect width="100" height="10" rx="2" className="fill-ink/10 dark:fill-paper/15" />
            {s.score ? <rect width={s.score} height="10" rx="2" fill={BAR} /> : null}
          </svg>
          <p className="mt-0.5 text-xs text-ink/60 dark:text-paper/60">
            {s.score === null
              ? t('sampleNeeded', { count: s.sample })
              : t(`skillValue.${s.key}`, { value: formatValue(s) })}
          </p>
        </li>
      ))}
    </ul>
  );
}

function formatValue(s: Skill): string {
  if (s.value === null) return '–';
  if (s.key === 'scoring') return s.value.toFixed(1);
  if (s.key === 'consistency') return `${Math.round(s.value * 100)}%`;
  return `${Math.round(s.value * 100)}%`;
}

/** The visit totals thrown most often: bars with the count written at the end. */
export function CountBars({
  rows,
  label,
}: {
  rows: { label: string; count: number }[];
  label: string;
}) {
  const t = useT('stats');
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div>
      <ul aria-label={label} className="space-y-1.5">
        {rows.map((r) => (
          <li
            key={r.label}
            className="grid grid-cols-[3.5rem_1fr_2.5rem] items-center gap-2 text-sm"
          >
            <span className="text-right font-mono font-bold">{r.label}</span>
            <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="h-4 w-full" aria-hidden>
              <title>{t('times', { count: r.count })}</title>
              <rect width={Math.max(2, (r.count / max) * 100)} height="10" rx="2" fill={BAR} />
            </svg>
            <span className="tabular-nums text-ink/70 dark:text-paper/70">{r.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A headline number. */
export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white/70 p-4 dark:border-paper/10 dark:bg-paper/5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink/60 dark:text-paper/60">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl font-bold tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-ink/60 dark:text-paper/60">{hint}</p> : null}
    </div>
  );
}
