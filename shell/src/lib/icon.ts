import { APP } from '@/generated/app';

const escape = (s: string) => s.replace(/[&<>"']/g, '');

/** One colour per bundled app, in order (the instance itself uses DevQuake's orange). */
const COLOURS = ['#e4572e', '#2e86ab', '#3b8b5a', '#8e5ad6', '#c2185b', '#b07d12'];

/** An icon: a name's first letter on a colour (favicon, toolbar, the home's tiles). */
export function iconSvg(name: string = APP.name, index = 0): string {
  const letter = escape(name.trim().charAt(0).toUpperCase() || 'D');
  const fill = COLOURS[index % COLOURS.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${fill}"/><text x="32" y="44" font-family="system-ui,sans-serif" font-size="36" font-weight="700" fill="#fff" text-anchor="middle">${letter}</text></svg>`;
}
