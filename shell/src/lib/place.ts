import 'server-only';
import { headers } from 'next/headers';
import { cache } from 'react';
import { APP, PLUGIN_IDS } from '@/generated/app';
import { configuredPublicUrl, domainSetting } from './env';
import { appOrigin, homeOrigin, placeOf, type Place } from './hosts';
import { publicUrl } from './url';

// Which app this request is for, and the addresses of the home and every app (ADR 0056).

export const getPlace = cache(async (): Promise<Place> => {
  const h = await headers();
  const host = (h.get('x-forwarded-host') ?? h.get('host') ?? '').split(',')[0]!.trim();
  return placeOf(host, PLUGIN_IDS, APP.multi, domainSetting());
});

export const getOrigins = cache(async () => {
  const h = await headers();
  const domain = domainSetting();
  const base = configuredPublicUrl() ?? publicUrl(h);
  return {
    home: homeOrigin(base, APP.multi, domain),
    app: (id: string) => appOrigin(id, base, APP.multi, domain),
  };
});
