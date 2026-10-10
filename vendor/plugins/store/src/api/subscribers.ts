import { api, mine } from '../lib/api';
import { listSubscribers } from '../lib/newsletter-data';

const csvCell = (v: string) => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

// GET /api/subscribers: the confirmed subscribers as CSV (email, language, since).
export const GET = api('marketing', async ({ db, store }) => {
  const list = await listSubscribers(db, mine(store).id, 'confirmed');
  const rows = [
    'email,language,confirmed_at',
    ...list.map((s) => [s.email, s.locale, s.confirmedAt ?? ''].map(csvCell).join(',')),
  ];
  return new Response(`${rows.join('\n')}\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="subscribers.csv"',
      'Cache-Control': 'no-store',
    },
  });
});
