import type { OrgPage } from '../lib/org-page';
import { OrgHeader } from './org-header';

/** The organisation's banner in its own look (its own page and its staff's pages). */
export function OrgBanner({
  page,
  logoUrl,
  imageUrl,
}: {
  page: OrgPage;
  logoUrl: string;
  imageUrl: string;
}) {
  return (
    <section>
      <OrgHeader page={page} logoUrl={logoUrl} imageUrl={imageUrl} />
    </section>
  );
}
