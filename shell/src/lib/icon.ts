import { APP } from '@/generated/app';

const escape = (s: string) => s.replace(/[&<>"']/g, '');

/** The instance's icon: the app's first letter on DevQuake's orange (favicon, toolbar). */
export function iconSvg(): string {
  const letter = escape(APP.name.trim().charAt(0).toUpperCase() || 'D');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#e4572e"/><text x="32" y="44" font-family="system-ui,sans-serif" font-size="36" font-weight="700" fill="#fff" text-anchor="middle">${letter}</text></svg>`;
}
