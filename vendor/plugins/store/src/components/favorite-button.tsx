'use client';

import { useState } from 'react';
import { Link, cn, useT } from '@devquake/ui';
import { callApi, errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { S } from './shop-style';

/**
 * Saves the product to the buyer's favourites (ADR 0064), with its price now, or takes it off.
 * People who are not signed in (neither a DevQuake member nor the shop's buyer) get a link to
 * sign in instead.
 */
export function FavoriteButton({
  slug,
  product,
  initial,
  canSave,
}: {
  slug: string;
  product: string;
  initial: boolean;
  canSave: boolean;
}) {
  const t = useT('favorites');
  const tErrors = useT('errors');
  const { toast } = useFeedback();
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);

  const heart = (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="size-5"
      fill={on ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    >
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
    </svg>
  );

  if (!canSave) {
    return (
      <Link
        href={`/s/${slug}/account`}
        className={cn(S.buttonSecondary, 'inline-flex items-center gap-2')}
      >
        {heart}
        {t('signIn')}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await callApi(`/s/${slug}/p/${product}/favorite`, on ? 'DELETE' : 'POST');
          toast(on ? t('removed') : t('added'));
          setOn(!on);
        } catch (err) {
          toast(errorMessage(err, tErrors), 'error');
        } finally {
          setBusy(false);
        }
      }}
      className={cn(S.buttonSecondary, 'inline-flex items-center gap-2')}
    >
      {heart}
      {on ? t('saved') : t('save')}
    </button>
  );
}
