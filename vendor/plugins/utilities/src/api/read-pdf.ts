import { api, readBytes } from '../lib/api';
import { requireOwner } from '../lib/data';
import { MAX_PDF_BYTES, isPdf } from '../lib/files';
import { HttpError } from '../lib/http';
import { readPdfFields } from '../lib/pdf-text';
import { id } from '../lib/validate';

// POST /api/utilities/:id/read-pdf with the provider's PDF as the body: the fields the app
// could read from it (nothing is stored). Empty fields are typed in by the owner.
export const POST = api(async ({ request, params, db, user }) => {
  await requireOwner(db, id(params.id), user.id);
  const bytes = await readBytes(request, MAX_PDF_BYTES, 'pdfTooLarge');
  if (!isPdf(bytes)) throw new HttpError(400, 'notPdf');
  return readPdfFields(bytes);
});
