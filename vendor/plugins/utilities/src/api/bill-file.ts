import { api, readBytes } from '../lib/api';
import { deleteBillFile, readBillFile, saveBillFile } from '../lib/data';
import { MAX_PDF_BYTES, isPdf, safePdfName } from '../lib/files';
import { HttpError } from '../lib/http';
import { id } from '../lib/validate';

// GET /api/bills/:id/file: the provider's PDF (everyone on the utility), shown in the browser.
export const GET = api(async ({ params, db, user }) => {
  const file = await readBillFile(db, id(params.id), user.id);
  return new Response(new Uint8Array(file.data), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${safePdfName(file.fileName)}"`,
      'Cache-Control': 'private, no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
});

// PUT /api/bills/:id/file with the PDF as the body (header X-File-Name, URL-encoded): owner.
export const PUT = api(async ({ request, params, db, user }) => {
  const bytes = await readBytes(request, MAX_PDF_BYTES, 'pdfTooLarge');
  if (!isPdf(bytes)) throw new HttpError(400, 'notPdf');
  let name: string | null = null;
  try {
    name = decodeURIComponent(request.headers.get('x-file-name') ?? '');
  } catch {
    name = null;
  }
  await saveBillFile(db, id(params.id), user.id, safePdfName(name), bytes);
});

export const DELETE = api(async ({ params, db, user }) => {
  await deleteBillFile(db, id(params.id), user.id);
});
