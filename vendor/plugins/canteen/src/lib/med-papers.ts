import type { PluginDatabase } from '@devquake/plugin-sdk';
import { openBytes, openText, sealBytes, sealText } from './crypto';
import { log, requireCan, requireKey } from './data';
import { MAX_PHOTO_BYTES, sniffPhoto } from './files';
import { HttpError } from './http';

// Medical papers (discharge letters, results, prescriptions) as a PDF or a photo: medical staff
// only, title and file encrypted, every opening logged (docs/plugins/ideas/canteen.md, step 4).

type Db = Omit<PluginDatabase, 'transaction'>;

/** A PDF up to 5 MB; photos are shrunk in the browser first (at most 2 MB). */
export const MAX_PDF_BYTES = 5 * 1024 * 1024;

const num = (v: unknown) => Number(v);

/** The file's type from its first bytes: a PDF or a JPEG/PNG/WebP picture; null otherwise. */
export function sniffPaper(bytes: Uint8Array): string | null {
  const pdf = bytes.length > 4 && String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
  return pdf ? 'application/pdf' : sniffPhoto(bytes);
}

/** The uploaded paper from a multipart form: `title` and `file` (a PDF or a shrunk photo). */
export async function readPaper(
  request: Request,
): Promise<{ title: string; mime: string; data: Uint8Array }> {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_PDF_BYTES + 64 * 1024) throw new HttpError(413, 'paperTooLarge');
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  const title = form?.get('title');
  if (!(file instanceof Blob)) throw new HttpError(415, 'paperType');
  if (typeof title !== 'string' || !title.trim()) {
    throw new HttpError(400, 'required', { field: 'paperTitle' });
  }
  const data = new Uint8Array(await file.arrayBuffer());
  const mime = sniffPaper(data);
  if (!mime) throw new HttpError(415, 'paperType');
  const max = mime === 'application/pdf' ? MAX_PDF_BYTES : MAX_PHOTO_BYTES;
  if (data.byteLength > max) throw new HttpError(413, 'paperTooLarge');
  return { title: title.replace(/\s+/g, ' ').trim().slice(0, 200), mime, data };
}

async function personIn(db: Db, orgId: number, personId: number) {
  const [row] = await db.query<{ id: number }>(
    'SELECT id FROM canteen_people WHERE id = ? AND org_id = ?',
    [personId, orgId],
  );
  if (!row) throw new HttpError(404, 'personNotFound');
}

export interface MedPaper {
  id: number;
  title: string;
  mime: string;
  bytes: number;
  uploadedAt: string;
}

export async function listPapers(
  db: Db,
  orgId: number,
  personId: number,
  userId: number,
): Promise<MedPaper[]> {
  await requireCan(db, orgId, userId, 'medical.view');
  await personIn(db, orgId, personId);
  const rows = await db.query<{
    id: number;
    title_sealed: string;
    mime: string;
    bytes: number;
    uploaded_at: Date | string;
  }>(
    `SELECT id, title_sealed, mime, bytes, uploaded_at FROM canteen_med_papers
      WHERE person_id = ? ORDER BY uploaded_at DESC, id DESC`,
    [personId],
  );
  return rows.map((r) => ({
    id: num(r.id),
    title: openText(r.title_sealed) ?? '?',
    mime: r.mime,
    bytes: num(r.bytes),
    uploadedAt: new Date(r.uploaded_at).toISOString(),
  }));
}

export async function addPaper(
  db: Db,
  orgId: number,
  personId: number,
  userId: number,
  paper: { title: string; mime: string; data: Uint8Array },
): Promise<number> {
  await requireCan(db, orgId, userId, 'medical.edit');
  await personIn(db, orgId, personId);
  requireKey();
  const [count] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM canteen_med_papers WHERE person_id = ?',
    [personId],
  );
  if (num(count?.n ?? 0) >= 100) throw new HttpError(400, 'tooManyPapers', { max: 100 });
  const res = await db.execute(
    `INSERT INTO canteen_med_papers (person_id, title_sealed, mime, bytes, data, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      personId,
      sealText(paper.title),
      paper.mime,
      paper.data.byteLength,
      sealBytes(paper.data),
      userId,
    ],
  );
  return res.insertId;
}

/** The paper itself, decrypted; opening it is logged. */
export async function readPaperFile(
  db: Db,
  orgId: number,
  personId: number,
  paperId: number,
  userId: number,
): Promise<{ mime: string; data: Buffer; title: string }> {
  await requireCan(db, orgId, userId, 'medical.view');
  await personIn(db, orgId, personId);
  const [row] = await db.query<{ mime: string; data: Buffer; title_sealed: string }>(
    'SELECT mime, data, title_sealed FROM canteen_med_papers WHERE id = ? AND person_id = ?',
    [paperId, personId],
  );
  if (!row) throw new HttpError(404, 'documentNotFound');
  const data = openBytes(row.data);
  if (!data) throw new HttpError(503, 'noMasterKey');
  await log(db, orgId, personId, userId, 'medical.paper');
  return { mime: row.mime, data, title: openText(row.title_sealed) ?? 'paper' };
}

export async function deletePaper(
  db: Db,
  orgId: number,
  personId: number,
  paperId: number,
  userId: number,
) {
  await requireCan(db, orgId, userId, 'medical.edit');
  await personIn(db, orgId, personId);
  await db.execute('DELETE FROM canteen_med_papers WHERE id = ? AND person_id = ?', [
    paperId,
    personId,
  ]);
}
