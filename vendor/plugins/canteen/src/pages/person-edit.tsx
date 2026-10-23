import type { PluginPageProps } from '@devquake/plugin-sdk';
import { PrintHeader } from '../components/print-header';
import { notFound } from 'next/navigation';
import { Link } from '@devquake/ui';
import { PersonForm } from '../components/forms';
import { orgScope, personIdOf } from '../components/guard';
import { Panel } from '../components/ui';
import { localeOf, translator } from '../i18n';
import { HttpError, getPerson } from '../lib/data';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('person.edit') };
}

/** Changes a person's profile (organisers and coordinators). */
export default async function EditPersonPage({ ctx, params }: PluginPageProps) {
  const scope = await orgScope(ctx, params, 'people.edit');
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale);
  const person = await getPerson(scope.db, scope.org.id, personIdOf(params), scope.user.id).catch(
    (err: unknown) => {
      if (err instanceof HttpError) notFound();
      throw err;
    },
  );
  const name = `${person.lastName} ${person.firstName}`;
  return (
    <>
      <PrintHeader scope={scope} />
      <Link
        href={`/orgs/${scope.org.id}/people/${person.id}`}
        className="text-sm underline hover:text-quake"
      >
        ← {name}
      </Link>
      <h1 className="mt-2 mb-6 font-display text-3xl font-bold">
        {t('meta.editPerson', { name })}
      </h1>
      <Panel>
        <PersonForm orgId={scope.org.id} person={person} />
      </Panel>
    </>
  );
}
