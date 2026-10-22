import { api } from '../lib/api';
import { deletePaper, readPaperFile } from '../lib/med-papers';
import { id } from '../lib/validate';

// GET /api/orgs/:id/people/:personId/med-papers/:paperId: the paper, opened in the browser
// (medical staff; logged). Never cached.
export const GET = api(async ({ params, db, user }) => {
  const paper = await readPaperFile(
    db,
    id(params.id),
    id(params.personId),
    id(params.paperId),
    user.id,
  );
  const ext = paper.mime === 'application/pdf' ? 'pdf' : paper.mime.split('/')[1];
  const name = `${paper.title.replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 60) || 'paper'}.${ext}`;
  return new Response(new Uint8Array(paper.data), {
    headers: {
      'Content-Type': paper.mime,
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(name)}`,
      'Cache-Control': 'private, no-store',
      // The type comes from the file's own first bytes (sniffPaper), never from the upload.
      'X-Content-Type-Options': 'nosniff',
    },
  });
});

// DELETE …: medical staff remove a paper.
export const DELETE = api(async ({ params, db, user }) => {
  await deletePaper(db, id(params.id), id(params.personId), id(params.paperId), user.id);
});
