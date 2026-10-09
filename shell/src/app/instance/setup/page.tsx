import { redirect } from 'next/navigation';
import { localizePath } from '@devquake/ui';
import { APP } from '@/generated/app';
import { AccountFields } from '@/components/account-fields';
import { ErrorText, InstanceFrame } from '@/components/instance-frame';
import { NotReady } from '@/components/not-ready';
import { getLocale } from '@/lib/context';
import { formError } from '@/lib/form-error';
import { ready } from '@/lib/boot';
import { shellT } from '@/lib/texts';
import { hasAdmin } from '@/lib/users';
import { setupAction } from '../actions';

export const metadata = { title: 'Setup' };

/** First run: creates the admin account, then locks itself. */
export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await ready();
  if (!state.ok) return <NotReady reason={state.reason} />;
  const locale = await getLocale();
  if (await hasAdmin()) redirect(localizePath('/instance/sign-in', locale));
  const t = shellT(locale);
  const error = formError(t, (await searchParams).error);
  return (
    <InstanceFrame title={t('setupTitle', { app: APP.name })}>
      <p className="text-sm text-ink/70 dark:text-paper/70">{t('setupIntro', { app: APP.name })}</p>
      <form action={setupAction} className="space-y-3">
        <AccountFields t={t} />
        <ErrorText>{error}</ErrorText>
        <button
          type="submit"
          className="w-full rounded-md bg-quake px-4 py-2 font-semibold text-white hover:opacity-90"
        >
          {t('createAdmin')}
        </button>
      </form>
    </InstanceFrame>
  );
}
