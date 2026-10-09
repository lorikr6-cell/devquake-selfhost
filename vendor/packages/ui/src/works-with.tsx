'use client';

import { useId, useState } from 'react';
import { buttonClass } from './button';
import { Sheet } from './sheet';

export interface WorksWithApp {
  app: string;
  name: string;
  iconUrl: string;
  benefit: string;
  state: 'connected' | 'available' | 'needs-access';
  openUrl: string;
  connectUrl: string;
}

export interface WorksWithLabels {
  /** The footer link and the dialog's title, e.g. "Works with". */
  title: string;
  intro: string;
  open: string;
  connect: string;
  getIt: string;
  connected: string;
  close: string;
  /** Disconnecting from inside the app (ADR 0035); without these the button is hidden. */
  disconnect?: string;
  /** "{app}" is replaced by the other app's name. */
  disconnectTitle?: string;
  disconnectBody?: string;
  cancel?: string;
}

/**
 * "Works with" (ADR 0035): the apps this app works with, from `ctx.links.list()`, each with why
 * they fit together and Open (connected), Connect (devquake.com consent page) or Get it (the
 * other app's page to subscribe or try). A footer link opens it in a Sheet. Renders nothing
 * without apps.
 */
export function WorksWith({ apps, labels }: { apps: WorksWithApp[]; labels: WorksWithLabels }) {
  const [open, setOpen] = useState(false);
  const [asking, setAsking] = useState<WorksWithApp | null>(null);
  const [busy, setBusy] = useState(false);
  const titleId = useId();
  const confirmId = useId();
  if (apps.length === 0) return null;
  // Ends the connection only (both subscriptions stay), through the host (same origin).
  const disconnect = async (app: WorksWithApp) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/_links/disconnect?with=${encodeURIComponent(app.app)}`, {
        method: 'POST',
      });
      if (res.ok) window.location.reload();
    } finally {
      setBusy(false);
      setAsking(null);
    }
  };
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="underline hover:text-quake">
        {labels.title}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} labelledBy={titleId}>
        <div className="space-y-4">
          <h2 id={titleId} className="font-display text-xl font-bold">
            {labels.title}
          </h2>
          <p className="text-sm text-ink/70 dark:text-paper/70">{labels.intro}</p>
          <ul className="space-y-3">
            {apps.map((a) => (
              <li
                key={a.app}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-ink/10 p-3 dark:border-paper/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- the app's SVG logo */}
                <img src={a.iconUrl} alt="" className="size-10 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {a.name}
                    {a.state === 'connected' ? (
                      <span className="ml-2 text-xs font-normal text-emerald-800 dark:text-emerald-300">
                        ✓ {labels.connected}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-ink/70 dark:text-paper/70">{a.benefit}</p>
                </div>
                {a.state === 'connected' && labels.disconnect ? (
                  <button
                    type="button"
                    onClick={() => setAsking(a)}
                    className={buttonClass('ghost')}
                  >
                    {labels.disconnect}
                  </button>
                ) : null}
                <a
                  href={
                    a.state === 'connected'
                      ? a.openUrl
                      : a.state === 'available'
                        ? a.connectUrl
                        : a.openUrl
                  }
                  className={buttonClass(a.state === 'connected' ? 'secondary' : 'primary')}
                >
                  {a.state === 'connected'
                    ? labels.open
                    : a.state === 'available'
                      ? labels.connect
                      : labels.getIt}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={buttonClass('secondary')}
            >
              {labels.close}
            </button>
          </div>
        </div>
      </Sheet>
      <Sheet open={asking !== null} onClose={() => setAsking(null)} labelledBy={confirmId}>
        {asking ? (
          <div className="space-y-4">
            <h2 id={confirmId} className="font-display text-xl font-bold">
              {(labels.disconnectTitle ?? '{app}').replace('{app}', asking.name)}
            </h2>
            {labels.disconnectBody ? (
              <p className="text-sm text-ink/70 dark:text-paper/70">{labels.disconnectBody}</p>
            ) : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setAsking(null)}
                className={buttonClass('secondary')}
              >
                {labels.cancel ?? labels.close}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => disconnect(asking)}
                className={buttonClass(
                  'primary',
                  'bg-red-700 text-white hover:bg-red-800 dark:bg-red-600 dark:text-white dark:hover:bg-red-700',
                )}
              >
                {labels.disconnect}
              </button>
            </div>
          </div>
        ) : null}
      </Sheet>
    </>
  );
}
