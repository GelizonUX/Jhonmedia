/* booking.js: live booking (#book). API contract: booking/SETUP.md */
var BOOKING_CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/AKfycbyRGxbLtwj8UO1yju8xzUI_bDyhp9J8WPPtgxTnlW1McsQ3qn8nwDiGwp8W5aVnrq9C/exec',
  refreshSeconds: 60,
  laneDays: 21,
  email: 'jhonlloydvincent29@gmail.com',
  manilaZone: 'Asia/Manila',
  timeoutMs: 15000
};

(function () {
'use strict';
var C = BOOKING_CONFIG, doc = document, win = window;
function $(id) { return doc.getElementById(id); }
function B(id) { return $('bkg-' + id); }
function mk(tag, cls, text) { var e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) tx(e, text); return e; }
function attr(el, n) { return el && el.getAttribute ? el.getAttribute(n) : null; }
function on(el, e, f) { el.addEventListener(e, f); }
function tx(el, t) { el.textContent = t; }
function sa(el, o) { for (var k in o) el.setAttribute(k, o[k]); return el; }
var mqR = win.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
function RM() { return mqR.matches; }

function init() {
  var sec = $('book'), root = $('bkg');
  if (!sec || !root) return;
  var TZ = 'UTC';
  try { TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) {}

  /* Formatting */
  function F(o, z, l) { return new Intl.DateTimeFormat(l || 'en-US', Object.assign({ timeZone: z || TZ }, o)); }
  var fKey = F({ year: 'numeric', month: '2-digit', day: '2-digit' }, 0, 'en-CA');
  var H23 = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
  var WDM = { weekday: 'short', day: 'numeric', month: 'short' };
  var fWd = F({ weekday: 'short' }), fDM = F({ day: 'numeric', month: 'short' }, 0, 'en-GB'), fDL = F(WDM, 0, 'en-GB');
  var fTime = F({ hour: 'numeric', minute: '2-digit' }), f24 = F(H23), fZone = F({ timeZoneName: 'short' });
  var mDate = F(WDM, C.manilaZone, 'en-GB'), m24 = F(H23, C.manilaZone);
  function keyOf(d) { return fKey.format(d); }
  function dayLabel(d, f) { return (f || fDL).format(d).replace(',', '').toUpperCase(); }
  function zoneAbbr(d) { try { return fZone.formatToParts(d).filter(function (p) { return p.type === 'timeZoneName'; })[0].value; } catch (e) { return ''; } }
  function endOf(iso) { return new Date(Date.parse(iso) + slotMin * 6e4); }
  function tNb(d) { return fTime.format(d).replace(/\s(?=[AP]M)/, '\u00a0'); }
  function whenText(iso) { var s = new Date(iso); return dayLabel(s) + ' · ' + tNb(s) + ' to ' + tNb(endOf(iso)) + '\u00a0' + zoneAbbr(s); }
  function manilaText(iso) {
    if (TZ === C.manilaZone) return 'MANILA TIME. SAME AS YOURS.';
    var s = new Date(iso);
    return ('MANILA · ' + dayLabel(s, mDate) + ' · ' + m24.format(s) + ' TO ' + m24.format(endOf(iso))).toUpperCase();
  }

  /* State */
  var slotMin = 30, days = [], byKey = {}, loaded = false, rawDays = [];
  var step = 1, selDay = null, selIso = null, meetUrl = '', taken = {};
  var lastOk = 0, failing = false, fetching = null, retryT = null, backoff = 0, inView = false, started = false;

  /* 21 local days; times grouped by local date */
  function buildDays() {
    var n = new Date(), out = [];
    for (var i = 0; i < C.laneDays; i++) {
      var d = new Date(n.getFullYear(), n.getMonth(), n.getDate() + i, 12);
      out.push({ key: keyOf(d), date: d, times: [], open: 0, busy: 0, full: false });
    }
    return out;
  }
  function applyData(api) {
    var list = buildDays(), map = {};
    list.forEach(function (d) { map[d.key] = d; });
    (api || []).forEach(function (ad) {
      function add(iso, open) {
        var k = keyOf(new Date(iso)), d = map[k];
        if (!d) { if (k < list[list.length - 1].key) return; d = map[k] = { key: k, date: new Date(iso), times: [], open: 0, busy: 0, full: false }; list.push(d); }
        if (taken[iso]) open = false;
        d.times.push({ iso: iso, open: open, t: Date.parse(iso) });
        if (open) d.open++; else d.busy++;
      }
      (ad.slots || []).forEach(function (s) { add(s, true); });
      (ad.busy || []).forEach(function (s) { add(s, false); });
      if (ad.full) {
        var ks = (ad.busy || []).map(function (s) { return keyOf(new Date(s)); });
        if (!ks.length && ad.date) ks.push(keyOf(new Date(ad.date + 'T04:00:00Z')));
        ks.forEach(function (k) { if (map[k]) map[k].full = true; });
      }
    });
    list.sort(function (a, b) { return a.key < b.key ? -1 : 1; });
    list.forEach(function (d) { d.times.sort(function (a, b) { return a.t - b.t; }); });
    days = list; byKey = map; loaded = true;
    checkSelection(); renderDays();
    if (selDay) renderTimes();
  }
  function dayState(d) { return !loaded ? 'load' : d.open ? 'open' : (d.busy || d.full) ? 'full' : 'off'; }
  function isOpen(iso) {
    var d = byKey[selDay];
    return !!(iso && d && d.times.some(function (t) { return t.iso === iso && t.open; }));
  }

  /* Messages */
  var msgEl = B('msg'), annEl = B('announce'), msgT;
  function say(t) { tx(annEl, ''); setTimeout(function () { tx(annEl, t); }, 30); }
  function flash(t) {
    tx(msgEl, t); msgEl.classList.toggle('is-on', !!t); if (t) say(t);
    clearTimeout(msgT); if (t) msgT = setTimeout(function () { flash(''); }, 9000);
  }

  /* Steps */
  var SAY = ['', 'Pick a day.', 'Pick a time.', 'Your details.', 'Booked.'];
  function setStep(n, quiet) {
    step = n;
    [].forEach.call(B('steps').children, function (li) {
      var s = +attr(li, 'data-s');
      li.classList.toggle('is-done', s < n);
      if (s === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    B('pick').hidden = n > 2;
    B('details').hidden = n !== 3;
    B('done').hidden = n !== 4;
    B('times').hidden = !(n <= 2 && selDay);
    if (!quiet) say('Step ' + n + ' of 4. ' + SAY[n]);
  }
  function nearView(el) {
    var r = el.getBoundingClientRect();
    if (r.top > win.innerHeight * 0.75 || r.bottom < 0) win.scrollBy({ top: r.top - win.innerHeight * 0.3, behavior: RM() ? 'auto' : 'smooth' });
  }
  function keepFocus(box, a, fn) {
    var v = attr(doc.activeElement, a); fn();
    var f = v && box.querySelector('[' + a + '="' + v + '"]'); if (f) f.focus({ preventScroll: true });
  }

  /* Step 1: day lane */
  var daysEl = B('days'), scrollEl = B('scroll'), ph = B('ph');
  function dayEl(k) { return k ? daysEl.querySelector('[data-key="' + k + '"]') : null; }
  function renderDays() {
    if (!days.length) days = buildDays();
    var hasSel = !!byKey[selDay], first = 0;
    days.some(function (d, i) { if (dayState(d) === 'open') { first = i; return true; } });
    keepFocus(daysEl, 'data-key', function () {
      tx(daysEl, '');
      days.forEach(function (d, i) {
        var st = dayState(d), on = d.key === selDay, b = mk('button', 'bkg-day is-' + st + (on ? ' is-sel' : ''));
        var wd = fWd.format(d.date).toUpperCase(), dt = fDM.format(d.date).toUpperCase();
        var stx = st === 'open' ? d.open + ' OPEN' : st === 'full' ? 'FULLY BOOKED' : st === 'off' ? 'OFF' : 'LOADING';
        sa(b, { type: 'button', 'data-key': d.key, 'data-cursor': 'link', 'aria-pressed': on });
        b.tabIndex = (on || (!hasSel && i === first)) ? 0 : -1;
        if (st !== 'open') sa(b, { 'aria-disabled': 'true' });
        b.appendChild(mk('span', 'bkg-wd', wd));
        b.appendChild(mk('span', 'bkg-dt', dt));
        var bars = sa(b.appendChild(mk('span', 'bkg-bars')), { 'aria-hidden': 'true' });
        d.times.forEach(function (t) { bars.appendChild(mk('i', t.open ? 'o' : 'x')); });
        b.appendChild(mk('span', 'bkg-st', stx));
        daysEl.appendChild(b);
      });
    });
    movePlayhead(true);
  }
  function movePlayhead(instant) {
    var el = dayEl(selDay);
    ph.classList.toggle('is-idle', !el);
    el = el || daysEl.firstChild; if (!el) return;
    var snap = instant || RM();
    if (snap) { ph.classList.add('no-anim'); void ph.offsetWidth; }
    ph.style.transform = 'translate3d(' + (el.offsetLeft + el.offsetWidth / 2) + 'px,0,0)';
    if (snap) requestAnimationFrame(function () { ph.classList.remove('no-anim'); });
  }
  function laneTo(el) {
    var l = el.offsetLeft, r = l + el.offsetWidth, sl = scrollEl.scrollLeft, w = scrollEl.clientWidth, x = null;
    if (l < sl) x = l; else if (r > sl + w) x = r - w;
    if (x !== null) scrollEl.scrollTo({ left: x, behavior: RM() ? 'auto' : 'smooth' });
  }
  function pickDay(key, kbd) {
    var d = byKey[key];
    if (!d || dayState(d) !== 'open') return;
    if (selDay !== key) { selDay = key; selIso = null; }
    renderDays(); movePlayhead(false);
    laneTo(dayEl(key));
    setStep(2); renderTimes();
    var first = gridEl.querySelector('[tabindex="0"]');
    if (kbd && first) first.focus(); else { B('dayname').focus({ preventScroll: true }); nearView(B('times')); }
  }
  on(daysEl, 'click', function (e) {
    var b = e.target.closest('.bkg-day'); if (b) pickDay(attr(b, 'data-key'), e.detail === 0);
  });

  /* Roving tabindex + arrow keys */
  function rove(box, sel, cols) {
    on(box, 'keydown', function (e) {
      var items = [].slice.call(box.querySelectorAll(sel)), i = items.indexOf(doc.activeElement), c = cols(), k = e.key;
      if (i < 0) return;
      var j = k === 'ArrowRight' ? i + 1 : k === 'ArrowLeft' ? i - 1 : k === 'ArrowDown' ? i + c : k === 'ArrowUp' ? i - c : k === 'Home' ? 0 : k === 'End' ? items.length - 1 : null;
      if (j === null) return;
      e.preventDefault();
      j = Math.max(0, Math.min(items.length - 1, j));
      items.forEach(function (x, n) { x.tabIndex = n === j ? 0 : -1; });
      items[j].focus({ preventScroll: true });
      if (box === daysEl) laneTo(items[j]);
    });
  }
  rove(daysEl, '.bkg-day', function () { return 1; });

  /* Step 2: time grid */
  var gridEl = B('grid');
  rove(gridEl, '.bkg-time', function () { try { return getComputedStyle(gridEl).gridTemplateColumns.split(' ').length; } catch (e) { return 1; } });
  function renderTimes(flipIso) {
    var d = byKey[selDay]; if (!d) return;
    var z = zoneAbbr(d.date);
    tx(B('dayname'), dayLabel(d.date));
    tx(B('zone'), 'Times in ' + TZ.replace(/_/g, ' ') + (z ? ' (' + z + ')' : ''));
    var anySel = d.times.some(function (t) { return t.iso === selIso; }), firstOk = 0;
    d.times.some(function (t, i) { if (t.open) { firstOk = i; return true; } });
    keepFocus(gridEl, 'data-iso', function () {
      tx(gridEl, '');
      d.times.forEach(function (t, i) {
        var on = t.iso === selIso, s = new Date(t.iso);
        var b = mk('button', 'bkg-time ' + (t.open ? 'is-open' : 'is-busy') + (on ? ' is-sel' : '') + (t.iso === flipIso ? ' is-flip' : ''));
        sa(b, { type: 'button', 'data-iso': t.iso, 'data-cursor': 'link', 'aria-pressed': on });
        b.tabIndex = (on || (!anySel && i === firstOk)) ? 0 : -1;
        b.appendChild(mk('span', 'bkg-tt', fTime.format(s)));
        b.appendChild(mk('span', 'bkg-ts', t.open ? 'IN ' + f24.format(s) : 'BOOKED'));
        if (!t.open) sa(b, { 'aria-disabled': 'true' });
        gridEl.appendChild(b);
      });
    });
    var ok = isOpen(selIso);
    tx(B('in'), ok ? f24.format(new Date(selIso)) : '00:00');
    tx(B('out'), ok ? f24.format(endOf(selIso)) : '00:00');
    tx(B('mnl'), ok ? manilaText(selIso) : 'Pick a time.');
    B('next').hidden = !ok;
    B('mon').classList.toggle('is-set', ok);
  }
  var advT;
  on(gridEl, 'click', function (e) {
    var b = e.target.closest('.bkg-time'); if (!b || !b.classList.contains('is-open')) return;
    selIso = attr(b, 'data-iso');
    renderTimes(); say('Picked ' + whenText(selIso) + '.');
    clearTimeout(advT);
    advT = setTimeout(function () { if (step === 2 && selIso) toDetails(); }, RM() ? 250 : 650);
  });
  on(B('next'), 'click', function () { if (selIso) toDetails(); });

  /* Live flip: picked time got taken */
  function checkSelection() {
    if (!selIso || step === 4 || submitting || isOpen(selIso)) return;
    var gone = selIso;
    selIso = null; clearTimeout(advT);
    flash('That time just got booked. Pick another.');
    if (step === 3) { resetSubmit(); setStep(2, true); }
    setTimeout(function () {
      if (!selDay || step > 2) return;
      renderTimes(gone);
      var f = gridEl.querySelector('[data-iso="' + gone + '"]'); if (f) nearView(f);
    }, 0);
  }

  /* Step 3: details */
  var form = B('form'), go = B('go'), check = B('check'), errEl = B('err');
  function toDetails() {
    setStep(3);
    tx(B('card-when'), whenText(selIso));
    tx(B('card-mnl'), manilaText(selIso));
    tx(errEl, ''); go.hidden = true; check.hidden = false;
    B('name').focus(); nearView(B('details'));
    load().then(function () { if (step === 3 && selIso) { check.hidden = true; go.hidden = false; } });
  }
  on(B('change'), 'click', function () {
    setStep(1); renderDays(); renderTimes();
    var el = dayEl(selDay) || daysEl.firstChild;
    if (el) { laneTo(el); el.focus({ preventScroll: true }); }
    nearView(B('pick'));
  });

  on(form, 'input', function (e) { var k = e.target.name; if (k === 'name' || k === 'email') fieldErr(k, ''); });
  function fieldErr(id, t) {
    var inp = $('bkg-' + id);
    $('bkg-' + id + '-err').textContent = t || '';
    if (t) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid');
  }
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, NAME_ERR = 'Add your name.', MAIL_ERR = 'That email doesn\'t look right.';
  var ERR = {
    rate_limited: 'Too many tries. Wait a few minutes, or email ' + C.email + '.',
    busy_try_again: 'The calendar is busy for a second. Try again.',
    server_error: 'Something broke on my side. Try again, or email ' + C.email + '.'
  };
  function showErr(code) {
    if (code !== 'network') { tx(errEl, ERR[code] || ERR.server_error); return; }
    tx(errEl, 'Can\'t reach the calendar. Check your connection and try again. Or email me: ');
    var a = errEl.appendChild(mk('a', 'ulink', C.email));
    a.href = 'mailto:' + C.email + '?subject=' + encodeURIComponent('Booking a call');
    errEl.appendChild(doc.createTextNode('.'));
  }

  /* Export-style progress bar */
  var exp = B('exp'), expT, expV = 0;
  function expSet(v) { expV = v; B('exp-fill').style.transform = 'scaleX(' + v / 100 + ')'; tx(B('exp-pct'), ('00' + Math.round(v)).slice(-3) + '%'); }
  var submitting = false;
  function resetSubmit() { submitting = false; go.disabled = false; go.removeAttribute('aria-busy'); clearInterval(expT); exp.hidden = true; }

  on(form, 'submit', function (e) {
    e.preventDefault();
    if (submitting || !selIso) return;
    function v(n) { return (form.elements[n].value || '').trim(); }
    var name = v('name'), email = v('email'), okMail = EMAIL_RE.test(email);
    fieldErr('name', name ? '' : NAME_ERR);
    fieldErr('email', okMail ? '' : MAIL_ERR);
    tx(errEl, '');
    if (!name || !okMail) { $(name ? 'bkg-email' : 'bkg-name').focus(); return; }
    var payload = {
      start: selIso, name: name, email: email, brand: v('brand'), link: v('link'),
      budget: v('budget'), notes: v('notes'), timeZone: TZ, website: form.elements.website.value || ''
    };
    submitting = true; go.disabled = true; go.setAttribute('aria-busy', 'true');
    exp.hidden = false; expSet(0); clearInterval(expT);
    expT = setInterval(function () { expSet(expV + (92 - expV) * 0.12); }, RM() ? 400 : 90);
    say('Booking. One moment.');
    request(C.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!submitting) return;
      if (res && res.ok) {
        clearInterval(expT); expSet(100);
        return setTimeout(function () { resetSubmit(); done(res, name); }, RM() ? 0 : 350);
      }
      var code = (res && res.error) || 'server_error';
      resetSubmit();
      if (code === 'slot_taken') { taken[payload.start] = 1; if (res.days) { rawDays = res.days; markOk(); } applyData(rawDays); }
      else if (code === 'missing_name') { fieldErr('name', NAME_ERR); B('name').focus(); }
      else if (code === 'bad_email') { fieldErr('email', MAIL_ERR); B('email').focus(); }
      else { showErr(code); go.focus(); }
    }, function () { if (submitting) { resetSubmit(); showErr('network'); go.focus(); } });
  });

  /* Step 4: booked */
  function done(res, name) {
    var link = meetUrl = res.meetLink;
    setStep(4);
    tx(B('done-name'), 'See you there, ' + name.split(' ')[0] + '.');
    tx(B('done-when'), whenText(res.start || selIso));
    B('meet').hidden = !link;
    if (link) B('meet-link').href = link;
    tx(B('done-note'), link ? 'The invite and Meet link are in your inbox. Add it to your calendar from there.' : 'Your Meet link is in the calendar invite.');
    B('done-title').focus({ preventScroll: true }); nearView(B('done'));
    selIso = null;
    load(); // slot shows BOOKED for everyone
  }
  on(B('meet-copy'), 'click', function () {
    var inner = this.querySelector('.btn-in'), url = meetUrl;
    if (!url) return;
    function ok() { tx(inner, 'Copied'); setTimeout(function () { tx(inner, 'Copy link'); }, 1600); }
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(ok); else win.prompt('Copy this link', url);
  });

  /* Network */
  function request(url, o) {
    var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, C.timeoutMs);
    o.signal = ctl.signal; o.cache = 'no-store';
    return fetch(url, o).then(function (r) { clearTimeout(t); return r.json(); });
  }
  function markOk() { lastOk = Date.now(); failing = false; backoff = 0; B('loaderr').hidden = true; tick(); }
  function load() {
    if (fetching) return fetching;
    clearTimeout(retryT); retryT = null;
    fetching = request(C.apiUrl + (C.apiUrl.indexOf('?') < 0 ? '?' : '&') + 'action=slots&t=' + Date.now(), {}).then(function (res) {
      if (!res || !res.ok || !res.days) throw new Error((res && res.error) || 'bad_response');
      if (res.slotMinutes) slotMin = res.slotMinutes;
      Object.keys(taken).forEach(function (iso) { if (res.days.every(function (d) { return (d.slots || []).indexOf(iso) < 0; })) delete taken[iso]; });
      rawDays = res.days; markOk(); applyData(rawDays);
    }).catch(function () {
      failing = true; tick();
      var le = B('loaderr');
      if (!loaded) { le.hidden = false; tx(le, 'Can\'t load times right now. Retrying. Or email ' + C.email + '.'); }
      backoff = Math.min(backoff ? backoff * 2 : 2, 60);
      retryT = setTimeout(function () { retryT = null; if (!doc.hidden) load(); }, backoff * 1000);
    }).then(function () { fetching = null; });
    return fetching;
  }

  /* Live indicator + refresh while on screen */
  var syncEl = B('sync'), liveEl = B('live');
  function tick() {
    var s = Math.max(0, Math.floor((Date.now() - lastOk) / 1000));
    var t = failing ? 'OFFLINE · RETRYING' : !lastOk ? 'CONNECTING' : 'LIVE · SYNCED ' + (s < 60 ? s + 'S' : Math.floor(s / 60) + 'M') + ' AGO';
    if (syncEl.textContent !== t) tx(syncEl, t);
    liveEl.classList.toggle('is-off', failing);
  }
  setInterval(function () {
    tick();
    if (inView && !doc.hidden && lastOk && !failing && !fetching && Date.now() - lastOk >= C.refreshSeconds * 1000) load();
  }, 1000);
  on(doc, 'visibilitychange', function () { if (!doc.hidden && started) load(); });

  /* Boot */
  days = buildDays(); renderDays(); setStep(1, true);
  function start() { if (!started) { started = true; load(); } }
  if ('IntersectionObserver' in win) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { inView = e.isIntersecting; if (inView) start(); }); }, { rootMargin: '600px 0px' }).observe(sec);
  } else { inView = true; start(); }
  on(win, 'resize', function () { movePlayhead(true); });
  B('fallback').hidden = true;
}

function boot() { try { init(); } catch (e) { var s = B('sync'); if (s) tx(s, 'OFFLINE'); if (win.console) console.warn('[jm] booking failed', e); } }
if (doc.readyState === 'loading') on(doc, 'DOMContentLoaded', boot); else boot();
})();
