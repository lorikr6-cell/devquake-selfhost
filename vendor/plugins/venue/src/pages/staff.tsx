import type { PluginPageProps } from '@devquake/plugin-sdk';
import { StaffManager } from '../components/staff-manager';
import { localeOf, translator } from '../i18n';
import { listStaff } from '../lib/data';
import { ownVenue } from '../lib/page';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('nav.staff') };
}

/** Staff with their roles and PINs for the shared tablet (ADR 0080). */
export default async function Staff({ ctx }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const own = await ownVenue(ctx);
  if ('blocked' in own) return own.blocked;
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">{t('nav.staff')}</h1>
        <p className="text-ink/70 dark:text-paper/70">{t('staff.intro')}</p>
      </header>
      <StaffManager initial={await listStaff(own.db, own.venue.id)} />
    </div>
  );
}
