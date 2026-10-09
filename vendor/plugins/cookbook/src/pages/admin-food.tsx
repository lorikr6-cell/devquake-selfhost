import { notFound } from 'next/navigation';
import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { FoodEditor } from '../components/food-editor';
import { pageScope } from '../components/guard';
import { FoodPictures } from '../components/food-pictures';
import { foodPhotoVariants } from '../lib/food-photos';
import { foodById, thumbOf } from '../lib/foods';

export function generateMetadata({ ctx, params }: PluginPageProps) {
  return {
    title: translator(localeOf(ctx))(params.id ? 'foodAdmin.metaEdit' : 'foodAdmin.metaNew'),
  };
}

/** One food of the catalogue for DevQuake staff: /admin/foods/:id, or /admin/new-food. */
export default async function AdminFood({ ctx, params }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  if (!scope.user.isAdmin) notFound();
  const t = translator(scope.locale, 'foodAdmin');
  const food = params.id ? foodById(params.id) : null;
  if (params.id && !food) notFound();
  const variants = food ? await foodPhotoVariants(scope.db, food.id) : [];
  const timeZone = ctx.timeZone || 'UTC';

  return (
    <div className="space-y-6">
      <div>
        <BackLink
          href="/admin/foods"
          className="text-sm text-ink/60 hover:text-quake dark:text-paper/60"
        >
          {t('back')}
        </BackLink>
        <h1 className="font-display text-3xl font-bold">
          {food ? food.name[scope.locale] : t('newFood')}
        </h1>
      </div>
      {food ? (
        <FoodPictures
          foodId={food.id}
          shown={thumbOf(food)}
          variants={variants.map((v) => ({
            id: v.id,
            url: v.url,
            uploadedAt: formatDateTime(v.uploadedAt, timeZone, 'date', scope.locale),
          }))}
        />
      ) : null}
      <FoodEditor food={food ?? null} />
    </div>
  );
}
