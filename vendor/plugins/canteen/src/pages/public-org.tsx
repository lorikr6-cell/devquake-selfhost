import type { PluginPageProps } from '@devquake/plugin-sdk';
import { notFound } from 'next/navigation';
import { OrgBanner } from '../components/org-banner';
import { localeOf, translator } from '../i18n';
import { orgPage, publicOrgPage, type OrgPage } from '../lib/org-page';

/**
 * The page for this visitor: anyone once it is public; the organisation's own staff always
 * (they preview it while it is private). Everyone else gets 404, never a hint.
 */
async function pageFor(
  ctx: PluginPageProps['ctx'],
  params: PluginPageProps['params'],
): Promise<{ page: OrgPage; preview: boolean } | null> {
  const orgId = Number(params.id);
  if (!ctx.db || !Number.isSafeInteger(orgId) || orgId <= 0) return null;
  const open = await publicOrgPage(ctx.db, orgId).catch(() => null);
  if (open) return { page: open, preview: false };
  if (!ctx.user) return null;
  const own = await orgPage(ctx.db, orgId, ctx.user.id).catch(() => null);
  return own ? { page: own, preview: true } : null;
}

export async function generateMetadata({ ctx, params }: PluginPageProps) {
  const found = await pageFor(ctx, params);
  const t = translator(localeOf(ctx));
  return {
    title: found ? found.page.name : t('meta.home'),
    description: found?.page.description?.slice(0, 160) ?? undefined,
    robots: { index: false },
  };
}

/**
 * The organisation's own page for visitors (an open route, ADR 0047): its banner only, when its
 * organisers made it public. Nothing about the people it serves.
 */
export default async function PublicOrgPage({ ctx, params }: PluginPageProps) {
  const found = await pageFor(ctx, params);
  if (!found) notFound();
  const t = translator(localeOf(ctx));
  const { page, preview } = found;
  return (
    <>
      {preview ? (
        <p
          role="status"
          className="mb-4 rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-950 dark:bg-amber-900/60 dark:text-amber-100"
        >
          {t('orgPage.previewNote')}
        </p>
      ) : null}
      <OrgBanner
        page={page}
        logoUrl={preview ? `/api/orgs/${page.id}/logo` : `/api/o/${page.id}/logo`}
      />
      <p className="text-xs text-ink/60 dark:text-paper/60">{t('orgPage.poweredBy')}</p>
    </>
  );
}
