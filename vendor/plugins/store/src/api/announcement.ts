import { api, mine } from '../lib/api';
import { deleteAnnouncement, updateAnnouncement } from '../lib/marketing-data';
import { announcementInput, id, readBody } from '../lib/validate';

export const PUT = api('marketing', async ({ request, params, db, store, timeZone }) => {
  await updateAnnouncement(
    db,
    mine(store).id,
    id(params.id),
    announcementInput(await readBody(request), timeZone),
  );
});

export const DELETE = api('marketing', async ({ params, db, store }) => {
  await deleteAnnouncement(db, mine(store).id, id(params.id));
});
