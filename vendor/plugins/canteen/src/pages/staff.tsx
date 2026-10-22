import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link } from '@devquake/ui';
import { orgScope } from '../components/guard';
import { Invites, StaffList } from '../components/staff';
import { localeOf, translator } from '../i18n';
import { listInvites, listStaff } from '../lib/data';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('staff.title') };
}

/** The organisation's staff and their roles, and invitations (organisers only). */
export default async function StaffPage({ ctx, params }: PluginPageProps) {
  const scope = await orgScope(ctx, params, 'org.manage');
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale);
  const [staff, invites] = await Promise.all([
    listStaff(scope.db, scope.org.id, scope.user.id),
    listInvites(scope.db, scope.org.id, scope.user.id),
  ]);
  return (
    <>
      <Link href={`/orgs/${scope.org.id}`} className="text-sm underline hover:text-quake">
        ← {scope.org.name}
      </Link>
      <h1 className="mt-2 mb-2 font-display text-3xl font-bold">{t('staff.title')}</h1>
      <p className="mb-6 max-w-2xl text-sm text-ink/70 dark:text-paper/70">{t('staff.intro')}</p>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <StaffList orgId={scope.org.id} staff={staff} myUserId={scope.user.id} />
        <Invites orgId={scope.org.id} invites={invites} timeZone={scope.timeZone} />
      </div>
    </>
  );
}
