import type { PluginPageProps } from '@devquake/plugin-sdk';
import { plainQrSvg } from '@devquake/ui/qr';
import { TablesManager } from '../components/tables-manager';
import { localeOf, translator } from '../i18n';
import { listTables } from '../lib/floor';
import { ownVenue } from '../lib/page';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('nav.tables') };
}

/** The venue's tables and their QR stickers to print (the owner's). */
export default async function Tables({ ctx }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const own = await ownVenue(ctx);
  if ('blocked' in own) return own.blocked;
  const tables = await listTables(own.db, own.venue.id);
  return (
    <div className="space-y-6">
      <header className="space-y-2 print:hidden">
        <h1 className="font-display text-3xl font-bold">{t('nav.tables')}</h1>
        <p className="text-ink/70 dark:text-paper/70">{t('tables.intro')}</p>
      </header>
      <TablesManager
        initial={tables.map((x) => {
          const url = `${ctx.baseUrl}/t/${x.code}`;
          return { id: x.id, name: x.name, seats: x.seats, code: x.code, url, qr: plainQrSvg(url) };
        })}
      />
    </div>
  );
}
