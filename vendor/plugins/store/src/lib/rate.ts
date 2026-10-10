// In-memory limits of one server process (ADR 0023). Pure: the clock is passed in.

/** A token bucket: `perMinute` sustained, `burst` at once. */
export class Buckets {
  private buckets = new Map<string, { tokens: number; at: number }>();

  /** Takes one token for `key`; false when the caller must wait. */
  take(key: string, perMinute: number, burst: number, now: number): boolean {
    const b = this.buckets.get(key) ?? { tokens: burst, at: now };
    const refill = ((now - b.at) / 60_000) * perMinute;
    b.tokens = Math.min(burst, b.tokens + refill);
    b.at = now;
    const ok = b.tokens >= 1;
    if (ok) b.tokens -= 1;
    this.buckets.set(key, b);
    if (this.buckets.size > 20_000) this.sweep(now);
    return ok;
  }

  /** Milliseconds until the next token for `key`. */
  waitMs(key: string, perMinute: number): number {
    const b = this.buckets.get(key);
    if (!b || b.tokens >= 1) return 0;
    return Math.ceil(((1 - b.tokens) / perMinute) * 60_000);
  }

  private sweep(now: number) {
    for (const [k, b] of this.buckets) if (now - b.at > 10 * 60_000) this.buckets.delete(k);
  }
}

/** Counts events per key inside a sliding window (e.g. failed keys per IP address). */
export class WindowCounter {
  private hits = new Map<string, number[]>();

  constructor(
    private windowMs: number,
    private max: number,
  ) {}

  /** Records a hit; true while the key is still under the limit. */
  hit(key: string, now: number): boolean {
    const list = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    list.push(now);
    this.hits.set(key, list);
    if (this.hits.size > 20_000) {
      for (const [k, l] of this.hits)
        if (!l.some((t) => now - t < this.windowMs)) this.hits.delete(k);
    }
    return list.length <= this.max;
  }

  /** Is the key over the limit right now (without recording a hit)? */
  blocked(key: string, now: number): boolean {
    return (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs).length > this.max;
  }
}

/** Lets something through once per `everyMs` per key (e.g. one log line a minute). */
export class Once {
  private last = new Map<string, number>();

  constructor(private everyMs: number) {}

  pass(key: string, now: number): boolean {
    if (now - (this.last.get(key) ?? -Infinity) < this.everyMs) return false;
    this.last.set(key, now);
    if (this.last.size > 20_000) this.last.clear();
    return true;
  }
}
