// The organisation's contact email (migration 0016): DevQuake's address unless the organisers
// set their own. Pure: the settings form checks it before sending, the server again.

export const DEFAULT_CONTACT_EMAIL = 'contact@devquake.com';
export const CONTACT_EMAIL_MAX = 254;

/** For the browser's own check of the field (`pattern`): something@domain.tld. */
export const CONTACT_EMAIL_PATTERN = '[^@\\s]+@[^@\\s]+\\.[A-Za-z]{2,}';

const VALID = /^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/;

export const isContactEmail = (value: string) =>
  value.length <= CONTACT_EMAIL_MAX && VALID.test(value);

/**
 * What to store: null for DevQuake's default (empty, or its own address), else the address in
 * lower case; undefined when it is not a valid address.
 */
export function storedContactEmail(value: string): string | null | undefined {
  const v = value.trim().toLowerCase();
  if (!v || v === DEFAULT_CONTACT_EMAIL) return null;
  return isContactEmail(v) ? v : undefined;
}
