/**
 * An error with an HTTP status; the API wrapper turns it into a JSON response in the visitor's
 * language. `key` names the text in the translations (errors.<key>); a `field` param is a key of
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
