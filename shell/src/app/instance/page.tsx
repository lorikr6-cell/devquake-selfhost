import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { formatDateTime, localizePath } from '@devquake/ui';
import { APP } from '@/generated/app';
import { ConfirmRemove } from '@/components/confirm-remove';
import { CopyField } from '@/components/copy-field';
import { InstanceFrame } from '@/components/instance-frame';
import { NotReady } from '@/components/not-ready';
import { buildContext, getLocale } from '@/lib/context';
import { devquakeUrl, ISSUES_URL } from '@/lib/funnel';
import { instanceState } from '@/lib/gate';
import { mailConfigured } from '@/lib/mail';
import { getSessionUser } from '@/lib/session';
import { shellT } from '@/lib/texts';
import { publicUrl } from '@/lib/url';
import { listMembers } from '@/lib/users';
import { loadPlugin } from '@/generated/app';
import { createInviteAction, removeMemberAction } from './actions';

export const metadata = { title: 'Instance' };

const section = 'rounded-xl border border-ink/10 p-4 dark:border-paper/15';

/** The admin's page: members and invites, the configuration in effect, DevQuake. */
export default async function InstancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const state = await instanceState();
  if (!state.ok) {
    if (state.reason === 'setup') redirect('/instance/setup');
    return <NotReady reason={state.reason} />;
  }
  const locale = await getLocale();
  const user = await getSessionUser();
  if (!user) redirect(`${localizePath('/instance/sign-in', locale)}?next=/instance`);
  if (user.role !== 'admin') redirect(localizePath('/', locale));
  const t = shellT(locale);
  const query = await searchParams;
  const base = publicUrl(await headers());
  const invite =
    typeof query.invite === 'string' && /^[A-Za-z0-9_-]{20,64}$/.test(query.invite)
      ? `${base}${localizePath(`/instance/join/${query.invite}`, locale)}`
      : null;
  const removed = typeof query.removed === 'string' ? query.removed.slice(0, 80) : null;
  const members = await listMembers();
  const ctx = await buildContext((await loadPlugin()).manifest);
  const tz = ctx.timeZone ?? 'UTC';

  return (
    <InstanceFrame title={t('instanceTitle')} wide>
      <a href={localizePath('/', locale)} className="text-sm underline hover:text-quake">
        ← {t('openApp', { app: APP.name })}
      </a>

      {removed ? (
        <p role="status" className="rounded-md bg-green-600/10 px-3 py-2 text-sm">
          ✓ {t('removed', { name: removed })}
        </p>
      ) : null}

      <section className={section}>
        <h2 className="font-semibold">{t('members')}</h2>
        <ul className="mt-3 divide-y divide-ink/10 dark:divide-paper/10">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {m.displayName}
                  {m.role === 'admin' ? ` · ${t('admin')}` : ''}
                  {m.id === user.id ? ` (${t('you')})` : ''}
                </p>
                <p className="truncate text-xs text-ink/60 dark:text-paper/60">
                  {m.email} · {t('lastSeen')}:{' '}
                  {m.lastSeenAt ? formatDateTime(m.lastSeenAt, tz, 'datetime', locale) : t('never')}
                </p>
              </div>
              {m.role === 'admin' ? null : (
                <ConfirmRemove
                  action={removeMemberAction}
                  id={m.id}
                  name={m.displayName}
                  labels={{
                    remove: t('remove'),
                    title: t('removeTitle', { name: m.displayName }),
                    body: t('removeBody', { app: APP.name }),
                    cancel: t('cancel'),
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className={section}>
        <h2 className="font-semibold">{t('invite')}</h2>
        {invite ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-ink/70 dark:text-paper/70">{t('inviteHint')}</p>
            <CopyField value={invite} labels={{ copy: t('copy'), copied: t('copied') }} />
          </div>
        ) : null}
        <form action={createInviteAction} className="mt-3">
          <button
            type="submit"
            className="rounded-md bg-quake px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            {t('newInvite')}
          </button>
        </form>
      </section>

      <section className={section}>
        <h2 className="font-semibold">{t('configTitle')}</h2>
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('configHint')}</p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-ink/60 dark:text-paper/60">{t('address')}</dt>
          <dd className="break-all">{base}</dd>
          <dt className="text-ink/60 dark:text-paper/60">{t('emailSending')}</dt>
          <dd>{mailConfigured() ? t('emailOn') : t('emailOff')}</dd>
          <dt className="text-ink/60 dark:text-paper/60">{t('version')}</dt>
          <dd>
            {APP.name} {APP.version}
          </dd>
        </dl>
      </section>

      <section className={section}>
        <h2 className="font-semibold">{t('moreTitle')}</h2>
        <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">{t('moreBody')}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <a href={devquakeUrl('instance')} rel="noopener" className="underline hover:text-quake">
            {t('moreLink')}
          </a>
          <a href={ISSUES_URL} rel="noopener" className="underline hover:text-quake">
            {t('bugs')}
          </a>
        </div>
      </section>
    </InstanceFrame>
  );
}
