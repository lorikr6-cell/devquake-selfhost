import { getLocale } from '@/lib/context';
import { shellT } from '@/lib/texts';
import { InstanceFrame } from './instance-frame';

/** Shown while the database is missing or cannot be prepared (see the server log). */
export async function NotReady({ reason }: { reason: 'no-database' | 'database-error' }) {
  const t = shellT(await getLocale());
  return (
    <InstanceFrame title={t('notReadyTitle')}>
      <p>{t(reason === 'no-database' ? 'noDatabase' : 'databaseError')}</p>
    </InstanceFrame>
  );
}
