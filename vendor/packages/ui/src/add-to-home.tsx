'use client';

import { useEffect, useId, useState } from 'react';
import { cn } from './cn';
import type { Locale } from './i18n';
import { useLocale } from './i18n-react';
import { Sheet } from './sheet';

// Texts of this button, like the release notes' (every app shows it; ADR 0011).
const WORDS: Record<
  Locale,
  {
    button: string;
    title: string;
    intro: string;
    ios: [string, string, string];
    android: string;
    other: string;
    close: string;
  }
> = {
  en: {
    button: 'Add to Home Screen',
    title: 'Add this app to your Home Screen',
    intro: 'It opens like an app, with its own icon.',
    ios: ['Tap Share', 'in the browser’s toolbar,', 'then “Add to Home Screen”.'],
    android: 'Open the browser menu (⋮) and choose “Add to Home screen” or “Install app”.',
    other: 'Open your browser’s menu and choose “Add to Home screen” or “Install”.',
    close: 'Close',
  },
  de: {
    button: 'Zum Home-Bildschirm',
    title: 'Diese App zum Home-Bildschirm hinzufügen',
    intro: 'Sie öffnet sich dann wie eine App, mit eigenem Symbol.',
    ios: ['Tippe auf Teilen', 'in der Leiste des Browsers,', 'dann auf „Zum Home-Bildschirm“.'],
    android:
      'Öffne das Browsermenü (⋮) und wähle „Zum Startbildschirm hinzufügen“ oder „App installieren“.',
    other:
      'Öffne das Menü deines Browsers und wähle „Zum Startbildschirm hinzufügen“ oder „Installieren“.',
    close: 'Schließen',
  },
  ro: {
    button: 'Adaugă pe ecranul principal',
    title: 'Adaugă aplicația pe ecranul principal',
    intro: 'Se va deschide ca o aplicație, cu propria pictogramă.',
    ios: ['Atinge Partajează', 'din bara browserului,', 'apoi „Adaugă pe ecranul principal”.'],
    android:
      'Deschide meniul browserului (⋮) și alege „Adaugă pe ecranul de pornire” sau „Instalează aplicația”.',
    other: 'Deschide meniul browserului și alege „Adaugă pe ecranul de pornire” sau „Instalează”.',
    close: 'Închide',
  },
  hu: {
    button: 'Hozzáadás a kezdőképernyőhöz',
    title: 'Add hozzá az alkalmazást a kezdőképernyődhöz',
    intro: 'Így saját ikonnal, alkalmazásként nyílik meg.',
    ios: [
      'Koppints a Megosztás',
      'gombra a böngésző sávjában,',
      'majd a „Főképernyőhöz adás” lehetőségre.',
    ],
    android:
      'Nyisd meg a böngésző menüjét (⋮), és válaszd a „Hozzáadás a kezdőképernyőhöz” vagy az „Alkalmazás telepítése” lehetőséget.',
    other:
      'Nyisd meg a böngésző menüjét, és válaszd a „Hozzáadás a kezdőképernyőhöz” vagy a „Telepítés” lehetőséget.',
    close: 'Bezárás',
  },
};

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Chrome, Edge and Samsung Internet offer installing through this event, which can fire before
// the toolbar mounts: it is caught as soon as this module loads.
let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // our button instead of the browser's own banner
    deferred = e as InstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

type Platform = 'ios' | 'android' | 'other';

function detect(): { show: boolean; platform: Platform } {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  // Phones and tablets: a touch screen as the main pointer (iPads report a desktop browser).
  const touch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 1;
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return {
    show: touch && !standalone,
    platform: ios ? 'ios' : /Android/.test(ua) ? 'android' : 'other',
  };
}

function ShareIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="inline size-5 align-text-bottom"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

/**
 * "Add to Home Screen" in every app's toolbar (ADR 0026), on phones and tablets only, and not
 * when the app already runs from the home screen. Where the browser can install the app itself
 * (Android: Chrome, Edge, Samsung Internet) the button asks it to; elsewhere (iPhone and iPad,
 * other browsers) it shows the two steps. The icon on the home screen is the app's logo with
 * the DevQuake badge, from the app's manifest and Apple touch icon (set by DevQuake).
 */
export function AddToHomeScreenButton({ className }: { className?: string }) {
  const words = WORDS[useLocale()];
  const headingId = useId();
  const [state, setState] = useState<{ show: boolean; platform: Platform; canPrompt: boolean }>({
    show: false,
    platform: 'other',
    canPrompt: false,
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const update = () => setState({ ...detect(), canPrompt: deferred !== null });
    update();
    listeners.add(update);
    const standalone = window.matchMedia('(display-mode: standalone)');
    standalone.addEventListener('change', update);
    return () => {
      listeners.delete(update);
      standalone.removeEventListener('change', update);
    };
  }, []);

  if (!state.show) return null;

  const click = async () => {
    if (deferred) {
      const prompt = deferred;
      await prompt.prompt().catch(() => {});
      const choice = await prompt.userChoice.catch(() => null);
      if (choice?.outcome === 'accepted') deferred = null;
      setState((s) => ({ ...s, canPrompt: deferred !== null }));
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={click}
        aria-label={words.button}
        title={words.button}
        className={cn(
          'inline-flex size-9 shrink-0 items-center justify-center rounded-md text-current opacity-75 transition hover:opacity-100 focus-visible:ring-2 focus-visible:ring-quake focus-visible:outline-none',
          className,
        )}
      >
        {/* A phone with a plus: add to the home screen. */}
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
          <path d="M12 9v6M9 12h6" />
        </svg>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} labelledBy={headingId}>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {/* The icon the home screen will show (DevQuake serves it for every app). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/api/_icon?size=192"
              alt=""
              width={56}
              height={56}
              className="size-14 shrink-0 rounded-2xl shadow"
            />
            <div>
              <h2 id={headingId} className="font-display text-lg font-bold">
                {words.title}
              </h2>
              <p className="text-sm text-ink/70 dark:text-paper/70">{words.intro}</p>
            </div>
          </div>
          <p className="text-sm">
            {state.platform === 'ios' ? (
              <>
                {words.ios[0]} <ShareIcon /> {words.ios[1]} {words.ios[2]}
              </>
            ) : state.platform === 'android' ? (
              words.android
            ) : (
              words.other
            )}
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5 dark:border-paper/20 dark:hover:bg-paper/10"
            >
              {words.close}
            </button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
