import type { PluginPageProps } from '@devquake/plugin-sdk';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { ProfileForm } from '../components/profile-form';
import { PageTitle, Panel } from '../components/ui';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.profile') };
}

/** Set up the profile (first visit) or change it. */
export default async function ProfilePage({ ctx }: PluginPageProps) {
  const scope = await pageScope(ctx, false);
  if (!scope.ok) return scope.notice;
  const t = translator(localeOf(ctx), 'profile');
  const setup = scope.profile === null;
  const initial = scope.profile ?? {
    nickname: scope.user.displayName.slice(0, 40),
    hand: 'right' as const,
    level: 'beginner' as const,
    entryMode: 'board' as const,
    favoriteDouble: null,
  };
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageTitle
        title={setup ? t('setupTitle') : t('title')}
        intro={setup ? t('setupIntro') : t('intro')}
      />
      <Panel>
        <ProfileForm initial={initial} setup={setup} />
      </Panel>
    </div>
  );
}
