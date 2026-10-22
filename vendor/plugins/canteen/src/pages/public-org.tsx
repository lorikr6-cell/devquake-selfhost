import type { PluginPageProps } from '@devquake/plugin-sdk';
import { notFound } from 'next/navigation';
import { OrgBanner } from '../components/org-banner';
import { localeOf, translator } from '../i18n';
import { publicOrgPage } from '../lib/org-page';

async function pageFor(ctx: PluginPageProps['ctx'], params: PluginPageProps['params']) {
  const orgId = Number(params.id);
  if (!ctx.db || !Number.isSafeInteger(orgId) || orgId <= 0) return null;
  return publicOrgPage(ctx.db, orgId).catch(() => null);
}

export async function generateMetadata({ ctx, params }: PluginPageProps) {
  const page = await pageFor(ctx, params);
  const t = translator(localeOf(ctx));
  return {
    title: page ? page.name : t('meta.home'),
    description: page?.description?.slice(0, 160) ?? undefined,
    robots: { index: false },
  };
}

/**
 * The organisation's own page for visitors (an open route, ADR 0047): its banner only, when
 * its organisers made it public. Nothing about the people it serves.
 */
export default async function PublicOrgPage({ ctx, params }: PluginPageProps) {
  const page = await pageFor(ctx, params);
  if (!page) notFound();
  const t = translator(localeOf(ctx));
  return (
    <>
      <OrgBanner page={page} logoUrl={`/api/o/${page.id}/logo`} />
      <p className="text-xs text-ink/60 dark:text-paper/60">{t('orgPage.poweredBy')}</p>
    </>
  );
}
