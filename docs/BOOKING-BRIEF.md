# Booking section brief (client spec, verbatim requirements)

Build a live booking system into the portfolio site. Live site: https://gelizonux.github.io/Jhonmedia/

## Context
- One-page static site: plain HTML, CSS and vanilla JS. No build step, no frameworks, no libraries. Keep it that way.
- Read docs/DESIGN.md first. It is the source of truth for tokens, type, motion and copy rules. The whole site is designed like a video editing suite (timecode, REC dot, track lanes, playheads, in/out points). The booking section must feel like part of that edit, not a widget dropped in.
- The backend is already live and connected to Google Calendar. It creates the event, the Google Meet link, the client invite and a confirmation email automatically. Read booking/SETUP.md for the full API contract.
- API URL: https://script.google.com/macros/s/AKfycbyRGxbLtwj8UO1yju8xzUI_bDyhp9J8WPPtgxTnlW1McsQ3qn8nwDiGwp8W5aVnrq9C/exec
- Do NOT touch booking/apps-script/Code.gs.

## Where it goes
1. New section id="book", directly after #contact and before the footer. Label it [09] BOOK in the same slabel format as the other sections, with its own timecode.
2. Repoint every "Book a call" link (nav, menu, hero, footer) to #book.
3. In #contact, add a primary CTA button above the email line: "Book a 30-min call". Email stays as the secondary option.

## Fully automated availability (most important part)
The calendar on the site must always match the real Google Calendar, with zero manual updates.
- The API returns, per day: "slots" (open), "busy" (already taken) and "full" (day hit the daily cap). slots + busy = every time in working hours.
- Draw EVERY time from slots + busy in order. Busy times stay visible but clearly unavailable, labelled "BOOKED", not clickable.
- Days where everything is busy or full show as "FULLY BOOKED". Days with no slots and no busy (weekends, days off) show as "OFF".
- Keep it live:
  - fetch when #book comes near the viewport (IntersectionObserver), with a skeleton while loading
  - re-fetch every 60 seconds while the section is on screen
  - re-fetch when the tab regains focus (visibilitychange)
  - re-fetch right before showing the Book it button
  - add &t=<timestamp> to every GET to beat caching
- If a re-fetch shows the visitor's selected time is now taken, flip it to BOOKED with a short animation, clear the selection, and say "That time just got booked. Pick another." Keep their form data.
- Live indicator in the section header: REC dot + "LIVE · SYNCED 12S AGO", updating every second. If a fetch fails, switch to "OFFLINE · RETRYING" and retry with backoff.

## The flow
4 steps, one screen, no reloads, step indicator at the top styled as timecode: 01 DAY · 02 TIME · 03 DETAILS · 04 BOOKED

Step 1, day: horizontal timeline of the next 21 days, styled like a track lane with clips. Each day is a clip showing weekday, date and "8 OPEN" / "FULLY BOOKED" / "OFF". A white playhead slides to the selected day. Picking a day moves straight to step 2.

Step 2, time: the selected day's times as a grid of clips. Open clips are outlined; BOOKED clips are filled dark gray with diagonal hatching, like a locked clip. Show times in the VISITOR's time zone (Intl.DateTimeFormat().resolvedOptions().timeZone), with "Times in [their zone]" and a small line showing Manila time for the selected slot. Group by the visitor's local date, not the API "date" field. Selecting a time shows IN 09:00 / OUT 09:30 in timecode style, then moves to step 3.

Step 3, details:
- At the top, a locked summary card of their pick: "TUE 14 OCT · 9:00 AM to 9:30 AM (their zone)" plus "30 MIN · GOOGLE MEET". A "Change" link jumps back to step 1 with the selection kept. The client never types the date or time.
- Fields: name (required, first field, autofocus), email (required, hint: "Your invite and Meet link go here"), brand, product or site link, monthly ad spend (select: Under $5k / $5k-$20k / $20k-$50k / $50k+), notes ("What are you running now and what number do you want to move?").
- Hidden honeypot input named "website", off-screen, tabindex -1, autocomplete off.
- Button: "Book it". While submitting, show a short export-style progress bar.

Step 4, booked: REC dot, "BOOKED", their name, date and time in their zone, and the Google Meet link from the API response as a big button ("Open Google Meet") plus a copy button. Under it: "The invite and Meet link are in your inbox. Add it to your calendar from there." If the API returns no meetLink, say "Your Meet link is in the calendar invite." After success, re-fetch so that slot shows BOOKED for everyone.

## API rules
- POST with headers {"Content-Type": "text/plain;charset=utf-8"} and body JSON.stringify(payload). Never application/json.
- Payload: start (exact ISO string from the API), name, email, brand, link, budget, notes, timeZone, website.
- Handle every error: slot_taken (use the "days" in the response to re-render, flip that slot to BOOKED, send them back to step 2, keep form data), rate_limited, bad_email, missing_name, busy_try_again, network failure (offer the email as fallback). Disable the button while submitting.

## Design
- Monochrome only, Helvetica, tabular numbers for all times. Selected states inverted (white bg, black text). Match spacing and type scale from DESIGN.md.
- One big motion per viewport max. Respect prefers-reduced-motion (no sliding playhead, instant state changes).
- Mobile first: works at 360px, tap targets at least 44px, no horizontal page scroll (the day timeline scrolls on its own with snap).
- Keyboard accessible: arrow keys on the day timeline and time grid, visible focus, aria-live for step changes and "just got booked" messages, labelled inputs, BOOKED clips marked aria-disabled.
- Copy rules: no em dashes anywhere, short sentences, no buzzwords.

## Code
- New files: assets/css/booking.css and assets/js/booking.js. API URL in a CONFIG object at the top of booking.js (with refreshSeconds: 60). Wrap init so a failure never breaks the rest of the page.
- Keep booking.js under 20KB unminified.

## When done
- Test the full flow at desktop and 375px. To test the live update, temporarily mark one open slot as busy in the fetched data and confirm it flips to BOOKED. Do not submit a real booking.
- Update README.md with a short "Booking" section.
- Branch booking-ui, PR into main. Never push to main.
- Screenshots of every state (day, time with BOOKED slots, details with the summary card, submitting, booked, slot-just-taken, offline) on desktop and mobile.
