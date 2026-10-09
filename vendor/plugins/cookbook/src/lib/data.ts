import { randomInt } from 'node:crypto';
import type { PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import type { Locale } from '@devquake/ui';
import { PICTURE_SQL, thumbParams, thumbValues, type Picture } from './picture';
import { isAllergen, type Allergen } from './foods';
import { HttpError } from './http';
import { LIBRARY, libraryIngredients, libraryRecipe, librarySteps } from './library';
import {
  LIMITS,
  allergensOf,
  isStage,
  isTag,
  isUnit,
  nutritionOf,
  tagsOf,
  type Difficulty,
  type Ingredient,
  type Scaling,
  type Step,
  type Tag,
  type TagCheck,
} from './recipe';
import type { RecipeInput } from './validate';

/**
 * Data access for the cookbook, on its OWN database (ctx.db, ADR 0007), and the starter library
 * from the code. A recipe is referred to by its "ref": a library id ("shakshuka") or an own
 * recipe's number ("12"). Visibility: the library is for every member; an own recipe for its
 * owner, for people who opened its share link while it is shared, and for every member of the
 * app while it is public (Community: recommendations and comments).
 */

export { HttpError };

type Db = Omit<PluginDatabase, 'transaction'>;

const num = (v: unknown) => Number(v);
const LIBRARY_REF = /^[a-z][a-z0-9-]{1,39}$/;
const OWN_REF = /^[1-9]\d{0,9}$/;
export const isRef = (v: unknown): v is string =>
  typeof v === 'string' && (LIBRARY_REF.test(v) || OWN_REF.test(v));

export interface RecipeView {
  ref: string;
  library: boolean;
  icon: string;
  ownerId: number | null;
  ownerName: string | null;
  title: string;
  intro: string | null;
  tips: string | null;
  cuisine: string | null;
  servings: number;
  prepMin: number;
  cookMin: number;
  difficulty: Difficulty;
  declaredTags: Tag[];
  declaredAllergens: Allergen[];
  ingredients: Ingredient[];
  steps: Step[];
  /** Version of the photo, or null. */
  photo: number | null;
  shareCode: string | null;
  /** The public link's code (/p/CODE, ADR 0047), for the author; null without one. */
  publicCode: string | null;
  /** Everyone using the app sees it (and may recommend and comment). */
  isPublic: boolean;
  /** What to have ready, one per line. */
  equipment: string | null;
  recommendations: number;
}

export interface RecipeSummary {
  ref: string;
  library: boolean;
  icon: string;
  title: string;
  ownerName: string | null;
  servings: number;
  minutes: number;
  difficulty: Difficulty;
  tags: TagCheck[];
  allergens: Allergen[];
  kcal: number | null;
  photo: number | null;
  isPublic: boolean;
  recommendations: number;
}

const csv = <T extends string>(text: string, ok: (v: unknown) => v is T): T[] =>
  text
    .split(',')
    .map((x) => x.trim())
    .filter((x): x is T => ok(x));

function libraryView(id: string, locale: Locale): RecipeView | null {
  const r = libraryRecipe(id);
  if (!r) return null;
  return {
    ref: r.id,
    library: true,
    icon: r.icon,
    ownerId: null,
    ownerName: null,
    title: r.title[locale],
    intro: r.intro[locale],
    tips: r.tips?.[locale] ?? null,
    cuisine: r.cuisine[locale],
    servings: r.servings,
    prepMin: r.prepMin,
    cookMin: r.cookMin,
    difficulty: r.difficulty,
    declaredTags: r.tags,
    declaredAllergens: r.allergens ?? [],
    ingredients: libraryIngredients(r, locale),
    steps: librarySteps(r, locale),
    photo: null,
    shareCode: null,
    publicCode: null,
    isPublic: false,
    equipment: null,
    recommendations: 0,
  };
}

interface RecipeRow {
  id: number;
  owner_user_id: number;
  owner_name: string;
  title: string;
  intro: string | null;
  tips: string | null;
  servings: number;
  prep_min: number;
  cook_min: number;
  difficulty: Difficulty;
  cuisine: string | null;
  tags: string;
  allergens: string;
  share_code: string | null;
  public_code: string | null;
  photo: number | string | null;
  is_public: number;
  equipment: string | null;
  recommendations: number | string;
}

const RECIPE_COLUMNS = `r.id, r.owner_user_id, r.owner_name, r.title, r.intro, r.tips, r.servings,
  r.prep_min, r.cook_min, r.difficulty, r.cuisine, r.tags, r.allergens, r.share_code,
  r.public_code, r.is_public, r.equipment,
  (SELECT UNIX_TIMESTAMP(p.updated_at) FROM recipe_photos p WHERE p.recipe_id = r.id) AS photo,
  (SELECT COUNT(*) FROM recipe_recommendations x WHERE x.recipe_id = r.id) AS recommendations`;

/** Own recipes the person may see: theirs, public ones, and shared ones they opened. */
const VISIBLE = `(r.owner_user_id = ? OR r.is_public = 1 OR (r.share_code IS NOT NULL AND EXISTS
  (SELECT 1 FROM recipe_access a WHERE a.recipe_id = r.id AND a.user_id = ?)))`;

async function partsOf(db: Db, ids: number[]) {
  const ingredients = new Map<number, Ingredient[]>();
  const steps = new Map<number, Step[]>();
  if (ids.length === 0) return { ingredients, steps };
  const marks = ids.map(() => '?').join(',');
  const iRows = await db.query<{
    recipe_id: number;
    name: string;
    qty: string | number | null;
    unit: string;
    food_id: string | null;
    scaling: Scaling;
    note: string | null;
  }>(
    `SELECT recipe_id, name, qty, unit, food_id, scaling, note FROM recipe_ingredients
      WHERE recipe_id IN (${marks}) ORDER BY recipe_id, position`,
    ids,
  );
  for (const r of iRows) {
    const list = ingredients.get(num(r.recipe_id)) ?? [];
    list.push({
      name: r.name,
      qty: r.qty === null ? null : Number(r.qty),
      unit: isUnit(r.unit) ? r.unit : 'g',
      foodId: r.food_id,
      scaling: r.scaling,
      note: r.note,
    });
    ingredients.set(num(r.recipe_id), list);
  }
  const sRows = await db.query<{
    recipe_id: number;
    text: string;
    timer_sec: number | null;
    stage: string;
    uses: string | null;
  }>(
    `SELECT recipe_id, text, timer_sec, stage, uses FROM recipe_steps WHERE recipe_id IN (${marks})
      ORDER BY recipe_id, position`,
    ids,
  );
  for (const r of sRows) {
    const list = steps.get(num(r.recipe_id)) ?? [];
    list.push({
      text: r.text,
      timerSec: r.timer_sec === null ? null : num(r.timer_sec),
      stage: isStage(r.stage) ? r.stage : 'cook',
      uses:
        r.uses === null
          ? null
          : r.uses
              .split(',')
              .filter(Boolean)
              .map(Number)
              .filter((n) => Number.isInteger(n)),
    });
    steps.set(num(r.recipe_id), list);
  }
  return { ingredients, steps };
}

function ownView(r: RecipeRow, ingredients: Ingredient[], steps: Step[]): RecipeView {
  return {
    ref: String(num(r.id)),
    library: false,
    icon: '🍽️',
    ownerId: num(r.owner_user_id),
    ownerName: r.owner_name,
    title: r.title,
    intro: r.intro,
    tips: r.tips,
    cuisine: r.cuisine,
    servings: num(r.servings),
    prepMin: num(r.prep_min),
    cookMin: num(r.cook_min),
    difficulty: r.difficulty,
    declaredTags: csv(r.tags, isTag),
    declaredAllergens: csv(r.allergens, isAllergen),
    ingredients,
    steps,
    photo: r.photo === null ? null : num(r.photo),
    shareCode: r.share_code,
    publicCode: r.public_code,
    isPublic: Boolean(num(r.is_public)),
    equipment: r.equipment,
    recommendations: num(r.recommendations),
  };
}

/** The recipe behind a ref, if the person may see it; null otherwise (never a hint). */
export async function recipeByRef(
  db: Db | undefined,
  ref: string,
  userId: number,
  locale: Locale,
): Promise<RecipeView | null> {
  if (LIBRARY_REF.test(ref)) return libraryView(ref, locale);
  if (!OWN_REF.test(ref) || !db) return null;
  const [row] = await db.query<RecipeRow>(
    `SELECT ${RECIPE_COLUMNS} FROM recipes r WHERE r.id = ? AND ${VISIBLE}`,
    [Number(ref), userId, userId],
  );
  if (!row) return null;
  const parts = await partsOf(db, [num(row.id)]);
  return ownView(row, parts.ingredients.get(num(row.id)) ?? [], parts.steps.get(num(row.id)) ?? []);
}

export function summaryOf(r: RecipeView): RecipeSummary {
  const nutrition = nutritionOf(r.ingredients, r.servings);
  const minutes = r.prepMin + r.cookMin;
  return {
    ref: r.ref,
    library: r.library,
    icon: r.icon,
    title: r.title,
    ownerName: r.ownerName,
    servings: r.servings,
    minutes,
    difficulty: r.difficulty,
    tags: tagsOf({ declared: r.declaredTags, ingredients: r.ingredients, nutrition, minutes }),
    allergens: allergensOf(r.ingredients, r.declaredAllergens),
    kcal: nutrition.counted > 0 ? Math.round(nutrition.perPortion.kcal) : null,
    photo: r.photo,
    isPublic: r.isPublic,
    recommendations: r.recommendations,
  };
}

export function libraryViews(locale: Locale): RecipeView[] {
  return LIBRARY.map((r) => libraryView(r.id, locale)!);
}

/** Own recipes: the person's, or the shared ones they opened. */
export async function ownRecipes(
  db: Db,
  userId: number,
  which: 'mine' | 'shared',
): Promise<RecipeView[]> {
  const rows = await db.query<RecipeRow>(
    which === 'mine'
      ? `SELECT ${RECIPE_COLUMNS} FROM recipes r WHERE r.owner_user_id = ? ORDER BY r.title, r.id`
      : `SELECT ${RECIPE_COLUMNS} FROM recipes r
          JOIN recipe_access a ON a.recipe_id = r.id AND a.user_id = ?
         WHERE r.share_code IS NOT NULL AND r.owner_user_id <> a.user_id ORDER BY r.title, r.id`,
    [userId],
  );
  const ids = rows.map((r) => num(r.id));
  const parts = await partsOf(db, ids);
  return rows.map((r) =>
    ownView(r, parts.ingredients.get(num(r.id)) ?? [], parts.steps.get(num(r.id)) ?? []),
  );
}

export async function favouriteRefs(db: Db, userId: number): Promise<string[]> {
  const rows = await db.query<{ recipe_ref: string }>(
    'SELECT recipe_ref FROM favourites WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
  );
  return rows.map((r) => r.recipe_ref);
}

export async function setFavourite(
  db: Db,
  user: PluginUser,
  ref: string,
  on: boolean,
  locale: Locale,
) {
  if (on) {
    if (!(await recipeByRef(db, ref, user.id, locale))) throw new HttpError(404, 'recipeNotFound');
    await db.execute('INSERT IGNORE INTO favourites (user_id, recipe_ref) VALUES (?, ?)', [
      user.id,
      ref,
    ]);
  } else {
    await db.execute('DELETE FROM favourites WHERE user_id = ? AND recipe_ref = ?', [user.id, ref]);
  }
}

/** Every recipe the person can use (library, own, shared, public), for link points. */
export async function allVisible(
  db: Db | undefined,
  userId: number,
  locale: Locale,
): Promise<RecipeView[]> {
  if (!db) return libraryViews(locale);
  const own = [
    ...(await ownRecipes(db, userId, 'mine')),
    ...(await ownRecipes(db, userId, 'shared')),
  ];
  const seen = new Set(own.map((r) => r.ref));
  const community = (await communityRecipes(db)).filter((r) => !seen.has(r.ref));
  return [...libraryViews(locale), ...own, ...community];
}

// ---------------------------------------------------------------------------------------------
// Writing own recipes

async function writeParts(tx: Db, recipeId: number, input: RecipeInput) {
  await tx.execute('DELETE FROM recipe_ingredients WHERE recipe_id = ?', [recipeId]);
  await tx.execute('DELETE FROM recipe_steps WHERE recipe_id = ?', [recipeId]);
  for (const [position, i] of input.ingredients.entries()) {
    await tx.execute(
      `INSERT INTO recipe_ingredients (recipe_id, position, name, qty, unit, food_id, scaling, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [recipeId, position, i.name, i.qty, i.unit, i.foodId, i.scaling, i.note],
    );
  }
  for (const [position, s] of input.steps.entries()) {
    await tx.execute(
      `INSERT INTO recipe_steps (recipe_id, position, stage, text, timer_sec, uses)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [recipeId, position, s.stage, s.text, s.timerSec, s.uses === null ? null : s.uses.join(',')],
    );
  }
}

const recipeValues = (input: RecipeInput) => [
  input.title,
  input.intro,
  input.tips,
  input.servings,
  input.prepMin,
  input.cookMin,
  input.difficulty,
  input.cuisine,
  input.tags.join(','),
  input.allergens.join(','),
  input.equipment,
];

export async function createRecipe(
  db: PluginDatabase,
  user: PluginUser,
  input: RecipeInput,
): Promise<number> {
  const [count] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM recipes WHERE owner_user_id = ?',
    [user.id],
  );
  if (num(count?.n ?? 0) >= LIMITS.recipesPerUser) {
    throw new HttpError(400, 'tooManyRecipes', { max: LIMITS.recipesPerUser });
  }
  return db.transaction(async (tx) => {
    const res = await tx.execute(
      `INSERT INTO recipes (owner_user_id, owner_name, title, intro, tips, servings, prep_min,
                            cook_min, difficulty, cuisine, tags, allergens, equipment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, user.displayName.slice(0, 80), ...recipeValues(input)],
    );
    await writeParts(tx, res.insertId, input);
    return res.insertId;
  });
}

async function requireOwn(db: Db, recipeId: number, userId: number) {
  const [row] = await db.query<{ owner_user_id: number }>(
    'SELECT owner_user_id FROM recipes WHERE id = ?',
    [recipeId],
  );
  if (!row) throw new HttpError(404, 'recipeNotFound');
  if (num(row.owner_user_id) !== userId) throw new HttpError(403, 'ownerOnly');
}

export async function updateRecipe(
  db: PluginDatabase,
  recipeId: number,
  userId: number,
  input: RecipeInput,
) {
  await requireOwn(db, recipeId, userId);
  await db.transaction(async (tx) => {
    await tx.execute(
      `UPDATE recipes SET title = ?, intro = ?, tips = ?, servings = ?, prep_min = ?, cook_min = ?,
              difficulty = ?, cuisine = ?, tags = ?, allergens = ?, equipment = ?
        WHERE id = ?`,
      [...recipeValues(input), recipeId],
    );
    await writeParts(tx, recipeId, input);
  });
}

export async function deleteRecipe(db: Db, recipeId: number, userId: number) {
  await requireOwn(db, recipeId, userId);
  await db.execute('DELETE FROM recipes WHERE id = ?', [recipeId]);
  await db.execute('DELETE FROM favourites WHERE recipe_ref = ?', [String(recipeId)]);
}

/** A copy of a recipe the person can see (library or shared), as their own recipe. */
export async function copyRecipe(
  db: PluginDatabase,
  user: PluginUser,
  ref: string,
  locale: Locale,
): Promise<number> {
  const r = await recipeByRef(db, ref, user.id, locale);
  if (!r) throw new HttpError(404, 'recipeNotFound');
  return createRecipe(db, user, {
    title: r.title.slice(0, LIMITS.title),
    intro: r.intro,
    tips: r.tips,
    servings: r.servings,
    prepMin: r.prepMin,
    cookMin: r.cookMin,
    difficulty: r.difficulty,
    cuisine: r.cuisine,
    tags: r.declaredTags,
    allergens: r.declaredAllergens,
    equipment: r.equipment,
    ingredients: r.ingredients,
    steps: r.steps,
  });
}

// ---------------------------------------------------------------------------------------------
// Photos

export async function readRecipePhoto(db: Db, recipeId: number, userId: number, thumb = false) {
  const [row] = await db.query<{ mime: string; data: Buffer }>(
    `SELECT ${PICTURE_SQL} FROM recipe_photos p JOIN recipes r ON r.id = p.recipe_id
      WHERE p.recipe_id = ? AND ${VISIBLE}`,
    [...thumbParams(thumb), recipeId, userId, userId],
  );
  if (!row) throw new HttpError(404, 'notFound');
  return row;
}

export async function saveRecipePhoto(db: Db, recipeId: number, userId: number, photo: Picture) {
  await requireOwn(db, recipeId, userId);
  await db.execute(
    `INSERT INTO recipe_photos (recipe_id, mime, data, bytes, thumb_mime, thumb)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE mime = VALUES(mime), data = VALUES(data), bytes = VALUES(bytes),
       thumb_mime = VALUES(thumb_mime), thumb = VALUES(thumb)`,
    [recipeId, photo.mime, Buffer.from(photo.data), photo.data.byteLength, ...thumbValues(photo)],
  );
}

export async function deleteRecipePhoto(db: Db, recipeId: number, userId: number) {
  await requireOwn(db, recipeId, userId);
  await db.execute('DELETE FROM recipe_photos WHERE recipe_id = ?', [recipeId]);
}

// ---------------------------------------------------------------------------------------------
// Sharing

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const SHARE_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/;

/** A share link for the recipe (keeps the current one); returns the code. */
export async function shareRecipe(db: Db, recipeId: number, userId: number): Promise<string> {
  await requireOwn(db, recipeId, userId);
  const [row] = await db.query<{ share_code: string | null }>(
    'SELECT share_code FROM recipes WHERE id = ?',
    [recipeId],
  );
  if (row?.share_code) return row.share_code;
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = '';
    for (let i = 0; i < 8; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    const [taken] = await db.query<{ id: number }>('SELECT id FROM recipes WHERE share_code = ?', [
      code,
    ]);
    if (taken) continue;
    await db.execute('UPDATE recipes SET share_code = ? WHERE id = ?', [code, recipeId]);
    return code;
  }
  throw new Error('could not make a unique share code');
}

/** Stops sharing: the link stops working and the people who opened it no longer see it. */
export async function unshareRecipe(db: Db, recipeId: number, userId: number) {
  await requireOwn(db, recipeId, userId);
  await db.execute('UPDATE recipes SET share_code = NULL WHERE id = ?', [recipeId]);
  await db.execute('DELETE FROM recipe_access WHERE recipe_id = ?', [recipeId]);
}

/** Opening a share link: the person may see the recipe from now on; returns its id, or null. */
export async function openShare(db: Db, code: string, userId: number): Promise<number | null> {
  const [row] = await db.query<{ id: number }>('SELECT id FROM recipes WHERE share_code = ?', [
    code,
  ]);
  if (!row) return null;
  await db.execute('INSERT IGNORE INTO recipe_access (recipe_id, user_id) VALUES (?, ?)', [
    num(row.id),
    userId,
  ]);
  return num(row.id);
}

// ---------------------------------------------------------------------------------------------
// Public links (ADR 0047): /p/CODE for anyone, signed in or not

export const PUBLIC_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{10}$/;

/** The recipe's public link (keeps the current one); returns the code. Author only. */
export async function makePublicLink(db: Db, recipeId: number, userId: number): Promise<string> {
  await requireOwn(db, recipeId, userId);
  const [row] = await db.query<{ public_code: string | null }>(
    'SELECT public_code FROM recipes WHERE id = ?',
    [recipeId],
  );
  if (row?.public_code) return row.public_code;
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = '';
    for (let i = 0; i < 10; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    const [taken] = await db.query<{ id: number }>('SELECT id FROM recipes WHERE public_code = ?', [
      code,
    ]);
    if (taken) continue;
    await db.execute('UPDATE recipes SET public_code = ? WHERE id = ?', [code, recipeId]);
    return code;
  }
  throw new Error('could not make a unique public code');
}

/** Stops the public link: it shows "not shared" from now on. */
export async function stopPublicLink(db: Db, recipeId: number, userId: number) {
  await requireOwn(db, recipeId, userId);
  await db.execute('UPDATE recipes SET public_code = NULL WHERE id = ?', [recipeId]);
}

/** The recipe behind a public link, or null (no hint whether it ever existed). */
export async function publicRecipe(db: Db, code: string): Promise<RecipeView | null> {
  if (!PUBLIC_CODE_PATTERN.test(code)) return null;
  const [row] = await db.query<RecipeRow>(
    `SELECT ${RECIPE_COLUMNS} FROM recipes r WHERE r.public_code = ?`,
    [code],
  );
  if (!row) return null;
  const parts = await partsOf(db, [num(row.id)]);
  const view = ownView(
    row,
    parts.ingredients.get(num(row.id)) ?? [],
    parts.steps.get(num(row.id)) ?? [],
  );
  // Visitors see the recipe, not how it is shared with members.
  return { ...view, shareCode: null, publicCode: code };
}

/** The photo of a publicly linked recipe. */
export async function readPublicPhoto(db: Db, code: string, thumb = false) {
  if (!PUBLIC_CODE_PATTERN.test(code)) throw new HttpError(404, 'notFound');
  const [row] = await db.query<{ mime: string; data: Buffer }>(
    `SELECT ${PICTURE_SQL} FROM recipe_photos p JOIN recipes r ON r.id = p.recipe_id
      WHERE r.public_code = ?`,
    [...thumbParams(thumb), code],
  );
  if (!row) throw new HttpError(404, 'notFound');
  return row;
}

// ---------------------------------------------------------------------------------------------
// Community: public recipes, recommendations and comments

/** Public recipes of every member, most recommended first. */
export async function communityRecipes(db: Db, limit = 200): Promise<RecipeView[]> {
  const rows = await db.query<RecipeRow>(
    `SELECT ${RECIPE_COLUMNS} FROM recipes r WHERE r.is_public = 1
      ORDER BY recommendations DESC, r.published_at DESC, r.id DESC LIMIT ${Math.trunc(limit)}`,
  );
  const parts = await partsOf(
    db,
    rows.map((r) => num(r.id)),
  );
  return rows.map((r) =>
    ownView(r, parts.ingredients.get(num(r.id)) ?? [], parts.steps.get(num(r.id)) ?? []),
  );
}

/**
 * The author makes a recipe public (when the required checks pass, lib/guide.ts) or private
 * again. Recommendations and comments stay while it is private, hidden with it.
 */
export async function setPublic(db: Db, recipeId: number, userId: number, on: boolean) {
  await requireOwn(db, recipeId, userId);
  await db.execute(
    `UPDATE recipes SET is_public = ?, published_at = CASE WHEN ? = 1 THEN COALESCE(published_at, UTC_TIMESTAMP()) ELSE published_at END
      WHERE id = ?`,
    [on ? 1 : 0, on ? 1 : 0, recipeId],
  );
}

async function requirePublicOfOthers(db: Db, recipeId: number, userId: number) {
  const [row] = await db.query<{ owner_user_id: number; is_public: number }>(
    'SELECT owner_user_id, is_public FROM recipes WHERE id = ?',
    [recipeId],
  );
  if (!row || !num(row.is_public)) throw new HttpError(404, 'recipeNotFound');
  return { ownerId: num(row.owner_user_id), own: num(row.owner_user_id) === userId };
}

/** A member recommends a public recipe of someone else (once), or takes it back. */
export async function setRecommendation(db: Db, recipeId: number, userId: number, on: boolean) {
  const r = await requirePublicOfOthers(db, recipeId, userId);
  if (r.own) throw new HttpError(400, 'ownRecipe');
  if (on) {
    await db.execute(
      'INSERT IGNORE INTO recipe_recommendations (recipe_id, user_id) VALUES (?, ?)',
      [recipeId, userId],
    );
  } else {
    await db.execute('DELETE FROM recipe_recommendations WHERE recipe_id = ? AND user_id = ?', [
      recipeId,
      userId,
    ]);
  }
  const [count] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM recipe_recommendations WHERE recipe_id = ?',
    [recipeId],
  );
  return num(count?.n ?? 0);
}

export async function recommendedBy(db: Db, recipeId: number, userId: number): Promise<boolean> {
  const [row] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM recipe_recommendations WHERE recipe_id = ? AND user_id = ?',
    [recipeId, userId],
  );
  return num(row?.n ?? 0) > 0;
}

export interface Comment {
  id: number;
  recipeId: number;
  userId: number;
  name: string;
  body: string;
  /** UTC ISO. */
  at: string;
}

const UTC = (col: string, as: string) => `DATE_FORMAT(${col}, '%Y-%m-%dT%H:%i:%sZ') AS ${as}`;

interface CommentRow {
  id: number;
  recipe_id: number;
  user_id: number;
  user_name: string;
  body: string;
  at: string;
}

const toComment = (r: CommentRow): Comment => ({
  id: num(r.id),
  recipeId: num(r.recipe_id),
  userId: num(r.user_id),
  name: r.user_name,
  body: r.body,
  at: r.at,
});

export async function commentsOf(db: Db, recipeId: number): Promise<Comment[]> {
  const rows = await db.query<CommentRow>(
    `SELECT id, recipe_id, user_id, user_name, body, ${UTC('created_at', 'at')}
       FROM recipe_comments WHERE recipe_id = ? ORDER BY created_at, id LIMIT 500`,
    [recipeId],
  );
  return rows.map(toComment);
}

/** A comment on a public recipe (the author is told by the scheduled hook). */
export async function addComment(db: Db, recipeId: number, user: PluginUser, body: string) {
  await requirePublicOfOthers(db, recipeId, user.id);
  const [recent] = await db.query<{ n: number }>(
    `SELECT COUNT(*) AS n FROM recipe_comments
      WHERE user_id = ? AND created_at > UTC_TIMESTAMP() - INTERVAL 1 HOUR`,
    [user.id],
  );
  if (num(recent?.n ?? 0) >= LIMITS.commentsPerHour) throw new HttpError(429, 'tooManyComments');
  const res = await db.execute(
    'INSERT INTO recipe_comments (recipe_id, user_id, user_name, body) VALUES (?, ?, ?, ?)',
    [recipeId, user.id, user.displayName.slice(0, 80), body],
  );
  return res.insertId;
}

/** The comment's writer or the recipe's author removes a comment. */
export async function deleteComment(db: Db, recipeId: number, commentId: number, userId: number) {
  const [row] = await db.query<{ user_id: number; owner_user_id: number }>(
    `SELECT c.user_id, r.owner_user_id FROM recipe_comments c JOIN recipes r ON r.id = c.recipe_id
      WHERE c.id = ? AND c.recipe_id = ?`,
    [commentId, recipeId],
  );
  if (!row) throw new HttpError(404, 'commentNotFound');
  if (num(row.user_id) !== userId && num(row.owner_user_id) !== userId) {
    throw new HttpError(403, 'ownerOnly');
  }
  await db.execute('DELETE FROM recipe_comments WHERE id = ?', [commentId]);
}

/** Comments others wrote on the person's recipes, newest first (the app's Comments page). */
export async function commentsOnMine(
  db: Db,
  userId: number,
): Promise<(Comment & { title: string })[]> {
  const rows = await db.query<CommentRow & { title: string }>(
    `SELECT c.id, c.recipe_id, c.user_id, c.user_name, c.body, ${UTC('c.created_at', 'at')}, r.title
       FROM recipe_comments c JOIN recipes r ON r.id = c.recipe_id
      WHERE r.owner_user_id = ? AND c.user_id <> r.owner_user_id
      ORDER BY c.created_at DESC, c.id DESC LIMIT 200`,
    [userId],
  );
  return rows.map((r) => ({ ...toComment(r), title: r.title }));
}

// --- For the scheduled hook

/** Comments the recipe's author has not been told about (not their own, at most a week old). */
export async function commentsToNotify(db: Db, limit: number) {
  const rows = await db.query<CommentRow & { title: string; owner_user_id: number }>(
    `SELECT c.id, c.recipe_id, c.user_id, c.user_name, c.body, ${UTC('c.created_at', 'at')}, r.title,
            r.owner_user_id
       FROM recipe_comments c JOIN recipes r ON r.id = c.recipe_id
      WHERE c.notified_at IS NULL AND c.user_id <> r.owner_user_id
        AND c.created_at > UTC_TIMESTAMP() - INTERVAL 7 DAY
      ORDER BY c.id LIMIT ${Math.trunc(limit)}`,
  );
  return rows.map((r) => ({ ...toComment(r), title: r.title, ownerId: num(r.owner_user_id) }));
}

/** Claims a comment's notification; false when another run already did. */
export async function claimCommentNotice(db: Db, commentId: number) {
  const res = await db.execute(
    'UPDATE recipe_comments SET notified_at = UTC_TIMESTAMP() WHERE id = ? AND notified_at IS NULL',
    [commentId],
  );
  return res.affectedRows > 0;
}

/** Recipes whose recommendations passed a hundred their author has not been rewarded for. */
export async function recipesDueForPoints(db: Db) {
  const rows = await db.query<{
    id: number;
    owner_user_id: number;
    title: string;
    nps_milestones: number;
    recommendations: number | string;
  }>(
    `SELECT r.id, r.owner_user_id, r.title, r.nps_milestones, x.n AS recommendations
       FROM recipes r
       JOIN (SELECT recipe_id, COUNT(*) AS n FROM recipe_recommendations GROUP BY recipe_id) x
         ON x.recipe_id = r.id
      WHERE FLOOR(x.n / 100) > r.nps_milestones
      LIMIT 50`,
  );
  return rows.map((r) => ({
    id: num(r.id),
    ownerId: num(r.owner_user_id),
    title: r.title,
    milestones: num(r.nps_milestones),
    recommendations: num(r.recommendations),
  }));
}

export async function setMilestones(db: Db, recipeId: number, milestones: number) {
  await db.execute('UPDATE recipes SET nps_milestones = GREATEST(nps_milestones, ?) WHERE id = ?', [
    milestones,
    recipeId,
  ]);
}
