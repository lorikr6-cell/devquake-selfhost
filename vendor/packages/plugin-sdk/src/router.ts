export interface RouteMatch {
  pattern: string;
  params: Record<string, string>;
}

const split = (path: string): string[] => path.split('/').filter(Boolean);

/** Higher score = more specific. Static > :param > *splat. */
function score(pattern: string): number {
  return split(pattern).reduce((acc, seg) => {
    if (seg.startsWith('*')) return acc - 1;
    if (seg.startsWith(':')) return acc + 2;
    return acc + 3;
  }, 0);
}

function matchOne(pattern: string, segments: string[]): Record<string, string> | null {
  const parts = split(pattern);
  const params: Record<string, string> = {};

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    if (part.startsWith('*')) {
      params[part.slice(1) || 'rest'] = segments.slice(i).join('/');
      return params;
    }
    const seg = segments[i];
    if (seg === undefined) return null;
    if (part.startsWith(':')) params[part.slice(1)] = seg;
    else if (part !== seg) return null;
  }
  return parts.length === segments.length ? params : null;
}

/** Find the most specific pattern matching `pathname`. Returns null when nothing matches. */
export function matchRoute(patterns: string[], pathname: string): RouteMatch | null {
  const segments = split(pathname);
  const sorted = [...patterns].sort((a, b) => score(b) - score(a));
  for (const pattern of sorted) {
    const params = matchOne(pattern, segments);
    if (params) return { pattern, params };
  }
  return null;
}
