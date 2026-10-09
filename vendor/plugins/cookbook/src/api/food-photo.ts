import { api } from '../lib/api';
import { readFoodPhoto } from '../lib/food-photos';
import { pictureResponse, wantsThumb } from '../lib/picture';
import { id } from '../lib/validate';

// GET /api/food-photos/:photoId[?v=][&size=thumb]: a food picture: the ones chosen for everyone, the member's
// own, and every one for DevQuake staff.
export const GET = api(async ({ request, params, db, user }) =>
  pictureResponse(request, await readFoodPhoto(db, id(params.photoId), user, wantsThumb(request))),
);
