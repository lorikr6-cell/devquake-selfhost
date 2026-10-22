import { api } from '../lib/api';
import { deleteMedNote } from '../lib/medical-data';
import { id } from '../lib/validate';

// DELETE /api/orgs/:id/people/:personId/med-notes/:noteId: medical staff.
export const DELETE = api(async ({ params, db, user }) => {
  await deleteMedNote(db, id(params.id), id(params.personId), id(params.noteId), user.id);
});
