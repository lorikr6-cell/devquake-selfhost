/**
 * Headers for a request the person did not ask for (polling, presence, keep-alives): the
 * platform's loading bar does not count it. `fetch(url, { headers: BACKGROUND_REQUEST })`.
 */
export const BACKGROUND_REQUEST: Readonly<Record<string, string>> = { 'x-dq-background': '1' };
