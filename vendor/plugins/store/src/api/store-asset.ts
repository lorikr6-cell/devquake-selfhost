import { api, mine } from '../lib/api';
import { deleteAsset, isAssetKind, readAsset, saveAsset } from '../lib/data';
import { HttpError } from '../lib/http';
import { pictureResponse, readPicture } from '../lib/picture';

function kindOf(params: Record<string, string>) {
  if (!isAssetKind(params.kind)) throw new HttpError(404, 'notFound');
  return params.kind;
}

// GET /api/store/assets/:kind (logo | banner): the team sees it while the shop is closed.
export const GET = api('overview', async ({ request, params, db, store }) => {
  const asset = await readAsset(db, mine(store).id, kindOf(params));
  if (!asset) throw new HttpError(404, 'notFound');
  return pictureResponse(request, asset);
});

// POST /api/store/assets/:kind (multipart photo, shrunk in the browser): replaces it.
export const POST = api('design', async ({ request, params, db, store }) => {
  const picture = await readPicture(request);
  await saveAsset(db, mine(store).id, kindOf(params), picture);
});

export const DELETE = api('design', async ({ params, db, store }) => {
  await deleteAsset(db, mine(store).id, kindOf(params));
});
