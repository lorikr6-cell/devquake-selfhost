import type { PluginPageProps } from '@devquake/plugin-sdk';
import { PrintHeader } from '../components/print-header';
import { notFound } from 'next/navigation';
import { Link } from '@devquake/ui';
import { orgScope, personIdOf } from '../components/guard';
import { Incidents } from '../components/incidents';
import { MedPapers } from '../components/med-papers';
import { HospitalStays, Medications, ProfileForm } from '../components/medical';
import { localeOf, translator } from '../i18n';
import { HttpError } from '../lib/data';
import { listPapers } from '../lib/med-papers';
import { medicalFile } from '../lib/medical-data';

export async function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('medical.title') };
}

/**
 * A person's medical file (medical staff only; opening it is logged): profile, medications,
 * medical notes and hospital stays, all stored encrypted.
 */
export default async function MedicalPage({ ctx, params }: PluginPageProps) {
  const scope = await orgScope(ctx, params, 'medical.view');
  if (!scope.ok) return scope.notice;
  const t = translator(scope.locale);
  const personId = personIdOf(params);
  const file = await medicalFile(scope.db, scope.org.id, personId, scope.user.id).catch(
    (err: unknown) => {
      if (err instanceof HttpError && err.status === 404) notFound();
      throw err;
    },
  );
  const papers = await listPapers(scope.db, scope.org.id, personId, scope.user.id);
  const base = `/orgs/${scope.org.id}/people/${personId}`;
  const canEdit = scope.can('medical.edit');
  return (
    <>
      <PrintHeader scope={scope} />
      <Link href={base} className="text-sm underline hover:text-quake">
        ← {file.name}
      </Link>
      <h1 className="mt-2 mb-2 font-display text-3xl font-bold">
        {t('medical.title')} · {file.name}
      </h1>
      <p className="mb-6 text-xs text-ink/60 dark:text-paper/60">{t('medical.privacy')}</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileForm path={`${base}/medical`} profile={file.profile} />
        <Medications
          path={`${base}/medications`}
          medications={file.medications}
          today={scope.today}
        />
        <div className="lg:col-span-2">
          <Incidents
            path={`${base}/med-notes`}
            incidents={file.notes}
            timeZone={scope.timeZone}
            canWrite={canEdit}
            texts="medNotes"
          />
        </div>
        <div className="lg:col-span-2">
          <HospitalStays path={`${base}/hospital-stays`} stays={file.stays} today={scope.today} />
        </div>
        <div className="lg:col-span-2">
          <MedPapers path={`${base}/med-papers`} papers={papers} timeZone={scope.timeZone} />
        </div>
      </div>
    </>
  );
}
