'use client';

import { useState } from 'react';
import { cn, useT } from '@devquake/ui';
import { prepTasks, stepUses, stepsByStage } from '../lib/guide';
import type { Ingredient, Step } from '../lib/recipe';

/**
 * "Get ready": the equipment to put out and every ingredient's preparation (chop, grate, melt…)
 * with its quantity for the chosen servings, as a checklist, before the first step.
 */
export function GetReady({
  equipment,
  ingredients,
  show,
}: {
  equipment: string | null;
  /** Already scaled to the chosen servings. */
  ingredients: Ingredient[];
  /** Quantity and unit as shown ("2 tbsp"). */
  show: (i: Ingredient) => string;
}) {
  const t = useT('guide');
  const tasks = prepTasks(ingredients);
  const tools = (equipment ?? '')
    .split(/\n|,/)
    .map((x) => x.trim())
    .filter(Boolean);
  const [done, setDone] = useState<Set<number>>(new Set());
  if (!tasks.length && !tools.length) return null;
  return (
    <section className="space-y-3 rounded-xl border border-ink/10 bg-white/70 p-4 dark:border-paper/10 dark:bg-paper/5">
      <h2 className="font-display text-xl font-bold">{t('getReady')}</h2>
      {tools.length ? (
        <p className="text-sm">
          <span className="font-medium">{t('equipment')}: </span>
          {tools.join(', ')}
        </p>
      ) : null}
      {tasks.length ? (
        <>
          <p className="text-sm text-ink/70 dark:text-paper/70">{t('prepIntro')}</p>
          <ul className="space-y-1 text-sm">
            {tasks.map(({ ingredient, index }) => (
              <li key={index}>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 accent-quake"
                    checked={done.has(index)}
                    onChange={(e) => {
                      const next = new Set(done);
                      if (e.target.checked) next.add(index);
                      else next.delete(index);
                      setDone(next);
                    }}
                  />
                  <span className={cn(done.has(index) && 'line-through opacity-50')}>
                    <span className="font-medium">{ingredient.name}</span>
                    {show(ingredient) ? ` (${show(ingredient)})` : ''}: {ingredient.note}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

/** Steps grouped by stage, each with the ingredients it uses (scaled) and its timer. */
export function StageSteps({
  steps,
  ingredients,
  show,
}: {
  steps: Step[];
  /** Already scaled to the chosen servings. */
  ingredients: Ingredient[];
  show: (i: Ingredient) => string;
}) {
  const t = useT('guide');
  const tR = useT('recipe');
  return (
    <section className="space-y-5">
      <h2 className="font-display text-xl font-bold">{tR('steps')}</h2>
      {stepsByStage(steps).map((group) => (
        <div key={group.stage} className="space-y-3">
          <h3 className="text-sm font-semibold tracking-wide text-quake uppercase">
            {t(`stage.${group.stage}`)}
          </h3>
          <ol className="space-y-4">
            {group.steps.map(({ step, n }) => {
              const uses = stepUses(step, ingredients);
              return (
                <li key={n} className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-quake text-sm font-bold text-white">
                    {n}
                  </span>
                  <div className="min-w-0 space-y-1.5 pt-0.5">
                    <p className="whitespace-pre-wrap">{step.text}</p>
                    {uses.length || step.timerSec ? (
                      <p className="flex flex-wrap gap-1 text-xs">
                        {uses.map((i) => (
                          <span
                            key={i}
                            className="rounded-full bg-ink/5 px-2 py-0.5 dark:bg-paper/10"
                          >
                            {[show(ingredients[i]!), ingredients[i]!.name]
                              .filter(Boolean)
                              .join(' ')}
                          </span>
                        ))}
                        {step.timerSec ? (
                          <span className="rounded-full bg-quake/10 px-2 py-0.5">
                            ⏱ {tR('timer', { count: Math.round(step.timerSec / 60) })}
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </section>
  );
}
