import { formatDateTime } from '@devquake/ui';
import { translator } from '../i18n';
import { orgPage } from '../lib/org-page';
import type { OrgScope } from './guard';

/**
 * The top of every printout of an organisation's page (menus, kitchen sheet, route sheets,
 * calendar, profiles): its logo, name and description, and who printed it and when, in the
 * printer's time zone. Hidden on screen.
 */
export async function PrintHeader({ scope }: { scope: Extract<OrgScope, { ok: true }> }) {
  const t = translator(scope.locale);
  const page = await orgPage(scope.db, scope.org.id, scope.user.id).catch(() => null);
  const printedAt = formatDateTime(new Date(), scope.timeZone, 'datetime', scope.locale);
  return (
    <header className="mb-4 hidden items-start gap-4 border-b border-ink/30 pb-3 print:flex">
      {page?.logoVersion ? (
        // eslint-disable-next-line @next/next/no-img-element -- served by the app's own API
        <img
          src={`/api/orgs/${scope.org.id}/logo?v=${page.logoVersion}`}
          alt=""
          className="h-14 w-14 shrink-0 object-contain"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold">{scope.org.name}</p>
        {page?.description ? (
          <p className="text-xs whitespace-pre-line">{page.description}</p>
        ) : null}
        {page ? <p className="text-xs">{page.contactEmail}</p> : null}
      </div>
      <p className="shrink-0 text-right text-xs">
        {t('print.by', { name: scope.user.displayName, date: printedAt })}
      </p>
    </header>
  );
}
