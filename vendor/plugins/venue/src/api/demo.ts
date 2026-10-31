import { jsonBody, ownerApi } from '../lib/api';
import { deleteDemoVenue, setOwnerView, venuesOfOwner } from '../lib/data';
import { todayIn } from '../lib/dates';
import { createDemoVenue } from '../lib/demo';
import { HttpError } from '../lib/http';

// The owner's demo venue (a sample café with every feature, beside their own venue):
// POST makes it (once; asking again opens it) and switches to it; PUT { demo: boolean } switches
// between the demo and the own venue; DELETE removes the demo with everything in it.

export const POST = ownerApi(
  async ({ db, user, ctx }) => {
    const venue = await createDemoVenue(db, user, todayIn(ctx.timeZone || 'UTC'));
    return { slug: venue.slug };
  },
  { needVenue: false },
);

export const PUT = ownerApi(
  async ({ request, db, user }) => {
    const demo = (await jsonBody(request)).demo === true;
    // Back to the own venue also before it exists (the home page then sets it up).
    if (demo && !(await venuesOfOwner(db, user.id)).demo) throw new HttpError(404, 'notFound');
    await setOwnerView(db, user.id, demo);
    return { demo };
  },
  { needVenue: false },
);

export const DELETE = ownerApi(
  async ({ db, user }) => {
    await deleteDemoVenue(db, user.id);
  },
  { needVenue: false },
);
