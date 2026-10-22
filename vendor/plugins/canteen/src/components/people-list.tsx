'use client';

import { useMemo, useState } from 'react';
import { Link, cn, useT } from '@devquake/ui';
import { PERSON_KINDS, type PersonKind } from '../lib/model';
import type { Person } from '../lib/data';
import { Input, Select } from './ui';

/** The organisation's people, searchable by name or address and filtered by where they live. */
export function PeopleList({ orgId, people }: { orgId: number; people: Person[] }) {
  const t = useT();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<PersonKind | ''>('');
  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return people.filter((p) => {
      if (kind && p.kind !== kind) return false;
      const text = `${p.lastName} ${p.firstName} ${p.address ?? ''}`.toLowerCase();
      return words.every((w) => text.includes(w));
    });
  }, [people, q, kind]);

  if (people.length === 0) {
    return <p className="text-sm text-ink/70 dark:text-paper/70">{t('org.noPeople')}</p>;
  }
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('org.search')}
          aria-label={t('org.search')}
          className="w-full sm:w-80"
        />
        <Select
          value={kind}
          onChange={(e) => setKind(e.target.value as PersonKind | '')}
          aria-label={t('fields.kind')}
          className="w-auto"
        >
          <option value="">{t('org.all')}</option>
          {PERSON_KINDS.map((k) => (
            <option key={k} value={k}>
              {t(`kinds.${k}`)}
            </option>
          ))}
        </Select>
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-ink/70 dark:text-paper/70">{t('org.noMatch')}</p>
      ) : (
        <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 bg-white/70 dark:divide-paper/10 dark:border-paper/10 dark:bg-paper/5">
          {shown.map((p) => (
            <li key={p.id}>
              <Link
                href={`/orgs/${orgId}/people/${p.id}`}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 hover:bg-ink/5 dark:hover:bg-paper/10',
                  p.status !== 'active' && 'opacity-60',
                )}
              >
                <Avatar orgId={orgId} person={p} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {p.lastName} {p.firstName}
                  </span>
                  <span className="block truncate text-xs text-ink/60 dark:text-paper/60">
                    {t(`kinds.${p.kind}`)}
                    {p.address ? ` · ${p.address}` : ''}
                  </span>
                </span>
                {p.inHospital ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-950 dark:bg-amber-900/60 dark:text-amber-100">
                    {t('medical.inHospital')}
                  </span>
                ) : null}
                {p.incomplete ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-950 dark:bg-amber-900/60 dark:text-amber-100">
                    {t('org.incomplete')}
                  </span>
                ) : null}
                {p.status !== 'active' ? (
                  <span className="text-xs">{t(`statuses.${p.status}`)}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The person's photo (small version), or their initials. */
export function Avatar({
  orgId,
  person,
  size = 40,
}: {
  orgId: number;
  person: Person;
  size?: number;
}) {
  const version = person.documents.photo;
  if (!version) {
    return (
      <span
        aria-hidden
        style={{ width: size, height: size }}
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-ink/10 text-sm font-semibold dark:bg-paper/15"
      >
        {person.lastName.charAt(0)}
        {person.firstName.charAt(0)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- served by the app's own API
    <img
      src={`/api/orgs/${orgId}/people/${person.id}/documents/photo?size=thumb&v=${version}`}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full object-cover"
    />
  );
}
