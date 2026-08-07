# Manage the Guest List

Open the Google Sheet connected to the attendance app.

Use the worksheet tab named `Guests`. If your app was configured with a
different worksheet name, use that tab instead.

## Add a guest

1. Add a new row below the existing guests.
2. Enter the guest's details:
   - `name` — guest's full name
   - `group` — optional family or group description
   - `table` — assigned table
   - `status` — enter `active`
3. Leave these cells blank:
   - `guest_id`
   - `checked_in`
   - `checked_in_at`
   - `check_in_request_id`
   - `checked_in_source`
4. Open **Extensions → Apps Script**.
5. Select `backfillGuestIds` and click **Run**.

The app should now display the new guest.

## Edit a guest

Edit the guest's `name`, `group`, `table`, or `status` directly in the
spreadsheet.

Do not change `guest_id`. The app uses it to identify the correct guest.

## Remove a guest

The safest way to remove a guest from the app is to change their `status` to:

```text
cancelled
```

This hides the guest from the app while keeping their record in the
spreadsheet. You can change it back to `active` later.

## Reset a guest's attendance

Clear these four cells in the guest's row:

- `checked_in`
- `checked_in_at`
- `check_in_request_id`
- `checked_in_source`

Do not clear `guest_id`.

## Important

- Keep the column headings unchanged.
- Give every guest a unique row.
- Do not copy a `guest_id` from another guest.
- Spreadsheet changes appear in the app automatically; Vercel does not need to
  be redeployed.
