import type { PluginPageProps } from '@devquake/plugin-sdk';
import { PageTips, TipsToggle } from '../components/tips';
import { PrintHeader } from '../components/print-header';
import { notFound } from 'next/navigation';
import { LOCALE_TAGS, Link, buttonClass, formatDateTime } from '@devquake/ui';
import { DeletePerson } from '../components/forms';
import { orgScope, personIdOf } from '../components/guard';
import { IdReader } from '../components/id-reader';
import { IdentityPanel } from '../components/identity-panel';
import { Incidents } from '../components/incidents';
import { Avatar } from '../components/people-list';
import { PictureUpload } from '../components/picture-upload';
import { PersonSocial } from '../components/social';
import { Panel } from '../components/ui';
import { localeOf, translator } from '../i18n';
import {
  HttpError,
  accessLog,
  getPerson,
  listIncidents,
  orgById,
  staffOf,
  type AccessEntry,
  type Incident,
} from '../lib/data';
import { formatTime } from '../lib/meals';
import { personSocial } from '../lib/social-data';
import { DOCUMENT_KINDS, REQUIRED_DOCUMENTS, ageOn, documentSlug } from '../lib/model';

export async function generateMetadata({ ctx, params }: PluginPageProps) {
  const t = translator(localeOf(ctx));
  const orgId = Number(params.id);
  const ok =
    ctx.db && ctx.user && orgId > 0
      ? await staffOf(ctx.db, orgId, ctx.user.id).catch(() => null)
      : null;
  const org = ok && ctx.db ? await orgById(ctx.db, orgId).catch(() => null) : null;
  return { title: org ? t('meta.org', { name: org.name }) : t('meta.home') };
}

/**
 * A person's profile: photo and details for everyone who sees profiles; the ID card, other
 * papers, personal numbers and the access log for organisers; incidents for the roles that
 * keep them.
 */
export default async function PersonPage({ ctx, params }: PluginPageProps) {
  const scope = await orgScope(ctx, params, 'people.view');
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale);
  const orgId = scope.org.id;
  const person = await getPerson(scope.db, orgId, personIdOf(params), scope.user.id).catch(
    (err: unknown) => {
      if (err instanceof HttpError) notFound();
      throw err;
    },
  );
  const base = `/orgs/${orgId}/people/${person.id}`;
  const identity = scope.can('identity.view');
  const [incidents, access, social] = await Promise.all([
    scope.can('incidents.view')
      ? listIncidents(scope.db, orgId, person.id, scope.user.id)
      : ([] as Incident[]),
    scope.can('access.view')
      ? accessLog(scope.db, orgId, person.id, scope.user.id)
      : ([] as AccessEntry[]),
    scope.can('social.view') ? personSocial(scope.db, orgId, scope.user.id, person.id) : null,
  ]);
  const name = `${person.lastName} ${person.firstName}`;
  const birth = person.birthDate
    ? `${new Date(`${person.birthDate}T00:00:00Z`).toLocaleDateString(LOCALE_TAGS[scope.locale], {
        timeZone: 'UTC',
      })} · ${t('person.age', { age: ageOn(person.birthDate, scope.today) })}`
    : null;
  const details: [string, string | null][] = [
    [t('fields.birthDate'), birth],
    [t('fields.kind'), t(`kinds.${person.kind}`)],
    [t('fields.status'), t(`statuses.${person.status}`)],
    [t('fields.address'), person.address],
    [t('fields.phone'), person.phone],
    [
      t('person.contact'),
      [person.contactName, person.contactPhone].filter(Boolean).join(' · ') || null,
    ],
    [t('fields.diet'), t(`diets.${person.diet}`)],
    [t('fields.allergies'), person.allergies],
    [t('fields.observation'), person.observation],
    [
      t('person.window'),
      person.windowFromMin !== null && person.windowToMin !== null
        ? `${formatTime(person.windowFromMin)}–${formatTime(person.windowToMin)}`
        : null,
    ],
  ];
  const kinds = identity ? DOCUMENT_KINDS : (['photo'] as const);

  return (
    <>
      <PrintHeader scope={scope} />
      <Link href={`/orgs/${orgId}`} className="text-sm underline hover:text-quake">
        ← {scope.org.name}
      </Link>
      <div className="mt-2 mb-6 flex flex-wrap items-center gap-4">
        <Avatar orgId={orgId} person={person} size={72} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-bold">{name}</h1>
          <PageTips page="person" demo={scope.org.demo} />
          <TipsToggle demo={scope.org.demo} />
          {person.inHospital ? (
            <p className="mt-1 mr-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-950 dark:bg-amber-900/60 dark:text-amber-100">
              {t('medical.inHospital')}
            </p>
          ) : null}
          {person.incomplete ? (
            <p className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-950 dark:bg-amber-900/60 dark:text-amber-100">
              {t('org.incomplete')}
            </p>
          ) : null}
        </div>
        {scope.can('medical.view') ? (
          <Link href={`${base}/medical`} className={buttonClass('primary')}>
            {t('medical.title')}
          </Link>
        ) : null}
        {scope.can('people.edit') ? (
          <Link href={`${base}/edit`} className={buttonClass('secondary')}>
            {t('person.edit')}
          </Link>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-3 font-semibold">{t('person.details')}</h2>
          <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
            {details.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-ink/60 dark:text-paper/60">{label}</dt>
                <dd className="whitespace-pre-line">{value || t('person.none')}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel>
          <h2 className="font-semibold">{t('documents.title')}</h2>
          {!identity ? (
            <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">
              {t('documents.onlyOrganisers')}
            </p>
          ) : null}
          <ul className="mt-3 space-y-4">
            {kinds.map((kind) => {
              const version = person.documents[kind];
              const url = `/api${base}/documents/${documentSlug(kind)}`;
              const what = t(`documents.${kind}`);
              const canChange =
                kind === 'photo' ? scope.can('people.edit') : scope.can('identity.edit');
              return (
                <li key={kind} className="flex flex-wrap items-center gap-3">
                  {version ? (
                    <a href={url} target="_blank" rel="noopener" title={t('documents.open')}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- the app's own API */}
                      <img
                        src={`${url}?size=thumb&v=${version}`}
                        alt={what}
                        className="h-16 w-24 rounded-md border border-ink/10 object-cover dark:border-paper/10"
                      />
                    </a>
                  ) : (
                    <span className="inline-flex h-16 w-24 items-center justify-center rounded-md border border-dashed border-ink/20 text-center text-[11px] text-ink/50 dark:border-paper/20 dark:text-paper/50">
                      {t('documents.missing')}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="block font-medium">{what}</span>
                    {REQUIRED_DOCUMENTS.includes(kind) ? (
                      <span className="text-xs text-ink/60 dark:text-paper/60">
                        {t('documents.required')}
                      </span>
                    ) : null}
                  </span>
                  {canChange ? (
                    <PictureUpload
                      path={`${base}/documents/${documentSlug(kind)}`}
                      hasPicture={Boolean(version)}
                      what={what}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Panel>

        {identity ? (
          <div className="lg:col-span-2">
            <IdentityPanel path={`${base}/identity`} />
          </div>
        ) : null}

        {scope.can('identity.edit') && person.documents.id_card ? (
          <div className="lg:col-span-2">
            <IdReader base={base} person={person} />
          </div>
        ) : null}

        {scope.can('incidents.view') ? (
          <div className="lg:col-span-2">
            <Incidents
              path={`${base}/incidents`}
              incidents={incidents}
              timeZone={scope.timeZone}
              canWrite={scope.can('incidents.write')}
            />
          </div>
        ) : null}

        {social ? (
          <div className="lg:col-span-2">
            <PersonSocial
              orgId={orgId}
              personId={person.id}
              status={person.status}
              data={social}
              canEdit={scope.can('social.edit')}
              timeZone={scope.timeZone}
              myUserId={scope.user.id}
            />
          </div>
        ) : null}

        {scope.can('access.view') ? (
          <Panel className="lg:col-span-2">
            <h2 className="mb-3 font-semibold">{t('access.title')}</h2>
            {access.length === 0 ? (
              <p className="text-sm text-ink/70 dark:text-paper/70">{t('access.empty')}</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {access.map((a, i) => (
                  <li key={i}>
                    <span className="text-xs text-ink/60 dark:text-paper/60">
                      {formatDateTime(a.at, scope.timeZone, 'datetime', scope.locale)}
                    </span>{' '}
                    · {a.who ?? t('access.unknown')} ·{' '}
                    {t(`access.actions.${a.action.replaceAll('.', '_')}`)}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ) : null}
      </div>

      {scope.can('identity.edit') ? (
        <div className="mt-8">
          <DeletePerson orgId={orgId} personId={person.id} name={name} />
        </div>
      ) : null}
    </>
  );
}
