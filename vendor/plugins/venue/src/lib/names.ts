import { HttpError } from './http';
import { NAME_MAX } from './model';

/** The `name` of a request body (a category, a tablet), one line, required. */
export function nameOf(body: Record<string, unknown>): string {
  const name = String(body.name ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!name) throw new HttpError(400, 'required', { field: 'name' });
  if (name.length > NAME_MAX) throw new HttpError(400, 'tooLong', { field: 'name', max: NAME_MAX });
  return name;
}
