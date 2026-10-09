import { api } from '../lib/api';
import { deleteReading, saveReading } from '../lib/data';
import { id, readBody, readingInput } from '../lib/validate';

// PUT /api/bills/:id/readings/:userId { previousIndex, currentIndex } or { consumption }: a
// participant's own reading, or the owner entering it for someone. DELETE removes it (and its
// photo).
export const PUT = api(async ({ request, params, db, user }) => {
  const input = readingInput(await readBody(request));
  await saveReading(db, id(params.id), user, id(params.userId), input);
});

export const DELETE = api(async ({ params, db, user }) => {
  await deleteReading(db, id(params.id), user, id(params.userId));
});
