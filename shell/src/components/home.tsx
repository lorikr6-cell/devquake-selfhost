import { localizePath } from '@devquake/ui';
import { APP, PLUGIN_IDS } from '@/generated/app';
import { getLocale } from '@/lib/context';
import { domainSetting } from '@/lib/env';
import { manifests } from '@/lib/links';
import { getOrigins } from '@/lib/place';
import { getSessionUser } from '@/lib/session';
import { shellT } from '@/lib/texts';
import { InstanceBar } from './instance-bar';

/**
 * The instance's home with several apps (ADR 0056): every bundled app as a tile on its own
 * address, one sign-in for all; until DOMAIN or PUBLIC_IP is set, what to set.
 */
export async function HomePage() {
  const locale = await getLocale();
  const t = shellT(locale);
  const [user, all, origins] = await Promise.all([
    getSessionUser().catch(() => null),
    manifests(),
    getOrigins(),
  ]);
  const domain = domainSetting();
  return (
    <>
      {user ? <InstanceBar user={user} locale={locale} /> : null}
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- the instance's own SVG icon */}
          <img src="/instance/icon.svg" alt="" className="size-14" />
          <div>
            <h1 className="font-display text-3xl font-bold">{t('homeTitle', { app: APP.name })}</h1>
            <p className="text-ink/70 dark:text-paper/70">{t('homeIntro')}</p>
          </div>
        </div>

        {!domain ? (
          <section className="space-y-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            <h2 className="font-semibold">{t('homeSetupTitle')}</h2>
            <p>{t('homeSetupBody', { names: PLUGIN_IDS.map((id) => `${id}.…`).join(', ') })}</p>
          </section>
        ) : null}

        {!user ? (
          <a
            href={localizePath('/instance/sign-in', locale)}
            className="inline-block rounded-md bg-quake px-4 py-2 font-semibold text-white hover:opacity-90"
          >
            {t('homeSignIn')}
          </a>
        ) : null}

        <ul className="grid gap-3 sm:grid-cols-2">
          {PLUGIN_IDS.map((id) => {
            const manifest = all.get(id)!.manifest;
            const description =
              manifest.about?.description[locale] ??
              manifest.about?.description.en ??
              manifest.description;
            const href = domain ? `${origins.app(id)}${localizePath('/', locale)}` : null;
            const tile = (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- the app's own SVG icon */}
                <img src={`/instance/icon.svg?app=${id}`} alt="" className="size-11 shrink-0" />
                <span className="min-w-0">
                  <span className="block font-semibold">{manifest.name}</span>
                  <span className="block text-sm text-ink/70 dark:text-paper/70">
                    {description}
                  </span>
                </span>
              </>
            );
            return (
              <li key={id}>
                {href ? (
                  <a
                    href={href}
                    className="flex h-full items-start gap-3 rounded-xl border border-ink/10 bg-white/70 p-4 hover:border-quake dark:border-paper/10 dark:bg-paper/5"
                  >
                    {tile}
                  </a>
                ) : (
                  <div className="flex h-full items-start gap-3 rounded-xl border border-ink/10 bg-white/70 p-4 opacity-70 dark:border-paper/10 dark:bg-paper/5">
                    {tile}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
