import type { OrgPage } from '../lib/org-page';

/** The organisation's banner: logo, name and description (its own page and its staff's pages). */
export function OrgBanner({ page, logoUrl }: { page: OrgPage; logoUrl: string }) {
  return (
    <section className="mb-6 flex flex-wrap items-center gap-5 rounded-2xl border border-ink/10 bg-white/70 p-5 dark:border-paper/10 dark:bg-paper/5">
      {page.logoVersion ? (
        // eslint-disable-next-line @next/next/no-img-element -- served by the app's own API
        <img
          src={`${logoUrl}?v=${page.logoVersion}`}
          alt=""
          className="h-20 w-20 shrink-0 rounded-xl object-contain"
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-3xl font-bold">{page.name}</h1>
        {page.description ? (
          <p className="mt-2 max-w-3xl text-sm whitespace-pre-line text-ink/80 dark:text-paper/80">
            {page.description}
          </p>
        ) : null}
        <p className="mt-2 text-sm">
          <a
            href={`mailto:${page.contactEmail}`}
            className="underline decoration-quake/50 underline-offset-2 hover:decoration-quake"
          >
            {page.contactEmail}
          </a>
        </p>
      </div>
    </section>
  );
}
