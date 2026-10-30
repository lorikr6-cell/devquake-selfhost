import { jsonBody } from '../lib/api';
import { checkPin } from '../lib/model';
import { leaveTablet, staffList, switchStaff } from '../lib/floor';
import { floorApi } from '../lib/floor-api';
import { HttpError } from '../lib/http';
import { PIN_WAIT_MINUTES } from '../lib/bill';

// The staff on a tablet (ADR 0080): GET who can switch in and who is on; POST { staffId, pin }
// switches in (5 wrong PINs: wait 15 minutes); DELETE switches out. Tablets only.

export const GET = floorApi(
  async ({ db, venue, actor }) => ({
    venue: venue.name,
    staff: await staffList(db, venue.id),
    on: actor.staffId ? { id: actor.staffId, name: actor.name } : null,
  }),
  { tabletOnly: true, allowNoStaff: true },
);

export const POST = floorApi(
  async ({ request, db, venue, actor }) => {
    const body = await jsonBody(request);
    const pin = checkPin(body.pin);
    if (!pin.ok && pin.error === 'pin') throw new HttpError(400, 'pin', { field: 'pin' });
    const result = await switchStaff(
      db,
      venue.id,
      actor.tabletId!,
      Number(body.staffId),
      String(body.pin ?? ''),
    );
    if (result === 'wait') throw new HttpError(429, 'pinWait', { minutes: PIN_WAIT_MINUTES });
    if (result === 'wrong') throw new HttpError(403, 'pinWrong');
    return { ok: true };
  },
  { tabletOnly: true, allowNoStaff: true },
);

export const DELETE = floorApi(
  async ({ db, actor }) => {
    await leaveTablet(db, actor.tabletId!);
  },
  { tabletOnly: true, allowNoStaff: true },
);
