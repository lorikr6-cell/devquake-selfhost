import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { ProfileForm } from '../components/profile-form';
import { Panel } from '../components/ui';
import { getProfile } from '../lib/data';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.profile') };
}

/** Only app paths ("/join/ABC"), never another site. */
function safeNext(value: unknown): string | null {
  return typeof value === 'string' && /^\/(?!\/)[\w\-/?=&%.]*$/.test(value) ? value : null;
}

/** Name and address: asked on the first visit (then back to `next`), editable later. */
export default async function ProfilePage({ ctx, searchParams }: PluginPageProps) {
  const scope = pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const t = translator(localeOf(ctx), 'profile');
  const profile = await getProfile(scope.db, scope.user.id);
  const next = safeNext(searchParams.next) ?? (profile?.parts ? null : '/');
  return (
    <Panel className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl font-bold">
        {profile?.parts ? t('title') : profile ? t('completeTitle') : t('welcomeTitle')}
      </h1>
      <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
      <div className="mt-5">
        <ProfileForm initial={profile} next={next} />
      </div>
    </Panel>
  );
}
