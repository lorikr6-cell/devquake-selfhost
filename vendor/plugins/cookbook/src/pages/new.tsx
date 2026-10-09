import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { RecipeEditor, emptyRecipe } from '../components/recipe-editor';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.new') };
}

/** Writing a new own recipe. */
export default async function NewRecipe({ ctx }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale, 'editor');
  return (
    <div className="space-y-6">
      <BackLink
        href="/?tab=mine"
        className="text-sm text-ink/60 hover:text-quake dark:text-paper/60"
      >
        {t('back')}
      </BackLink>
      <h1 className="font-display text-3xl font-bold">{t('newTitle')}</h1>
      <RecipeEditor initial={emptyRecipe()} />
    </div>
  );
}
