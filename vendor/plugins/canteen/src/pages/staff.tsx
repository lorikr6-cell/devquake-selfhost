import type { PluginPageProps } from '@devquake/plugin-sdk';
import { PrintHeader } from '../components/print-header';
import { Link, localizePath } from '@devquake/ui';
import { brandedQrSvg } from '@devquake/ui/qr';
import { orgScope } from '../components/guard';
import { Invites, SentInvites, StaffList } from '../components/staff';
import { localeOf, translator } from '../i18n';
import { listInvites, listSentInvites, listStaff } from '../lib/data';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('staff.title') };
}

/** The organisation's staff and their roles, and invitations (organisers only). */
export default async function StaffPage({ ctx, params }: PluginPageProps) {
  const scope = await orgScope(ctx, params, 'org.manage');
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale);
  const [staff, invites, sent] = await Promise.all([
    listStaff(scope.db, scope.org.id, scope.user.id),
    listInvites(scope.db, scope.org.id, scope.user.id),
    listSentInvites(scope.db, scope.org.id, scope.user.id),
  ]);
  return (
    <>
      <PrintHeader scope={scope} />
      <Link href={`/orgs/${scope.org.id}`} className="text-sm underline hover:text-quake">
        ← {scope.org.name}
      </Link>
      <h1 className="mt-2 mb-2 font-display text-3xl font-bold">{t('staff.title')}</h1>
      <p className="mb-6 max-w-2xl text-sm text-ink/70 dark:text-paper/70">{t('staff.intro')}</p>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <StaffList orgId={scope.org.id} staff={staff} myUserId={scope.user.id} />
        <Invites
          orgId={scope.org.id}
          invites={invites.map((i) => {
            // Each invitation's QR code, drawn here (the generator is server-only).
            const url = `${ctx.baseUrl}${localizePath(`/join/${i.code}`, scope.locale)}`;
            return { ...i, url, qr: brandedQrSvg(url) };
          })}
          timeZone={scope.timeZone}
          canEmail={Boolean(ctx.invitations)}
        />
      </div>
      <section className="mt-8">
        <h2 className="mb-2 font-semibold">{t('staff.sentTitle')}</h2>
        <SentInvites invites={sent} timeZone={scope.timeZone} />
      </section>
    </>
  );
}
