import { formatDateTime } from '@devquake/ui';
import { translator } from '../i18n';
import { orgPage } from '../lib/org-page';
import type { OrgScope } from './guard';
import { OrgHeader } from './org-header';

/**
 * The top of every printout of an organisation's page (menus, kitchen sheet, route sheets,
 * reports, calendar, profiles): its header in the organisation's own look (logo, name,
 * description, contact), and who printed it and when, in the printer's time zone. Hidden on
 * screen.
 */
export async function PrintHeader({ scope }: { scope: Extract<OrgScope, { ok: true }> }) {
  const t = translator(scope.locale);
  const page = await orgPage(scope.db, scope.org.id, scope.user.id).catch(() => null);
  const printedAt = formatDateTime(new Date(), scope.timeZone, 'datetime', scope.locale);
  const by = t('print.by', { name: scope.user.displayName, date: printedAt });
  if (!page) {
    return (
      <header className="mb-4 hidden border-b border-ink/30 pb-3 print:block">
        <p className="text-lg font-bold">{scope.org.name}</p>
        <p className="text-xs">{by}</p>
      </header>
    );
  }
  return (
    <header className="hidden print:block">
      <OrgHeader
        page={page}
        logoUrl={`/api/orgs/${scope.org.id}/logo`}
        imageUrl={`/api/orgs/${scope.org.id}/header-image`}
        print
        aside={by}
      />
    </header>
  );
}
