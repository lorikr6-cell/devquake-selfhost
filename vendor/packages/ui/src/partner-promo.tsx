'use client';

import { useEffect, useState } from 'react';
import { buttonClass } from './button';
import { useT } from './i18n-react';

/** What the card needs of a partner app (PluginLinkedApp from ctx.links.list()). */
export interface PartnerPromoApp {
  app: string;
  name: string;
  iconUrl: string;
  state: 'connected' | 'available' | 'needs-access';
  openUrl: string;
  connectUrl: string;
}

/**
 * A card that invites the member to a partner app where it helps right here (e.g. "your pets'
 * vet visits in the family calendar"): Connect when they can, Try it otherwise. Not shown once
 * connected, nor after closing it (remembered in this browser). `message` is the app's own,
 * in the page language; the buttons use the host's texts (common.partnerPromo).
 */
export function PartnerPromo({ partner, message }: { partner: PartnerPromoApp; message: string }) {
  const t = useT('common.partnerPromo');
  const key = `dq_promo_closed:${partner.app}`;
  const [closed, setClosed] = useState(true);
  useEffect(() => {
    try {
      setClosed(localStorage.getItem(key) === '1');
    } catch {
      setClosed(false);
    }
  }, [key]);
  if (partner.state === 'connected' || closed) return null;
  const close = () => {
    try {
      localStorage.setItem(key, '1');
    } catch {
      // private window: closed for this page only
    }
    setClosed(true);
  };
  return (
    <aside className="flex flex-wrap items-center gap-3 rounded-xl border border-quake/30 bg-quake/5 px-4 py-3 text-sm">
      {/* eslint-disable-next-line @next/next/no-img-element -- the app's own SVG logo */}
      <img src={partner.iconUrl} alt="" className="size-9 shrink-0 rounded-lg" />
      <p className="min-w-0 flex-1">
        <span className="font-semibold">{partner.name}: </span>
        {message}
      </p>
      <a
        href={partner.state === 'available' ? partner.connectUrl : partner.openUrl}
        className={buttonClass('primary')}
      >
        {partner.state === 'available' ? t('connect') : t('tryIt')}
      </a>
      <button
        type="button"
        onClick={close}
        aria-label={t('close')}
        className="rounded p-1 text-ink/60 hover:text-ink dark:text-paper/60 dark:hover:text-paper"
      >
        ×
      </button>
    </aside>
  );
}
