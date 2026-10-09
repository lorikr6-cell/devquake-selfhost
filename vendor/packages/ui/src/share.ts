// Sharing on social networks, for the site and every app: the networks, their own "share" pages
// with the link filled in, and campaign parameters so DevQuake's statistics see where visitors
// came from. Pure (no React), so it is safe on the server too.

export const SOCIAL_NETWORKS = [
  'x',
  'facebook',
  'linkedin',
  'reddit',
  'bluesky',
  'mastodon',
  'telegram',
  'whatsapp',
  'pinterest',
] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export const SOCIAL_NAMES: Record<SocialNetwork, string> = {
  x: 'X',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  reddit: 'Reddit',
  bluesky: 'Bluesky',
  mastodon: 'Mastodon',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  pinterest: 'Pinterest',
};

/**
 * The networks offered when sharing without a member's own accounts (apps, invite links): the
 * most used ones that open with the link filled in. Mastodon needs the member's instance, so it
 * is left out here.
 */
export const DEFAULT_SHARE_NETWORKS: readonly SocialNetwork[] = [
  'whatsapp',
  'facebook',
  'x',
  'pinterest',
  'telegram',
  'reddit',
  'linkedin',
  'bluesky',
];

/** `url` with campaign parameters: where it was shared (`source`) and what (`campaign`). */
export function campaignUrl(
  url: string,
  source: SocialNetwork | 'copy' | 'native',
  campaign: string,
): string {
  const u = new URL(url);
  u.searchParams.set('utm_source', source);
  u.searchParams.set('utm_medium', 'social');
  u.searchParams.set('utm_campaign', campaign);
  return u.href;
}

/**
 * The network's own "share" page with the link filled in; the person presses Post there.
 * Mastodon needs the member's instance (from their handle, "@name@instance"); null without it.
 */
export function shareUrl(
  network: SocialNetwork,
  item: { url: string; title: string; image?: string | null },
  options: { campaign: string; handle?: string },
): string | null {
  const url = campaignUrl(item.url, network, options.campaign);
  const e = encodeURIComponent;
  switch (network) {
    case 'x':
      return `https://x.com/intent/post?url=${e(url)}&text=${e(item.title)}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`;
    case 'reddit':
      return `https://www.reddit.com/submit?url=${e(url)}&title=${e(item.title)}`;
    case 'bluesky':
      return `https://bsky.app/intent/compose?text=${e(`${item.title} ${url}`)}`;
    case 'mastodon': {
      const instance = options.handle?.split('@')[2];
      return instance ? `https://${instance}/share?text=${e(`${item.title} ${url}`)}` : null;
    }
    case 'telegram':
      return `https://t.me/share/url?url=${e(url)}&text=${e(item.title)}`;
    case 'whatsapp':
      return `https://wa.me/?text=${e(`${item.title} ${url}`)}`;
    case 'pinterest':
      return `https://pinterest.com/pin/create/button/?url=${e(url)}&description=${e(item.title)}${
        item.image ? `&media=${e(item.image)}` : ''
      }`;
  }
}
