import { redirect } from 'next/navigation';
import { APP } from '@/generated/app';
import { AccountFields } from '@/components/account-fields';
import { ErrorText, InstanceFrame } from '@/components/instance-frame';
import { NotReady } from '@/components/not-ready';
import { getLocale } from '@/lib/context';
import { formError } from '@/lib/form-error';
import { instanceState } from '@/lib/gate';
import { shellT } from '@/lib/texts';
import { inviteIsOpen } from '@/lib/users';
import { joinAction } from '../../actions';

export const metadata = { title: 'Join' };

/** An invite link from the admin: the new member creates their account. */
export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await instanceState();
  if (!state.ok) {
    if (state.reason === 'setup') redirect('/instance/setup');
    return <NotReady reason={state.reason} />;
  }
  const { code } = await params;
  const t = shellT(await getLocale());
  if (!(await inviteIsOpen(code))) {
    return (
      <InstanceFrame title={t('joinTitle', { app: APP.name })}>
        <p>{t('inviteGone')}</p>
      </InstanceFrame>
    );
  }
  return (
    <InstanceFrame title={t('joinTitle', { app: APP.name })}>
      <p className="text-sm text-ink/70 dark:text-paper/70">{t('joinIntro', { app: APP.name })}</p>
      <form action={joinAction.bind(null, code)} className="space-y-3">
        <AccountFields t={t} />
        <ErrorText>{formError(t, (await searchParams).error)}</ErrorText>
        <button
          type="submit"
          className="w-full rounded-md bg-quake px-4 py-2 font-semibold text-white hover:opacity-90"
        >
          {t('joinButton')}
        </button>
      </form>
    </InstanceFrame>
  );
}
