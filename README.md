# Event-Attendance-App
=======
# Guest Seat Check-in

A mobile-first guest check-in app designed to open from an event QR code. Guests
can search or browse the roster, confirm their identity, record attendance, and
see their seat. A server-side provider keeps the UI independent of Google Sheets.

## What is included

- Searchable, scrollable guest list with duplicate-name hints
- Confirmation dialog before attendance is recorded
- Seat reveal, success toast, and already-checked-in handling
- Loading, empty, offline, error, and retry states
- Keyboard navigation, focus management, live announcements, and reduced-motion
  support
- Preview mode with sample guests
- Protected Google Apps Script adapter with atomic attendance writes

## Run locally

Node.js 20.9 or newer is required.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. With the Google variables left unset, the app uses
the fictional preview guest list in `data/demo-guests.js`.

Run the project checks with:

```bash
npm run check
npm run build
```

## Deploy the web app

Use a host that supports Next.js server routes (this is not a static-only site).
Configure the event and provider environment values on the host, then run:

```bash
npm ci
npm run build
npm run start
```

For a private stakeholder preview, explicitly set
`GUEST_DATA_SOURCE="demo"`. Before printing the event QR code, switch it to
`google-sheets`, complete a real test check-in, and make the site reachable by
the intended guests.

## Connect a Google Sheet

### 1. Create the roster

Create a Google Sheet and name its guest tab `Guests`. Import
`guest-list-template.csv`, or use this exact header row:

| Column | Purpose |
| --- | --- |
| `guest_id` | Stable, opaque ID; never use a row number |
| `name` | Guest name displayed in search |
| `group` | Optional non-sensitive hint for duplicate names |
| `seat_number` | Seat number, kept as plain text |
| `table` | Optional table number/name, kept as plain text |
| `status` | `active` or `cancelled`; blank is treated as active |
| `checked_in` | App-managed attendance checkbox/boolean |
| `checked_in_at` | App-managed timestamp |
| `check_in_request_id` | App-managed retry/audit ID |
| `checked_in_source` | App-managed source (`qr-web`) |

The public guest-list response contains only `guest_id`, `name`, and `group`.
Seat and attendance fields are returned only after check-in.

### 2. Add the Apps Script adapter

1. In the Sheet, select **Extensions → Apps Script**.
2. Replace the editor contents with `google-apps-script/Code.gs`.
3. In **Project Settings → Script Properties**, add:
   - `GUEST_SHEET_NAME` = `Guests`
   - `SHARED_SECRET` = a random secret of at least 24 characters
4. Run `setupGuestSheet` once from the editor and approve access. This creates
   the tab/header when the tab is empty, validates an existing header, fills
   blank `guest_id` values, and stores the bound Sheet’s `SPREADSHEET_ID`
   without replacing guest data. For a standalone script, add
   `SPREADSHEET_ID` yourself; it is the value between `/d/` and `/edit` in the
   Google Sheet URL.
5. Select **Deploy → New deployment → Web app**.
6. Set **Execute as** to yourself and **Who has access** to **Anyone** (anonymous
   access, not “anyone signed in”). The Next.js server does not sign in to
   Google. A Workspace administrator may need to allow anonymous web apps.
7. Copy the deployed URL ending in `/exec` (not the `/dev` test URL).

The header names must match the template. The four app-managed columns
`checked_in`, `checked_in_at`, `check_in_request_id`, and `checked_in_source`
must remain next to one another in that order so attendance is saved in one
write. Duplicate IDs are rejected instead of risking the wrong guest being
checked in.

After adding guest rows later, run `backfillGuestIds` once before the event.

Generate a suitable secret on a machine with OpenSSL:

```bash
openssl rand -hex 32
```

The optional `google-apps-script/appsscript.json` contains the spreadsheet and
script-properties OAuth scopes needed by projects that manage the Apps Script
manifest directly.

### 3. Configure the web app

Set these server-only values in `.env.local` or in the hosting environment:

```dotenv
GUEST_DATA_SOURCE="google-sheets"
GOOGLE_APPS_SCRIPT_URL="https://script.google.com/macros/s/DEPLOYMENT_ID/exec"
GOOGLE_APPS_SCRIPT_TOKEN="the-same-random-secret"
```

Never prefix either value with `NEXT_PUBLIC_`. The guest’s browser calls the
app’s same-origin API; only the server talks to Apps Script.

Restart or redeploy the web app, then open `/api/guests` on the deployed domain
and confirm that it returns JSON with `"source":"google-sheets"`. The amber
preview notice disappears once the Google Sheets provider is active.

## Customize the event

Edit these server-side environment values:

```dotenv
EVENT_NAME="Aisha & Daniel"
EVENT_DATE="Saturday, 18 October · 6:30 PM"
EVENT_VENUE="The Garden Hall"
HOST_HELP_TEXT="Please see a host at the welcome desk."
```

The UI, metadata, monogram, and help messages use these values without exposing
the Sheets connection settings.

## QR-code launch

After deployment, generate a QR code that points to the production site URL.
Print and test it with both iOS and Android before the event. The app is
responsive down to small phones and does not require installation.

## Data and security notes

- `LockService` serializes check-ins, and the four attendance fields are saved
  together, so double taps and concurrent scans cannot create conflicting
  attendance writes.
- A repeated check-in returns the original attendance state and still shows the
  assigned seat.
- The shared secret protects the Apps Script endpoint and is never sent to the
  browser.
- Because the requested experience includes a browsable roster, anyone with the
  event URL can see guest names and optional group hints. Do not put phone
  numbers, email addresses, private notes, or seat data in those display fields.
- The “Is this you?” dialog is a confirmation step, not identity verification.
  For higher-security events, add an invitation code or one-time guest token.
- Keep the Sheet private, protect the app-managed columns, and rotate the shared
  secret after the event.

## Provider boundary

API routes call a small provider interface:

- `DemoGuestProvider` supplies local preview data.
- `AppsScriptGuestProvider` uses the protected Google Sheet.

Both expose `listGuests()` and `checkIn({ guestId, requestId })`. A database,
CRM, or another spreadsheet system can be added later without changing the
guest UI.
