import { Link, cn, type Translate } from '@devquake/ui';
import type { Action } from '../lib/roles';

const TABS: { key: string; path: string; action: Action }[] = [
  { key: 'people', path: '', action: 'people.view' },
  { key: 'calendar', path: '/calendar', action: 'people.view' },
  { key: 'meals', path: '/meals', action: 'kitchen.view' },
  { key: 'kitchen', path: '/kitchen', action: 'kitchen.view' },
  { key: 'routes', path: '/routes', action: 'routes.edit' },
  { key: 'myRoute', path: '/my-route', action: 'route.own' },
  { key: 'medication', path: '/medication', action: 'medical.view' },
  { key: 'staff', path: '/staff', action: 'org.manage' },
];

/** The organisation's sections this role may open; `current` is the active one. */
export function OrgNav({
  orgId,
  orgName,
  current,
  can,
  t,
}: {
  orgId: number;
  orgName: string;
  current: string;
  can: (action: Action) => boolean;
  t: Translate;
}) {
  const tabs = TABS.filter((tab) => can(tab.action));
  return (
    <div className="mb-6 print:hidden">
      <p className="text-sm text-ink/60 dark:text-paper/60">{orgName}</p>
      {tabs.length > 1 ? (
        <nav
          aria-label={orgName}
          className="-mx-4 mt-2 overflow-x-auto overflow-y-hidden border-b border-ink/10 px-4 sm:mx-0 sm:px-0 dark:border-paper/10"
        >
          <ul className="flex min-w-max gap-1">
            {tabs.map((tab) => (
              <li key={tab.key}>
                <Link
                  href={`/orgs/${orgId}${tab.path}`}
                  aria-current={tab.key === current ? 'page' : undefined}
                  className={cn(
                    '-mb-px inline-block border-b-2 px-3 py-2 text-sm whitespace-nowrap',
                    tab.key === current
                      ? 'border-quake font-medium'
                      : 'border-transparent text-ink/70 hover:text-ink dark:text-paper/70 dark:hover:text-paper',
                  )}
                >
                  {t(`orgNav.${tab.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
