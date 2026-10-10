import type { PluginPageProps } from '@devquake/plugin-sdk';
import { formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { needArea, ownerScope } from '../components/guard';
import { SubNav } from '../components/sub-nav';
import { TeamEditor } from '../components/team-editor';
import { listInvites, listStaff } from '../lib/team-data';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.team') };
}

/** The shop's team: members with their roles, and one-time links to invite more. */
export default async function TeamPage({ ctx }: PluginPageProps) {
  const scope = await ownerScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, store, roles, locale, timeZone } = scope;
  const missing = needArea(store, roles, 'team', locale);
  if (missing || !store) return missing;
  const t = translator(locale, 'team');
  const [staff, invites] = await Promise.all([listStaff(db, store.id), listInvites(db, store.id)]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 max-w-2xl text-ink/70 dark:text-paper/70">{t('intro')}</p>
      </div>
      <SubNav group="settings" current="/team" roles={roles} locale={locale} />
      <TeamEditor
        staff={staff.map((s) => ({
          ...s,
          since: formatDateTime(s.since, timeZone, 'date', locale),
        }))}
        invites={invites.map((i) => ({
          ...i,
          expires: formatDateTime(i.expiresAt, timeZone, 'datetime', locale),
        }))}
      />
    </div>
  );
}
