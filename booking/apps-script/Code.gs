/* ============================================================
   JHON MEDIA · Booking backend (Google Apps Script web app)

   Runs under your own Google account, so it can read your free/busy
   and create events on your calendar with no API keys, no OAuth
   client and nothing secret living in the GitHub repo.

   Endpoints (once deployed as a web app):
     GET  <WEB_APP_URL>?action=slots          -> open slots, next N days
     GET  <WEB_APP_URL>?action=ping           -> health check
     POST <WEB_APP_URL>  (body: JSON string)  -> book a slot

   Edit CONFIG below, then Deploy > Manage deployments > Edit > New version.
   ============================================================ */

var CONFIG = {
  calendarId: 'primary',          // 'primary' = the calendar of the account that owns this script
  timeZone: 'Asia/Manila',        // your working time zone
  slotMinutes: 30,                // call length
  stepMinutes: 30,                // gap between possible start times
  bufferMinutes: 15,              // free time kept before and after every call
  minNoticeHours: 12,             // nobody can book a slot sooner than this
  daysAhead: 21,                  // how far out people can book
  maxPerDay: 4,                   // cap on booked discovery calls per day
  allDayBlocks: true,             // true = any all-day event on your calendar closes that day

  // Bookable windows per weekday, in CONFIG.timeZone (24h "HH:MM").
  // 0 = Sunday ... 6 = Saturday. Empty array = closed.
  // Default: mornings for AU/UK, evenings PHT = US morning.
  hours: {
    0: [],
    1: [['09:00', '12:00'], ['20:00', '23:00']],
    2: [['09:00', '12:00'], ['20:00', '23:00']],
    3: [['09:00', '12:00'], ['20:00', '23:00']],
    4: [['09:00', '12:00'], ['20:00', '23:00']],
    5: [['09:00', '12:00'], ['20:00', '23:00']],
    6: []
  },

  eventTitle: 'Discovery call · {name}{brand}',
  addMeetLink: true,              // needs the "Google Calendar API" advanced service (see SETUP.md)
  sendConfirmationEmail: true,    // branded email to the client on top of the calendar invite
  ownerEmail: '',                 // optional: extra address to notify; blank = the script owner
  allowedOrigins: []              // informational only; Apps Script cannot enforce CORS
};

var BOOKING_TAG = 'jm-booking';

/* ---------------- HTTP ---------------- */

function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.action === 'ping') return json_({ ok: true, tz: CONFIG.timeZone });
    if (p.action === 'slots' || !p.action) return json_(getSlots_());
    return json_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return json_({ ok: false, error: 'server_error', detail: String(err) });
  }
}

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) body = JSON.parse(e.postData.contents);
    return json_(book_(body));
  } catch (err) {
    return json_({ ok: false, error: 'server_error', detail: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- Availability ---------------- */

function getSlots_() {
  var now = new Date();
  var rangeStart = now;
  var rangeEnd = new Date(now.getTime() + (CONFIG.daysAhead + 1) * 864e5);
  var busy = getBusy_(rangeStart, rangeEnd);
  var slots = computeSlots_(now, busy.blocks, busy.perDay);
  return {
    ok: true,
    timeZone: CONFIG.timeZone,
    slotMinutes: CONFIG.slotMinutes,
    generatedAt: now.toISOString(),
    days: slots
  };
}

// Returns { blocks: [{s,e}] (ms), perDay: {'YYYY-MM-DD': count of bookings made by this widget} }
function getBusy_(start, end) {
  var cal = getCalendar_();
  var events = cal.getEvents(start, end);
  var blocks = [], perDay = {};
  for (var i = 0; i < events.length; i++) {
    var ev = events[i];
    if (ev.isAllDayEvent() && !CONFIG.allDayBlocks) continue;
    var st = ev.getMyStatus && String(ev.getMyStatus());
    if (st === 'NO') continue; // declined invites do not block
    blocks.push({ s: ev.getStartTime().getTime(), e: ev.getEndTime().getTime() });
    if (ev.getTag(BOOKING_TAG)) {
      var key = dayKey_(ev.getStartTime());
      perDay[key] = (perDay[key] || 0) + 1;
    }
  }
  return { blocks: blocks, perDay: perDay };
}

function computeSlots_(now, blocks, perDay) {
  var out = [];
  var earliest = now.getTime() + CONFIG.minNoticeHours * 36e5;
  var slotMs = CONFIG.slotMinutes * 6e4;
  var stepMs = CONFIG.stepMinutes * 6e4;
  var bufMs = CONFIG.bufferMinutes * 6e4;

  for (var d = 0; d <= CONFIG.daysAhead; d++) {
    var dayDate = new Date(now.getTime() + d * 864e5);
    var key = dayKey_(dayDate);
    if (out.length && out[out.length - 1].date === key) continue;
    var weekday = Number(Utilities.formatDate(dayDate, CONFIG.timeZone, 'u')) % 7; // u: 1=Mon..7=Sun
    var windows = CONFIG.hours[weekday] || [];
    var times = [], busyTimes = [];
    var full = (perDay[key] || 0) >= CONFIG.maxPerDay;
    for (var w = 0; w < windows.length; w++) {
      var ws = localToDate_(key, windows[w][0]).getTime();
      var we = localToDate_(key, windows[w][1]).getTime();
      for (var t = ws; t + slotMs <= we; t += stepMs) {
        if (t < earliest) continue;
        var iso = new Date(t).toISOString();
        if (full || overlaps_(t - bufMs, t + slotMs + bufMs, blocks)) busyTimes.push(iso);
        else times.push(iso);
      }
    }
    // slots = bookable. busy = inside working hours but already taken (shown as unavailable, never why).
    out.push({ date: key, weekday: weekday, slots: times, busy: busyTimes, full: full });
  }
  return out;
}

function overlaps_(s, e, blocks) {
  for (var i = 0; i < blocks.length; i++) {
    if (s < blocks[i].e && e > blocks[i].s) return true;
  }
  return false;
}

/* ---------------- Booking ---------------- */

function book_(b) {
  // Honeypot: real people never fill the hidden "website" field.
  if (b.website) return { ok: true, spam: true };

  var name = clean_(b.name, 80);
  var email = clean_(b.email, 120).toLowerCase();
  var brand = clean_(b.brand, 120);
  var link = clean_(b.link, 300);
  var budget = clean_(b.budget, 60);
  var notes = clean_(b.notes, 1500);
  var clientTz = clean_(b.timeZone, 60);
  var start = new Date(b.start);

  if (!name) return { ok: false, error: 'missing_name' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'bad_email' };
  if (isNaN(start.getTime())) return { ok: false, error: 'bad_start' };

  // Simple abuse limit: 3 bookings per email per 24h.
  var cache = CacheService.getScriptCache();
  var rlKey = 'rl:' + email;
  var count = Number(cache.get(rlKey) || 0);
  if (count >= 3) return { ok: false, error: 'rate_limited' };

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return { ok: false, error: 'busy_try_again' };
  try {
    // Re-validate against live calendar so two people can't grab the same slot.
    var slotIso = start.toISOString();
    var fresh = getSlots_();
    var valid = false;
    for (var i = 0; i < fresh.days.length && !valid; i++) {
      if (fresh.days[i].slots.indexOf(slotIso) !== -1) valid = true;
    }
    if (!valid) return { ok: false, error: 'slot_taken', days: fresh.days };

    var end = new Date(start.getTime() + CONFIG.slotMinutes * 6e4);
    var title = CONFIG.eventTitle
      .replace('{name}', name)
      .replace('{brand}', brand ? ' (' + brand + ')' : '');
    var description = [
      'Booked from jhonmedia.com',
      '',
      'Name: ' + name,
      'Email: ' + email,
      brand ? 'Brand: ' + brand : '',
      link ? 'Link: ' + link : '',
      budget ? 'Monthly ad spend: ' + budget : '',
      clientTz ? 'Their time zone: ' + clientTz : '',
      '',
      notes ? 'Notes:\n' + notes : ''
    ].filter(function (l) { return l !== ''; }).join('\n');

    var result = createEvent_(title, description, start, end, email, name);

    cache.put(rlKey, String(count + 1), 21600);

    if (CONFIG.sendConfirmationEmail) {
      try { sendConfirmation_(name, email, start, clientTz, result.meetLink); } catch (mailErr) { /* invite still went out */ }
    }
    if (CONFIG.ownerEmail) {
      try {
        MailApp.sendEmail(CONFIG.ownerEmail, 'New booking: ' + title, description +
          '\n\nWhen: ' + Utilities.formatDate(start, CONFIG.timeZone, "EEE d MMM yyyy, HH:mm '(" + CONFIG.timeZone + ")'"));
      } catch (e2) {}
    }

    return {
      ok: true,
      start: start.toISOString(),
      end: end.toISOString(),
      meetLink: result.meetLink || '',
      eventId: result.id
    };
  } finally {
    lock.releaseLock();
  }
}

function createEvent_(title, description, start, end, email, name) {
  var calId = CONFIG.calendarId;

  // Path A: advanced Calendar service -> Google Meet link + invite emails.
  if (CONFIG.addMeetLink && typeof Calendar !== 'undefined' && Calendar.Events) {
    var resource = {
      summary: title,
      description: description,
      start: { dateTime: start.toISOString(), timeZone: CONFIG.timeZone },
      end: { dateTime: end.toISOString(), timeZone: CONFIG.timeZone },
      attendees: [{ email: email, displayName: name }],
      reminders: { useDefault: false, overrides: [{ method: 'email', minutes: 1440 }, { method: 'popup', minutes: 15 }] },
      conferenceData: { createRequest: { requestId: Utilities.getUuid(), conferenceSolutionKey: { type: 'hangoutsMeet' } } },
      extendedProperties: { private: { source: BOOKING_TAG } }
    };
    var created = Calendar.Events.insert(resource, calId, { conferenceDataVersion: 1, sendUpdates: 'all' });
    // Tag it so the per-day cap can count it.
    try { getCalendar_().getEventById(created.iCalUID).setTag(BOOKING_TAG, '1'); } catch (e) {}
    var meet = created.hangoutLink || '';
    if (!meet && created.conferenceData && created.conferenceData.entryPoints) {
      created.conferenceData.entryPoints.forEach(function (ep) { if (ep.entryPointType === 'video') meet = ep.uri; });
    }
    return { id: created.id, meetLink: meet };
  }

  // Path B: plain CalendarApp (no Meet link, still sends the invite).
  var ev = getCalendar_().createEvent(title, start, end, {
    description: description,
    guests: email,
    sendInvites: true
  });
  ev.setTag(BOOKING_TAG, '1');
  return { id: ev.getId(), meetLink: '' };
}

function sendConfirmation_(name, email, start, clientTz, meetLink) {
  var tz = clientTz || CONFIG.timeZone;
  var when;
  try { when = Utilities.formatDate(start, tz, "EEEE d MMMM, h:mm a '(" + tz + ")'"); }
  catch (e) { tz = CONFIG.timeZone; when = Utilities.formatDate(start, tz, "EEEE d MMMM, h:mm a '(" + tz + ")'"); }
  var first = name.split(' ')[0];
  var lines = [
    'Hey ' + first + ',',
    '',
    "You're booked. " + when + ', ' + CONFIG.slotMinutes + ' minutes.',
    meetLink ? 'Call link: ' + meetLink : 'The calendar invite has the call details.',
    '',
    'To get the most out of it, reply with any of these before we talk:',
    '- the product page',
    '- 2 or 3 ads running right now',
    "- the number you're trying to move (ROAS, CPA, hook rate)",
    '',
    'Need to move it? Reply to this email.',
    '',
    'Jhon',
    'jhonmedia.com'
  ];
  MailApp.sendEmail({
    to: email,
    subject: 'Booked: discovery call with Jhon · ' + when,
    body: lines.join('\n'),
    name: 'Jhon Vin'
  });
}

/* ---------------- Helpers ---------------- */

function getCalendar_() {
  return CONFIG.calendarId === 'primary'
    ? CalendarApp.getDefaultCalendar()
    : CalendarApp.getCalendarById(CONFIG.calendarId);
}

function dayKey_(date) {
  return Utilities.formatDate(date, CONFIG.timeZone, 'yyyy-MM-dd');
}

// "2026-10-14" + "09:00" in CONFIG.timeZone -> Date
function localToDate_(key, hhmm) {
  var probe = new Date(key + 'T12:00:00Z');
  var off = Utilities.formatDate(probe, CONFIG.timeZone, 'XXX'); // e.g. +08:00
  if (off === 'Z') off = '+00:00';
  return new Date(key + 'T' + hhmm + ':00' + off);
}

function clean_(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

/* ---------------- Run these from the editor ---------------- */

// 1) Run once to grant permissions and see your open slots in the log.
function testSlots() {
  var r = getSlots_();
  var open = r.days.filter(function (d) { return d.slots.length; });
  Logger.log('Days with open slots: ' + open.length);
  open.slice(0, 3).forEach(function (d) { Logger.log(d.date + ': ' + d.slots.length + ' slots, first ' + d.slots[0]); });
}

// 2) Optional: books the first open slot with your own email, then you can delete it.
function testBooking() {
  var r = getSlots_();
  var first = null;
  r.days.some(function (d) { if (d.slots.length) { first = d.slots[0]; return true; } return false; });
  if (!first) { Logger.log('No open slots. Check CONFIG.hours.'); return; }
  var me = Session.getActiveUser().getEmail();
  Logger.log(JSON.stringify(book_({ name: 'Test Booking', email: me, brand: 'Test', start: first, notes: 'Delete me' })));
}
