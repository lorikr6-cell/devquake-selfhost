'use client';

import { useState } from 'react';
import { cn, useT } from '@devquake/ui';
import { ReviewForm } from './review-form';
import { S } from './shop-style';

/** On a shipped or delivered order's page: rate each product bought (a verified purchase). */
export function OrderReviews({
  slug,
  code,
  buyerName,
  products,
  reviewed,
}: {
  slug: string;
  code: string;
  buyerName: string;
  products: Array<{ id: number; name: string }>;
  reviewed: number[];
}) {
  const t = useT('reviewsShop');
  const [done, setDone] = useState<number[]>(reviewed);
  const open = products.filter((p) => !done.includes(p.id));
  if (products.length === 0) return null;
  return (
    <section className={cn('space-y-3', S.panel)}>
      <h2 className={cn('text-lg font-semibold', S.heading)}>{t('rateTitle')}</h2>
      {open.length === 0 ? (
        <p className="text-sm">{t('allRated')}</p>
      ) : (
        <ul className="space-y-4">
          {open.map((p) => (
            <li key={p.id} className="space-y-2">
              <p className="font-medium">{p.name}</p>
              <ReviewForm
                action={`/api/s/${slug}/orders/${code}/reviews`}
                moderated={false}
                extra={{ productId: p.id }}
                defaultName={buyerName.split(' ')[0] ?? ''}
                onDone={() => setDone((d) => [...d, p.id])}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
