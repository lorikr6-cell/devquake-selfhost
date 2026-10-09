'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, LOCALE_TAGS, Link, buttonClass, cn, useLocale, useT } from '@devquake/ui';
import { stepUses } from '../lib/guide';
import { formatQty, type Ingredient, type Step } from '../lib/recipe';
import { GetReady } from './recipe-guide';

const VOICE_KEY = 'cookbook.voice';

const clock = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m >= 60
    ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
};

/** A countdown for a step: start, pause, reset; a beep and a vibration when it ends. */
function StepTimer({ seconds, label }: { seconds: number; label: string }) {
  const t = useT('cook');
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const ended = left === 0;

  useEffect(() => {
    setLeft(seconds);
    setRunning(false);
  }, [seconds]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running || left > 0) return;
    setRunning(false);
    try {
      const ctx = new AudioContext();
      for (const at of [0, 0.4, 0.8]) {
        const o = ctx.createOscillator();
        o.frequency.value = 880;
        o.connect(ctx.destination);
        o.start(ctx.currentTime + at);
        o.stop(ctx.currentTime + at + 0.25);
      }
    } catch {
      // No sound: the screen still says the time is up.
    }
    navigator.vibrate?.([300, 150, 300]);
  }, [left, running]);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-xl border p-4',
        ended ? 'border-quake bg-quake/10' : 'border-ink/10 dark:border-paper/10',
      )}
      role="timer"
      aria-label={label}
    >
      <span className="font-display text-4xl font-bold tabular-nums">{clock(left)}</span>
      <span className="flex flex-wrap gap-2">
        {ended ? (
          <span className="font-medium">{t('timeUp')}</span>
        ) : (
          <Button type="button" onClick={() => setRunning(!running)}>
            {running ? t('pause') : t('start')}
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setLeft(seconds);
            setRunning(false);
          }}
        >
          {t('reset')}
        </Button>
      </span>
    </div>
  );
}

/**
 * Cooking mode: one step per screen in big text, the screen kept awake, a timer for steps that
 * have one, and a voice that reads each step (the browser's speech in the page language).
 */
export function CookMode({
  recipeRef,
  title,
  steps,
  ingredients,
  equipment,
  servings,
}: {
  recipeRef: string;
  title: string;
  steps: Step[];
  /** Scaled to `servings`. */
  ingredients: Ingredient[];
  equipment: string | null;
  servings: number;
}) {
  const t = useT('cook');
  const tUnit = useT('units');
  const locale = useLocale();
  const show = (i: Ingredient) =>
    i.qty === null
      ? i.unit === 'taste'
        ? tUnit('taste')
        : ''
      : `${formatQty(i.qty, LOCALE_TAGS[locale])} ${tUnit(i.unit)}`;
  const needsReady = Boolean(equipment?.trim()) || ingredients.some((i) => i.note);
  const [ready, setReady] = useState(!needsReady);
  const [n, setN] = useState(0);
  const [voice, setVoice] = useState(false);
  const lock = useRef<{ release: () => Promise<void> } | null>(null);
  const step = steps[n]!;

  useEffect(() => {
    try {
      setVoice(localStorage.getItem(VOICE_KEY) === 'on');
    } catch {
      // Private window: the voice starts off.
    }
  }, []);

  // Keep the screen awake while cooking (and again when the tab comes back).
  useEffect(() => {
    const wake = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
    };
    const request = () => {
      if (document.visibilityState === 'visible') {
        wake.wakeLock
          ?.request('screen')
          .then((l) => (lock.current = l))
          .catch(() => undefined);
      }
    };
    request();
    document.addEventListener('visibilitychange', request);
    return () => {
      document.removeEventListener('visibilitychange', request);
      void lock.current?.release().catch(() => undefined);
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LOCALE_TAGS[locale];
      const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith(locale));
      // Prefer natural voices where the system has them.
      u.voice =
        voices.find((v) => /natural|neural|premium|enhanced/i.test(v.name)) ?? voices[0] ?? null;
      window.speechSynthesis.speak(u);
    },
    [locale],
  );

  useEffect(() => {
    if (voice) speak(`${t('stepOf', { n: n + 1, total: steps.length })}. ${step.text}`);
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [n, voice, speak, step.text, steps.length, t]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setN((x) => Math.min(steps.length - 1, x + 1));
      if (e.key === 'ArrowLeft') setN((x) => Math.max(0, x - 1));
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [steps.length]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href={`/r/${recipeRef}`}
          className="text-sm text-ink/60 hover:text-quake dark:text-paper/60"
        >
          {t('back', { title })}
        </Link>
        <p className="text-sm font-medium text-quake">{t('forServings', { count: servings })}</p>
        <GetReady equipment={equipment} ingredients={ingredients} show={show} />
        <Button type="button" className="min-h-14 min-w-32" onClick={() => setReady(true)}>
          {t('ready')}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`/r/${recipeRef}`}
          className="text-sm text-ink/60 hover:text-quake dark:text-paper/60"
        >
          {t('back', { title })}
        </Link>
        <Button
          type="button"
          variant="secondary"
          aria-pressed={voice}
          onClick={() => {
            const next = !voice;
            setVoice(next);
            if (!next && 'speechSynthesis' in window) window.speechSynthesis.cancel();
            try {
              localStorage.setItem(VOICE_KEY, next ? 'on' : 'off');
            } catch {
              // Private window: the choice lasts for this page only.
            }
          }}
        >
          {voice ? t('voiceOn') : t('voiceOff')}
        </Button>
      </div>

      <p className="text-sm font-medium text-quake" aria-live="polite">
        {t('stepOf', { n: n + 1, total: steps.length })}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink/10 dark:bg-paper/10">
        <div
          className="h-full bg-quake transition-all"
          style={{ width: `${((n + 1) / steps.length) * 100}%` }}
        />
      </div>
      <p className="font-display text-2xl leading-relaxed sm:text-3xl">{step.text}</p>
      {stepUses(step, ingredients).length ? (
        <ul className="flex flex-wrap gap-2 text-base">
          {stepUses(step, ingredients).map((i) => (
            <li key={i} className="rounded-full bg-ink/5 px-3 py-1 dark:bg-paper/10">
              {[show(ingredients[i]!), ingredients[i]!.name].filter(Boolean).join(' ')}
            </li>
          ))}
        </ul>
      ) : null}

      {step.timerSec ? (
        <StepTimer seconds={step.timerSec} label={t('timerFor', { n: n + 1 })} />
      ) : null}

      <div className="flex flex-wrap justify-between gap-2 pt-4">
        <Button
          type="button"
          variant="secondary"
          disabled={n === 0}
          onClick={() => setN(n - 1)}
          className="min-h-14 min-w-32"
        >
          {t('previous')}
        </Button>
        {voice ? (
          <Button type="button" variant="ghost" onClick={() => speak(step.text)}>
            {t('repeat')}
          </Button>
        ) : null}
        {n < steps.length - 1 ? (
          <Button type="button" onClick={() => setN(n + 1)} className="min-h-14 min-w-32">
            {t('next')}
          </Button>
        ) : (
          <Link href={`/r/${recipeRef}`} className={buttonClass('primary', 'min-h-14 min-w-32')}>
            {t('finish')}
          </Link>
        )}
      </div>
    </div>
  );
}
