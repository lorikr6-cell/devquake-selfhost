import { api } from '../lib/api';
import { exportOrg } from '../lib/transfer-data';
import { id } from '../lib/validate';

// GET /api/orgs/:id/export: the organisation as an Excel workbook (organisers), named with the
// viewer's local date and time. Never cached.
export const GET = api(async ({ params, db, user, locale, today, timeZone }) => {
  const { fileName, bytes } = await exportOrg(db, id(params.id), user.id, locale, today, timeZone);
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
});
