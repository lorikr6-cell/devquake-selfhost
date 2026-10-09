import type { PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import { PICTURE_SQL, thumbParams, thumbValues, type Picture } from './picture';
import { foodPhotoUrl } from './food-model';
import { loadFoods } from './food-store';
import { foodById } from './foods';
import { HttpError } from './http';

// Pictures of foods (migration 0004). A member's own picture of a food is seen only by them (and
// by DevQuake staff, who review them); staff may choose one to show everyone instead of the
// drawn thumbnail. The choice is a copy without a member (user_id NULL), so it stays when the
// member deletes their account or their picture. The drawn thumbnail is never removed.

const num = (v: number | string) => Number(v);

/** The member's own pictures: food id → URL (with a version, so a new picture shows at once). */
export async function myFoodPhotos(
  db: PluginDatabase,
  userId: number,
): Promise<Record<string, string>> {
  const rows = await db
    .query<{ id: number; food_id: string; v: number | string }>(
      'SELECT id, food_id, UNIX_TIMESTAMP(updated_at) AS v FROM food_photos WHERE user_id = ?',
      [userId],
    )
    .catch(() => []); // before migration 0004
  return Object.fromEntries(rows.map((r) => [r.food_id, foodPhotoUrl(num(r.id), num(r.v))]));
}

/** Saves (or replaces) the member's own picture of a food; returns its URL. */
export async function saveMyFoodPhoto(
  db: PluginDatabase,
  foodId: string,
  userId: number,
  photo: Picture,
): Promise<string> {
  if (!foodById(foodId)) throw new HttpError(404, 'notFound');
  await db.execute(
    `INSERT INTO food_photos (food_id, user_id, mime, data, bytes, thumb_mime, thumb)
     VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE mime = VALUES(mime), data = VALUES(data), bytes = VALUES(bytes),
                               thumb_mime = VALUES(thumb_mime), thumb = VALUES(thumb),
                               updated_at = CURRENT_TIMESTAMP`,
    [
      foodId,
      userId,
      photo.mime,
      Buffer.from(photo.data),
      photo.data.byteLength,
      ...thumbValues(photo),
    ],
  );
  return (await myFoodPhotos(db, userId))[foodId]!;
}

export async function deleteMyFoodPhoto(db: PluginDatabase, foodId: string, userId: number) {
  await db.execute('DELETE FROM food_photos WHERE food_id = ? AND user_id = ?', [foodId, userId]);
}

/** A picture for whoever may see it: the chosen ones for every member, own ones, staff all. */
export async function readFoodPhoto(
  db: PluginDatabase,
  photoId: number,
  user: PluginUser,
  thumb = false,
) {
  const [row] = await db.query<{ user_id: number | null; mime: string; data: Buffer }>(
    `SELECT user_id, ${PICTURE_SQL} FROM food_photos WHERE id = ?`,
    [...thumbParams(thumb), photoId],
  );
  const visible =
    row && (row.user_id === null || Number(row.user_id) === user.id || user.isAdmin === true);
  if (!row || !visible) throw new HttpError(404, 'notFound');
  return { mime: row.mime, data: row.data };
}

export interface FoodPhotoVariant {
  id: number;
  url: string;
  /** When the member uploaded it (UTC). */
  uploadedAt: Date;
}

/** The members' pictures of a food, newest first (staff choose among them). */
export async function foodPhotoVariants(
  db: PluginDatabase,
  foodId: string,
): Promise<FoodPhotoVariant[]> {
  const rows = await db
    .query<{ id: number; v: number | string; uploaded_at: Date }>(
      `SELECT id, UNIX_TIMESTAMP(updated_at) AS v, updated_at AS uploaded_at
         FROM food_photos WHERE food_id = ? AND user_id IS NOT NULL
        ORDER BY updated_at DESC LIMIT 60`,
      [foodId],
    )
    .catch(() => []);
  return rows.map((r) => ({
    id: num(r.id),
    url: foodPhotoUrl(num(r.id), num(r.v)),
    uploadedAt: new Date(r.uploaded_at),
  }));
}

/** Staff show a member's picture to everyone: a copy without a member replaces the last one. */
export async function chooseFoodPhoto(db: PluginDatabase, foodId: string, photoId: number) {
  await db.transaction(async (tx) => {
    const [source] = await tx.query<{ id: number }>(
      'SELECT id FROM food_photos WHERE id = ? AND food_id = ? AND user_id IS NOT NULL',
      [photoId, foodId],
    );
    if (!source) throw new HttpError(404, 'notFound');
    await tx.execute('UPDATE foods SET photo_id = NULL WHERE id = ?', [foodId]);
    await tx.execute('DELETE FROM food_photos WHERE food_id = ? AND user_id IS NULL', [foodId]);
    const { insertId } = await tx.execute(
      `INSERT INTO food_photos (food_id, user_id, mime, data, bytes, thumb_mime, thumb)
       SELECT food_id, NULL, mime, data, bytes, thumb_mime, thumb FROM food_photos WHERE id = ?`,
      [photoId],
    );
    await tx.execute('UPDATE foods SET photo_id = ? WHERE id = ?', [insertId, foodId]);
  });
  await loadFoods(db, true);
}

/** Staff go back to the drawn thumbnail (the chosen copy is removed; members' pictures stay). */
export async function resetFoodPhoto(db: PluginDatabase, foodId: string) {
  await db.execute('UPDATE foods SET photo_id = NULL WHERE id = ?', [foodId]);
  await db.execute('DELETE FROM food_photos WHERE food_id = ? AND user_id IS NULL', [foodId]);
  await loadFoods(db, true);
}
