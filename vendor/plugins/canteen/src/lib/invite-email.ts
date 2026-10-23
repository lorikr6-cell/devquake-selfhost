// Invitations by email (ADR 0073): what the canteen keeps of the address (a masked hint for the
// staff page, never the address) and how often one invitation may be sent. Pure, tested.

export const MAX_EMAILS_PER_INVITE = 3;

/** "ana.pop@gmail.com" → "a***@gmail.com"; the domain stays so the organiser recognises it. */
export function maskAddress(address: string): string {
  const a = address.trim().toLowerCase();
  const at = a.lastIndexOf('@');
  if (at < 1) return '***';
  return `${a[0]}***${a.slice(at)}`.slice(0, 80);
}
