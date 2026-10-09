'use client';

import { useState } from 'react';
import { Button, useT } from '@devquake/ui';
import { BULL } from '../lib/engine/darts';
import {
  COUNTUP_ROUNDS,
  DRILL_DARTS,
  KILLER_LIVES,
  MAX_DRILL_TARGETS,
  MAX_LEGS,
  X01_STARTS,
  type AtcOptions,
  type CheckoutOptions,
  type CountupOptions,
  type CricketOptions,
  type DrillTarget,
  type GameOptions,
  type GameType,
  type KillerOptions,
  type ShanghaiOptions,
  type TargetsOptions,
  type X01Options,
} from '../lib/engine/games';
import { targetLabel } from './game-text';
import { Field, Input, Segmented, Select } from './ui';

/** The options of one game type, as form controls. */
export function GameOptionsEditor({
  type,
  options,
  onChange,
}: {
  type: GameType;
  options: GameOptions;
  onChange: (options: GameOptions) => void;
}) {
  const t = useT('games.options');
  const set = <T extends GameOptions>(patch: Partial<T>) =>
    onChange({ ...(options as T), ...patch });
  const legs = (value: number, apply: (legs: number) => void) => (
    <Field
      label={t('legs')}
      className="max-w-prose [&_select]:max-w-48"
      hint={<span className="block min-h-10">{t('help.legs', { count: value })}</span>}
    >
      <Select value={value} onChange={(e) => apply(Number(e.target.value))}>
        {Array.from({ length: MAX_LEGS }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {t('firstTo', { count: n })}
          </option>
        ))}
      </Select>
    </Field>
  );

  switch (type) {
    case 'x01': {
      const o = options as X01Options;
      return (
        <div className="space-y-4">
          <Segmented
            name="start"
            label={t('start')}
            value={o.start}
            options={X01_STARTS.map((s) => ({ value: s, label: String(s) }))}
            onChange={(start) => set<X01Options>({ start })}
            hint={t(`help.start.${o.start}`)}
          />
          <Segmented
            name="in"
            label={t('inLabel')}
            value={o.in}
            options={[
              { value: 'straight', label: t('in.straight') },
              { value: 'double', label: t('in.double') },
            ]}
            onChange={(v) => set<X01Options>({ in: v })}
            hint={t(`help.in.${o.in}`)}
          />
          <Segmented
            name="out"
            label={t('outLabel')}
            value={o.out}
            options={(['double', 'single', 'master'] as const).map((v) => ({
              value: v,
              label: t(`out.${v}`),
            }))}
            onChange={(v) => set<X01Options>({ out: v })}
            hint={t(`help.out.${o.out}`)}
          />
          {legs(o.legs, (l) => set<X01Options>({ legs: l }))}
        </div>
      );
    }
    case 'cricket': {
      const o = options as CricketOptions;
      return (
        <div className="space-y-4">
          <Segmented
            name="variant"
            label={t('variantLabel')}
            value={o.variant}
            options={(['standard', 'cutthroat'] as const).map((v) => ({
              value: v,
              label: t(`variant.${v}`),
            }))}
            onChange={(v) => set<CricketOptions>({ variant: v })}
            hint={t(`help.variant.${o.variant}`)}
          />
          {legs(o.legs, (l) => set<CricketOptions>({ legs: l }))}
        </div>
      );
    }
    case 'shanghai':
      return (
        <Segmented
          name="rounds"
          label={t('rounds')}
          value={(options as ShanghaiOptions).rounds}
          options={[7, 20].map((r) => ({ value: r, label: t('roundsCount', { count: r }) }))}
          onChange={(r) => set<ShanghaiOptions>({ rounds: r as 7 | 20 })}
          hint={t(`help.shanghaiRounds.${(options as ShanghaiOptions).rounds}`)}
        />
      );
    case 'atc':
      return (
        <Segmented
          name="hit"
          label={t('hitLabel')}
          value={(options as AtcOptions).hit}
          options={(['any', 'doubles'] as const).map((v) => ({ value: v, label: t(`hit.${v}`) }))}
          onChange={(v) => set<AtcOptions>({ hit: v })}
          hint={t(`help.hit.${(options as AtcOptions).hit}`)}
        />
      );
    case 'killer':
      return (
        <Segmented
          name="lives"
          label={t('lives')}
          value={(options as KillerOptions).lives}
          options={KILLER_LIVES.map((l) => ({ value: l, label: t('livesCount', { count: l }) }))}
          onChange={(l) => set<KillerOptions>({ lives: l })}
          hint={t('help.lives', { count: (options as KillerOptions).lives })}
        />
      );
    case 'countup':
      return (
        <Segmented
          name="rounds"
          label={t('rounds')}
          value={(options as CountupOptions).rounds}
          options={COUNTUP_ROUNDS.map((r) => ({ value: r, label: t('roundsCount', { count: r }) }))}
          onChange={(r) => set<CountupOptions>({ rounds: r })}
          hint={t('help.countupRounds', { count: (options as CountupOptions).rounds })}
        />
      );
    case 'targets':
      return <TargetsEditor options={options as TargetsOptions} onChange={onChange} />;
    case 'checkout': {
      const o = options as CheckoutOptions;
      return (
        <div className="space-y-4">
          <FinishesField
            value={o.finishes}
            onChange={(finishes) => set<CheckoutOptions>({ finishes })}
          />
          <Segmented
            name="dartsPerFinish"
            label={t('dartsPerFinish')}
            value={o.dartsPerFinish}
            options={DRILL_DARTS.map((d) => ({ value: d, label: String(d) }))}
            onChange={(d) => set<CheckoutOptions>({ dartsPerFinish: d })}
            hint={t('help.dartsPerFinish', {
              count: o.dartsPerFinish,
              visits: o.dartsPerFinish / 3,
            })}
          />
        </div>
      );
    }
  }
}

function FinishesField({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  const t = useT('games.options');
  const [text, setText] = useState(value.join(', '));
  return (
    <Field label={t('finishes')} hint={t('finishesHint')}>
      <Input
        inputMode="numeric"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const list = e.target.value
            .split(/[\s,;]+/)
            .map(Number)
            .filter((n) => Number.isInteger(n) && n >= 2 && n <= 170)
            .slice(0, MAX_DRILL_TARGETS);
          if (list.length) onChange(list);
        }}
      />
    </Field>
  );
}

function TargetsEditor({
  options,
  onChange,
}: {
  options: TargetsOptions;
  onChange: (o: TargetsOptions) => void;
}) {
  const t = useT('games.options');
  const [n, setN] = useState(20);
  const [m, setM] = useState<DrillTarget['m']>(2);
  const add = () => {
    const target: DrillTarget = { n, m: n === BULL && m === 3 ? 2 : m };
    if (options.targets.length >= MAX_DRILL_TARGETS) return;
    onChange({ ...options, targets: [...options.targets, target] });
  };
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-sm font-medium">{t('targets')}</p>
        <p className="mb-2 max-w-prose text-xs text-ink/60 dark:text-paper/60">
          {t('help.targets')}
        </p>
        <ul className="flex flex-wrap gap-2">
          {options.targets.map((target, i) => (
            <li key={i}>
              <button
                type="button"
                className="rounded-full border border-ink/20 px-3 py-1 font-mono text-sm hover:border-red-600 hover:text-red-700 dark:border-paper/20 dark:hover:text-red-400"
                aria-label={t('removeTarget', { target: targetLabel(target) })}
                disabled={options.targets.length <= 1}
                onClick={() =>
                  onChange({ ...options, targets: options.targets.filter((_, k) => k !== i) })
                }
              >
                {targetLabel(target)} ×
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Field label={t('ring')} className="w-36">
          <Select value={m} onChange={(e) => setM(Number(e.target.value) as DrillTarget['m'])}>
            <option value={0}>{t('ringAny')}</option>
            <option value={1}>{t('ringSingle')}</option>
            <option value={2}>{t('ringDouble')}</option>
            <option value={3}>{t('ringTreble')}</option>
          </Select>
        </Field>
        <Field label={t('number')} className="w-28">
          <Select value={n} onChange={(e) => setN(Number(e.target.value))}>
            {[...Array.from({ length: 20 }, (_, i) => 20 - i), BULL].map((v) => (
              <option key={v} value={v}>
                {v === BULL ? t('bull') : v}
              </option>
            ))}
          </Select>
        </Field>
        <Button
          type="button"
          variant="secondary"
          onClick={add}
          disabled={options.targets.length >= MAX_DRILL_TARGETS}
        >
          {t('addTarget')}
        </Button>
      </div>
      <p
        aria-live="polite"
        className="-mt-2 min-h-10 max-w-prose text-xs text-ink/60 dark:text-paper/60"
      >
        {t(`help.ring.${n === BULL && m === 3 ? 2 : m}`)}
      </p>
      <Segmented
        name="dartsPerTarget"
        label={t('dartsPerTarget')}
        value={options.dartsPerTarget}
        options={DRILL_DARTS.map((d) => ({ value: d, label: String(d) }))}
        onChange={(d) => onChange({ ...options, dartsPerTarget: d })}
        hint={t('help.dartsPerTarget', {
          count: options.dartsPerTarget,
          visits: options.dartsPerTarget / 3,
          total: options.dartsPerTarget * options.targets.length,
        })}
      />
    </div>
  );
}
