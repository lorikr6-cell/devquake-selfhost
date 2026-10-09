import type { Metadata } from 'next';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { ShareButtons, buttonClass } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { RecipeBody } from '../components/recipe-view';
import { Notice, Panel } from '../components/ui';
import { publicRecipe, summaryOf } from '../lib/data';
import { nutritionOf } from '../lib/recipe';

/** A recipe behind a public link, or null (also when the app's database is not there). */
async function load({ ctx, params }: PluginPageProps) {
  if (!ctx.db) return null;
  return publicRecipe(ctx.db, params.code ?? '').catch(() => null);
}

const photoUrl = (baseUrl: string, code: string, version: number) =>
  `${baseUrl}/api/p/${code}/photo?v=${version}`;

export async function generateMetadata(props: PluginPageProps): Promise<Metadata> {
  const t = translator(localeOf(props.ctx), 'publicRecipe');
  const r = await load(props);
  // Shared on purpose, but only for people who have the link: not for search engines.
  const robots = { index: false, follow: true };
  if (!r || !r.publicCode) return { title: t('goneTitle'), robots };
  const url = `${props.ctx.baseUrl}/p/${r.publicCode}`;
  const description = (r.intro ?? t('description', { name: r.ownerName ?? '' })).slice(0, 200);
  const image = r.photo !== null ? photoUrl(props.ctx.baseUrl, r.publicCode, r.photo) : null;
  return {
    title: r.title,
    description,
    robots,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: r.title,
      description,
      url,
      ...(image ? { images: [{ url: image, alt: r.title }] } : {}),
    },
    twitter: { card: image ? 'summary_large_image' : 'summary' },
  };
}

/**
 * A recipe its author shared with a public link (ADR 0047): anyone who has the link sees it,
 * signed in or not, with its photo, ingredients and steps, and can share it further. Nothing
 * else about the author or the app's members is shown.
 */
export default async function PublicRecipe(props: PluginPageProps) {
  const { ctx } = props;
  const locale = localeOf(ctx);
  const t = translator(locale, 'publicRecipe');
  const tRecipe = translator(locale, 'recipe');
  const tDiff = translator(locale, 'difficulty');
  const r = await load(props);
  if (!r || !r.publicCode) {
    return (
      <Notice title={t('goneTitle')}>
        <p>{t('goneBody')}</p>
        <a href={ctx.baseUrl} className={buttonClass('primary', 'mt-4')}>
          {t('ctaButton')}
        </a>
      </Notice>
    );
  }
  const summary = summaryOf(r);
  const url = `${ctx.baseUrl}/p/${r.publicCode}`;
  const image = r.photo !== null ? photoUrl(ctx.baseUrl, r.publicCode, r.photo) : null;

  return (
    <article className="space-y-8">
      <div className="flex flex-wrap items-start gap-4">
        {image ? (
          // The photo is served by the app itself; next/image is not used in apps.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={r.title} className="h-48 w-full rounded-xl object-cover sm:w-72" />
        ) : (
          <span
            aria-hidden
            className="grid size-24 place-items-center rounded-xl bg-quake/10 text-5xl"
          >
            {r.icon}
          </span>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="font-display text-3xl font-bold break-words">{r.title}</h1>
          <p className="text-sm text-ink/70 dark:text-paper/70">
            {[
              r.prepMin ? tRecipe('prep', { count: r.prepMin }) : null,
              r.cookMin ? tRecipe('cook', { count: r.cookMin }) : null,
              tDiff(r.difficulty),
              r.cuisine,
              tRecipe('by', { name: r.ownerName ?? '' }),
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {r.intro ? <p className="whitespace-pre-wrap">{r.intro}</p> : null}
        </div>
      </div>

      <RecipeBody
        recipeRef={`p-${r.publicCode}`}
        baseServings={r.servings}
        ingredients={r.ingredients}
        steps={r.steps}
        equipment={r.equipment}
        tags={summary.tags}
        allergens={summary.allergens}
        nutrition={nutritionOf(r.ingredients, r.servings)}
        thumbs={{}}
        lists={null}
        connectUrl={null}
        cookLink={false}
      />

      {r.tips ? (
        <section className="rounded-lg border-l-4 border-quake bg-quake/5 px-4 py-3">
          <h2 className="text-sm font-semibold">{tRecipe('tips')}</h2>
          <p className="text-sm whitespace-pre-wrap">{r.tips}</p>
        </section>
      ) : null}

      <p className="text-xs text-ink/50 dark:text-paper/50">{tRecipe('disclaimer')}</p>

      <ShareButtons
        url={url}
        title={r.title}
        image={image}
        campaign="recipe"
        labels={{
          title: t('share'),
          more: t('shareMore'),
          copy: t('copy'),
          copied: t('copied'),
          on: t('shareOn'),
        }}
      />

      <Panel className="space-y-2 border-quake/40 bg-quake/5">
        <h2 className="font-display text-lg font-bold">{t('ctaTitle')}</h2>
        <p className="text-sm text-ink/80 dark:text-paper/80">{t('ctaBody')}</p>
        <a href={ctx.baseUrl} className={buttonClass('primary')}>
          {t('ctaButton')}
        </a>
      </Panel>
    </article>
  );
}
