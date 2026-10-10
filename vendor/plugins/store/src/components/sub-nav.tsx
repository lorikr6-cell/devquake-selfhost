import { Link, cn, type Locale } from '@devquake/ui';
import { translator } from '../i18n';
import { can, type Area, type Role } from '../lib/roles';

// Tabs inside a section (Products · Types · Vendors; Settings · Payments · …), for the roles
// that may open each one.

type Tab = { href: string; key: string; area: Area };

const GROUPS = {
  products: [
    { href: '/products', key: 'products', area: 'products' },
    { href: '/products/types', key: 'types', area: 'products' },
    { href: '/vendors', key: 'vendors', area: 'products' },
  ],
  marketing: [
    { href: '/marketing', key: 'promotions', area: 'marketing' },
    { href: '/newsletters', key: 'newsletters', area: 'marketing' },
  ],
  settings: [
    { href: '/settings', key: 'shop', area: 'settings' },
    { href: '/settings/design', key: 'design', area: 'design' },
    { href: '/settings/seo', key: 'seo', area: 'seo' },
    { href: '/settings/languages', key: 'languages', area: 'settings' },
    { href: '/settings/payments', key: 'payments', area: 'payments' },
    { href: '/settings/shipping', key: 'shipping', area: 'shipping' },
    { href: '/team', key: 'team', area: 'team' },
  ],
} satisfies Record<string, Tab[]>;

export function SubNav({
  group,
  current,
  roles,
  locale,
}: {
  group: keyof typeof GROUPS;
  current: string;
  roles: readonly Role[];
  locale: Locale;
}) {
  const t = translator(locale, 'subNav');
  const tabs = (GROUPS[group] as Tab[]).filter((tab) => can(roles, tab.area));
  if (tabs.length < 2) return null;
  return (
    <nav aria-label={t(group)} className="-mt-2 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.href === current ? 'page' : undefined}
          className={cn(
            'rounded-full border px-3 py-1.5 text-sm',
            tab.href === current
              ? 'border-quake bg-quake/10 font-semibold'
              : 'border-ink/15 hover:border-quake dark:border-paper/15',
          )}
        >
          {t(tab.key)}
        </Link>
      ))}
    </nav>
  );
}
