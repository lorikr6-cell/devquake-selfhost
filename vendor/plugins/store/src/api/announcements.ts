import { api, mine } from '../lib/api';
import { createAnnouncement } from '../lib/marketing-data';
import { announcementInput, readBody } from '../lib/validate';

// POST /api/announcements { message, details, tone, placement, linkUrl, linkLabel, voucherId,
// campaignId, startsAt, endsAt, active }
export const POST = api('marketing', async ({ request, db, store, timeZone }) => {
  const id = await createAnnouncement(
    db,
    mine(store).id,
    announcementInput(await readBody(request), timeZone),
  );
  return { id };
});
