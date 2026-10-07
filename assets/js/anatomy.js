/* ============================================================
   JHON MEDIA · anatomy.js
   "Anatomy of a winner" V2 (docs/TIMELINE-V2.md).
   Program monitor with a procedural mock ad, retention curve,
   NLE timeline polish. Runs inside main.js's shared rAF (window.JM).
   Every visual is a pure function of ad time t, so scrubbing
   backwards plays frames in reverse. Transforms + opacity only.
   ============================================================ */
(function () {
  'use strict';
  var JM = window.JM, doc = document, win = window;
  var sec = doc.getElementById('anatomy');
  if (!JM || !sec) return;
  var S = JM.S, $ = JM.$, $$ = JM.$$, clamp = JM.clamp, pad = JM.pad, tc = JM.tc, on = JM.on;

  /* ---------- Easing ---------- */
  function eOutExpo(x) { return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); }
  function eOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function eInOutCubic(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function eInOutQuart(x) { return x < .5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2; }
  function eOutBack(x) { return 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2); }
  function seg(u, a, b) { return clamp((u - a) / (b - a), 0, 1); }
  var TAU = Math.PI * 2;

  /* ---------- AD: single source of truth ---------- */
  var AD = {
    beats: [
      { name: 'HOOK', s: 0, e: 3, cuts: [0, 1.5], th: ['face', 'dog'] },
      { name: 'PROBLEM', s: 3, e: 8, cuts: [3, 3.83, 4.67, 5.5, 6.33, 7.17], th: ['face', 'face', 'dog', 'paw', 'cards', 'cards'] },
      { name: 'DEMO', s: 8, e: 16, cuts: [8, 10, 12, 14.4], th: ['bottle', 'hand', 'split', 'zoom'] },
      { name: 'PROOF', s: 16, e: 23, cuts: [16], th: ['stars'] },
      { name: 'OFFER', s: 23, e: 27, cuts: [23], th: ['price'] },
      { name: 'CTA', s: 27, e: 30, cuts: [27], th: ['button'] }
    ],
    // caption blocks: [in, out, karaoke, [[y, size, [[word, t0], ...]], ...]]
    caps: [
      [.375, 1.5, 0, [[178, 44, [['STOP', .375]]], [222, 44, [['SCROLLING', .625]]]]],
      [38 / 24, 3, 0, [[360, 26, [['IF', 38 / 24], ['YOUR', 42 / 24], ['DOG', 46 / 24]]], [392, 26, [['DOES', 54 / 24], ['THIS', 58 / 24]]]]],
      [3, 4.667, 1, [[372, 24, [['MY', 3.08], ['DOG', 3.5], ['WOULDN’T', 3.92]]]]],
      [4.667, 6.333, 1, [[372, 24, [['STOP', 4.75], ['SCRATCHING.', 5.3]]]]],
      [6.333, 8, 1, [[372, 24, [['I', 6.42], ['TRIED', 6.62], ['EVERYTHING.', 6.95]]]]],
      [8, 10, 1, [[384, 22, [['SO', 8.2], ['I', 8.45], ['TRIED', 8.7], ['THIS.', 8.95]]]]],
      [10, 12, 1, [[384, 22, [['TWO', 10.3], ['SPRAYS', 10.6], ['A', 11], ['DAY.', 11.2]]]]],
      [12, 14.4, 1, [[384, 22, [['TWO', 12.3], ['WEEKS', 12.6], ['LATER.', 13]]]]],
      [14.4, 16, 1, [[384, 22, [['LOOK', 14.6], ['AT', 14.85], ['THAT', 15.05], ['COAT.', 15.3]]]]]
    ],
    keys: [[.33, .5], [1.5, 2], [14.64, 15.36], [24.2, 24.37]],
    trans: [8, 12],
    flashes: [[8, .55], [36, .55], [72, .55], [112, .55], [152, .55], [192, .45], [576, .35]],
    shakes: [8, 576],
    stills: [.9, 7.6, 14.2, 22.5, 26, 28.8],
    warp: [[0, 0], [.17, 3], [.38, 8], [.64, 16], [.78, 23], [.87, 27], [.96, 30], [1, 30]],
    // Retention anchors (placeholder — replace with real account data)
    hold: [[0, 100], [3, 38], [8, 31], [16, 25], [23, 21], [30, 19]],
    avg: [[0, 100], [3, 30], [8, 19], [16, 12.5], [23, 9], [30, 7]]
  };
  var CUTS = [];
  AD.beats.forEach(function (b) { b.cuts.forEach(function (c) { if (c > 0) CUTS.push(c); }); });
  $$('#beats-list li').forEach(function (li, i) {
    var ps = $$('p', li), b = AD.beats[i]; if (!b) return;
    b.body = ps[0].textContent; b.stat = ps[1].textContent;
  });

  /* ---------- DOM + write-cache helpers ---------- */
  function mk(p, cls, css, txt, tag) {
    var e = doc.createElement(tag || 'div');
    if (cls) e.className = cls; if (css) e.style.cssText = css; if (txt != null) e.textContent = txt;
    if (p) p.appendChild(e); return e;
  }
  function T(el, v) { if (el.__t !== v) { el.__t = v; el.style.transform = v; } }
  function O(el, v) { v = Math.round(v * 1000) / 1000; if (el.__o !== v) { el.__o = v; el.style.opacity = v; } }
  function X(el, v) { if (el.__x !== v) { el.__x = v; el.textContent = v; } }
  function C(el, c, on) { var k = '__c' + c; if (el[k] !== on) { el[k] = on; el.classList.toggle(c, on); } }
  function px(n) { return (Math.round(n * 100) / 100) + 'px'; }

  /* ---------- Waveform (seeded, deterministic) ---------- */
  var rnd = JM.mulberry32(1337), BARS = [];
  for (var i = 0; i < 240; i++) {
    var env = 0.55 + 0.45 * Math.sin(i / 240 * Math.PI * 3 + 0.6) * Math.sin(i / 17);
    BARS.push(Math.round(clamp(12 + rnd() * 60 * (0.6 + Math.abs(env)), 8, 96)));
  }
  function amp(t) { return BARS[clamp(Math.floor(t / 30 * 240), 0, 239)] / 96; }

  /* ---------- Retention curves (precomputed per frame) ---------- */
  function mono(xs, ys) { // monotone cubic (Fritsch-Carlson)
    var n = xs.length, d = [], m = [], k;
    for (k = 0; k < n - 1; k++) d[k] = (ys[k + 1] - ys[k]) / (xs[k + 1] - xs[k]);
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (k = 1; k < n - 1; k++) m[k] = d[k - 1] * d[k] <= 0 ? 0 : (d[k - 1] + d[k]) / 2;
    for (k = 0; k < n - 1; k++) {
      var a = m[k] / d[k], b = m[k + 1] / d[k], h = a * a + b * b;
      if (h > 9) { var tau = 3 / Math.sqrt(h); m[k] = tau * a * d[k]; m[k + 1] = tau * b * d[k]; }
    }
    return function (x) {
      for (k = 0; k < n - 2 && x > xs[k + 1]; k++);
      var hh = xs[k + 1] - xs[k], s = (x - xs[k]) / hh, s2 = s * s, s3 = s2 * s;
      return (2 * s3 - 3 * s2 + 1) * ys[k] + (s3 - 2 * s2 + s) * hh * m[k] + (-2 * s3 + 3 * s2) * ys[k + 1] + (s3 - s2) * hh * m[k + 1];
    };
  }
  function curve(anch, damp) {
    var L = mono(anch.map(function (a) { return a[0]; }), anch.map(function (a) { return Math.log(a[1]); }));
    var r = [], f, k;
    for (f = 0; f < 720; f++) {
      var t = f / 24, base = Math.max(1e-6, L(t) - L(t + 1 / 24)), mult = 1;
      if (damp) CUTS.forEach(function (c) { if (c <= t) mult *= 1 - .75 * Math.exp(-(t - c) / .35); });
      r.push(base * mult);
    }
    for (k = 0; k < anch.length - 1; k++) { // rescale each segment so anchors still land
      var f0 = Math.round(anch[k][0] * 24), f1 = Math.round(anch[k + 1][0] * 24), sum = 0;
      for (f = f0; f < f1; f++) sum += r[f];
      var sc = Math.log(anch[k][1] / anch[k + 1][1]) / sum;
      for (f = f0; f < f1; f++) r[f] *= sc;
    }
    var out = [100];
    for (f = 0; f < 720; f++) out.push(out[f] * Math.exp(-r[f]));
    return out;
  }
  var HOLD = curve(AD.hold, true), AVG = curve(AD.avg, false);
  function gx(t) { return 24 + 272 * t / 30; }
  function gy(h) { return 130 - 1.2 * h; }
  function pathOf(arr) {
    var d = '';
    for (var f = 0; f <= 720; f += 2) d += (f ? 'L' : 'M') + gx(f / 24).toFixed(1) + ' ' + gy(arr[f]).toFixed(1);
    return d;
  }
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs, p) { var e = doc.createElementNS(SVGNS, tag); for (var a in attrs) e.setAttribute(a, attrs[a]); if (p) p.appendChild(e); return e; }
  function buildGraph(host, full) {
    var g = { plot: mk(host, 'rt-plot'), W: 300, H: 150, ticks: [] };
    var s1 = svgEl('svg', { viewBox: '0 0 300 150', preserveAspectRatio: 'none' }, g.plot);
    svgEl('path', { d: pathOf(HOLD), 'class': 'rt-cut' }, s1);
    g.mask = mk(g.plot, 'rt-mask');
    var s2 = svgEl('svg', { viewBox: '0 0 300 150', preserveAspectRatio: 'none' }, g.plot);
    if (full) {
      svgEl('line', { x1: 24, x2: 296, y1: gy(50), y2: gy(50), 'class': 'rt-grid' }, s2);
      svgEl('line', { x1: 24, x2: 296, y1: gy(0), y2: gy(0), 'class': 'rt-grid' }, s2);
      [100, 50, 0].forEach(function (v) { var t = svgEl('text', { x: 0, y: gy(v) + 3 }, s2); t.textContent = v; });
    }
    svgEl('path', { d: pathOf(AVG), 'class': 'rt-avg' }, s2);
    g.dot = mk(g.plot, 'rt-dot');
    if (full) CUTS.forEach(function (c) { var k = mk(g.plot, 'rt-tick'); k.style.left = (gx(c) / 3) + '%'; g.ticks.push({ c: c, el: k }); });
    return g;
  }
  function graphAt(g, t, done) {
    var f = clamp(Math.round(t * 24), 0, 720);
    T(g.mask, 'translate3d(' + px((done ? 300 : gx(t)) / 300 * g.W) + ',0,0)');
    T(g.dot, 'translate3d(' + px(gx(t) / 300 * g.W) + ',' + px(gy(HOLD[f]) / 150 * g.H) + ',0)');
    O(g.dot, done ? 0 : 1);
  }

  /* ---------- Thumbnail glyphs (inline <symbol>s) ---------- */
  var GLYPHS = {
    face: '<circle cx="11" cy="15" r="5"/><path d="M3 34 Q11 22 19 34"/>',
    dog: '<path d="M6 14 L8 9 L10 14 M12 14 L14 9 L16 14"/><rect x="6" y="14" width="10" height="9"/><rect x="8" y="20" width="6" height="5"/>',
    paw: '<circle cx="11" cy="23" r="4"/><circle cx="6" cy="16" r="1.5"/><circle cx="9.5" cy="13" r="1.5"/><circle cx="13" cy="13" r="1.5"/><circle cx="16" cy="16" r="1.5"/>',
    cards: '<rect x="2.5" y="14" width="5" height="10"/><rect x="8.5" y="14" width="5" height="10"/><rect x="14.5" y="14" width="5" height="10"/><path d="M14.5 14 L19.5 24 M19.5 14 L14.5 24"/>',
    bottle: '<rect x="7" y="16" width="8" height="17"/><rect x="9" y="12" width="4" height="4"/><rect x="8.5" y="9" width="5" height="3"/>',
    hand: '<rect x="6" y="20" width="10" height="12"/><path d="M6 20 V14 M9 20 V12 M12 20 V12 M15 20 V14"/>',
    split: '<rect x="3" y="8" width="16" height="24"/><path d="M11 4 V36"/>',
    zoom: '<path d="M4 12 V8 H8 M14 8 H18 V12 M18 28 V32 H14 M8 32 H4 V28"/><rect x="8" y="16" width="6" height="8"/>',
    stars: '<path d="M11 12 l1.5 3 3 .4 -2.2 2 .6 3 -2.9 -1.5 -2.9 1.5 .6 -3 -2.2 -2 3 -.4z"/><path d="M4 28 H18 M4 32 H14"/>',
    price: '<path d="M14 13 H9 Q6 13 6 16 Q6 19 11 20 Q16 21 16 24 Q16 27 13 27 H7 M11 10 V30"/>',
    button: '<rect x="3" y="16" width="16" height="7"/><path d="M11 26 V32 M8.5 29.5 L11 32 L13.5 29.5"/>'
  };
  (function () {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0" aria-hidden="true"><defs>';
    for (var k in GLYPHS) s += '<symbol id="g-' + k + '" viewBox="0 0 22 40" fill="none" stroke="#8a8a8a" stroke-width="1">' + GLYPHS[k] + '</symbol>';
    var w = doc.createElement('div'); w.innerHTML = s + '</defs></svg>';
    doc.body.appendChild(w.firstChild);
  })();
  function glyph(p, name) { var s = svgEl('svg', { viewBox: '0 0 22 40', 'aria-hidden': 'true' }, p); svgEl('use', { href: '#g-' + name }, s); return s; }

  /* ============================================================
     Program monitor: build (270 x 480 authoring space)
     ============================================================ */
  var INK0 = '#0a0a0a', INK1 = '#141414', INK2 = '#1f1f1f', INK3 = '#2a2a2a', HI = '#3a3a3a', MUTE = '#8a8a8a';
  function box(p, l, t, w, h, bg, extra) { return mk(p, '', 'left:' + l + 'px;top:' + t + 'px;width:' + w + 'px;height:' + h + 'px;background:' + bg + ';' + (extra || '')); }
  function circ(p, l, t, d, bg, extra) { return box(p, l, t, d, d, bg, 'border-radius:50%;' + (extra || '')); }
  function txt(p, css, s, cls) { return mk(p, cls || '', css, s); }

  function buildMon(still) {
    var M = { still: still };
    var scr = M.scr = mk(null, 'scr' + (still ? ' is-still' : ''));
    var wrap = M.wrap = mk(scr, '', 'inset:0');
    M.scn = [];
    function scene() { var s = mk(wrap, 'scn'); M.scn.push(s); return s; }

    // --- HOOK ---
    var h = scene();
    var feed = M.feed = mk(h, '', 'inset:0;background:' + INK1);
    circ(feed, 16, 64, 24, INK3); box(feed, 48, 70, 80, 8, INK3); box(feed, 16, 100, 238, 230, INK2);
    box(feed, 16, 346, 220, 8, INK3); box(feed, 16, 362, 180, 8, INK3); box(feed, 16, 378, 120, 8, INK3);
    var adp = M.adp = mk(h, '', 'inset:0;background:#000');
    var sa = M.shotA = mk(adp, '', 'inset:0;transform-origin:50% 38%;background:radial-gradient(circle at 50% 32%,' + INK3 + ',' + INK1 + ' 70%)');
    box(sa, 25, 235, 220, 260, INK3, 'clip-path:polygon(30% 0,70% 0,100% 40%,100% 100%,0 100%,0 40%)');
    box(sa, 113, 215, 44, 30, INK3);
    circ(sa, 73, 100, 124, 'linear-gradient(160deg,' + HI + ',' + INK2 + ')');
    box(sa, 103, 152, 10, 5, INK1); box(sa, 157, 152, 10, 5, INK1);
    M.mouthA = box(sa, 124, 196, 22, 6, INK0, 'transform-origin:50% 50%');
    var sb = M.shotB = mk(adp, '', 'inset:0;transform-origin:50% 50%;background:radial-gradient(circle at 50% 40%,' + INK3 + ',' + INK0 + ' 75%)');
    box(sb, 40, 255, 190, 240, INK2, 'border-radius:60px 60px 0 0');
    M.legB = box(sb, 180, 300, 26, 120, INK3, 'border-radius:13px;transform-origin:50% 8%');
    box(sb, 66, 82, 44, 64, HI, 'clip-path:polygon(50% 0,100% 100%,0 100%)');
    box(sb, 160, 82, 44, 64, HI, 'clip-path:polygon(50% 0,100% 100%,0 100%)');
    box(sb, 70, 128, 130, 112, INK3, 'border-radius:40px');
    circ(sb, 98, 165, 9, MUTE); circ(sb, 163, 165, 9, MUTE);
    box(sb, 105, 192, 60, 52, HI, 'border-radius:18px'); box(sb, 125, 197, 20, 12, INK0, 'border-radius:6px');
    M.speed = [];
    for (var k = 0; k < 6; k++) M.speed.push(box(h, 28 + k * 42, 0, 1, 480, '#fff', 'opacity:0'));
    mk(h, 'vig');

    // --- PROBLEM ---
    var pb = scene();
    var pH = M.pH = mk(pb, '', 'inset:0;transform-origin:50% 40%;background:linear-gradient(' + INK2 + ',' + INK1 + ')');
    box(pH, 0, 40, 90, 110, INK3); box(pH, 180, 40, 90, 110, INK3); box(pH, 0, 300, 270, 2, INK3);
    box(pH, 55, 215, 160, 265, INK3, 'clip-path:polygon(25% 0,75% 0,100% 30%,100% 100%,0 100%,0 30%)');
    circ(pH, 91, 120, 88, 'linear-gradient(160deg,' + HI + ',' + INK2 + ')');
    M.mouthP = box(pH, 124, 180, 22, 6, INK0, 'transform-origin:50% 50%');
    var pD = M.pD = mk(pb, '', 'inset:0;transform-origin:190px 300px;background:radial-gradient(circle at 50% 60%,' + INK2 + ',' + INK0 + ' 80%)');
    box(pD, 186, 222, 44, 6, INK3, 'transform:rotate(-30deg)');
    box(pD, 85, 278, 10, 52, INK3); box(pD, 108, 278, 10, 52, INK3);
    box(pD, 70, 230, 125, 56, INK3, 'border-radius:24px');
    M.legP = box(pD, 168, 262, 12, 72, HI, 'border-radius:6px;transform-origin:50% 6%');
    box(pD, 36, 195, 56, 46, HI, 'border-radius:14px'); box(pD, 48, 182, 18, 22, HI, 'clip-path:polygon(50% 0,100% 100%,0 100%)');
    M.rings = [];
    [[150, 240, 9], [168, 252, 6], [140, 258, 7], [180, 238, 5], [158, 266, 8], [128, 244, 5]].forEach(function (r) {
      M.rings.push(circ(pD, r[0] - r[2], r[1] - r[2], r[2] * 2, 'transparent', 'border:1px solid #fff;opacity:0'));
    });
    var pC = M.pC = mk(pb, '', 'inset:0;transform-origin:50% 45%;background:linear-gradient(' + INK1 + ',' + INK0 + ')');
    box(pC, 0, 244, 270, 3, INK3);
    M.cards = [];
    ['SHAMPOO', 'CREAM', 'VET $$'].forEach(function (lbl, j) {
      var c = box(pC, 30 + j * 73, 150, 64, 92, INK2, 'border:1px solid ' + INK3 + ';opacity:0');
      box(c, 10, 14, 42, 30, INK3);
      txt(c, 'left:0;right:0;top:66px;font-size:9px;font-weight:700;text-align:center', lbl, 'dec');
      var b1 = box(c, 30, 6, 2, 78, '#fff', 'transform:rotate(45deg) scaleY(0)');
      var b2 = box(c, 30, 6, 2, 78, '#fff', 'transform:rotate(-45deg) scaleY(0)');
      M.cards.push({ el: c, b1: b1, b2: b2 });
    });
    box(pb, 10, 140, 4, 160, INK3);
    M.meter = box(pb, 10, 140, 4, 160, '#fff', 'transform-origin:50% 100%');
    txt(pb, 'left:-4px;top:118px;font-size:7px;transform:rotate(-90deg)', 'ITCH', 'dec dec2');
    mk(pb, 'vig');

    // --- DEMO ---
    var dm = scene();
    var d1 = M.d1 = mk(dm, '', 'inset:0;background:radial-gradient(circle at 50% 58%,' + INK3 + ',' + INK0 + ' 72%)');
    M.shadow = box(d1, 92, 352, 86, 14, 'rgba(0,0,0,.6)', 'border-radius:50%');
    var bt = M.bottle = mk(d1, '', 'left:100px;top:140px;width:70px;height:220px');
    box(bt, 18, 30, 34, 22, HI); box(bt, 22, 52, 26, 18, INK3);
    box(bt, 0, 70, 70, 150, 'linear-gradient(90deg,' + INK3 + ',' + HI + ' 45%,' + INK2 + ')', 'border-radius:6px');
    var band = box(bt, 0, 110, 70, 56, INK1, 'overflow:hidden');
    M.label = mk(band, '', 'left:0;top:0;width:280px;height:56px');
    for (k = 0; k < 2; k++) {
      var pnl = mk(M.label, '', 'left:' + (k * 140) + 'px;top:0;width:140px;height:56px');
      txt(pnl, 'left:8px;top:12px;font-size:8px;font-weight:700', 'ITCH RELIEF', 'dec');
      box(pnl, 8, 26, 50, 2, INK3); box(pnl, 8, 32, 40, 2, INK3); box(pnl, 8, 38, 46, 2, INK3);
      box(pnl, 76, 12, 54, 32, INK2);
    }
    M.spec = box(bt, 31, 72, 8, 146, '#fff', 'opacity:.22');
    M.callouts = [];
    [[.04, 152, 175, -18, 'FAST-ACTING'], [.10, 170, 268, 18, 'NO STING'], [.16, 100, 350, 198, '2 SPRAYS / DAY']].forEach(function (c) {
      var g = mk(d1, '', 'left:' + c[1] + 'px;top:' + c[2] + 'px;width:0;height:0;opacity:0');
      box(g, -2, -2, 4, 4, '#fff');
      var a = c[3] * Math.PI / 180, ex = Math.cos(a) * 52, ey = Math.sin(a) * 52;
      var ln = box(g, 0, 0, 52, 1, '#fff', 'transform-origin:0 0;transform:rotate(' + c[3] + 'deg) scaleX(0)');
      var lb = txt(g, 'top:' + (ey - 5) + 'px;font-size:9px;font-weight:700;white-space:nowrap;opacity:0;' + (ex < 0 ? 'right:' + (-ex + 4) + 'px' : 'left:' + (ex + 4) + 'px'), c[4], 'dec');
      M.callouts.push({ u: c[0], g: g, ln: ln, lb: lb, rot: c[3] });
    });
    var d2 = M.d2 = mk(dm, '', 'inset:0;background:linear-gradient(' + INK2 + ',' + INK0 + ')');
    M.hand = mk(d2, '', 'inset:0');
    M.bt2 = mk(M.hand, '', 'inset:0');
    box(M.bt2, 98, 175, 16, 8, HI); box(M.bt2, 112, 170, 24, 20, HI); box(M.bt2, 116, 190, 20, 14, INK3);
    box(M.bt2, 106, 204, 50, 120, 'linear-gradient(90deg,' + INK3 + ',' + HI + ' 45%,' + INK2 + ')', 'border-radius:5px');
    box(M.hand, 128, 236, 70, 92, INK3, 'border-radius:12px');
    for (k = 0; k < 4; k++) box(M.hand, 100, 242 + k * 18, 40, 13, HI, 'border-radius:7px');
    M.parts = [];
    var prnd = JM.mulberry32(7);
    for (k = 0; k < 24; k++) {
      var ang = (-25 + 50 * ((k % 12) / 11)) * Math.PI / 180, mag = .65 + .35 * prnd();
      M.parts.push({ el: box(d2, 96, 177, 3, 3, '#fff', 'opacity:0'), vx: -Math.cos(ang) * mag * 90, vy: Math.sin(ang) * mag * 90, burst: k < 12 ? 0 : 1 });
    }
    var d3 = M.d3 = mk(dm, '', 'inset:0;overflow:hidden');
    var dz = M.dz = mk(d3, '', 'inset:0;transform-origin:150px 200px');
    mk(dz, '', 'inset:0;background:repeating-linear-gradient(60deg,' + INK3 + ' 0 1px,' + INK1 + ' 1px 5px)');
    [[60, 130, 9], [140, 170, 7], [190, 120, 8], [100, 260, 6], [170, 300, 9], [70, 340, 5], [210, 230, 7]].forEach(function (r) {
      circ(dz, r[0] - r[2], r[1] - r[2], r[2] * 2, 'transparent', 'border:1px solid #fff;opacity:.7');
    });
    M.wipe = mk(dz, '', 'inset:0;overflow:hidden');
    M.after = mk(M.wipe, '', 'inset:0;background:repeating-linear-gradient(60deg,' + HI + ' 0 1px,' + INK2 + ' 1px 5px)');
    [[80, 150], [190, 210], [120, 320]].forEach(function (s) {
      box(M.after, s[0] - 4, s[1], 9, 1, '#fff'); box(M.after, s[0], s[1] - 4, 1, 9, '#fff');
    });
    M.div = mk(dz, '', 'left:-1px;top:0;width:2px;height:480px;background:#fff');
    var hd = box(M.div, -9, 230, 20, 20, '#fff');
    box(hd, 4, 7, 0, 0, 'transparent', 'border-right:5px solid #000;border-top:3px solid transparent;border-bottom:3px solid transparent');
    box(hd, 11, 7, 0, 0, 'transparent', 'border-left:5px solid #000;border-top:3px solid transparent;border-bottom:3px solid transparent');
    M.befL = txt(dz, 'left:16px;top:56px;font-size:9px;font-weight:700', 'BEFORE · DAY 1', 'sm befl');
    M.afterL = txt(dz, 'right:16px;top:56px;font-size:9px;font-weight:700;opacity:0', 'AFTER · DAY 14', 'sm aftl');
    M.whip = [];
    for (k = 0; k < 8; k++) M.whip.push(box(dm, 20 + (k * 37) % 60, 70 + k * 46, 200 - (k % 3) * 40, 1, '#fff', 'opacity:0'));
    M.brk = mk(dm, '', 'left:105px;top:155px;width:90px;height:90px;transform-origin:50% 50%;opacity:0');
    box(M.brk, 0, 0, 16, 2, '#fff'); box(M.brk, 0, 0, 2, 16, '#fff'); box(M.brk, 74, 0, 16, 2, '#fff'); box(M.brk, 88, 0, 2, 16, '#fff');
    box(M.brk, 0, 88, 16, 2, '#fff'); box(M.brk, 0, 74, 2, 16, '#fff'); box(M.brk, 74, 88, 16, 2, '#fff'); box(M.brk, 88, 74, 2, 16, '#fff');
    M.brkL = txt(dm, 'left:0;top:0;font-size:9px;white-space:nowrap;opacity:0', 'CLOSE-UP', 'sm');
    mk(dm, 'vig');

    // --- PROOF ---
    var pr = scene();
    mk(pr, '', 'inset:0;background:' + INK1);
    box(pr, 60, 390, 150, 50, INK2, 'border-radius:25px'); circ(pr, 40, 380, 40, INK2);
    M.revH = txt(pr, 'left:0;right:0;top:70px;font-size:10px;font-weight:700;text-align:center;font-variant-numeric:tabular-nums;--b:10px', '', 'sm');
    M.revs = [];
    ['"Stopped scratching in a week."', '"She finally sleeps through the night."', '"Our vet asked what we changed."'].forEach(function (q, j) {
      var c = box(pr, 25, 290, 220, 64, INK2, 'border:1px solid ' + INK3 + ';opacity:0;transform-origin:50% 0');
      var st = [];
      for (var n = 0; n < 5; n++) st.push(txt(c, 'left:' + (10 + n * 12) + 'px;top:10px;font-size:10px;opacity:.2', '★'));
      txt(c, 'left:10px;right:34px;top:30px;font-size:11px;line-height:1.2;text-transform:none;font-weight:400', q, 'dec');
      if (j === 2) circ(c, 190, 8, 20, HI);
      M.revs.push({ el: c, st: st, u: [.04, .32, .60][j] });
    });
    mk(pr, 'vig');

    // --- OFFER ---
    var of = scene();
    mk(of, '', 'inset:0;background:radial-gradient(circle at 50% 45%,' + INK2 + ',' + INK0 + ' 75%)');
    txt(of, 'left:0;right:0;top:118px;text-align:center;font-size:40px;font-weight:200;color:' + MUTE, '$49');
    M.strike = box(of, 92, 138, 86, 2, '#fff', 'transform-origin:0 50%;transform:scaleX(0)');
    M.p29 = txt(of, 'left:0;right:0;top:182px;text-align:center;font-size:96px;font-weight:700;letter-spacing:-0.04em;opacity:0', '$29');
    M.offT = txt(of, 'left:0;right:0;top:312px;text-align:center;font-size:12px;font-weight:700;opacity:0;--b:12px', '30% OFF. TODAY ONLY.', 'sm');
    mk(of, 'vig');

    // --- CTA ---
    var ct = scene();
    mk(ct, '', 'inset:0;background:radial-gradient(circle at 50% 55%,' + INK2 + ',' + INK0 + ' 75%)');
    box(ct, 105, 120, 60, 120, 'linear-gradient(90deg,' + INK3 + ',' + HI + ' 45%,' + INK2 + ')', 'border-radius:6px');
    M.btn = box(ct, 45, 268, 180, 44, '#fff', 'color:#000;font-size:14px;font-weight:700;text-align:center;line-height:44px');
    M.btn.textContent = 'SHOP NOW';
    M.ripple = circ(ct, 113, 268, 44, 'transparent', 'border:1px solid #fff;opacity:0');
    M.arrow = txt(ct, 'left:0;right:0;top:322px;text-align:center;font-size:18px', '↓');
    M.finger = circ(ct, 0, 0, 24, 'rgba(255,255,255,.25)', 'border:1px solid #fff');
    M.black = mk(ct, '', 'inset:0;background:#000;opacity:0');
    M.loop = txt(ct, 'left:0;right:0;top:236px;text-align:center;font-size:9px;opacity:0', '↺ LOOP', 'sm');

    // --- Captions ---
    var cap = mk(scr, 'cap');
    M.blocks = AD.caps.map(function (bk) {
      var bel = mk(cap, '', 'inset:0;opacity:0'), words = [];
      bk[3].forEach(function (ln) {
        var l = mk(bel, 'cl', 'top:' + (ln[0] - ln[1] * .85) + 'px;font-size:' + ln[1] + 'px');
        ln[2].forEach(function (w) {
          var cw = mk(l, 'cw', null, null, 'span');
          var a = mk(cw, 'cw-w', null, w[0], 'span'), b = mk(cw, 'cw-i', null, w[0], 'span');
          words.push({ t0: w[1], f0: Math.round(w[1] * 24), el: cw, w: a, inv: b });
        });
      });
      return { a: bk[0], b: bk[1], kar: bk[2], el: bel, words: words };
    });

    M.flash = mk(scr, 'flash');

    // --- Guides ---
    var gd = mk(scr, 'guides');
    mk(gd, '', 'left:13.5px;top:24px;right:13.5px;bottom:24px;border:1px solid ' + INK3);
    [[27, 48, 1, 1], [243, 48, -1, 1], [27, 432, 1, -1], [243, 432, -1, -1]].forEach(function (c) {
      box(gd, c[2] > 0 ? c[0] : c[0] - 10, c[1], 10, 1, '#fff'); box(gd, c[0], c[3] > 0 ? c[1] : c[1] - 10, 1, 10, '#fff');
    });
    box(gd, 130, 240, 10, 1, '#fff'); box(gd, 135, 235, 1, 10, '#fff');
    var hatch = 'repeating-linear-gradient(45deg,rgba(255,255,255,.25) 0 1px,transparent 1px 6px)';
    var ui1 = box(gd, 222, 250, 40, 170, hatch, ''); ui1.className = 'ui';
    var ui2 = box(gd, 13, 404, 244, 48, hatch, ''); ui2.className = 'ui';
    txt(ui1, 'left:3px;top:3px;font-size:7px', 'UI', 'dec dec2');

    // --- HUD ---
    var hud = mk(scr, 'hud');
    M.rec = txt(hud, 'left:12px;top:12px;font-weight:700', '', 'sm'); M.rec.innerHTML = '<i class="rec-dot"></i>REC';
    M.shut = txt(hud, 'left:44px;top:12px', '❚❚'); M.shut.className = 'sh';
    M.tc = txt(hud, 'right:12px;top:12px', '00:00:00:00'); M.tc.className = 'tc sm';
    M.chip = txt(hud, 'left:12px;top:30px', ''); M.chip.className = 'chip sm';
    M.ring = mk(hud, 'ring', 'right:14px;top:28px;width:30px;height:30px;transform-origin:50% 50%');
    M.segs = [];
    for (k = 0; k < 12; k++) M.segs.push(mk(M.ring, 'seg', 'transform:rotate(' + (k * 30) + 'deg)'));
    M.dig = txt(M.ring, 'left:0;right:0;top:9px;text-align:center;font-size:13px;font-weight:700;--b:13px', '3', 'sm');
    M.fc = txt(hud, 'left:12px;bottom:12px;color:' + MUTE, ''); M.fc.className = 'fc dec';
    M.btag = txt(hud, 'right:12px;bottom:12px;color:' + MUTE, ''); M.btag.className = 'btag dec';
    if (still) [M.rec, M.shut, M.ring, M.fc, M.btag].forEach(function (e) { e.style.display = 'none'; });
    M.f = -1;
    return M;
  }

  /* ============================================================
     Program monitor: render one frame (pure function of t)
     ============================================================ */
  function beatAt(t) { for (var b = AD.beats.length - 1; b > 0; b--) if (t + 1e-6 >= AD.beats[b].s) return b; return 0; }
  var lastFlashWall = -1e9;
  function renderMon(M, t, wall) {
    var f = clamp(Math.floor(t * 24 + 1e-6), 0, 719);
    if (f === M.f) return; M.f = f;
    var tf = f / 24, b = beatAt(tf), B = AD.beats[b], u = seg(tf, B.s, B.e), k, j;
    for (k = 0; k < 6; k++) C(M.scn[k], 'is-on', k === b);

    // shake + flash
    var sh = '';
    if (!M.still) AD.shakes.forEach(function (s0) { var d = f - s0; if (d >= 0 && d < 4) sh = 'translate(' + [[5, -3], [-4, 2], [2, -1], [0, 0]][d].join('px,') + 'px)'; });
    T(M.wrap, sh || 'none');
    var fl = 0;
    if (!M.still) AD.flashes.forEach(function (x) { if (f === x[0]) fl = x[1]; else if (f === x[0] + 1) fl = x[1] * .45; });
    if (fl > .3) { if (wall - lastFlashWall < 333) fl = .2; else lastFlashWall = wall; }
    O(M.flash, fl);

    if (b === 0) { // HOOK
      var sw = eOutExpo(seg(u, 0, .10));
      T(M.feed, 'translate3d(0,' + px(-528 * sw) + ',0)');
      T(M.adp, 'translate3d(0,' + px(480 * (1 - sw)) + ',0)');
      for (k = 0; k < 6; k++) O(M.speed[k], f <= 5 ? .25 : 0);
      O(M.shotA, f < 36 ? 1 : 0); O(M.shotB, f >= 36 ? 1 : 0);
      T(M.shotA, 'scale(' + (1 + .22 * eOutExpo(seg(u, .10, .16)) + .04 * seg(u, .16, .5)).toFixed(4) + ')');
      T(M.mouthA, 'scaleY(' + (.2 + .8 * amp(tf)).toFixed(3) + ')');
      T(M.shotB, 'scale(' + (1.10 - .10 * eOutExpo(seg(f, 36, 48))).toFixed(4) + ')');
      T(M.legB, 'rotate(' + (22 * Math.sin(TAU * 6 * tf)).toFixed(2) + 'deg)');
      var lit = Math.ceil(12 * (1 - u));
      for (k = 0; k < 12; k++) O(M.segs[k], k < lit ? 1 : .15);
      X(M.dig, String(Math.max(1, Math.ceil(3 - tf - 1e-6))));
      T(M.ring, f >= 70 ? 'scale(1.15)' : 'none');
      X(M.chip, 'HOOK RATE ' + Math.round(38 * eOutCubic(u)) + '%'); // placeholder — replace
    }
    O(M.ring, b === 0 && !M.still ? 1 : 0);

    if (b === 1) { // PROBLEM
      var cuts = B.cuts, si = 0;
      for (k = 0; k < cuts.length; k++) if (tf + 1e-6 >= cuts[k]) si = k;
      O(M.pH, si < 2 ? 1 : 0); O(M.pD, si === 2 || si === 3 ? 1 : 0); O(M.pC, si > 3 ? 1 : 0);
      var glitch = si === 1 && f === Math.ceil(cuts[1] * 24) ? 4 : 0;
      T(M.pH, si === 1 ? 'translate(' + (-8 + glitch) + 'px,0) scale(1.12)' : 'none');
      T(M.mouthP, 'scaleY(' + (.2 + .8 * amp(tf)).toFixed(3) + ')');
      T(M.pD, si === 3 ? 'scale(1.3)' : 'none');
      T(M.legP, 'rotate(' + (28 * Math.sin(TAU * 7 * tf)).toFixed(2) + 'deg)');
      for (k = 0; k < 6; k++) { O(M.rings[k], si === 3 ? 1 : 0); T(M.rings[k], 'scale(' + (.975 + .075 * Math.sin(TAU * 2 * tf + k)).toFixed(3) + ')'); }
      T(M.pC, si === 5 ? 'scale(1.08)' : 'none');
      M.cards.forEach(function (c, n) {
        var fp = Math.round((3 + 5 * [.70, .77, .84][n]) * 24), kk = eOutExpo(seg(f, fp, fp + 3)), fx = fp + 4;
        var stamp = f >= fx ? 1 + .15 * (1 - seg(f, fx, fx + 2)) : 1;
        O(c.el, kk); T(c.el, 'translateY(' + px(24 * (1 - kk)) + ') scale(' + stamp.toFixed(3) + ')');
        T(c.b1, 'rotate(45deg) scaleY(' + seg(f, fx, fx + 2).toFixed(3) + ')');
        T(c.b2, 'rotate(-45deg) scaleY(' + seg(f, fx + 2, fx + 4).toFixed(3) + ')');
      });
      T(M.meter, (u > .8 ? 'translateX(' + (f % 2 ? 1 : -1) + 'px) ' : '') + 'scaleY(' + (.15 + .8 * u * u).toFixed(3) + ')');
      X(M.chip, 'CUT ' + (si + 1) + ' · AVG 1.6s'); // placeholder — replace
    }

    if (b === 2) { // DEMO
      var fw = 288, w = eInOutCubic(seg(f, fw, fw + 5));
      O(M.d1, u < .25 ? 1 : 0); O(M.d2, u >= .25 && f < fw + 5 ? 1 : 0); O(M.d3, f >= fw ? 1 : 0);
      // D1 turntable
      var th = 360 * eInOutCubic(seg(u, 0, .25)), cs = Math.cos(th * Math.PI / 180), sx = .88 + .12 * Math.abs(cs);
      T(M.label, 'translateX(' + px(((th / 360) * 140) % 140 - 140) + ')');
      T(M.bottle, 'scaleX(' + sx.toFixed(3) + ')'); T(M.shadow, 'scaleX(' + sx.toFixed(3) + ')');
      T(M.spec, 'translateX(' + px(24 * cs) + ')');
      var fade = 1 - seg(u, .23, .25);
      M.callouts.forEach(function (c) {
        var fs = 192 + c.u * 192, lk = eOutExpo(seg(f, fs, fs + 5)), lb = eOutExpo(seg(f, fs + 5, fs + 9));
        O(c.g, f >= fs ? fade : 0);
        T(c.ln, 'rotate(' + c.rot + 'deg) scaleX(' + lk.toFixed(3) + ')');
        O(c.lb, lb); T(c.lb, 'translateX(' + px(4 * (1 - lb)) + ')');
      });
      // D2 hand + sprays
      T(M.hand, 'translateX(' + px(324 * (1 - eOutExpo(seg(u, .25, .30)))) + ')');
      T(M.d2, 'translateX(' + px(-270 * w) + ')');
      var recoil = 0;
      M.parts.forEach(function (p) {
        var s0 = p.burst ? .42 : .34, kk = seg(u, s0, s0 + .04), e = eOutCubic(kk);
        O(p.el, kk > 0 && kk < 1 ? 1 - kk : 0);
        T(p.el, 'translate(' + px(p.vx * e) + ',' + px(p.vy * e) + ') scale(' + (1 - .5 * kk).toFixed(3) + ')');
      });
      [.34, .42].forEach(function (s0) { var fs = Math.round(192 + s0 * 192); if (f >= fs && f < fs + 2) recoil = 3; });
      T(M.bt2, recoil ? 'translateX(3px)' : 'none');
      for (k = 0; k < 8; k++) O(M.whip[k], w > 0 && w < 1 ? .3 : 0);
      // D3 wipe + D4 zoom
      T(M.d3, 'translateX(' + px(270 * (1 - w)) + ')');
      var ww = u <= .68 ? eInOutQuart(seg(u, .53, .68)) : 1 - .5 * eOutCubic(seg(u, .68, .76));
      ww += (1 - ww) * eInOutCubic(seg(u, .76, .80)); // finish on AFTER before the close-up, no seam
      T(M.wipe, 'translateX(' + px((ww - 1) * 270) + ')'); T(M.after, 'translateX(' + px((1 - ww) * 270) + ')');
      T(M.div, 'translateX(' + px(ww * 270) + ')'); O(M.div, 1 - seg(u, .76, .80));
      C(M.d3, 'zclip', u >= .8);
      var lf2 = 1 - seg(u, .76, .80); // labels + divider leave before the close-up zoom
      O(M.afterL, seg(ww, .4, .6) * lf2); O(M.befL, lf2);
      var zp = eInOutCubic(seg(u, .83, .92)), ps = 1 + 1.4 * zp + .1 * seg(u, .92, 1);
      T(M.dz, 'scale(' + ps.toFixed(4) + ')');
      var fb = Math.round(192 + .8 * 192), stp = f >= fb ? 1.3 - .3 * seg(f, fb, fb + 4) : 1;
      var bs = (1 + 1.6 * zp) * stp;
      O(M.brk, f >= fb ? 1 : 0); T(M.brk, 'scale(' + bs.toFixed(4) + ')');
      O(M.brkL, f >= fb ? 1 : 0); T(M.brkL, 'translate(' + px(150 - 45 * bs) + ',' + px(200 + 45 * bs + 6) + ')');
      X(M.chip, u >= .8 ? 'SCALE ' + Math.round(100 * ps) + '%' : u >= .5 ? 'SHOT 3/4' : u >= .42 ? 'SPRAY 2/2' : u >= .34 ? 'SPRAY 1/2' : u >= .25 ? 'SHOT 2/4' : 'SHOT 1/4');
    }

    if (b === 3) { // PROOF
      var n = Math.round(2341 * eOutCubic(u)).toLocaleString('en-US');
      X(M.revH, '4.8 ★ AVG · ' + n + ' REVIEWS');
      var arr = M.revs.map(function (r) { var fs = 384 + Math.round(r.u * 168); return { fs: fs, k: eOutExpo(seg(f, fs, fs + 6)) }; });
      M.revs.forEach(function (r, i2) {
        var depth = 0; for (j = i2 + 1; j < 3; j++) depth += arr[j].k;
        O(r.el, arr[i2].k);
        T(r.el, 'translateY(' + px(60 * (1 - arr[i2].k) - 72 * depth) + ') scale(' + (1 - .04 * depth).toFixed(3) + ')');
        r.st.forEach(function (s, q) { O(s, f >= arr[i2].fs + 5 + q * 2 ? 1 : .2); });
      });
      X(M.chip, '★ 4.8 · ' + n); // placeholder — replace
    }

    if (b === 4) { // OFFER
      T(M.strike, 'scaleX(' + seg(u, .20, .28).toFixed(3) + ')');
      O(M.p29, f >= 576 ? 1 : 0); T(M.p29, 'scale(' + (2.6 - 1.6 * eOutExpo(seg(f, 576, 580))).toFixed(3) + ')');
      var ok = eOutExpo(seg(f, 605, 609)); O(M.offT, ok); T(M.offT, 'translateY(' + px(12 * (1 - ok)) + ')');
      X(M.chip, 'AOV $29'); // placeholder — replace
    }

    if (b === 5) { // CTA
      var bk = eOutExpo(seg(u, 0, .10)), tap = f >= 696 && f < 698;
      var pulse = M.still ? 1 : 1 + .05 * Math.max(0, Math.sin(TAU * 2 * tf));
      T(M.btn, 'translateY(' + px(40 * (1 - bk)) + ') scale(' + (tap ? .94 : pulse).toFixed(3) + ')');
      O(M.btn, bk);
      var rr = seg(f, 696, 704);
      O(M.ripple, f >= 696 && rr < 1 ? .6 * (1 - rr) : 0); T(M.ripple, 'scale(' + (3 * rr).toFixed(3) + ')');
      var fm = eOutCubic(seg(u, .20, .45));
      T(M.finger, 'translate(' + px(210 + (135 - 210) * fm - 12) + ',' + px(430 + (296 - 430) * fm - 12) + ')');
      T(M.arrow, 'translateY(' + px(M.still ? 0 : 4 * Math.sin(TAU * 1.5 * tf)) + ')');
      O(M.black, seg(u, .9, 1)); O(M.loop, u >= .96 ? 1 : 0);
      X(M.chip, 'CTR 2.4%'); // placeholder — replace
    }

    // captions
    M.blocks.forEach(function (bk2) {
      var vis = tf + 1e-6 >= bk2.a && tf < bk2.b;
      O(bk2.el, vis ? 1 : 0);
      if (!vis) return;
      var act = -1;
      bk2.words.forEach(function (wd, q) { if (tf + 1e-6 >= wd.t0) act = q; });
      bk2.words.forEach(function (wd, q) {
        if (q > act) { O(wd.w, bk2.kar ? .35 : 0); O(wd.inv, 0); T(wd.el, 'none'); }
        else if (q === act) { O(wd.w, 1); O(wd.inv, 1); T(wd.el, 'scale(' + (1.4 - .4 * eOutBack(seg(f, wd.f0, wd.f0 + 3))).toFixed(3) + ')'); }
        else { O(wd.w, 1); O(wd.inv, 0); T(wd.el, 'none'); }
      });
    });

    X(M.tc, tc(f));
    if (!M.still) { X(M.fc, 'F ' + pad(f, 4) + ' / 0720'); X(M.btag, 'B' + (b + 1) + ' ' + B.name); }
  }

  /* ============================================================
     Section wiring
     ============================================================ */
  var scroll = $('#an-scroll'), scroller = $('#tl-scroller'), track = $('#tl-track'), ph = $('#tl-playhead'), trail = $('#tl-trail');
  var tcEl = $('#an-tc'), mtc = $('#an-mtc'), titleEl = $('#an-title'), bodyEl = $('#an-body'), statEl = $('#an-stat'), idxEl = $('#an-idx');
  var waveMask = $('#wave-mask'), waveLit = $('#wave-lit'), razor = $('#tl-razor'), rzl = $('#rz-l'), shutEl = $('#pm-shuttle');
  var chapters = $$('#an-chapters button'), clips = $$('#tl-v1 .clip'), tlRegion = $('#tl'), playBtn = $('#pm-play'), verb = $('#an-verb');
  var MTR = [$('#mtr-l'), $('#mtr-r'), $('#mtr-pk')];
  var well = $('#pm-well'), rtHost = $('#rt'), spark = $('#an-spark');
  titleEl.__splitable = bodyEl.__splitable = true;

  // Waveform bars (two copies; the lit copy sits in a two-translate mask)
  var waveA = [], waveB = [];
  [['#wave', waveA], ['#wave-lit', waveB]].forEach(function (p) {
    var w = $(p[0]); if (!w) return;
    var frag = doc.createDocumentFragment();
    BARS.forEach(function (hh) { var bi = doc.createElement('i'); bi.style.height = hh + '%'; frag.appendChild(bi); p[1].push(bi); });
    w.appendChild(frag);
  });

  // Ruler beat markers
  var ruler = $('#tl-ruler');
  AD.beats.forEach(function (b) { mk(ruler, 'rb', 'left:' + (b.s / 30 * 100) + '%'); });

  // T1 caption lane
  var t1 = $('#tl-t1'), T1 = [];
  AD.caps.forEach(function (bk) {
    var ws = []; bk[3].forEach(function (ln) { ln[2].forEach(function (w) { ws.push(w[1]); }); });
    ws.forEach(function (t0, q) {
      var t1e = q < ws.length - 1 ? ws[q + 1] : bk[1];
      T1.push({ a: t0, b: t1e, el: mk(t1, 't1w', 'left:' + (t0 / 30 * 100) + '%;width:' + ((t1e - t0) / 30 * 100) + '%') });
    });
  });

  // V1 sub-clips + thumbnails, keyframe diamonds, transition markers
  var v1 = $('#tl-v1'), SUBS = [];
  clips.forEach(function (c, i2) {
    var B = AD.beats[i2];
    B.cuts.forEach(function (cs, q) {
      var e = q < B.cuts.length - 1 ? B.cuts[q + 1] : B.e;
      var sp = mk(c, 'sub', 'left:' + ((cs - B.s) / (B.e - B.s) * 100) + '%;width:' + ((e - cs) / (B.e - B.s) * 100) + '%', null, 'span');
      sp.setAttribute('aria-hidden', 'true');
      glyph(mk(sp, 'th', null, null, 'span'), B.th[q]);
      SUBS.push({ el: sp, d: e - cs });
    });
  });
  var KF = [];
  AD.keys.forEach(function (pr) {
    mk(v1, 'kfl', 'left:' + (pr[0] / 30 * 100) + '%;width:' + ((pr[1] - pr[0]) / 30 * 100) + '%');
    pr.forEach(function (tk) { var d = mk(v1, 'kf', 'left:' + (tk / 30 * 100) + '%'); mk(d, '', null, null, 'i'); KF.push({ t: tk, el: d }); });
  });
  AD.trans.forEach(function (tt) { mk(v1, 'trm', 'left:' + (tt / 30 * 100) + '%'); });

  // Cut flashes (one per sub-clip boundary)
  var CF = CUTS.map(function (c) { return { c: c, el: mk(track, 'cf', 'left:' + (c / 30 * 100) + '%'), last: 0, alt: 0 }; });

  // Toolbar
  var tools = $('#tl-tools'), rzTool;
  if (tools) {
    var tg = function (d) { var s = mk(tools, 'tg', null, null, 'span'); s.innerHTML = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1">' + d + '</svg>'; return s; };
    tg('<path d="M2 1 L2 10 L4.5 7.5 L6.5 11 L8 10.3 L6 7 L9.5 7 Z"/>');
    rzTool = tg('<path d="M6 1 V11 M3 4 H9 M3 4 L1 2 M9 4 L11 2"/>');
    tg('<path d="M1 6 H11 M1 6 L3 4 M1 6 L3 8 M11 6 L9 4 M11 6 L9 8"/>');
    mk(tools, 'tab', null, 'SEQ 01', 'span'); mk(tools, '', null, 'SNAP ON', 'span');
    var z = mk(tools, 'zoom', null, null, 'span'); mk(z, '', null, '−', 'span'); mk(z, '', null, null, 'i'); mk(z, '', null, '+', 'span');
  }

  // Chapters: in-times from AD
  chapters.forEach(function (c, i2) { var tt = c.querySelector('.ch-t'); if (tt) tt.textContent = '00:' + pad(AD.beats[i2].s); });

  // Program monitor (main instance)
  var MON = null, frame = null;
  if (well) {
    frame = mk(well, 'pm-frame'); var scrn = mk(frame, 'pm-screen');
    MON = buildMon(false); scrn.appendChild(MON.scr);
  }
  // Retention panel + mobile sparkline
  var RT = null, SP = null, holdEl, diffEl, spHold;
  if (rtHost) {
    var head = mk(rtHost, 'rt-head');
    mk(head, 'label muted', null, 'RETENTION', 'span');
    var hb = mk(head, 'rt-hold');
    var hl = mk(hb, 'label', null, null, 'span'); hl.innerHTML = 'HOLD&nbsp; ';
    holdEl = mk(hl, 'rt-val', null, '100%', 'span');
    diffEl = mk(hb, 'micro muted', 'display:block;margin-top:4px', '+0 VS AVG');
    RT = buildGraph(rtHost, true);
    var lg = mk(rtHost, 'rt-legend micro muted'); lg.innerHTML = '<span><i></i>THIS CUT</span><span><i class="d"></i>AVG AD</span>';
    mk(rtHost, 'rt-note micro muted', null, 'Illustrative curve.');
  }
  if (spark) { var sh2 = mk(spark, 'label', null, null, 'span'); sh2.innerHTML = 'HOLD '; spHold = mk(sh2, 'rt-val', 'font-size:inherit;font-weight:400', '100%', 'span'); SP = buildGraph(spark, false); }

  /* ---------- Mode, measure ---------- */
  var mode = '', top = 0, height = 1, trackW = 1, vis = false;
  var cur = { t: 0, f: -1, b: -1, rate: 0, rS: 0, shut: '', shutN: 0, shutC: '', trail: 0, pk: 0, waveIdx: [], playing: false, played: false, slam: 0 };

  function warp(p) { var W = AD.warp; for (var q = 1; q < W.length; q++) if (p <= W[q][0]) return W[q - 1][1] + (W[q][1] - W[q - 1][1]) * (p - W[q - 1][0]) / (W[q][0] - W[q - 1][0]); return 30; }
  function unwarp(t) { var W = AD.warp; for (var q = 1; q < W.length; q++) if (t <= W[q][1] && W[q][1] > W[q - 1][1]) return W[q - 1][0] + (W[q][0] - W[q - 1][0]) * (t - W[q - 1][1]) / (W[q][1] - W[q - 1][1]); return 1; }

  function measure() {
    if (mode === 'static' || !MON) return;
    top = JM.docTop(scroll); height = scroll.offsetHeight; trackW = track.offsetWidth || 1;
    var W, H, iw, ih;
    if (mode === 'scrub') { W = well.clientWidth; H = well.clientHeight; ih = H - 14; iw = ih * 9 / 16; if (iw + 14 > W) { iw = W - 14; ih = iw * 16 / 9; } }
    else { W = $('#pm').clientWidth; iw = W - 14; ih = iw * 16 / 9; }
    frame.style.width = px(iw + 14); frame.style.height = px(ih + 14);
    frame.style.setProperty('--k', (iw / 270).toFixed(4));
    C(frame, 'pm-small', iw / 270 < .8); C(frame, 'pm-wide', iw > 330);
    SUBS.forEach(function (sb) { C(sb.el, 'no-th', sb.d / 30 * trackW < 60); });
    [RT, SP].forEach(function (g) { if (g) { g.W = g.plot.clientWidth || 300; g.H = g.plot.clientHeight || 150; } });
    cur.f = -1; MON.f = -1; cur.force = true;
  }

  var stillsBuilt = false;
  function buildStills() {
    if (stillsBuilt) return; stillsBuilt = true;
    $$('#beats-list li').forEach(function (li, i2) {
      var M = buildMon(true), host = mk(null, 'pm-still');
      host.setAttribute('aria-hidden', 'true');
      host.appendChild(M.scr); li.insertBefore(host, li.firstChild); li.classList.add('has-still');
      renderMon(M, AD.stills[i2], 0);
    });
  }

  function setMode() {
    var m = JM.isReduced() ? 'static' : (JM.mqDesk.matches && win.innerHeight >= 600 ? 'scrub' : 'strip');
    if (m === mode) return; mode = m;
    sec.classList.toggle('is-scrub', m === 'scrub'); sec.classList.toggle('is-strip', m === 'strip');
    if (verb) verb.textContent = m === 'strip' ? 'Swipe to scrub.' : m === 'static' ? 'Frame by frame.' : 'Scroll to scrub.';
    if (playBtn) playBtn.hidden = m !== 'strip';
    stopPlay();
    T(ph, 'none'); T(waveMask, 'none'); T(waveLit, 'none');
    clips.forEach(function (c) { C(c, 'is-played', false); C(c, 'is-active', false); });
    if (m === 'static') {
      buildStills();
      if (RT) { RT.W = RT.plot.clientWidth || 300; RT.H = RT.plot.clientHeight || 150; graphAt(RT, 30, true); X(holdEl, HOLD[720].toFixed(0) + '%'); X(diffEl, '+' + Math.round(HOLD[720] - AVG[720]) + ' VS AVG'); }
      T1.forEach(function (w) { C(w.el, 'is-on', false); C(w.el, 'is-done', true); });
      JM.measureAll(); return;
    }
    cur.b = -1; cur.f = -1;
    measure(); JM.measureAll();
    render(mode === 'strip' ? clamp(scroller.scrollLeft / trackW, 0, 1) * 30 : warp(progress()), performance.now(), 0);
  }
  function progress() { return clamp((S.smooth - top) / Math.max(1, height - S.vh), 0, 1); }

  /* ---------- Per-frame + per-rAF updates ---------- */
  function setBeat(b) {
    var first = cur.b === -1; cur.b = b;
    var B = AD.beats[b];
    titleEl.innerHTML = '<span class="thin">the</span><br>' + B.name; // constant strings only
    if (!first) {
      titleEl.classList.remove('slamA', 'slamB');
      titleEl.classList.add((cur.slam = 1 - cur.slam) ? 'slamA' : 'slamB');
      JM.swapText(bodyEl, B.body, 60);
    } else bodyEl.textContent = B.body;
    statEl.textContent = B.stat;
    X(idxEl, pad(b + 1) + ' / 06 · 00:' + pad(B.s) + ' → 00:' + pad(B.e));
    chapters.forEach(function (c, q) { C(c, 'is-active', q === b); c.setAttribute('aria-current', q === b ? 'step' : 'false'); });
  }

  function render(t, now, dt) {
    var f = clamp(Math.floor(t * 24 + 1e-6), 0, 720), p = t / 30;
    // per rAF: rate, shuttle, trail, playhead, masks, wave reaction, meters, graph
    if (dt > 0) { cur.rate = (t - cur.t) / dt; cur.rS += (cur.rate - cur.rS) * .25; } else cur.rS *= .8;
    var prevT = cur.t; cur.t = t;
    var r = cur.rS, ar = Math.abs(r);
    var st = ar < .05 ? '❚❚' : (r > 0 ? '▶ ' : '◀ ') + Math.min(9.9, ar).toFixed(1) + '×';
    if (st !== cur.shutC) { cur.shutC = st; cur.shutN = 0; }
    if (++cur.shutN >= 3 && st !== cur.shut) { cur.shut = st; X(shutEl, st); if (MON) X(MON.shut, st); }
    if (mode === 'scrub') T(ph, 'translate3d(' + px(p * (trackW - 1)) + ',0,0)');
    T(waveMask, 'translate3d(' + ((p - 1) * 100).toFixed(3) + '%,0,0)');
    T(waveLit, 'translate3d(' + ((1 - p) * 100).toFixed(3) + '%,0,0)');
    cur.trail += (clamp(ar / 4, 0, 1) - cur.trail) * .2;
    O(trail, cur.trail < .01 ? 0 : cur.trail); T(trail, r < 0 ? 'scaleX(-1)' : 'none');
    var wi = Math.floor(p * 240), next = [], k;
    var react = Math.min(1, ar / 2);
    if (react > .02) for (k = -4; k <= 4; k++) { var ix = wi + k; if (ix >= 0 && ix < 240) next.push([ix, 1 + .45 * (1 - Math.abs(k) / 5) * react]); }
    cur.waveIdx.forEach(function (ix) { if (!next.some(function (n) { return n[0] === ix; })) { T(waveA[ix], 'none'); T(waveB[ix], 'none'); } });
    next.forEach(function (n) { var s = 'scaleY(' + n[1].toFixed(3) + ')'; T(waveA[n[0]], s); T(waveB[n[0]], s); });
    cur.waveIdx = next.map(function (n) { return n[0]; });
    var mL = amp(t) * Math.min(1, ar), mR = amp(t + 1 / 24) * Math.min(1, ar);
    cur.pk = Math.max(cur.pk - .6 * (dt || 0), mL);
    T(MTR[0], 'scaleY(' + mL.toFixed(3) + ')'); T(MTR[1], 'scaleY(' + mR.toFixed(3) + ')'); T(MTR[2], 'translateY(' + px(-cur.pk * 28) + ')');
    if (RT && mode === 'scrub') graphAt(RT, t, false);
    if (SP && mode === 'strip') graphAt(SP, t, false);
    chapters.forEach(function (c, q) { var B = AD.beats[q]; T(c.__fill || (c.__fill = c.querySelector('.ch-p i')), 'scaleX(' + clamp((t - B.s) / (B.e - B.s), 0, 1).toFixed(3) + ')'); });

    // crossings: cut flashes, retention ticks, razor loupe
    if (dt > 0 && t !== prevT) {
      var lo = Math.min(prevT, t), hi = Math.max(prevT, t);
      CF.forEach(function (c) {
        if (c.c > lo && c.c <= hi && now - c.last > 200) {
          c.last = now; c.alt = 1 - c.alt;
          c.el.classList.remove('is-flash', 'is-flash2'); c.el.classList.add(c.alt ? 'is-flash' : 'is-flash2');
          if (RT) RT.ticks.forEach(function (tk) { if (tk.c === c.c) { tk.el.classList.remove('is-flash', 'is-flash2'); tk.el.classList.add(c.alt ? 'is-flash' : 'is-flash2'); } });
        }
      });
      if (mode === 'scrub' && t > prevT && cur.rS <= 6) AD.beats.forEach(function (B) {
        if (B.s > 0 && B.s > prevT && B.s <= t) {
          T(razor, 'translate3d(' + px(clamp(B.s / 30 * trackW, 28, trackW - 28)) + ',0,0)');
          X(rzl, 'CUT ' + tc(B.s * 24));
          cur.rz = !cur.rz; razor.classList.remove('is-run', 'is-run2'); razor.classList.add(cur.rz ? 'is-run' : 'is-run2');
          if (rzTool) { rzTool.classList.add('is-on'); clearTimeout(cur.rzT); cur.rzT = setTimeout(function () { rzTool.classList.remove('is-on'); }, 420); }
        }
      });
    }

    // per ad frame
    if (f === cur.f && !cur.force) return;
    cur.f = f; cur.force = false;
    if (MON) renderMon(MON, t, now);
    var s = tc(f);
    X(tcEl, s); X(mtc, s);
    var b = beatAt(t);
    if (b !== cur.b) {
      var wasFirst = cur.b === -1;
      setBeat(b);
      if (!wasFirst) { tcEl.classList.add('is-cut'); clearTimeout(cur.cutT); cur.cutT = setTimeout(function () { tcEl.classList.remove('is-cut'); }, 80); }
    }
    var hv = HOLD[f];
    if (holdEl) { X(holdEl, Math.round(hv) + '%'); var dd = Math.round(hv - AVG[f]); X(diffEl, (dd >= 0 ? '+' : '') + dd + ' VS AVG'); }
    if (spHold) X(spHold, Math.round(hv) + '%');
    T1.forEach(function (w) { C(w.el, 'is-on', t >= w.a && t < w.b); C(w.el, 'is-done', t >= w.b); });
    clips.forEach(function (c, q) { C(c, 'is-played', q < b || (q === b && t > AD.beats[q].s + .01)); C(c, 'is-active', q === b); });
    KF.forEach(function (d) { C(d.el, 'is-on', t >= d.t); });
  }

  /* ---------- Strip mode: visibility, play ---------- */
  var stripDirty = true;
  on(scroller, 'scroll', function () { stripDirty = true; }, { passive: true });
  if ('IntersectionObserver' in win) {
    new IntersectionObserver(function (es) {
      vis = es[0].isIntersecting;
      if (vis && es[0].intersectionRatio >= .6 && mode === 'strip' && !cur.played) {
        var cn = navigator.connection; if (!(cn && cn.saveData)) startPlay();
      }
      if (!vis) stopPlay();
    }, { threshold: [0, .6] }).observe(sec.querySelector('.an-stage'));
  } else vis = true;
  function startPlay() {
    if (mode !== 'strip') return;
    cur.played = true; cur.playing = true; sec.classList.add('is-playing');
    if (cur.t >= 29.9) { cur.t = 0; scroller.scrollLeft = 0; }
    cur.playT = cur.t;
    if (playBtn) playBtn.innerHTML = '❚❚ PAUSE';
  }
  function stopPlay() {
    if (!cur.playing) return;
    cur.playing = false; sec.classList.remove('is-playing');
    if (playBtn) playBtn.innerHTML = '▶ PLAY <span class="muted">00:30</span>';
  }
  on(playBtn, 'click', function () { if (cur.playing) stopPlay(); else { cur.played = true; startPlay(); } });
  ['pointerdown', 'wheel', 'keydown'].forEach(function (ev) { on(scroller, ev, stopPlay, { passive: true }); });

  /* ---------- Jump + keyboard ---------- */
  function jump(i2) {
    i2 = clamp(i2, 0, 5); stopPlay();
    var behavior = JM.isReduced() ? 'auto' : 'smooth';
    if (mode === 'scrub') win.scrollTo({ top: top + unwarp(AD.beats[i2].s) * (height - S.vh) + 2, behavior: behavior });
    else if (mode === 'strip') scroller.scrollTo({ left: AD.beats[i2].s / 30 * trackW, behavior: behavior });
  }
  chapters.concat(clips).forEach(function (c) { on(c, 'click', function () { jump(Number(c.getAttribute('data-beat'))); }); });
  on(tlRegion, 'keydown', function (e) {
    if (mode === 'static') return;
    var b = Math.max(0, cur.b), map = { ArrowRight: b + 1, ArrowLeft: b - 1, Home: 0, End: 5 };
    if (e.key in map) { e.preventDefault(); jump(map[e.key]); }
  });

  /* ---------- Tick (inside main.js's single rAF) ---------- */
  var lastNow = 0;
  JM.ticks.push(function (now) {
    var dt = lastNow ? Math.min((now - lastNow) / 1000, .1) : 0; lastNow = now;
    if (mode === 'scrub') {
      if (S.smooth < top - S.vh || S.smooth > top + height) return;
      render(warp(progress()), now, dt);
    } else if (mode === 'strip') {
      if (!vis) return;
      if (cur.playing) {
        cur.playT = Math.min(30, cur.playT + dt);
        scroller.scrollLeft = cur.playT / 30 * trackW;
        render(cur.playT, now, dt);
        if (cur.playT >= 30) stopPlay();
        stripDirty = false;
      } else if (stripDirty || Math.abs(cur.rS) > .01) {
        if (stripDirty) cur.stripT = clamp(scroller.scrollLeft / trackW, 0, 1) * 30;
        stripDirty = false;
        render(cur.stripT == null ? cur.t : cur.stripT, now, dt);
      }
    }
  });

  JM.measures.push(measure);
  JM.listen(JM.mqDesk, setMode); JM.listen(JM.mqReduced, setMode);
  on(win, 'resize', function () { setMode(); });
  setMode();
})();
