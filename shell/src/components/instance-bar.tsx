import { localizePath } from '@devquake/ui';
import type { PluginLocale } from '@devquake/plugin-sdk';
import type { SessionUser } from '@/lib/session';
import { shellT } from '@/lib/texts';
import { signOutAction } from '@/app/instance/actions';

/** A thin bar above the app for signed-in people: who they are, the instance page, sign out. */
export function InstanceBar({ user, locale }: { user: SessionUser; locale: PluginLocale }) {
  const t = shellT(locale);
  return (
    <div className="border-b border-ink/10 bg-ink/[0.03] text-xs dark:border-paper/10 dark:bg-paper/5">
      <div className="mx-auto flex max-w-5xl items-center justify-end gap-3 px-4 py-1.5 text-ink/70 sm:px-6 dark:text-paper/70">
        <span className="truncate">{user.displayName}</span>
        {user.role === 'admin' ? (
          <a href={localizePath('/instance', locale)} className="underline hover:text-quake">
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
