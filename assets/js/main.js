/* ============================================================
   JHON MEDIA · main.js
   All interactions. Vanilla, no libraries. See docs/DESIGN.md §4.
   Every init is wrapped so one failure never blanks the page.
   ============================================================ */
(function () {
  'use strict';

  var CONFIG = {
    timeZone: 'Asia/Manila', // placeholder — replace (IANA time zone for the nav + footer clock)
    tzLabel: 'PHT',          // placeholder — replace
    email: 'hello@jhonmedia.com'
  };

  var doc = document, root = doc.documentElement, win = window;
  var mqReduced = matchMedia('(prefers-reduced-motion: reduce)');
  var mqFine = matchMedia('(hover: hover) and (pointer: fine)');
  var mqDesk = matchMedia('(min-width: 1024px)');
  var REDUCED = mqReduced.matches;
  var FINE = mqFine.matches;

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pad(n, l) { n = String(n); while (n.length < (l || 2)) n = '0' + n; return n; }
  function safe(name, fn) { try { fn(); } catch (e) { if (win.console) console.warn('[jm] ' + name + ' failed', e); } }
  function on(el, ev, fn, opt) { if (el) el.addEventListener(ev, fn, opt || false); }
  function listen(mq, fn) { if (mq.addEventListener) mq.addEventListener('change', fn); else if (mq.addListener) mq.addListener(fn); }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
  function tc(frames) { // HH:MM:SS:FF @ 24fps
    frames = Math.max(0, Math.floor(frames));
    var ff = frames % 24, s = Math.floor(frames / 24);
    return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60) + ':' + pad(ff);
  }
  function parseTc(str) { var p = str.split(':').map(Number); return ((p[0] * 60 + p[1]) * 60 + p[2]) * 24 + p[3]; }
  function docTop(el) { return el.getBoundingClientRect().top + win.pageYOffset; }

  /* ---------- Shared rAF loop + scroll state (4.4) ---------- */
  var S = { y: win.pageYOffset, smooth: win.pageYOffset, last: win.pageYOffset, vel: 0, vh: win.innerHeight, vw: root.clientWidth };
  var ticks = [];
  var lastT = performance.now();
  function loop(now) {
    var dt = Math.min((now - lastT) / 1000, 0.1); lastT = now;
    S.y = win.pageYOffset;
    S.vel = S.y - S.last; S.last = S.y;
    if (REDUCED) S.smooth = S.y;
    else { S.smooth += (S.y - S.smooth) * 0.1; if (Math.abs(S.y - S.smooth) < 0.1) S.smooth = S.y; }
    for (var i = 0; i < ticks.length; i++) ticks[i](now, dt);
    requestAnimationFrame(loop);
  }
  var measures = [];
  function measureAll() { S.vh = win.innerHeight; S.vw = root.clientWidth; measures.forEach(function (f) { safe('measure', f); }); }

  /* ---------- Live timecodes (4.11) ---------- */
  var heroStart = 0;
  function initTimecodes() {
    var heroEl = $('[data-tc="hero"]');
    var navEl = $('[data-clock="nav"]'), ftEl = $('[data-clock="footer"]');
    var fmt;
    try { fmt = new Intl.DateTimeFormat('en-GB', { timeZone: CONFIG.timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }); }
    catch (e) { fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }); }
    var cacheSec = -1, hms = '00:00:00', lastNav = '', lastFt = '', lastSecTick = -1;
    ticks.push(function (now) {
      var ms = Date.now(), sec = Math.floor(ms / 1000);
      if (REDUCED) { if (sec === lastSecTick) return; lastSecTick = sec; }
      if (sec !== cacheSec) { cacheSec = sec; hms = fmt.format(new Date(ms)).replace(/^24/, '00'); }
      var ff = REDUCED ? '00' : pad(Math.floor((ms % 1000) * 24 / 1000));
      var navTxt = hms + ':' + ff;
      if (navEl && navTxt !== lastNav) { navEl.textContent = navTxt; lastNav = navTxt; }
      var ftTxt = hms.slice(0, 5);
      if (ftEl && ftTxt !== lastFt) { ftEl.textContent = ftTxt; lastFt = ftTxt; }
      if (heroEl && heroStart) heroEl.textContent = REDUCED ? tc(Math.floor((now - heroStart) / 1000) * 24) : tc((now - heroStart) * 24 / 1000);
    });
  }

  /* ---------- Film grain (4.5) ---------- */
  function initGrain() {
    var g = $('.grain'); if (!g) return;
    var c = doc.createElement('canvas'); c.width = c.height = 256;
    var ctx = c.getContext('2d'); if (!ctx) return;
    var img = ctx.createImageData(256, 256), d = img.data;
    for (var i = 0; i < d.length; i += 4) { var v = Math.random() * 255 | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    ctx.putImageData(img, 0, 0);
    g.style.backgroundImage = 'url(' + c.toDataURL('image/png') + ')';
    if (!(win.CSS && CSS.supports && CSS.supports('mix-blend-mode', 'overlay'))) { g.style.mixBlendMode = 'normal'; g.style.opacity = '0.04'; }
  }

  /* ---------- Text roll (nav links, buttons) ---------- */
  function initRoll() {
    $$('[data-roll]').forEach(function (el) {
      var txt = el.textContent.trim();
      var wrap = doc.createElement('span'); wrap.className = 'roll';
      var a = doc.createElement('span'); a.className = 'roll-a'; a.textContent = txt;
      var b = doc.createElement('span'); b.className = 'roll-b'; b.textContent = txt; b.setAttribute('aria-hidden', 'true');
      wrap.appendChild(a); wrap.appendChild(b);
      el.textContent = ''; el.appendChild(wrap);
    });
  }

  /* ---------- Split lines (4.3) ---------- */
  function splitLines(el) {
    if (el.__orig == null) el.__orig = el.innerHTML; else el.innerHTML = el.__orig;
    var tokens = [], space = false;
    (function walk(node, chain) {
      Array.prototype.forEach.call(node.childNodes, function (n) {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { space = true; return; }
            tokens.push({ text: p, chain: chain, space: space }); space = false;
          });
        } else if (n.nodeType === 1) {
          if (n.tagName === 'BR') { tokens.push({ br: true }); space = false; return; }
          walk(n, chain.concat(n));
        }
      });
    })(el, []);
    el.innerHTML = '';
    var nodes = tokens.map(function (t) {
      if (t.br) { var br = doc.createElement('br'); el.appendChild(br); return br; }
      var outer = doc.createElement('span'), inner = outer;
      outer.style.whiteSpace = 'nowrap';
      t.chain.forEach(function (c, i) { var cl = c.cloneNode(false); if (i === 0) { outer.appendChild(cl); } else inner.appendChild(cl); inner = cl; });
      inner.appendChild(doc.createTextNode(t.text));
      if (t.space && el.lastChild) el.appendChild(doc.createTextNode(' '));
      el.appendChild(outer);
      return outer;
    });
    var lines = [], cur = null, top = null;
    tokens.forEach(function (t, i) {
      if (t.br) { cur = null; return; }
      var y = nodes[i].offsetTop;
      if (!cur || Math.abs(y - top) > 3) { cur = []; lines.push(cur); top = y; }
      cur.push(i);
    });
    el.innerHTML = '';
    lines.forEach(function (idxs) {
      var line = doc.createElement('span'); line.className = 'line';
      var li = doc.createElement('span'); li.className = 'line-inner';
      idxs.forEach(function (i, k) {
        var t = tokens[i];
        if (k > 0 && t.space) li.appendChild(doc.createTextNode(' '));
        var o = nodes[i];
        li.appendChild(o.firstChild && o.childNodes.length === 1 && o.firstChild.nodeType === 1 ? o.firstChild : doc.createTextNode(t.text));
      });
      line.appendChild(li); el.appendChild(line);
      el.appendChild(doc.createTextNode(' '));
    });
    el.classList.add('is-split');
    el.__w = el.offsetWidth;
    if (el.__revealed) $$('.line', el).forEach(function (l) { l.classList.add('is-in'); });
    return $$('.line', el);
  }
  function revealLines(el, stagger) {
    el.__revealed = true;
    $$('.line', el).forEach(function (l, i) {
      l.classList.remove('is-out');
      l.querySelector('.line-inner').style.transitionDelay = (i * (stagger || 80)) + 'ms';
      l.classList.add('is-in');
    });
  }
  // swap text with split-line out/in (timeline beats, used generically)
  function swapText(el, text, stagger) {
    if (REDUCED || !el.classList.contains('is-split')) { el.textContent = text; el.__orig = null; if (!REDUCED && el.__splitable) { el.__orig = null; splitLines(el); el.__revealed = true; revealLines(el, stagger); } return; }
    var gen = (el.__gen = (el.__gen || 0) + 1);
    $$('.line', el).forEach(function (l, i) { l.querySelector('.line-inner').style.transitionDelay = (i * (stagger || 60)) + 'ms'; l.classList.remove('is-in'); l.classList.add('is-out'); });
    setTimeout(function () {
      if (gen !== el.__gen) return;
      el.textContent = text; el.__orig = null; el.__revealed = false;
      splitLines(el);
      requestAnimationFrame(function () { requestAnimationFrame(function () { if (gen === el.__gen) revealLines(el, stagger); }); });
    }, 320);
  }

  var revealIO;
  function initReveals() {
    var splits = $$('[data-split]');
    if (REDUCED || !('IntersectionObserver' in win)) {
      splits.forEach(function (el) { el.__revealed = true; });
      $$('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
      if (REDUCED) return;
    }
    splits.forEach(function (el) { splitLines(el); });
    if (!('IntersectionObserver' in win)) { splits.forEach(function (el) { revealLines(el); }); return; }
    revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        revealIO.unobserve(e.target);
        if (e.target.hasAttribute('data-split')) revealLines(e.target);
        else e.target.classList.add('is-in');
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });
    // [data-*-manual] elements are split/hidden here but revealed by their owner (Process entrance)
    splits.concat($$('[data-reveal]')).forEach(function (el) { if (!el.hasAttribute('data-split-manual') && !el.hasAttribute('data-reveal-manual')) revealIO.observe(el); });
    on(win, 'resize', debounce(function () {
      splits.forEach(function (el) { if (el.classList.contains('is-split') && el.offsetWidth !== el.__w) splitLines(el); });
    }, 200));
  }

  /* ---------- Work grid (3.3 + 5) ---------- */
  var work = { list: [], cat: 'all' };
  var CATS = ['UGC', 'Product Demo', 'Talking Head', 'Motion'];
  function slug(s) { return s.toLowerCase().replace(/\s+/g, '-'); }
  function isUnset(url) { return !url || /\/video\/0000/.test(url); }
  function videoId(url) { var m = /\/video\/(\d+)/.exec(url || ''); return m ? m[1] : null; }

  function initWork() {
    var grid = $('#grid'), filters = $('#filters'), empty = $('#work-empty');
    if (!grid) return;
    var cfg = win.WORK_CONFIG || {};
    var data = Array.isArray(win.WORK) ? win.WORK : [];
    var lightbox = cfg.mode === 'lightbox';

    if (!data.length) { empty.hidden = false; if (filters) filters.parentNode.hidden = true; setCount(0, false); return; }

    data.forEach(function (item, i) {
      var num = pad(i + 1);
      var unset = isUnset(item.tiktok);
      var vid = videoId(item.tiktok);
      var asButton = lightbox && !unset && vid;
      var cell = doc.createElement('li'); cell.className = 'cell';
      // Cards without a real video link render as plain tiles, not links
      var card = doc.createElement(asButton ? 'button' : (unset ? 'div' : 'a')); card.className = 'card';
      var a11y = (item.title || '') + ', ' + (item.brand || '') + ', ' + (item.category || '') + '.';
      if (asButton) { card.type = 'button'; card.setAttribute('aria-label', a11y + ' Plays the video.'); card.style.textAlign = 'left'; card.style.width = '100%'; }
      else if (unset) { card.setAttribute('aria-label', a11y + ' Video coming soon.'); }
      else { card.href = item.tiktok; card.target = '_blank'; card.rel = 'noopener'; card.setAttribute('aria-label', a11y + ' Opens TikTok in a new tab.'); }
      card.setAttribute('data-cursor', unset ? 'soon' : 'play');

      var media = doc.createElement('div'); media.className = 'card-media';
      if (item.thumbnail) {
        var img = doc.createElement('img');
        img.alt = ''; img.width = 1080; img.height = 1920; img.decoding = 'async';
        img.loading = i < 4 ? 'eager' : 'lazy';
        if (i < 2) img.setAttribute('fetchpriority', 'high');
        img.onerror = function () { card.classList.add('is-placeholder'); if (img.parentNode) img.parentNode.removeChild(img); img.__done = true; };
        img.onload = function () { img.__done = true; };
        img.src = item.thumbnail;
        media.appendChild(img);
        if (i < 4) work.firstImgs = (work.firstImgs || []).concat(img);
      } else card.classList.add('is-placeholder');

      var ph = el('div', 'ph'); ph.setAttribute('aria-hidden', 'true');
      ph.appendChild(el('span', 'ph-num', num)); ph.appendChild(el('span', 'ph-lbl micro muted', 'THUMBNAIL 9:16'));
      media.appendChild(ph);
      var idx = el('span', 'card-tag card-idx label', num); idx.setAttribute('aria-hidden', 'true'); media.appendChild(idx);
      var rat = el('span', 'card-tag card-ratio label', '9:16'); rat.setAttribute('aria-hidden', 'true'); media.appendChild(rat);

      var meta = el('div', 'card-meta'); meta.setAttribute('aria-hidden', 'true');
      meta.appendChild(el('span', 'label muted', item.brand || ''));
      meta.appendChild(el('span', 'card-format label', [item.category, item.format].filter(Boolean).join(' · ')));
      if (item.metric) {
        var mw = el('span', 'card-mwrap');
        mw.appendChild(el('span', 'card-metric h1', item.metric));
        meta.appendChild(mw);
        meta.appendChild(el('span', 'card-rlabel micro muted', 'RESULT'));
      }
      media.appendChild(meta);
      var phd = el('span', 'card-playhead'); phd.setAttribute('aria-hidden', 'true'); media.appendChild(phd);

      card.appendChild(media);
      card.appendChild(el('span', 'card-title', item.title || ''));
      card.appendChild(el('span', 'card-sub label', [item.brand, item.category].filter(Boolean).join(' · ')));
      cell.appendChild(card);
      cell.setAttribute('data-cat', item.category || '');
      grid.appendChild(cell);
      work.list.push({ item: item, cell: cell, card: card, vid: vid });
      if (asButton) on(card, 'click', function () { openLightbox(work.list.indexOf(work.list.filter(function (w) { return w.card === card; })[0])); });
    });

    // Filters
    var counts = { all: data.length };
    data.forEach(function (d) { counts[d.category] = (counts[d.category] || 0) + 1; });
    var line = el('span', 'filter-line'); line.setAttribute('aria-hidden', 'true');
    var btns = [];
    ['all'].concat(CATS).forEach(function (c) {
      var n = counts[c] || 0; if (!n) return;
      var b = doc.createElement('button'); b.type = 'button';
      b.textContent = (c === 'all' ? 'All' : c) + ' (' + pad(n) + ')';
      b.setAttribute('aria-pressed', c === 'all' ? 'true' : 'false');
      b.setAttribute('data-cat', c); b.setAttribute('data-cursor', 'link');
      on(b, 'click', function () { applyFilter(c, true); });
      filters.appendChild(b); btns.push(b);
    });
    filters.appendChild(line);
    function moveLine() {
      var act = btns.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })[0];
      if (act) line.style.transform = 'translateX(' + act.offsetLeft + 'px) scaleX(' + act.offsetWidth + ')';
    }
    measures.push(moveLine);
    work.moveLine = moveLine; work.btns = btns;

    // Hover dimming
    on(grid, 'pointerover', function (e) { if (e.pointerType === 'mouse' && e.target.closest('.card')) grid.classList.add('is-hovering'); });
    on(grid, 'pointerout', function (e) { if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('.card')) grid.classList.remove('is-hovering'); });

    layoutCells();
    setCount(data.length, false);
    moveLine();

    // Hash deep link: #work/ugc
    var m = /^#work\/(.+)$/.exec(location.hash);
    if (m) {
      var match = CATS.filter(function (c) { return slug(c) === m[1]; })[0];
      if (match && counts[match]) {
        applyFilter(match, false);
        setTimeout(function () { var w = $('#work'); if (w) win.scrollTo(0, docTop(w) - 40); }, 50);
      }
    }
  }
  function el(tag, cls, text) { var e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function visibleItems() { return work.list.filter(function (w) { return !w.cell.hidden; }); }
  function layoutCells() {
    visibleItems().forEach(function (w, i) { w.cell.setAttribute('data-m2', i % 2); w.cell.setAttribute('data-m3', i % 3); w.cell.setAttribute('data-m4', i % 4); });
  }
  function setCount(n, roll) {
    var c = $('#work-count'); if (!c) return;
    c.textContent = '';
    ('(' + pad(n) + ')').split('').forEach(function (ch) { c.appendChild(el('span', 'dig', ch)); });
    if (roll && !REDUCED) { c.classList.remove('is-roll'); void c.offsetWidth; c.classList.add('is-roll'); }
  }
  function applyFilter(cat, animate) {
    if (cat === work.cat) return;
    work.cat = cat;
    work.btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-cat') === cat ? 'true' : 'false'); });
    work.moveLine();
    var match = function (w) { return cat === 'all' || w.item.category === cat; };
    var leaving = visibleItems().filter(function (w) { return !match(w); });
    var swap = function () {
      work.list.forEach(function (w) { w.card.classList.remove('is-leave'); w.cell.hidden = !match(w); });
      layoutCells();
      var incoming = visibleItems();
      setCount(incoming.length, true);
      if (animate && !REDUCED) {
        incoming.forEach(function (w) { w.card.classList.add('is-enter'); });
        void $('#grid').offsetWidth;
        incoming.forEach(function (w, i) {
          w.card.style.transition = 'opacity var(--d-3) var(--ease-out) ' + (i * 60) + 'ms, transform var(--d-3) var(--ease-out) ' + (i * 60) + 'ms';
          w.card.classList.remove('is-enter');
          setTimeout(function () { w.card.style.transition = ''; }, 700 + i * 60);
        });
      }
      measureAll();
    };
    if (animate && !REDUCED && leaving.length) { leaving.forEach(function (w) { w.card.classList.add('is-leave'); }); setTimeout(swap, 250); }
    else swap();
    if (animate) { try { history.replaceState(null, '', cat === 'all' ? '#work' : '#work/' + slug(cat)); } catch (e) { /* file:// */ } }
  }

  /* ---------- Lightbox (option B) ---------- */
  var lb = { idx: -1, ret: null };
  function lbList() { return visibleItems().filter(function (w) { return w.card.tagName === 'BUTTON'; }); }
  function openLightbox(i) {
    var box = $('#lightbox'); if (!box) return;
    var w = work.list[i]; if (!w) return;
    var list = lbList(); lb.idx = list.indexOf(w); lb.ret = lb.ret || w.card;
    var frame = $('#lb-frame'); frame.innerHTML = '';
    var ifr = doc.createElement('iframe');
    ifr.src = 'https://www.tiktok.com/embed/v2/' + w.vid; ifr.title = (w.item.title || 'Video') + ' on TikTok';
    ifr.allow = 'autoplay; encrypted-media; fullscreen';
    frame.appendChild(ifr);
    $('#lb-brand').textContent = w.item.brand || '';
    $('#lb-title').textContent = w.item.title || '';
    $('#lb-format').textContent = [w.item.category, w.item.format].filter(Boolean).join(' · ');
    $('#lb-metric').textContent = w.item.metric || '';
    var link = $('#lb-link'); link.href = w.item.tiktok; link.setAttribute('aria-label', 'Open on TikTok (opens in a new tab)');
    if (box.hidden) {
      box.hidden = false; root.style.overflow = 'hidden';
      requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.add('is-open'); }); });
      $('#lb-close').focus();
    }
  }
  function closeLightbox() {
    var box = $('#lightbox'); if (!box || box.hidden) return;
    box.classList.remove('is-open'); root.style.overflow = '';
    setTimeout(function () { box.hidden = true; $('#lb-frame').innerHTML = ''; }, 300);
    if (lb.ret) lb.ret.focus(); lb.ret = null;
  }
  function stepLightbox(d) {
    var list = lbList(); if (!list.length) return;
    var next = list[(lb.idx + d + list.length) % list.length];
    openLightbox(work.list.indexOf(next));
  }
  function initLightbox() {
    var box = $('#lightbox'); if (!box) return;
    on($('#lb-close'), 'click', closeLightbox);
    on(box, 'click', function (e) { if (e.target === box || e.target.classList.contains('lb-inner')) closeLightbox(); });
    on(doc, 'keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') stepLightbox(1);
      else if (e.key === 'ArrowLeft') stepLightbox(-1);
      else if (e.key === 'Tab') trap(e, box);
    });
    var sx = null;
    on(box, 'touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    on(box, 'touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) stepLightbox(dx < 0 ? 1 : -1); sx = null; });
  }
  function trap(e, container) {
    var f = $$('a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])', container).filter(function (x) { return x.offsetParent !== null || x.tagName === 'IFRAME'; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- Preloader + page-load sequence (3.0, 4.10) ---------- */
  function finishLoad() {
    root.classList.add('is-ready');
    heroStart = performance.now();
    var hero = $('.hero'); if (hero) hero.classList.add('is-in');
  }
  function clearBusy() { var m = $('#main'); if (m) m.setAttribute('aria-busy', 'false'); }
  // Preloader v3: export panel + NLE timeline loader. Plays on every load.
  var PL = {
    lines: ['Let me edit your video.', 'Cutting the boring parts.', 'Your hook called. It wants a rewrite.', 'Hire me, dawg.'],
    lineAt: [0, 420, 900, 1500],       // hard cuts; the last line lands before EXPORT COMPLETE (≥ 1800ms)
    logAt: [0, 16, 34, 52, 70, 88],    // progress % that activates log line i
    status: 'EXPORT COMPLETE · LET’S CUT YOUR NEXT WINNER',
    frames: 720, fps: 30,
    easeTo: 90, easeDur: 1600,         // 0 → 90 cubic-out
    minT: 1800, maxT: 2200,            // finish window (navigation clock)
    skipAfter: 800, runDur: 180,       // run to 100, quad-out
    hold: 500,                         // playhead snaps to the end, the "cut" flashes, hold
    fade: 300,                         // panel content fades to black (.is-fade)
    out: 160,                          // black drops, hero enters (.is-out)
    // Timeline (fractions of the ruler). Precomputed once; rAF only toggles classes + one transform.
    v1: [[0, .14], [.14, .30], [.30, .47], [.47, .62], [.62, .80], [.80, 1]],
    a1: [[0, .30], [.30, .62], [.62, 1]],
    t1: [[.03, .12], [.16, .25], [.32, .41], [.49, .58], [.64, .74], [.83, .94]],
    remFrom: 8, watchdog: 4500
  };
  function f30(ms) { // MM:SS:FF @ 30fps
    var fr = Math.max(0, Math.floor(ms * PL.fps / 1000)), s = Math.floor(fr / PL.fps);
    return pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60) + ':' + pad(fr % PL.fps);
  }
  function hash(n) { var x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); }
  function initPreloader() {
    var pl = $('#preloader');
    if (!pl) { root.classList.add('pl-skip'); clearBusy(); finishLoad(); return; }
    var heroFired = false, wd;
    function hero() { if (!heroFired) { heroFired = true; finishLoad(); } }
    function done() { pl.classList.add('is-done'); clearBusy(); clearTimeout(wd); }
    wd = setTimeout(function () { hero(); done(); }, PL.watchdog); // armed before anything can throw

    var count = $('#pl-count'), file = $('#pl-file'), status = $('#pl-status'), mbps = $('#pl-mbps');
    var frameEl = $('#pl-frame'), elEl = $('#pl-el'), remEl = $('#pl-rem'), log = $('#pl-log'), lis = $$('li', log), ph = $('#plt-ph');
    var rows = matchMedia('(min-width: 768px)').matches ? 3 : 1;
    function W(el, v) { if (el && el.__v !== v) { el.__v = v; el.textContent = v; } }
    function setLog(cur) {
      lis.forEach(function (li, j) { li.classList.toggle('is-past', j < cur); li.classList.toggle('is-cur', j === cur); });
      log.style.setProperty('--shift', Math.max(0, cur - (rows - 1)));
    }
    // Build the timeline once: clips (start fraction, element), razor marks at V1 joins
    var clips = [], rnd = mulberry32(5);
    function lay(laneId, list, bars) {
      var lane = $(laneId); if (!lane) return;
      list.forEach(function (c) {
        var e = doc.createElement('i');
        e.style.left = (c[0] * 100) + '%'; e.style.width = ((c[1] - c[0]) * 100) + '%';
        if (bars) for (var k = Math.max(4, Math.round((c[1] - c[0]) * 90)); k > 0; k--) { var bb = doc.createElement('b'); bb.style.height = Math.round(18 + rnd() * 78) + '%'; e.appendChild(bb); }
        lane.appendChild(e); clips.push({ at: c[0] * 100, el: e });
      });
    }
    lay('#plt-v1', PL.v1); lay('#plt-a1', PL.a1, true); lay('#plt-t1', PL.t1);
    var cutsHost = $('#plt-cuts');
    PL.v1.slice(1).forEach(function (c) { var e = doc.createElement('i'); e.style.left = (c[0] * 100) + '%'; if (cutsHost) cutsHost.appendChild(e); clips.push({ at: c[0] * 100 + 1, el: e }); });
    function timelineAt(p) {
      for (var q = 0; q < clips.length; q++) { var cl = clips[q], onn = p >= cl.at; if (cl.el.__on !== onn) { cl.el.__on = onn; cl.el.classList.toggle('is-on', onn); } }
      if (ph) ph.style.transform = 'translate3d(' + clamp(p, 0, 100).toFixed(2) + '%,0,0)';
    }
    function complete() {
      W(count, '100'); count.classList.add('is-cut'); W(frameEl, '0720'); W(remEl, '00:00:00'); W(mbps, '12.4');
      W(status, rows === 1 ? 'EXPORT COMPLETE' : PL.status); W(file, PL.lines[3]); timelineAt(100);
      pl.classList.add('is-complete'); setLog(lis.length - 1);
    }
    function exit() { // never panel + hero together: fade panel to black, then drop the black and start the hero
      pl.classList.add('is-fade');
      setTimeout(function () { hero(); pl.classList.add('is-out'); setTimeout(done, PL.out); }, PL.fade);
    }

    if (REDUCED) {
      complete(); W(elEl, '00:00:00');
      setTimeout(function () { pl.classList.add('is-out'); hero(); setTimeout(done, PL.out); }, 300);
      return;
    }

    var ready = false, skip = false, waits = [];
    if (doc.fonts && doc.fonts.ready) waits.push(doc.fonts.ready);
    (work.firstImgs || []).forEach(function (img) {
      waits.push(new Promise(function (res) { if (img.__done || img.complete) return res(); img.addEventListener('load', res); img.addEventListener('error', res); }));
    });
    Promise.all(waits).then(function () { ready = true; }, function () { ready = true; });
    var start = performance.now(), fin = null, finFrom = 0, lineI = 0, cur = 0, remShown = null;
    var EV = ['wheel', 'touchmove', 'keydown', 'pointerdown'];
    var skipper = function () { if (performance.now() - start >= PL.skipAfter) skip = true; };
    EV.forEach(function (ev) { on(win, ev, skipper, { passive: true }); });

    (function step(now) {
      try {
        var t = now - start, p;
        var li = 0; for (var n = 0; n < PL.lineAt.length; n++) if (t >= PL.lineAt[n]) li = n;
        if (li !== lineI) { lineI = li; W(file, PL.lines[li]); }
        if (fin === null) {
          // Progress and the finish window run on the navigation clock, so a late-booting main.js
          // doesn't replay the whole run on top of the wait; the headline lines and log stay on the local clock.
          var tn = Math.max(now, t);
          p = PL.easeTo * (1 - Math.pow(1 - Math.min(tn / PL.easeDur, 1), 3));
          if ((((ready && tn >= PL.minT) || tn >= PL.maxT) && t >= 600) || (skip && t >= PL.skipAfter)) { fin = now; finFrom = p; }
        } else {
          var k = Math.min((now - fin) / PL.runDur, 1);
          p = finFrom + (100 - finFrom) * (1 - (1 - k) * (1 - k));
        }
        W(count, pad(Math.round(p), 3));
        W(frameEl, pad(Math.round(p / 100 * PL.frames), 4));
        W(elEl, f30(t));
        W(mbps, (12.4 + .45 * Math.sin(t * .009) + .3 * (hash(Math.floor(t / 120)) - .5)).toFixed(1));
        if (p < PL.remFrom) W(remEl, '--:--:--');
        else { var est = t * (100 - p) / p; remShown = remShown === null ? est : remShown + (est - remShown) * .15; W(remEl, f30(remShown)); }
        var c = 0; for (var q = 0; q < PL.logAt.length; q++) if (p >= PL.logAt[q]) c = q;
        if (c !== cur) { cur = c; setLog(c); }
        timelineAt(p);
        if (p >= 100) {
          EV.forEach(function (ev) { win.removeEventListener(ev, skipper); });
          complete();
          setTimeout(exit, PL.hold);
          return;
        }
        requestAnimationFrame(step);
      } catch (e) { hero(); done(); }
    })(start);
  }

  /* ---------- Custom cursor (4.1) ---------- */
  function initCursor() {
    var c = $('.cursor'); if (!c) return;
    var dot = $('.cursor-dot', c), ring = $('.cursor-ring', c), label = $('.cursor-label', c);
    var x = -200, y = -200, rx = x, ry = y, seen = false, state = '';
    var LABELS = { play: 'PLAY', soon: 'SOON', view: 'VIEW', drag: 'DRAG' };
    function setOn() { if (FINE) root.classList.add('has-cursor'); else root.classList.remove('has-cursor'); }
    setOn(); listen(mqFine, function (e) { FINE = e.matches; setOn(); });
    c.classList.add('is-hidden');
    on(doc, 'pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      if (!seen) { seen = true; rx = x; ry = y; c.classList.remove('is-hidden'); }
    }, { passive: true });
    on(doc, 'pointerover', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-cursor]') : null;
      var s = t ? t.getAttribute('data-cursor') : '';
      if (s === state) return; state = s;
      c.setAttribute('data-state', s === 'soon' ? 'play' : s);
      if (LABELS[s]) label.textContent = LABELS[s];
    });
    on(doc, 'mouseout', function (e) { if (!e.relatedTarget) { c.classList.add('is-hidden'); seen = false; } });
    ticks.push(function () {
      if (!FINE || !seen) return;
      rx += (x - rx) * 0.15; ry += (y - ry) * 0.15;
      dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      ring.style.transform = 'translate3d(' + rx.toFixed(2) + 'px,' + ry.toFixed(2) + 'px,0)';
    });
  }

  /* ---------- Magnetic buttons (4.2) ---------- */
  function initMagnetic() {
    $$('[data-magnetic]').forEach(function (m) {
      var inner = m.querySelector('.btn-in, .roll');
      on(m, 'pointermove', function (e) {
        if (!FINE || REDUCED || e.pointerType !== 'mouse') return;
        var r = m.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        m.classList.remove('is-mag-out');
        m.style.transform = 'translate3d(' + clamp(dx * 0.3, -16, 16) + 'px,' + clamp(dy * 0.3, -16, 16) + 'px,0)';
        if (inner) inner.style.transform = 'translate3d(' + clamp(dx * 0.15, -8, 8) + 'px,' + clamp(dy * 0.15, -8, 8) + 'px,0)';
      });
      on(m, 'pointerleave', function () {
        m.classList.add('is-mag-out'); m.style.transform = ''; if (inner) inner.style.transform = '';
      });
    });
  }

  /* ---------- Nav (3.1) ---------- */
  function initNav() {
    var nav = $('#nav'), btn = $('#menu-btn'), menu = $('#menu'), close = $('#menu-close');
    var menuOpen = false;
    ticks.push(function () {
      if (!nav) return;
      var hide = !menuOpen && S.y > 120 && S.vel > 2;
      var show = menuOpen || S.y <= 120 || S.vel < -2;
      if (hide) nav.classList.add('is-hidden'); else if (show) nav.classList.remove('is-hidden');
    });
    // active section underline
    var links = $$('[data-nav]');
    if ('IntersectionObserver' in win && links.length) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('data-nav') === e.target.id); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      ['work', 'services', 'process', 'faq', 'top', 'results', 'anatomy', 'clients', 'contact'].forEach(function (id) { var s = doc.getElementById(id); if (s) io.observe(s); });
    }
    if (!btn || !menu) return;
    function open() {
      menuOpen = true; menu.hidden = false; root.classList.add('menu-open'); btn.setAttribute('aria-expanded', 'true'); root.style.overflow = 'hidden';
      requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add('is-open'); }); });
      close.focus();
    }
    function shut(noFocus) {
      menuOpen = false; root.classList.remove('menu-open'); menu.classList.remove('is-open'); menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); root.style.overflow = '';
      if (!noFocus) btn.focus();
    }
    on(btn, 'click', open); on(close, 'click', function () { shut(); });
    $$('a', menu).forEach(function (a) { on(a, 'click', function () { shut(true); }); });
    on(doc, 'keydown', function (e) {
      if (!menuOpen) return;
      if (e.key === 'Escape') shut(); else if (e.key === 'Tab') trap(e, menu);
    });
    listen(mqDesk, function (e) { if (e.matches && menuOpen) shut(true); });
  }

  /* ---------- Marquees (4.8) ---------- */
  var marquees = [], boost = 1, scrollDir = 1;
  function buildMarquee(m) {
    $$('.mq-group[aria-hidden]', m.track).forEach(function (g) { g.parentNode.removeChild(g); });
    m.w = m.group.offsetWidth || 1;
    var n = Math.max(2, Math.ceil((S.vw * 2) / m.w) + 1);
    for (var i = 1; i < n; i++) { var c = m.group.cloneNode(true); c.setAttribute('aria-hidden', 'true'); m.track.appendChild(c); }
    m.x = m.x % m.w;
    m.track.style.transform = 'translate3d(' + (REDUCED ? 0 : m.x) + 'px,0,0)';
  }
  function initMarquees() {
    $$('[data-marquee]').forEach(function (node) {
      var m = { node: node, track: $('.mq-track', node), group: $('.mq-group', node), x: 0, w: 1,
        dir: Number(node.getAttribute('data-direction')) || 1, dur: Number(node.getAttribute('data-speed')) || 40,
        flip: node.hasAttribute('data-velocity-flip'), hoverMode: node.getAttribute('data-hover'), hover: false, rate: 1, vis: true };
      buildMarquee(m);
      on(node, 'mouseenter', function () { m.hover = true; }); on(node, 'mouseleave', function () { m.hover = false; });
      if ('IntersectionObserver' in win) new IntersectionObserver(function (es) { m.vis = es[0].isIntersecting; }).observe(node);
      marquees.push(m);
    });
    var lastVw = S.vw;
    measures.push(function () { if (S.vw !== lastVw) { lastVw = S.vw; marquees.forEach(buildMarquee); } });
    ticks.push(function (now, dt) {
      if (REDUCED) return;
      var target = 1 + Math.min(Math.abs(S.vel) * 0.04, 1.5);
      boost += (target - boost) * (target > boost ? 0.3 : 0.05);
      if (S.vel > 1) scrollDir = 1; else if (S.vel < -1) scrollDir = -1;
      for (var i = 0; i < marquees.length; i++) {
        var m = marquees[i]; if (!m.vis) continue;
        var want = m.hover ? (m.hoverMode === 'pause' ? 0 : 0.25) : 1;
        m.rate += (want - m.rate) * 0.08;
        var d = m.dir * (m.flip ? scrollDir : 1);
        m.x -= (m.w / m.dur) * dt * boost * m.rate * d;
        if (m.x <= -m.w) m.x += m.w; else if (m.x > 0) m.x -= m.w;
        m.track.style.transform = 'translate3d(' + m.x.toFixed(2) + 'px,0,0)';
      }
    });
  }

  /* ---------- Parallax [data-speed] (4.4) ---------- */
  function initParallax() {
    var els = $$('[data-speed]:not([data-marquee])'); var last = -1;
    ticks.push(function () {
      if (REDUCED) { if (last !== 0) { els.forEach(function (e) { e.style.transform = ''; }); last = 0; } return; }
      if (S.smooth > S.vh * 1.5 || Math.abs(S.smooth - last) < 0.05) return;
      last = S.smooth;
      els.forEach(function (e) { var sp = Number(e.getAttribute('data-speed')) || 1; e.style.transform = sp === 1 ? '' : 'translate3d(0,' + (S.smooth * (1 - sp)).toFixed(2) + 'px,0)'; });
    });
  }

  /* ---------- Hero headline fit guard: never clip a line ---------- */
  function initHeroFit() {
    var h = $('.hero-title'); if (!h) return;
    var lines = $$('.hline', h);
    var fit = function () {
      h.style.fontSize = '';
      var cur = parseFloat(getComputedStyle(h).fontSize), ratio = 1;
      lines.forEach(function (l) {
        var ws = $$('.hw', l); if (!ws.length) return;
        var tw = ws[ws.length - 1].getBoundingClientRect().right - ws[0].getBoundingClientRect().left;
        var avail = l.clientWidth - parseFloat(getComputedStyle(l).paddingLeft);
        if (tw > 0) ratio = Math.min(ratio, avail / tw);
      });
      if (ratio < 1) h.style.fontSize = (cur * ratio * 0.985).toFixed(2) + 'px';
    };
    fit(); measures.unshift(fit);
  }

  /* ---------- Counters (3.4, 4.9) ---------- */
  function countUp(node, to, dur, dec, cb) {
    var s = performance.now();
    (function f(now) {
      var k = Math.min((now - s) / dur, 1), e = k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
      node.textContent = (to * e).toFixed(dec);
      if (k < 1) requestAnimationFrame(f); else { node.textContent = to.toFixed(dec); if (cb) cb(); }
    })(s);
  }
  function initCounters() {
    var box = $('#stats'); if (!box) return;
    var vals = $$('[data-count]', box);
    if (REDUCED || !('IntersectionObserver' in win)) { box.classList.add('is-in'); return; }
    vals.forEach(function (v) {
      v.style.display = 'inline-block'; v.style.minWidth = v.textContent.length + 'ch';
      v.textContent = '0'; var suf = v.nextElementSibling; if (suf) suf.classList.add('is-hide');
    });
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; io.disconnect();
      box.classList.add('is-in');
      vals.forEach(function (v) {
        var dec = Number(v.getAttribute('data-decimals')) || 0;
        countUp(v, Number(v.getAttribute('data-count')), 1400, dec, function () { var suf = v.nextElementSibling; if (suf) suf.classList.remove('is-hide'); });
      });
    }, { threshold: 0.4 });
    io.observe(box);
  }

  /* ---------- Section label timecodes tick (4.12) ---------- */
  function initLabelTc() {
    if (REDUCED || !('IntersectionObserver' in win)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; io.unobserve(e.target);
        var n = e.target, a = n.getAttribute('data-in'), b = n.getAttribute('data-out');
        var fa = parseTc(a), fb = parseTc(b), s = performance.now();
        (function f(now) {
          var k = Math.min((now - s) / 600, 1), ease = 1 - Math.pow(1 - k, 3);
          n.textContent = 'TC ' + a + ' → ' + tc(fa + (fb - fa) * ease);
          if (k < 1) requestAnimationFrame(f);
        })(s);
      });
    }, { threshold: 0.5 });
    $$('.slabel-tc[data-in]').forEach(function (n) { io.observe(n); });
  }

  /* ---------- Edit timeline: lives in anatomy.js (docs/TIMELINE-V2.md) ---------- */
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------- Process v2: selected layer (docs/PROCESS-V2.md §7) ---------- */
  function initProcess() {
    var sec = $('#process'), wrap = $('#pr-wrap'), row = $('#pr-row'), sel = $('#pr-sel');
    if (!sec || !wrap || !row || !sel) return;
    var panels = $$('.pr-panel', row), N = panels.length;
    var manualEls = $$('[data-split-manual], [data-reveal-manual]', row);
    function revealAll() { manualEls.forEach(function (el) { if (el.hasAttribute('data-split')) { el.__revealed = true; $$('.line', el).forEach(function (l) { l.classList.add('is-in'); }); } else el.classList.add('is-in'); }); }
    if (REDUCED) { sec.classList.add('is-static'); revealAll(); return; }

    // Slot strips: keep the leading 0 as text, roll the last digit 0 → n
    var strips = panels.map(function (p) {
      var num = $('.pr-num', p), txt = num.textContent.trim(), n = parseInt(txt.slice(-1), 10) || 0;
      num.textContent = txt.slice(0, -1);
      var slot = doc.createElement('span'); slot.className = 'slot';
      var strip = doc.createElement('span'); strip.className = 'strip';
      for (var d = 0; d <= n; d++) { var sp = doc.createElement('span'); sp.textContent = d; strip.appendChild(sp); }
      slot.appendChild(strip); num.appendChild(slot);
      return { el: strip, n: n };
    });

    // Entrance: once per panel
    function enter(i, k) {
      var p = panels[i]; if (p.__in) return; p.__in = true;
      var st = strips[i];
      st.el.style.transition = 'transform 900ms var(--ease-out) ' + (k * 90) + 'ms';
      st.el.style.transform = 'translateY(' + (-st.n) + 'em)';
      var h = $('h3', p);
      setTimeout(function () { if (h.classList.contains('is-split')) revealLines(h, 80); else h.__revealed = true; }, 200 + k * 90);
      $$('[data-reveal-manual]', p).forEach(function (el) { setTimeout(function () { el.classList.add('is-in'); }, 320 + k * 90); });
    }
    if ('IntersectionObserver' in win) {
      if (mqDesk.matches) {
        var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); panels.forEach(function (p, i) { enter(i, i); }); } }, { threshold: 0.25 });
        io.observe(row);
      } else {
        var io2 = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io2.unobserve(e.target); enter(panels.indexOf(e.target), 0); } }); }, { threshold: 0.4 });
        panels.forEach(function (p) { io2.observe(p); });
      }
    } else panels.forEach(function (p, i) { enter(i, 0); });

    // Box parts
    var E = { t: $('.sel-et', sel), r: $('.sel-er', sel), b: $('.sel-eb', sel), l: $('.sel-el', sel) };
    var H = {}; $$('.sel-h', sel).forEach(function (h) { H[h.getAttribute('data-h')] = h; });
    var A = $('.sel-a', sel), tag = $('.sel-tag', sel), tagN = $('.sel-n', sel), tagName = $('.sel-name', sel);
    var HORDER = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    var fx = 0, fy = 0, boxes = [], triggers = [], secTop = 0, secBottom = 0, placed = -2, active = -1, lastActive = -1, manual = null, manualTouch = false, first = true;

    function measure() {
      var wrapTop = docTop(wrap), wrapW = wrap.offsetWidth, wr = wrap.getBoundingClientRect();
      // sub-pixel offset of .pr-wrap (fractional gutters at 1024/1280): snap box lines to device pixels
      fx = ((wr.left % 1) + 1) % 1; fy = (((wr.top + win.pageYOffset) % 1) + 1) % 1;
      var gut = parseFloat(getComputedStyle(sec).paddingLeft) || 16;
      var mob = !mqDesk.matches, padX = mob ? 8 : 10, padY = mob ? 10 : 12;
      boxes = panels.map(function (p) {
        var x = p.offsetLeft - padX, y = p.offsetTop - padY, w = p.offsetWidth + 2 * padX, h = p.offsetHeight + 2 * padY;
        if (x < -gut + 6) { w -= (-gut + 6) - x; x = -gut + 6; }
        if (x + w > wrapW + gut - 6) w = wrapW + gut - 6 - x;
        return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), top: p.offsetTop, ph: p.offsetHeight };
      });
      // rows: panels sharing offsetTop
      var rowsMap = {}; boxes.forEach(function (b, i) { (rowsMap[b.top] = rowsMap[b.top] || []).push(i); });
      triggers = new Array(N);
      Object.keys(rowsMap).forEach(function (k) {
        var idx = rowsMap[k], rh = Math.max.apply(null, idx.map(function (i) { return boxes[i].ph; }));
        idx.forEach(function (i, j) { triggers[i] = wrapTop + Number(k) + (j / idx.length) * Math.max(rh, 0.45 * S.vh); });
      });
      secTop = docTop(sec); secBottom = secTop + sec.offsetHeight;
      if (placed >= 0) { sel.classList.remove('is-live'); write(placed); requestAnimationFrame(function () { requestAnimationFrame(function () { sel.classList.add('is-live'); }); }); }
    }
    function T(el, x, y, extra) { el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)' + (extra || ''); }
    function write(i) {
      var b = boxes[i], x = Math.round(b.x + fx) - fx, y = Math.round(b.y + fy) - fy, w = b.w, h = b.h, cx = x + Math.round(w / 2), cy = y + Math.round(h / 2);
      T(E.t, x, y, ' scaleX(' + (w / 100) + ')'); T(E.b, x, y + h, ' scaleX(' + ((w + 1) / 100) + ')');
      T(E.l, x, y, ' scaleY(' + (h / 100) + ')'); T(E.r, x + w, y, ' scaleY(' + (h / 100) + ')');
      var pts = { nw: [x, y], n: [cx, y], ne: [x + w, y], e: [x + w, cy], se: [x + w, y + h], s: [cx, y + h], sw: [x, y + h], w: [x, cy] };
      HORDER.forEach(function (k) { T(H[k], pts[k][0] - 3, pts[k][1] - 3); });
      // Anchor sits in the empty top-right corner of the box (beside the ghost number), never over copy
      T(A, x + w - 22, y + 18); T(tag, x, y - 22);
    }
    function setTag(i) {
      var p = panels[i];
      tag.style.transition = 'none'; tag.style.opacity = '0';
      requestAnimationFrame(function () {
        tagN.textContent = pad(i + 1) + ' / ' + pad(N); tagName.textContent = p.getAttribute('data-name') || '';
        requestAnimationFrame(function () { tag.style.transition = 'opacity 120ms linear'; tag.style.opacity = ''; });
      });
    }
    function place(i) {
      if (i < 0) { sel.classList.remove('is-on'); placed = -1; panels.forEach(function (p) { p.classList.remove('is-sel'); }); return; }
      panels.forEach(function (p, j) { p.classList.toggle('is-sel', j === i); });
      if (first) {
        first = false; placed = i;
        var b0 = boxes[i], b = { x: Math.round(b0.x + fx) - fx, y: Math.round(b0.y + fy) - fy, w: b0.w, h: b0.h }, mx = b.x + Math.round(b.w / 2), my = b.y + Math.round(b.h / 2);
        // start: edges collapsed about their own midpoints
        T(E.t, mx, b.y, ' scaleX(0)'); T(E.b, mx, b.y + b.h, ' scaleX(0)'); T(E.l, b.x, my, ' scaleY(0)'); T(E.r, b.x + b.w, my, ' scaleY(0)');
        HORDER.forEach(function (k, n) { H[k].style.transitionDelay = (n * 20) + 'ms'; });
        tagN.textContent = pad(i + 1) + ' / ' + pad(N); tagName.textContent = panels[i].getAttribute('data-name') || '';
        // place handles/tag/anchor at final spots, edges collapsed
        var save = [E.t.style.transform, E.b.style.transform, E.l.style.transform, E.r.style.transform];
        write(i); E.t.style.transform = save[0]; E.b.style.transform = save[1]; E.l.style.transform = save[2]; E.r.style.transform = save[3];
        sel.classList.add('is-on');
        requestAnimationFrame(function () { requestAnimationFrame(function () {
          sel.classList.add('is-draw', 'is-shown'); write(i);
          setTimeout(function () { sel.classList.remove('is-draw'); HORDER.forEach(function (k) { H[k].style.transitionDelay = ''; }); sel.classList.add('is-live'); }, 460);
        }); });
        return;
      }
      sel.classList.add('is-on');
      if (placed !== i) setTag(i);
      placed = i; write(i);
    }

    ticks.push(function () {
      if (!boxes.length || S.y < secTop - S.vh || S.y > secBottom) return;
      var line = S.y + 0.65 * S.vh, a = -1;
      for (var i = 0; i < N; i++) if (triggers[i] <= line) a = i;
      if (a !== lastActive) { lastActive = a; active = a; if (manualTouch) { manual = null; manualTouch = false; } }
      var eff = manual !== null ? manual : active;
      if (eff !== placed) place(eff);
    });
    panels.forEach(function (p, i) {
      on(p, 'pointerenter', function (e) { if (FINE && e.pointerType === 'mouse') { manual = i; manualTouch = false; } });
      on(p, 'click', function () { if (!FINE) { manual = i; manualTouch = true; } });
    });
    on(row, 'pointerleave', function (e) { if (e.pointerType === 'mouse' && !manualTouch) manual = null; });

    measures.push(measure);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(measure);
    listen(mqDesk, measure);
    listen(mqReduced, function (e) {
      if (!e.matches) return;
      sec.classList.add('is-static'); revealAll();
      strips.forEach(function (st) { st.el.style.transition = 'none'; st.el.style.transform = 'translateY(' + (-st.n) + 'em)'; });
    });
    measure();
  }

  /* ---------- Testimonials (3.9) ---------- */
  function initTestimonials() {
    var wrap = $('#tq-wrap'); if (!wrap) return;
    var items = $$('.tq', wrap), count = $('#tq-count'), prog = $('#tq-prog');
    if (items.length < 2) return;
    var cur = 0, elapsed = 0, hover = false, focus = false, busy = false, vis = false, DUR = 8;
    items.forEach(function (it, i) { it.hidden = i !== 0; });
    var quotes = items.map(function (it) { return $('.tq-quote p', it); });
    if (!REDUCED) { splitLines(quotes[0]); quotes[0].__revealed = true; $$('.line', quotes[0]).forEach(function (l) { l.classList.add('is-in'); }); }
    function go(n) {
      if (busy) return; n = (n + items.length) % items.length; if (n === cur) return;
      var out = items[cur], inn = items[n]; cur = n; elapsed = 0; busy = true;
      count.textContent = pad(n + 1) + ' / ' + pad(items.length);
      var swap = function () {
        out.hidden = true; inn.hidden = false;
        if (!REDUCED) {
          quotes[n].__revealed = false; splitLines(quotes[n]);
          requestAnimationFrame(function () { requestAnimationFrame(function () { revealLines(quotes[n], 60); }); });
        }
        busy = false;
      };
      if (REDUCED) return swap();
      $$('.line', quotes[items.indexOf(out)]).forEach(function (l, i) { l.querySelector('.line-inner').style.transitionDelay = (i * 60) + 'ms'; l.classList.remove('is-in'); l.classList.add('is-out'); });
      setTimeout(swap, 450);
    }
    on($('#tq-prev'), 'click', function () { go(cur - 1); });
    on($('#tq-next'), 'click', function () { go(cur + 1); });
    on(wrap.parentNode, 'mouseenter', function () { hover = true; }); on(wrap.parentNode, 'mouseleave', function () { hover = false; });
    on(wrap.parentNode, 'focusin', function () { focus = true; }); on(wrap.parentNode, 'focusout', function () { focus = false; });
    var sx = null;
    on(wrap, 'touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    on(wrap, 'touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1)); sx = null; });
    if ('IntersectionObserver' in win) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(wrap);
    on(win, 'resize', debounce(function () { if (!REDUCED && quotes[cur].classList.contains('is-split')) splitLines(quotes[cur]); }, 200));
    ticks.push(function (now, dt) {
      if (REDUCED) { prog.style.transform = 'scaleX(0)'; return; }
      if (hover || focus || doc.hidden || !vis || busy) return;
      elapsed += dt;
      prog.style.transform = 'scaleX(' + Math.min(elapsed / DUR, 1).toFixed(4) + ')';
      if (elapsed >= DUR) go(cur + 1);
    });
  }

  /* ---------- FAQ accordion (3.11) ---------- */
  function initFaq() {
    var all = $$('#faq-list details');
    function anim(a, from, to, cb) {
      if (REDUCED) { cb(); return; }
      a.style.height = from + 'px'; void a.offsetHeight;
      a.style.transition = 'height var(--d-3) var(--ease-out)';
      a.style.height = to + 'px';
      var finished = false, end = function () { if (finished) return; finished = true; a.style.transition = ''; a.style.height = ''; cb(); };
      a.addEventListener('transitionend', end, { once: true }); setTimeout(end, 700);
    }
    function close(d) { var a = $('.faq-a', d); d.classList.add('is-closing'); anim(a, a.scrollHeight, 0, function () { d.open = false; d.classList.remove('is-closing'); }); }
    function open(d) { d.open = true; var a = $('.faq-a', d); anim(a, 0, a.scrollHeight, function () {}); }
    all.forEach(function (d) {
      on($('summary', d), 'click', function (e) {
        e.preventDefault();
        if (d.open && !d.classList.contains('is-closing')) close(d);
        else { all.forEach(function (o) { if (o !== d && o.open) close(o); }); open(d); }
      });
    });
  }

  /* ---------- Contact (3.12) ---------- */
  function initContact() {
    var btn = $('#copy-btn'), mail = $('#contact-email'), t;
    on(btn, 'click', function () {
      var ok = function () { btn.textContent = 'Copied'; clearTimeout(t); t = setTimeout(function () { btn.textContent = 'Copy'; }, 1600); };
      var fallback = function () {
        try { var r = doc.createRange(); r.selectNodeContents(mail); var s = win.getSelection(); s.removeAllRanges(); s.addRange(r); if (doc.execCommand && doc.execCommand('copy')) ok(); } catch (e) { /* text stays selected */ }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(CONFIG.email).then(ok, fallback); else fallback();
    });
    var sec = $('#contact'), title = $('.contact-title');
    if (sec && title) {
      title.classList.add('has-parallax');
      on(sec, 'pointermove', function (e) {
        if (!FINE || REDUCED || e.pointerType !== 'mouse') return;
        var px = e.clientX / S.vw - 0.5, py = e.clientY / S.vh - 0.5;
        title.style.transform = 'translate3d(' + (-px * 24).toFixed(1) + 'px,' + (-py * 24).toFixed(1) + 'px,0)';
      });
      on(sec, 'pointerleave', function () { title.style.transform = ''; });
    }
  }

  /* ---------- Footer ---------- */
  function initFooter() {
    on($('#to-top'), 'click', function (e) { e.preventDefault(); win.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' }); var m = $('.nav-mark'); if (m) m.focus({ preventScroll: true }); });
  }

  /* ---------- Boot ---------- */
  function setFlags() {
    root.classList.toggle('reduced', REDUCED);
    root.classList.toggle('grain-anim', !REDUCED);
  }
  listen(mqReduced, function (e) { REDUCED = e.matches; setFlags(); measureAll(); });

  setFlags();
  safe('timecodes', initTimecodes);
  safe('grain', initGrain);
  safe('heroFit', initHeroFit);
  safe('work', initWork);
  safe('roll', initRoll);
  safe('reveals', initReveals);
  safe('cursor', initCursor);
  safe('magnetic', initMagnetic);
  safe('nav', initNav);
  safe('marquees', initMarquees);
  safe('parallax', initParallax);
  safe('counters', initCounters);
  safe('labelTc', initLabelTc);
  safe('process', initProcess);
  safe('testimonials', initTestimonials);
  safe('faq', initFaq);
  safe('contact', initContact);
  safe('footer', initFooter);
  safe('lightbox', initLightbox);
  // Bridge for assets/js/anatomy.js (loaded right after this file)
  win.JM = { S: S, ticks: ticks, measures: measures, measureAll: measureAll, tc: tc, pad: pad, clamp: clamp, swapText: swapText,
    mulberry32: mulberry32, isReduced: function () { return REDUCED; }, mqDesk: mqDesk, mqReduced: mqReduced, listen: listen,
    docTop: docTop, on: on, $: $, $$: $$, safe: safe };
  win.__jmReady = true; clearTimeout(win.__jmSafety);
  safe('preloader', initPreloader);

  on(win, 'resize', debounce(measureAll, 150));
  on(win, 'load', measureAll);
  if ('ResizeObserver' in win) new ResizeObserver(debounce(measureAll, 120)).observe(doc.body);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(measureAll);
  measureAll();
  requestAnimationFrame(loop);
})();
