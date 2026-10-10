# Booking backend setup (Google Calendar, no API keys)

The site is static, so anything in the repo is public. That rules out putting a Google API key or OAuth secret in it, and an API key can't write to a calendar anyway. Instead, a Google Apps Script web app runs under your Google account and talks to Calendar for you. The site only ever knows its public URL.

You do **not** need the Cloud Console Credentials page for this.

## Live deployment

Deployed 2026-10-11 from jhonlloydvincent29@gmail.com (bookings land on that calendar).

```
BOOKING_API_URL = https://script.google.com/macros/s/AKfycbyRGxbLtwj8UO1yju8xzUI_bDyhp9J8WPPtgxTnlW1McsQ3qn8nwDiGwp8W5aVnrq9C/exec
```

Verified from an outside origin: `?action=ping`, `?action=slots` and POST validation all respond.

## 1. Create the script (5 minutes)

1. Sign in to the Google account whose calendar should take bookings.
2. Go to https://script.google.com > **New project**. Rename it `Jhonmedia Booking`.
3. Delete the starter code in `Code.gs` and paste in `booking/apps-script/Code.gs` from this repo.
4. Left sidebar > **Services** (+) > **Google Calendar API** > **Add**. This gives you the Google Meet link. Skip it and bookings still work, just without Meet.
5. Project Settings (gear) > set **Time zone** to `(GMT+08:00) Manila`.
6. Edit `CONFIG` at the top if you want different hours, call length or buffers.

## 2. Authorize and test

1. In the function dropdown pick `testSlots` > **Run**.
2. Google asks for permission. Pick your account. You'll see "Google hasn't verified this app": click **Advanced** > **Go to Jhonmedia Booking (unsafe)** > **Allow**. It's flagged only because you wrote it yourself.
3. The log should list days with open slots.
4. Optional: run `testBooking`. It books the first open slot with your own email so you can see the invite, Meet link and confirmation email. Delete the event after.

## 3. Deploy as a web app

1. **Deploy** > **New deployment** > gear > **Web app**.
2. Execute as: **Me**. Who has access: **Anyone**.
3. **Deploy**, then copy the **Web app URL** (ends in `/exec`). That URL is the only thing the site needs.
4. Check it: open `<URL>?action=ping` in a browser. You should see `{"ok":true,...}`.

After any code change: Deploy > Manage deployments > pencil > Version: **New version** > Deploy. The URL stays the same.

## API contract (for the frontend)

`GET <URL>?action=slots`

```json
{ "ok": true, "timeZone": "Asia/Manila", "slotMinutes": 30,
  "days": [ { "date": "2026-10-12", "weekday": 1, "slots": ["2026-10-12T01:00:00.000Z", "..."] } ] }
```

Slots are UTC ISO strings. Render them in the visitor's own time zone (`Intl.DateTimeFormat().resolvedOptions().timeZone`). `date` is the day in Manila time, so group by the visitor's local date when displaying.

`POST <URL>` with the body as a JSON **string** and header `Content-Type: text/plain;charset=utf-8`. Apps Script can't answer CORS preflight requests, and `text/plain` avoids triggering one. Do not send `application/json`.

```json
{ "start": "2026-10-12T01:00:00.000Z", "name": "Ana Cruz", "email": "ana@brand.com",
  "brand": "Brand Co", "link": "https://brand.com", "budget": "$10k-$50k",
  "notes": "Need hooks for a new launch", "timeZone": "America/New_York", "website": "" }
```

`website` is a hidden honeypot field. Leave it empty.

Responses:
- `{ "ok": true, "start", "end", "meetLink", "eventId" }`
- `{ "ok": false, "error": "slot_taken", "days": [...] }` someone grabbed it first. Fresh slots included, refresh the picker.
- other errors: `missing_name`, `bad_email`, `bad_start`, `rate_limited`, `busy_try_again`, `server_error`

What happens on a booking: event on your calendar, Google invite to the client (with Meet link), a short confirmation email from you with prep asks, and the slot disappears for everyone else.
