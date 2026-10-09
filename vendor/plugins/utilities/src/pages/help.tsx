import type { ReactNode } from 'react';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link, localizePath, rich } from '@devquake/ui';
import { localeOf } from '../i18n';
import { MANUAL, type ManualBlock } from '../i18n/manual';

const CONTACT_EMAIL = 'contact@devquake.com';

/** Public page (ADR 0009): indexed, with the app's own address as canonical URL. */
export function generateMetadata({ ctx }: PluginPageProps) {
  const locale = localeOf(ctx);
  const manual = MANUAL[locale];
  const url = `${ctx.baseUrl}${localizePath('/help', locale)}`;
  return {
    title: manual.metaTitle,
    description: manual.metaDescription,
    // The host adds the other languages (hreflang).
    alternates: { canonical: url },
    openGraph: { title: manual.ogTitle, url, siteName: 'DevQuake', type: 'article' },
  };
}

/** Manual text: **bold** and {placeholders} (e.g. {host}, a link to DevQuake). */
function inline(text: string, values: Record<string, ReactNode>): ReactNode {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith('**') ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{rich(part, values)}</span>
      ),
    );
}

/** The user manual: from signing up to sharing, readings, payments and statistics, in order. */
export default function Help({ ctx }: PluginPageProps) {
  const locale = localeOf(ctx);
  const manual = MANUAL[locale];
  const values = {
    host: (
      <a className="underline" href={ctx.hostUrl}>
        devquake.com
      </a>
    ),
  };

  function block(b: ManualBlock, key: number): ReactNode {
    if ('p' in b) return <p key={key}>{inline(b.p, values)}</p>;
    if ('tip' in b) {
      return (
        <p key={key} className="rounded-lg border-l-4 border-quake bg-quake/5 px-4 py-2 text-sm">
          {inline(b.tip, values)}
        </p>
      );
    }
    if ('steps' in b) {
      return (
        <ol key={key} className="list-decimal space-y-2 pl-5">
          {b.steps.map((s, i) => (
            <li key={i}>{inline(s, values)}</li>
          ))}
        </ol>
      );
    }
    return (
      <ul key={key} className="list-disc space-y-1 pl-5">
        {b.list.map((s, i) => (
          <li key={i}>{inline(s, values)}</li>
        ))}
      </ul>
    );
  }

  return (
    <article className="mx-auto max-w-3xl space-y-10 leading-relaxed">
      {!ctx.user ? (
        <p className="rounded-xl border border-quake/30 bg-quake/5 px-4 py-3 text-sm">
          {rich(manual.cta, {
            link: (
              <a className="font-medium text-quake underline" href={`${ctx.hostUrl}/#account`}>
                {manual.ctaLink}
              </a>
            ),
          })}
        </p>
      ) : null}
      <header>
        <p className="text-sm text-ink/60 dark:text-paper/60">{manual.kicker}</p>
        <h1 className="font-display text-4xl font-bold">{manual.title}</h1>
        <p className="mt-3 text-ink/80 dark:text-paper/80">{manual.intro}</p>
      </header>

      <nav
        aria-label={manual.contents}
        className="rounded-xl border border-ink/10 bg-white/70 p-4 dark:border-paper/10 dark:bg-paper/5"
      >
        <p className="mb-2 text-sm font-semibold">{manual.contents}</p>
        <ol className="grid gap-1 text-sm sm:grid-cols-2">
          {manual.sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="underline decoration-quake/40 underline-offset-2 hover:decoration-quake"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {manual.sections.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-20 space-y-3">
          <h2 className="font-display text-2xl font-bold">{s.title}</h2>
          {s.blocks.map(block)}
        </section>
      ))}

      <section className="space-y-3">
        <p>
          {rich(manual.questions, {
            email: (
              <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            ),
          })}
        </p>
        <p>
          <Link href="/" className="font-medium text-quake underline">
            {manual.back}
          </Link>
        </p>
      </section>
    </article>
  );
}
