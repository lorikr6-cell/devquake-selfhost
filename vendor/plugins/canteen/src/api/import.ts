import { api } from '../lib/api';
import { HttpError } from '../lib/http';
import { importOrg } from '../lib/transfer-data';
import { id } from '../lib/validate';

const MAX_BYTES = 10 * 1024 * 1024;

// POST /api/orgs/:id/import (multipart: file = an exported workbook, changed): organisers.
// Overwrites what the file changes, adds rows without an id, deletes nothing; all or nothing.
export const POST = api(async ({ request, params, db, user, today, locale }) => {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BYTES + 64 * 1024) {
    throw new HttpError(413, 'importTooLarge');
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof Blob) || file.size > MAX_BYTES) throw new HttpError(400, 'importFile');
  return importOrg(
    db,
    id(params.id),
    user.id,
    new Uint8Array(await file.arrayBuffer()),
    today,
    locale,
  );
});
