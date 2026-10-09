import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { TournamentForm } from '../components/tournament-form';
import { PageTitle } from '../components/ui';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.newTournament') };
}

const CURRENCY_BY_LOCALE = { en: 'EUR', de: 'EUR', ro: 'RON', hu: 'HUF' } as const;

export default async function NewTournament({ ctx }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const locale = localeOf(ctx);
  const t = translator(locale, 'newTournament');
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink
        href="/tournaments"
        className="text-sm text-ink/60 hover:text-quake dark:text-paper/60"
      >
        {t('back')}
      </BackLink>
      <PageTitle title={t('title')} intro={t('intro')} />
      <TournamentForm defaultCurrency={CURRENCY_BY_LOCALE[locale]} />
    </div>
  );
}
