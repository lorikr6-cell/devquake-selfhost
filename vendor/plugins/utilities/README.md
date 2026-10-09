# Utility bill manager

DevQuake app served at `https://utilities.devquake.com` (local: `http://utilities.localhost:3000`). It
has its own MySQL database (ADR 0007) and reads the platform only through the SDK (`ctx.user`,
`ctx.db`, `ctx.people`). Product spec: `docs/plugins/ideas/utilities.md`.

People add **utilities** (electricity, gas, water, heating, phone, cable TV, internet, online
hosting, Xbox, Microsoft, Apple, Steam or custom), each collecting **bills** month by month. The
manager (the utility's creator, who pays the provider) uploads the provider's **PDF**; the
server reads the total, consumption, unit price and due date from its text layer, and the
manager checks or types them in the same form. Utilities are shared with an **invite link / code
/ QR** or directly with people from the manager's **DevQuake referral network**. With
**"Individual meter required"** every participant sends a **meter reading with a photo** (read
in the browser with OCR when possible) and the bill is split by consumption; otherwise equally.
The manager records **payments received** (cash, card, other); over- and underpayments carry
over to the next bill. Every bill has **comments**. The home screen has a **calendar** (month /
year) of the user's own part and **statistics** per category.

## Routes

| Type | Pattern                             | File                             | Purpose                                                                                                                                                              |
| ---- | ----------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page | `/`                                 | `src/pages/home.tsx`             | Tabs: Bills (by category), Calendar, Statistics, New/Join                                                                                                            |
| Page | `/profile`                          | `src/pages/profile.tsx`          | Full name and address (required once, `?next=` back)                                                                                                                 |
| Page | `/join/:code`                       | `src/pages/join.tsx`             | Invitation: the utility and a Join button                                                                                                                            |
| Page | `/utilities/:id`                    | `src/pages/utility.tsx`          | The utility's bills with state; settings (manager)                                                                                                                   |
| Page | `/utilities/:id/share`              | `src/pages/share.tsx`            | Invite link/QR, referral friends, members with addresses                                                                                                             |
| Page | `/utilities/:id/bills/new`          | `src/pages/bill-new.tsx`         | New bill (PDF read + form), manager only                                                                                                                             |
| Page | `/bills/:id`                        | `src/pages/bill.tsx`             | Bill: split table, readings, payments, comments                                                                                                                      |
| Page | `/bills/:id/edit`                   | `src/pages/bill-edit.tsx`        | Edit a bill, manager only                                                                                                                                            |
| Page | `/help`                             | `src/pages/help.tsx`             | User manual; **public** (ADR 0009), in the sitemap                                                                                                                   |
| API  | `/health`                           | `src/api/health.ts`              | Liveness                                                                                                                                                             |
| API  | `/profile`                          | `src/api/profile.ts`             | GET, PUT `{ fullName, address }`                                                                                                                                     |
| API  | `/address-suggest`                  | `src/api/address-suggest.ts`     | GET `?field=state\|city\|street&q=&country=` suggestions (Photon)                                                                                                    |
| API  | `/utility-place`                    | `src/api/utility-place.ts`       | POST `{ lat?, lon? }`: the country and county / state for the search, from reverse geocoding or the profile address; the person checks or edits it before any search |
| API  | `/utility-suggestions`              | `src/api/utility-suggestions.ts` | POST `{ countryCode, region }`: services to suggest for the confirmed place (`lib/provider-catalog.ts`); nothing is saved                                            |
| API  | `/join`                             | `src/api/join.ts`                | POST `{ code }` (bills from this month on)                                                                                                                           |
| API  | `/utilities`                        | `src/api/utilities.ts`           | GET overview, POST create                                                                                                                                            |
| API  | `/utilities/:id`                    | `src/api/utility.ts`             | PATCH settings, DELETE (manager)                                                                                                                                     |
| API  | `/utilities/:id/bills`              | `src/api/bills.ts`               | POST a bill (manager)                                                                                                                                                |
| API  | `/utilities/:id/read-pdf`           | `src/api/read-pdf.ts`            | POST PDF body → fields read from it (nothing stored)                                                                                                                 |
| API  | `/utilities/:id/invite`             | `src/api/invite.ts`              | GET active code, POST new code (manager)                                                                                                                             |
| API  | `/utilities/:id/members`            | `src/api/members.ts`             | POST `{ userId }` from the referral network (manager)                                                                                                                |
| API  | `/utilities/:id/members/:userId`    | `src/api/member.ts`              | DELETE: manager removes, member leaves; PATCH `{ viewOnly }`                                                                                                         |
| API  | `/bills/:id`                        | `src/api/bill.ts`                | PATCH, DELETE (manager)                                                                                                                                              |
| API  | `/bills/:id/file`                   | `src/api/bill-file.ts`           | GET PDF (members), PUT PDF body + `X-File-Name`, DELETE                                                                                                              |
| API  | `/bills/:id/provider-paid`          | `src/api/provider-paid.ts`       | PUT `{ paid }` (manager)                                                                                                                                             |
| API  | `/bills/:id/readings/:userId`       | `src/api/reading.ts`             | PUT indexes or consumption (self, or manager), DELETE                                                                                                                |
| API  | `/bills/:id/readings/:userId/photo` | `src/api/reading-photo.ts`       | GET meter photo (members), PUT image body                                                                                                                            |
| API  | `/bills/:id/payments/:userId`       | `src/api/payment.ts`             | PUT confirms (then locked), DELETE: DevQuake admins only                                                                                                             |
| API  | `/bills/:id/comments`               | `src/api/comments.ts`            | GET, POST `{ body }` (members)                                                                                                                                       |
| API  | `/bills/:id/comments/:commentId`    | `src/api/comment.ts`             | DELETE: the author or the manager                                                                                                                                    |
| API  | `/bills/:id/expense`                | `src/api/bill-expense.ts`        | POST: the manager adds the bill to a Shared expenses group (link point `expense.add`, ADR 0035, 0055)                                                                |

Platform hooks (`src/platform.ts`): `getStats` (utilities, people, bills, PDFs, readings,
photos) and `deleteUserData`, run on account deletion **and** on unsubscribing: utilities the
user manages are deleted with everything under them (cascade), and on other utilities their
membership, bill shares, readings, meter photos, payments and comments are removed, as is their
profile.

## How a bill is split (`src/lib/split.ts`, unit-tested)

- Money is computed in whole cents; shares always add up to the bill. Leftover cents go to the
  manager.
- **Meter utilities**: share = consumption × unit price; once **all** participants have a
  reading, the rest of the bill (positive: common areas, losses, fixed fees; negative: readings
  above the bill) is split equally between all participants, the manager included. Until then
  the bill is `awaiting` (hourglass) and only provisional amounts are shown.
- **Other utilities**: equal split.
- **Unit price**: the bill's own, else total ÷ billed consumption, else (meter utilities)
  total ÷ sum of readings.
- **Carry-over** (`splitUtility`, oldest bill first, per utility): once the manager records a
  person's payment on a bill, `paid − share` is added to that person's balance; the next bill's
  "to pay" is `share − balance`. A share fully covered by credit counts as settled with 0 paid,
  so a credit is used once. Bills without a recorded payment carry nothing (they stay open).
- **State**: `paid` (green check) = provider paid and every other participant paid their part;
  `awaiting` = readings missing; `open` (warning) otherwise.
- **Participants** are copied into `bill_participants` when the bill is added (the utility's
  members then); people who join later are added to bills from their joining month on; people
  who leave are taken off bills where they have no reading and no payment.

## View-only members and confirmed payments

- **View only** (`utility_members.view_only`, `setMemberViewOnly`): a member who sees the utility
  and all bills but does not share them (a family member). New bills take only members who are
  not view-only as participants. Switching on removes them from bills without their reading or
  payment; switching off adds them to bills from the current month on. The bill page shows them
  a note instead of their line.
- **Confirmed payments are locked**: the manager's PUT on a payment that exists answers 409
  (`paymentLocked`) unless the person is a DevQuake administrator (`ctx.user.isAdmin`) who also
  manages the utility (the visibility rule has no admin bypass); DELETE is administrators only.
- **Confirmation email**: confirming sets `payments.email_sent_at = NULL`; the `scheduled` hook
  (`platform.ts`, ADR 0014) takes up to 25 per run (`takePaymentEmails` marks each before
  sending) and sends `lib/payment-email.ts` (tested) in the person's language: the bill, their
  consumption, share, carry-over, amount due and paid, and a button to the bill (PDF there).
  Payments from before migration 0003 are marked as sent.

## Reading PDFs and meter photos

- PDFs: `lib/pdf-text.ts` extracts the text layer server-side with `unpdf` (max 10 pages, 4 MB);
  `lib/pdf-fields.ts` (pure, tested with RO/DE/HU/EN wording) finds total, consumption and unit,
  unit price and due date. The document's decimal separator is detected from its two-decimal
  amounts (dates are ignored) to resolve "1.250" vs "245,000". Scanned PDFs return nothing.
- Meter photos: shrunk in the browser (`shrinkPhoto`, 1600 px), read with `tesseract.js`
  (`components/meter-ocr.ts`, digits only; the engine and English data load from the jsDelivr
  CDN on first use), and `lib/meter.ts` picks the index (smallest value ≥ the previous index).
  The photo is uploaded; OCR never runs on the server.

## Address and suggestions

- The profile address is stored in parts (`lib/address.ts`, migration 0002): ISO country code,
  state or county, city, street, house number, optional apartment. `profiles.address` keeps the
  whole line (country in English); pages write it in the reader's language with
  `formatAddress` and `Intl.DisplayNames`. Profiles without parts (saved before 0.2.0) are sent to
  `/profile` to complete them (`requireProfile`, `hasCompleteProfile`).
- Suggestions: `/api/address-suggest` (signed-in only) asks Photon
  (`https://photon.komoot.io`, OpenStreetMap, made for type-ahead; Nominatim forbids
  autocomplete) with the country filter and the matching layers (state and county, city,
  street), filters by state and city (`suggestionsFrom`, tested), caches answers for a
  day in memory and answers empty after 4 s. The form debounces 300 ms, needs 2 letters and uses
  a `<datalist>`, so typing anything else still works. OpenStreetMap is credited under the form.

## Links (ADR 0035)

Offers `calendar.events` (`{ from, to }`, ≤ 62 days; `links/calendar-events.ts`): the due dates of
the member's unpaid bills as all-day items, the utility's name only, and the target `bill` →
`/bills/:id`. Uses it from the family planner, shopping and workout: the Calendar tab shows “From
your other apps” and filters connected events by month or selected day. “Works with” in the footer
connects and disconnects them.

## Languages

English, German, Romanian and Hungarian (ADR 0011). Texts: `src/i18n/screens.ts` (screens),
`src/i18n/app-texts.ts` (categories, states, errors, field names), `src/i18n/manual.ts` (the `/help` manual as blocks with `**bold**` and `{host}`; same
sections and blocks in every language, tested).
Catalog test: `src/i18n/catalog.test.ts`. API errors are keys (`HttpError`) translated by
`lib/api.ts`. Release notes: `CHANGELOG.md` plus `CHANGELOG.de.md`, `.ro.md`, `.hu.md`.

## Database

Own database, configured with `UTILITIES_DB_NAME`, `UTILITIES_DB_USER`, `UTILITIES_DB_PWD` (optional
`UTILITIES_DB_HOST`/`UTILITIES_DB_PORT`). Apply with `pnpm db:migrate --plugin utilities` or in phpMyAdmin.
Needs `max_allowed_packet` ≥ 8 MB for 4 MB PDFs.

| File                                     | Adds                                                                                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `0001_utilities.sql`                     | profiles, utilities, utility_members, utility_invites, bills, bill_files, bill_participants, readings, reading_photos, payments, bill_comments |
| `0002_profile_address.sql`               | `profiles.country_code`, `state`, `city`, `street`, `house_number`, `apartment`                                                                |
| `0003_view_only_and_locked_payments.sql` | `utility_members.view_only`; `payments.confirmed_by`, `email_sent_at`                                                                          |

`CHANGELOG.md` is shown to users (version button, ADR 0008): write entries for them and keep
technical details here.

## Development

```bash
pnpm dev                                  # from the repo root, then http://utilities.localhost:3000
pnpm --filter @devquake/plugin-utilities test
pnpm db:migrate --plugin utilities            # needs UTILITIES_DB_* in the environment
```
