import { PASSWORD_MIN } from './passwords';
import type { ShellKey, shellT } from './texts';

const ERRORS = new Set<ShellKey>([
  'invalidName',
  'invalidEmail',
  'invalidPassword',
  'passwordsDiffer',
  'emailTaken',
  'wrongSignIn',
  'tooMany',
]);

/** The message for ?error=<code>, or null for anything unknown. */
export function formError(
  t: ReturnType<typeof shellT>,
  code: string | string[] | undefined,
): string | null {
  if (typeof code !== 'string' || !ERRORS.has(code as ShellKey)) return null;
  return t(code as ShellKey, { min: PASSWORD_MIN });
}
