// Delivery routes (docs/plugins/ideas/canteen.md, step 3): pure rules, tested in routes.test.ts.
// Without a map service, a stop takes the organisation's minutes per stop (driving included).

export interface Window {
  /** Minutes after midnight; null = any time. */
  fromMin: number | null;
  toMin: number | null;
}

export interface Shift {
  fromMin: number;
  toMin: number;
}

export interface TimedStop {
  personId: number;
  /** The estimated arrival, minutes after midnight. */
  etaMin: number;
  /** The arrival is within the person's window. */
  inWindow: boolean;
  /** The arrival is still within the driver's shift. */
  inShift: boolean;
}

/** Waiting for the window to open is fine; arriving after it closed is not. */
export function arrival(earliest: number, window: Window): number {
  return window.fromMin !== null && earliest < window.fromMin ? window.fromMin : earliest;
}

export function inWindow(eta: number, window: Window): boolean {
  return (
    (window.fromMin === null || eta >= window.fromMin) &&
    (window.toMin === null || eta <= window.toMin)
  );
}

/**
 * Estimated arrivals of a route in order: the first stop one leg after the shift starts, each
 * next one a leg later, waiting where a window has not opened yet.
 */
export function estimate(
  stops: readonly { personId: number; window: Window }[],
  shift: Shift,
  minutesPerStop: number,
): TimedStop[] {
  let clock = shift.fromMin;
  return stops.map((s) => {
    const eta = arrival(clock + minutesPerStop, s.window);
    clock = eta;
    return {
      personId: s.personId,
      etaMin: eta,
      inWindow: inWindow(eta, s.window),
      inShift: eta <= shift.toMin,
    };
  });
}

/** Every stop on time and within the shift. */
export function routeOk(timed: readonly TimedStop[]): boolean {
  return timed.every((t) => t.inWindow && t.inShift);
}

/**
 * Whether a person fits at the end of a route: the route stays on time and within the shift,
 * and the person is reached within their own window.
 */
export function fitsAtEnd(
  stops: readonly { personId: number; window: Window }[],
  candidate: { personId: number; window: Window },
  shift: Shift,
  minutesPerStop: number,
): boolean {
  return routeOk(estimate([...stops, candidate], shift, minutesPerStop));
}

/** Moves the item at `from` to `to` (both within the list). */
export function move<T>(list: readonly T[], from: number, to: number): T[] {
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item!);
  return copy;
}
