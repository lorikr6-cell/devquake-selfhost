import { jsonBody, ownerApi } from '../lib/api';
import { setVenueLink, syncDarts, venueTournaments } from '../lib/links';

// PUT { on }: show (or stop showing) the owner's open darts tournaments on the public menu. The
// copy is refreshed at once and then whenever the owner opens Venue (ADR 0035).
export const PUT = ownerApi(async ({ request, db, venue, ctx }) => {
  const on = (await jsonBody(request)).on === true;
  if (!on) {
    await setVenueLink(db, venue.id, 'darts', null);
    await db.execute('DELETE FROM venue_darts WHERE venue_id = ?', [venue.id]);
    return { on: false, tournaments: [] };
  }
  await setVenueLink(db, venue.id, 'darts', { ref: '1', name: 'darts' });
  await syncDarts(db, venue.id, ctx.links);
  return { on: true, tournaments: await venueTournaments(db, venue.id) };
});
