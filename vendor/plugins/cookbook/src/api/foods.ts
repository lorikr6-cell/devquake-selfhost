import { api } from '../lib/api';
import { myFoodPhotos } from '../lib/food-photos';
import { searchFoods, thumbOf } from '../lib/foods';

// GET /api/foods?q=: foods whose name matches, for linking an ingredient to its nutrition, with
// their thumbnails (the member's picture, the one chosen for everyone, or the drawing).
export const GET = api(async ({ request, locale, db, user }) => {
  const q = new URL(request.url).searchParams.get('q') ?? '';
  const mine = await myFoodPhotos(db, user.id);
  return {
    foods: searchFoods(q.slice(0, 40), locale).map((f) => ({
      id: f.id,
      name: f.name[locale],
      thumb: thumbOf(f, mine),
    })),
  };
});
