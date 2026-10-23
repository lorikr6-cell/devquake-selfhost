import type { PluginPageProps } from '@devquake/plugin-sdk';
import { PrintHeader } from '../components/print-header';
import { Link } from '@devquake/ui';
import { PersonForm } from '../components/forms';
import { orgScope } from '../components/guard';
import { Panel } from '../components/ui';
import { localeOf, translator } from '../i18n';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('org.addPerson') };
}

/** Adds a person; the photo and ID card follow on their profile. */
export default async function NewPersonPage({ ctx, params }: PluginPageProps) {
  const scope = await orgScope(ctx, params, 'people.edit');
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale);
  return (
    <>
      <PrintHeader scope={scope} />
      <Link href={`/orgs/${scope.org.id}`} className="text-sm underline hover:text-quake">
        ← {scope.org.name}
      </Link>
      <h1 className="mt-2 mb-6 font-display text-3xl font-bold">{t('org.addPerson')}</h1>
      <Panel>
        <PersonForm orgId={scope.org.id} />
      </Panel>
    </>
  );
}
