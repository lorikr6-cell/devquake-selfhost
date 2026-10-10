'use client';

import { useId, useState } from 'react';
import { ShareButtons, Sheet, trackEvent, useT } from '@devquake/ui';
import { useFeedback } from './feedback';
import { S } from './shop-style';

/**
 * Sharing a product: the device's own menu and the social networks, its direct link, and a QR
 * code of its page to download or print (for shelves, flyers and packaging).
 */
export function ProductShare({
  url,
  title,
  image,
  qrUrl,
  className,
  buttonClassName,
}: {
  /** The product page's absolute address. */
  url: string;
  title: string;
  image: string | null;
  /** The QR code's SVG (an app route). */
  qrUrl: string;
  className?: string;
  buttonClassName?: string;
}) {
  const t = useT('share');
  const { toast } = useFeedback();
  const [open, setOpen] = useState(false);
  const heading = useId();

  function print() {
    const w = window.open('', '_blank', 'width=480,height=640');
    if (!w) return;
    const doc = w.document;
    doc.title = title;
    const box = doc.createElement('div');
    box.style.cssText = 'font-family:system-ui,sans-serif;text-align:center;padding:24px';
    const img = doc.createElement('img');
    img.src = new URL(qrUrl, window.location.href).href;
    img.alt = '';
    img.style.cssText = 'width:300px;height:300px';
    const name = doc.createElement('p');
    name.textContent = title;
    name.style.cssText = 'font-size:18px;font-weight:600';
    const link = doc.createElement('p');
    link.textContent = url;
    link.style.cssText = 'font-size:12px;color:#555;word-break:break-all';
    box.append(img, name, link);
    doc.body.append(box);
    img.onload = () => w.print();
  }

  return (
    <div className={className}>
      <button
        type="button"
        className={buttonClassName ?? S.buttonSecondary}
        onClick={() => {
          setOpen(true);
          trackEvent('store_share_open');
        }}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        <span>{t('open')}</span>
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={heading}
        header={
          <h2 id={heading} className="font-display text-lg font-semibold">
            {t('title', { name: title })}
          </h2>
        }
        footer={
          <button
            type="button"
            className="min-h-11 rounded-md border border-ink/20 px-4 py-2 text-sm dark:border-paper/20"
            onClick={() => setOpen(false)}
          >
            {t('close')}
          </button>
        }
        bodyClassName="space-y-5"
      >
        <ShareButtons
          url={url}
          title={title}
          image={image}
          campaign="store_product"
          labels={{
            title: '',
            more: t('more'),
            copy: t('copy'),
            copied: t('copied'),
            on: t('on'),
          }}
        />
        <div className="space-y-1">
          <p className="text-sm font-medium">{t('link')}</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={url}
              aria-label={t('link')}
              onFocus={(e) => e.currentTarget.select()}
              className="min-h-11 min-w-0 flex-1 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink dark:border-paper/15 dark:bg-ink dark:text-paper"
            />
            <button
              type="button"
              className="min-h-11 rounded-md border border-ink/20 px-3 text-sm dark:border-paper/20"
              onClick={async () => {
                await navigator.clipboard?.writeText(url).catch(() => undefined);
                toast(t('copied'));
              }}
            >
              {t('copy')}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('qr')}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt={t('qrAlt', { name: title })}
            className="mx-auto size-56 rounded-lg bg-white p-2"
          />
          <p className="text-center text-xs text-ink/60 dark:text-paper/60">{t('qrHint')}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <a
              href={`${qrUrl}?download=1`}
              download
              className="inline-flex min-h-11 items-center rounded-md border border-ink/20 px-3 text-sm dark:border-paper/20"
              onClick={() => trackEvent('store_qr_download')}
            >
              {t('download')}
            </a>
            <button
              type="button"
              className="min-h-11 rounded-md border border-ink/20 px-3 text-sm dark:border-paper/20"
              onClick={print}
            >
              {t('print')}
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
