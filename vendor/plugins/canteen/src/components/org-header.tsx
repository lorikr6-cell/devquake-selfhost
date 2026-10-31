import type { CSSProperties, ReactNode } from 'react';
import { HEADER_FONTS, LIGHT_TEXT, isStyled, textColour } from '../lib/header-style';
import type { OrgPage } from '../lib/org-page';

/**
 * The organisation's header in its own look (font, colour or picture, text colour, alignment):
 * logo, name, description and contact. One component for the screen banner and the top of every
 * printout, so reports, route sheets and PDFs carry the same header. No hooks: server or client.
 */
export function OrgHeader({
  page,
  logoUrl,
  imageUrl,
  print = false,
  aside,
}: {
  page: OrgPage;
  /** Without the ?v= version (added here). */
  logoUrl: string;
  imageUrl: string;
  /** The printout's compact version. */
  print?: boolean;
  /** Shown at the end (the printout's "Printed by …"). */
  aside?: ReactNode;
}) {
  const look = page.look;
  const styled = isStyled(look);
  const colour = textColour(look);
  const picture = look.imageVersion ? `${imageUrl}?v=${look.imageVersion}` : null;
  // A veil over the picture so the text stays readable: dark under light text, light under dark.
  const veil = colour === LIGHT_TEXT ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.6)';
  const style: CSSProperties = {
    fontFamily: HEADER_FONTS[look.font],
    ...(styled
      ? {
          backgroundColor: look.bg ?? (picture ? '#333333' : undefined),
          backgroundImage: picture
            ? `linear-gradient(${veil}, ${veil}), url("${picture}")`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: colour ?? undefined,
          // Browsers leave backgrounds out of printouts unless asked.
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact',
        }
      : {}),
  };
  const center = look.align === 'center';
  const muted = styled ? 'opacity-85' : 'text-ink/80 dark:text-paper/80';

  const box = print
    ? styled
      ? 'mb-4 flex items-start gap-4 rounded-lg px-4 py-3'
      : 'mb-4 flex items-start gap-4 border-b border-ink/30 pb-3'
    : styled
      ? 'mb-6 flex flex-wrap items-center gap-5 rounded-2xl p-5 sm:p-6'
      : 'mb-6 flex flex-wrap items-center gap-5 rounded-2xl border border-ink/10 bg-white/70 p-5 dark:border-paper/10 dark:bg-paper/5';

  return (
    <div className={`${box} ${center ? 'flex-col text-center' : ''}`} style={style}>
      {page.logoVersion ? (
        // eslint-disable-next-line @next/next/no-img-element -- served by the app's own API
        <img
          src={`${logoUrl}?v=${page.logoVersion}`}
          alt=""
          className={`${print ? 'h-14 w-14' : 'h-20 w-20'} shrink-0 rounded-xl object-contain ${center ? 'mx-auto' : ''}`}
        />
      ) : null}
      <div className="min-w-0 flex-1">
        {print ? (
          <p className="text-lg font-bold">{page.name}</p>
        ) : (
          <h1 className="text-3xl font-bold">{page.name}</h1>
        )}
        {page.description ? (
          <p
            className={`${print ? 'text-xs' : `mt-2 max-w-3xl text-sm ${center ? 'mx-auto' : ''}`} whitespace-pre-line ${muted}`}
          >
            {page.description}
          </p>
        ) : null}
        <p className={print ? 'text-xs' : 'mt-2 text-sm'}>
          {print ? (
            page.contactEmail
          ) : (
            <a
              href={`mailto:${page.contactEmail}`}
              className="underline decoration-current/50 underline-offset-2 hover:decoration-current"
            >
              {page.contactEmail}
            </a>
          )}
        </p>
      </div>
      {aside ? <div className="shrink-0 text-right text-xs">{aside}</div> : null}
    </div>
  );
}
