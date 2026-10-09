'use client';

import { useState } from 'react';
import { Button, trackEvent, useT, ShareButtons } from '@devquake/ui';
import { callApi, errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { useAppRouter } from './use-app-router';

/** "Save a copy": a library or shared recipe becomes the visitor's own, to change. */
export function CopyButton({ recipeRef }: { recipeRef: string }) {
  const t = useT('recipe');
  const tErr = useT('errors');
  const router = useAppRouter();
  const { toast } = useFeedback();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await callApi<{ id: number }>('/copy', 'POST', { ref: recipeRef });
          trackEvent('recipe_copied');
          toast(t('copied'));
          router.push(`/r/${res!.id}/edit`);
        } catch (err) {
          toast(errorMessage(err, tErr), 'error');
          setBusy(false);
        }
      }}
    >
      {t('copy')}
    </Button>
  );
}

/** The owner's sharing: make a link, copy it, stop sharing. */
export function ShareControls({
  recipeId,
  baseUrl,
  code,
}: {
  recipeId: number;
  baseUrl: string;
  code: string | null;
}) {
  const t = useT('share');
  const tErr = useT('errors');
  const router = useAppRouter();
  const { confirm, toast } = useFeedback();
  const [busy, setBusy] = useState(false);
  const link = code ? `${baseUrl}/s/${code}` : null;

  async function run(action: () => Promise<unknown>, done: string) {
    setBusy(true);
    try {
      await action();
      toast(done);
      router.refresh();
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-ink/10 p-4 text-sm dark:border-paper/10">
      <p className="font-medium">{t('title')}</p>
      <p className="text-xs text-ink/60 dark:text-paper/60">
        {link ? t('sharedIntro') : t('privateIntro')}
      </p>
      {link ? (
        <>
          <p className="rounded-md bg-ink/5 px-3 py-2 font-mono text-sm break-all dark:bg-paper/10">
            {link}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(link).catch(() => undefined);
                toast(t('copied'));
              }}
            >
              {t('copy')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={async () => {
                const ok = await confirm({
                  title: t('stopTitle'),
                  body: t('stopBody'),
                  confirmLabel: t('stop'),
                  danger: true,
                });
                if (ok)
                  await run(() => callApi(`/recipes/${recipeId}/share`, 'DELETE'), t('stopped'));
              }}
            >
              {t('stop')}
            </Button>
          </div>
        </>
      ) : (
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => run(() => callApi(`/recipes/${recipeId}/share`, 'POST'), t('made'))}
        >
          {t('make')}
        </Button>
      )}
    </div>
  );
}

export function DeleteRecipeButton({ recipeId, title }: { recipeId: number; title: string }) {
  const t = useT('recipe');
  const tErr = useT('errors');
  const router = useAppRouter();
  const { confirm, toast } = useFeedback();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={busy}
      className="text-red-700 dark:text-red-400"
      onClick={async () => {
        const ok = await confirm({
          title: t('deleteTitle', { title }),
          body: t('deleteBody'),
          confirmLabel: t('delete'),
          danger: true,
        });
        if (!ok) return;
        setBusy(true);
        try {
          await callApi(`/recipes/${recipeId}`, 'DELETE');
          toast(t('deleted'));
          router.push('/?tab=mine');
        } catch (err) {
          toast(errorMessage(err, tErr), 'error');
          setBusy(false);
        }
      }}
    >
      {t('delete')}
    </Button>
  );
}

/**
 * The recipe's public link (ADR 0047): anyone who has it sees the recipe and its photo, signed
 * in or not, so it can go to Facebook, WhatsApp, Pinterest… The author makes and stops it.
 */
export function PublicLinkControls({
  recipeId,
  baseUrl,
  code,
  title,
  photo,
}: {
  recipeId: number;
  baseUrl: string;
  code: string | null;
  title: string;
  /** The photo's version, or null without a photo. */
  photo: number | null;
}) {
  const t = useT('publicRecipe');
  const tErr = useT('errors');
  const router = useAppRouter();
  const { confirm, toast } = useFeedback();
  const [busy, setBusy] = useState(false);
  const link = code ? `${baseUrl}/p/${code}` : null;

  async function run(action: () => Promise<unknown>, done: string) {
    setBusy(true);
    try {
      await action();
      toast(done);
      router.refresh();
    } catch (err) {
      toast(errorMessage(err, tErr), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-ink/10 p-4 text-sm dark:border-paper/10">
      <p className="font-medium">{t('controlsTitle')}</p>
      <p className="text-xs text-ink/60 dark:text-paper/60">
        {link ? t('onIntro') : t('offIntro')}
      </p>
      {link ? (
        <>
          <p className="rounded-md bg-ink/5 px-3 py-2 font-mono text-sm break-all dark:bg-paper/10">
            {link}
          </p>
          <ShareButtons
            url={link}
            title={title}
            image={photo !== null && code ? `${baseUrl}/api/p/${code}/photo?v=${photo}` : null}
            campaign="recipe"
            labels={{
              title: '',
              more: t('shareMore'),
              copy: t('copy'),
              copied: t('copied'),
              on: t('shareOn'),
            }}
          />
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={async () => {
              const ok = await confirm({
                title: t('stopTitle'),
                body: t('stopBody'),
                confirmLabel: t('stop'),
                danger: true,
              });
              if (ok) {
                await run(
                  () => callApi(`/recipes/${recipeId}/public-link`, 'DELETE'),
                  t('stopped'),
                );
              }
            }}
          >
            {t('stop')}
          </Button>
        </>
      ) : (
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => run(() => callApi(`/recipes/${recipeId}/public-link`, 'POST'), t('made'))}
        >
          {t('make')}
        </Button>
      )}
    </div>
  );
}
