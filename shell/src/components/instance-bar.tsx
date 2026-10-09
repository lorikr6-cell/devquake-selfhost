import { localizePath } from '@devquake/ui';
import type { PluginLocale, PluginReturnLink } from '@devquake/plugin-sdk';
import { APP } from '@/generated/app';
import { getOrigins } from '@/lib/place';
import type { SessionUser } from '@/lib/session';
import { shellT } from '@/lib/texts';
import { signOutAction } from '@/app/instance/actions';

/**
 * A thin bar above the app for signed-in people: who they are, the instance's home (several
 * apps), the instance page (admin), sign out.
 */
export async function InstanceBar({ user, locale }: { user: SessionUser; locale: PluginLocale }) {
  const t = shellT(locale);
  const home = APP.multi ? (await getOrigins()).home : '';
  return (
    <div className="border-b border-ink/10 bg-ink/[0.03] text-xs dark:border-paper/10 dark:bg-paper/5">
      <div className="mx-auto flex max-w-5xl items-center justify-end gap-3 px-4 py-1.5 text-ink/70 sm:px-6 dark:text-paper/70">
        {APP.multi ? (
          <a
            href={`${home}${localizePath('/', locale)}`}
            className="mr-auto underline hover:text-quake"
          >
            ← {t('allApps', { app: APP.name })}
          </a>
        ) : null}
        <span className="truncate">{user.displayName}</span>
        {user.role === 'admin' ? (
          <a
            href={`${home}${localizePath('/instance', locale)}`}
            className="underline hover:text-quake"
          >
            {t('instanceTitle')}
          </a>
        ) : null}
        <form action={signOutAction}>
          <button type="submit" className="underline hover:text-quake">
            {t('signOut')}
          </button>
        </form>
      </div>
    </div>
  );
}

/** Opened from another app's link (ADR 0035): the way back to where the person was. */
export function ReturnBar({ back, locale }: { back: PluginReturnLink; locale: PluginLocale }) {
  const t = shellT(locale);
  return (
    <div className="border-b border-quake/20 bg-quake/5 text-sm">
      <div className="mx-auto max-w-5xl px-4 py-2 sm:px-6">
        <a href={back.url} className="font-medium text-quake hover:underline">
          ← {t('backTo', { app: back.name })}
        </a>
      </div>
    </div>
  );
}
