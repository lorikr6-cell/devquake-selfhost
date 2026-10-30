import type { PluginContext } from '@devquake/plugin-sdk';
import { Link } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { venueOfOwner, type Venue } from './data';

/**
 * The admin pages' gate (ADR 0080): the signed-in member's own venue, or what to show instead
 * (sign in, the database missing, no venue yet). Nobody else's venue is ever loaded here.
 */
export async function ownVenue(
  ctx: PluginContext,
): Promise<{ venue: Venue; db: NonNullable<PluginContext['db']> } | { blocked: React.ReactNode }> {
  const t = translator(localeOf(ctx));
  if (!ctx.user)
    return {
      blocked: (
        <section className="space-y-3">
          <h1 className="font-display text-3xl font-bold">{t('signIn.title')}</h1>
          <p>{t('signIn.body')}</p>
          <a href={`${ctx.hostUrl}/#account`} className="font-medium text-quake underline">
            {t('signIn.link')}
          </a>
        </section>
      ),
    };
  if (!ctx.db) return { blocked: <p>{t('errors.unavailable')}</p> };
  const venue = await venueOfOwner(ctx.db, ctx.user.id);
  if (!venue)
    return {
      blocked: (
        <p>
          {t('home.noVenueYet')}{' '}
          <Link href="/" className="font-medium text-quake underline">
            {t('home.setUp')}
          </Link>
        </p>
      ),
    };
  return { venue, db: ctx.db };
}
