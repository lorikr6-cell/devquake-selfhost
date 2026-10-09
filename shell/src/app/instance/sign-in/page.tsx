import { redirect } from 'next/navigation';
import { APP } from '@/generated/app';
import { ErrorText, Field, InstanceFrame, inputClass } from '@/components/instance-frame';
import { NotReady } from '@/components/not-ready';
import { getLocale } from '@/lib/context';
import { formError } from '@/lib/form-error';
import { instanceState } from '@/lib/gate';
import { getSessionUser } from '@/lib/session';
import { shellT } from '@/lib/texts';
import { signInAction } from '../actions';

export const metadata = { title: 'Sign in' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await instanceState();
  if (!state.ok) {
    if (state.reason === 'setup') redirect('/instance/setup');
    return <NotReady reason={state.reason} />;
  }
  const query = await searchParams;
  const next = typeof query.next === 'string' ? query.next : '/';
  if (await getSessionUser()) redirect(next.startsWith('/') && !next.startsWith('//') ? next : '/');
  const t = shellT(await getLocale());
  return (
    <InstanceFrame title={t('signInTitle', { app: APP.name })}>
      <form action={signInAction} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <Field label={t('email')}>
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </Field>
        <Field label={t('password')}>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </Field>
        <ErrorText>{formError(t, query.error)}</ErrorText>
        <button
          type="submit"
          className="w-full rounded-md bg-quake px-4 py-2 font-semibold text-white hover:opacity-90"
        >
          {t('signIn')}
        </button>
      </form>
      <p className="text-sm text-ink/60 dark:text-paper/60">{t('noAccount')}</p>
    </InstanceFrame>
  );
}
