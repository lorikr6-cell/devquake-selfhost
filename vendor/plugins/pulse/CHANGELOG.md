# Changelog — Pulse

## 0.6.0

- Pulse can now run on your own server (DevQuake self-hosted): there, every member gets the full plan.

## 0.5.1

- “Back” links now return to the page you came from, with its filters and where you had scrolled to.

## 0.5.0

- The app’s card on DevQuake and its front page now show how many members use it and its totals: API services, events today.

0.4.1

- People who do not use the app yet now see what it does on its front page, with a link to the user manual, and shared links show the app’s own picture.

## 0.4.0

- Check it live: open the new demo in two browsers (signed in to the same account) and send a message or your own JSON from one to the other through the real Pulse API. The other browser shows what arrived and how long it took, from the sender to the server, from the server to the browser and in total, with the average, fastest and slowest. Free on every plan, on a private channel only you can use.

## 0.3.0

- API calls are counted: your service's page shows how many calls it received in total, in short form (like 1.2K or 100K; the exact number when you point at it), how many were refused, and the latest calls with their answer and how long they took.
- For DevQuake admins: the totals of all services, the size of the call log, and cleaning the log now or automatically every 1, 7, 30 or 90 days. Cleaning the log never changes the totals. When Pulse cannot start, admins now see which setting is missing.

## 0.2.0

- Add the app to your home screen: on phones and tablets, the new button in the toolbar puts the app’s icon (its logo with the DevQuake badge) on your home screen, so it opens like an app.

## 0.1.0

- Create API services and get a public key for your web pages and a secret key for your server (shown once, never stored; make a new one any time, the old one keeps working for 24 hours).
- Send events with your own key:value data and receive them live in every connected browser, with a polling fallback where live connections are blocked; clients that reconnect catch up on what they missed.
- Describe your own data structure per event (keys, types, required) and optionally refuse everything else.
- Security: the public key only works on websites you verified with a DNS record, the secret key is refused in web pages and can be tied to your servers' addresses, private channels need short-lived client tokens, and a security log warns you when a key seems to be shared.
- A live test to try everything with two devices, ready-to-copy code, and usage per day. Try it free for 24 hours (slower on purpose) or subscribe; ask us for full access.
