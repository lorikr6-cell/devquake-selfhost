/**
 * An error with an HTTP status for the dashboard API; the wrapper turns it into a JSON response
 * in the visitor's language. `key` names the text (errors.<key>); a `field` param is a key of
 * fields.<field> (ADR 0011).
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    public key: string,
    public params: Record<string, string | number> = {},
  ) {
    super(key);
  }
}
