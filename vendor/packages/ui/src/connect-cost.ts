/**
 * Connecting another app may cost NPS points (ADR 0082): connecting subscribes the member to it.
 * "NPS" reads the same in every language, so the button shows the points without new texts:
 * "Connect · 3 NPS" when they have enough, a disabled "🔒 3 NPS" when they do not.
 */
export interface ConnectCost {
  state: 'connected' | 'available' | 'needs-access';
  npsCost?: number;
  affordable?: boolean;
}

/** The connect button's label for `connect` (the app's own word), or null to keep its usual one. */
export function connectLabel(app: ConnectCost, connect: string): string | null {
  const cost = app.npsCost ?? 0;
  if (cost <= 0 || app.state === 'connected') return null;
  if (app.state === 'available') return `${connect} · ${cost} NPS`;
  return app.affordable === false ? `🔒 ${cost} NPS` : null;
}

/** True when the button must be disabled: the points are not enough. */
export const connectBlocked = (app: ConnectCost) =>
  app.state === 'needs-access' && (app.npsCost ?? 0) > 0 && app.affordable === false;
