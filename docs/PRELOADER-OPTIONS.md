# Preloader V2: Options + Build Spec

Addendum to `docs/DESIGN.md` §3.0 (Preloader) and §4.10 (Page-load sequence). Where this file and DESIGN.md disagree on the preloader, this file wins. Tokens, type scale, copy rules (no em dashes in visible copy) and the z-index stack are unchanged.

Client brief: make the loading screen "cooler and more advanced", something that feels like a video editor made it. Their idea: "an export loading screen, something like that".

Hard constraints (unchanged): black, white and the five grays. Helvetica 700 / 400 / 200. Vanilla JS. Animate transforms and opacity only, 60fps. Total 2.5 to 3.5s. Never blocks content for long, fails open if JS breaks. Skip on repeat visit in the same session. Reduced-motion path. Works at 375px.

---

## 0. What exists today (audit)

Files: `index.html` lines 29 to 37, `assets/css/style.css` lines 158 to 178, `assets/js/main.js` `initPreloader()` (lines 407 to 459) and the ticker in `initTimecodes()` (line 72).

- Markup: four corner labels (`● REC`, `LOADING FOOTAGE`, `JHON MEDIA`, a 24fps timecode), a mega counter `000` and a 1px bar on the bottom edge.
- Progress: eases to 90 over 1600ms, finishes when `document.fonts.ready` and the first 4 thumbnails resolve (min 1500ms, max 2800ms), or after 1200ms if the user scrolls or presses a key. Runs the last stretch to 100 in 150ms.
- At 100: weight cut 200 to 700, 150ms hold, then `clip-path: inset(0 0 100% 0)` wipe over 1200ms. `finishLoad()` (hero entrance) fires 720ms into the wipe; `is-done` at 1250ms.
- Repeat visit: `sessionStorage['jm-preloader'] === '1'` adds `html.pl-skip`, no preloader.
- Reduced motion: shows `100` bold and a full bar for 300ms, fades 200ms.
- Fail-open: the `<head>` safety timer removes `html.js` after 3500ms if `main.js` never sets `window.__jmReady`.

Problems worth fixing whatever we pick:

1. **The wipe animates `clip-path`.** That breaks the "transforms and opacity only" rule and is not compositor-only on every browser. The new exit must be a `transform`.
2. **The fail-open has a hole.** `window.__jmReady = true` (main.js line 789) runs *before* `safe('preloader', initPreloader)`. If the preloader throws inside its rAF loop, the head safety timer is already cleared and the preloader covers the page forever. Needs its own JS watchdog plus a pure-CSS failsafe.
3. **Forced layout every frame.** The ticker reads `plEl.offsetParent` every frame while the preloader writes text. Remove `data-tc="preloader"` from the new markup so that branch is skipped.
4. **Worst case is long.** 2800 + 150 + 150 + 1250 = 4350ms before `is-done`. The new spec caps the whole thing at 3500ms.
5. **Overlap to avoid.** The Anatomy section (`docs/TIMELINE-V2.md`) already does the Premiere timeline, playhead, HOOK / PROBLEM / DEMO clips and the 9:16 program monitor. That is the site's wow moment. The preloader should not spend those ideas in the first 3 seconds.

---

## 1. Concept A: Export (Media Encoder export panel, type-led)

The page loads as an export of the portfolio. It is not a drawn software window with fake chrome. It uses the same four-corner, mega-number layout as today, rewritten as an export readout. The joke is the filename, which cuts through six versions before it settles on `FINAL_v7`. Every editor and every DTC founder who has given notes will get it.

### Wireframe: desktop (1440 × 900)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ JHON MEDIA                                                ● EXPORTING      │
│                                                                            │
│                                                                            │
│                                                                            │
│                                                                            │
│ JHON_MEDIA_PORTFOLIO_FINAL_v7.mp4                                          │
│ H.264 · 1080x1920 · 9:16 · 30FPS                                           │
│                                                                            │
│ ███   ██   ██████  %                                                       │
│ █ █  █  █     ██                    (mega, weight 200, "072")              │
│ ███   ██     ██                                                            │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━──────────────────────────── │
│ FRAME 518 / 720          ELAPSED 00:01:12           REMAINING 00:00:14     │
│ > Cutting dead air…                                     (mute)             │
│ > Rendering captions…                                   (mute)             │
│ > Color matching UGC…                                   (white, current)   │
└────────────────────────────────────────────────────────────────────────────┘
```

### Wireframe: mobile (375 × 667)

```
┌───────────────────────────────────┐
│ JHON MEDIA          ● EXPORTING   │
│                                   │
│                                   │
│                                   │
│                                   │
│                                   │
│                                   │
│ JHON_MEDIA_PORTFOLIO_FINAL_v7.mp4 │
│ H.264 · 1080x1920 · 9:16 · 30FPS  │
│                                   │
│ 072%            (64px, wt 200)    │
│ ━━━━━━━━━━━━━━━━━━──────────────  │
│ FRAME 518 / 720  REMAINING 00:00:14│
│ > Color matching UGC…             │
└───────────────────────────────────┘
```

(ELAPSED is hidden below 768px. One log line is visible.)

### Copy

- Top-left: `JHON MEDIA`
- Top-right: `● EXPORTING`, then `● EXPORT COMPLETE` at 100.
- Filename sequence, hard cuts every 180ms:
  1. `JHON_MEDIA_PORTFOLIO.mp4`
  2. `JHON_MEDIA_PORTFOLIO_v2.mp4`
  3. `JHON_MEDIA_PORTFOLIO_FINAL.mp4`
  4. `JHON_MEDIA_PORTFOLIO_FINAL_v2.mp4`
  5. `JHON_MEDIA_PORTFOLIO_FINAL_FINAL.mp4`
  6. `JHON_MEDIA_PORTFOLIO_FINAL_v7.mp4` (stays)
- Spec line: `H.264 · 1080x1920 · 9:16 · 30FPS`
- Big number: `000` to `100`, then `%`.
- Stats: `FRAME 000 / 720`, `ELAPSED 00:00:00`, `REMAINING --:--:--`
- Log (in order): `Conforming sequence to 9:16…`, `Encoding hook (first 3s)…`, `Cutting dead air…`, `Rendering captions…`, `Color matching UGC…`, `Syncing SFX to cuts…`, `Muxing audio…`, `Export complete. 0 dropped frames.`

### Beats

| t (ms) | Beat | Easing |
|---|---|---|
| 0 | Panel painted at its start state (v1 name, `000`, bar 0). Dot pulsing. | none |
| 0 to 900 | Filename cuts v1 to v7, one every 180ms. | hard cut (textContent) |
| 0 to 1300 | Progress eases 0 to 90. Bar, frame, elapsed and remaining all follow it. | cubic out |
| per threshold | New log line slides up one row. | 240ms `--ease-out` |
| 1600 to 2100 | Finish trigger: assets ready and t ≥ 1600, or t ≥ 2100, or skip and t ≥ 800. | none |
| F to F+200 | Run to 100. | quad out |
| C = F+200 | Weight cut 200 to 700, `EXPORT COMPLETE`, dot stops, last log line. | single frame |
| C+300 | Exit: whole preloader `translateY(-100%)`. Content inside counter-drifts down by 25vh. | 900ms `--ease-in-out` |
| C+840 | `finishLoad()`: hero entrance starts (60% into the exit). | existing |
| C+1250 | `is-done`, display none. | none |

Total: about 3050ms on a fast load, 3550ms at the cap, 2250ms with an early skip. Hero starts 2640ms (fast) to 3140ms (cap).

### Hand-off

The 1px progress line is the bottom edge of the panel. When the panel lifts, that full-width white line rides up the screen as the leading edge, like a render bar becoming a wipe. The hero headline rises under it from 60% of the lift. Same choreography as today, but compositor-only.

### Reduced motion

Static final state: v7 filename, `100%` bold, full bar, `FRAME 720 / 720`, `REMAINING 00:00:00`, log shows `Export complete. 0 dropped frames.`, status `● EXPORT COMPLETE` with a solid dot. Hold 300ms, then fade opacity over 200ms. Total 500ms.

### Build complexity + risks

Low to medium. It is the same DOM pattern as today plus about 10 text nodes. Risks: (1) small text changing every frame can reflow. Mitigated with tabular nums and fixed-width spans. (2) The filename at 375px: the longest name (`..._FINAL_FINAL.mp4`, 36 chars) must fit in 343px. Spec sets 13px with 0.02em tracking (about 290px) and clips overflow. (3) The log ticks every 250ms or so, which is readable on desktop but only flavour on mobile. That is acceptable.

### Scores

| Brand resonance | Wow | Elegance + restraint | Speed |
|---|---|---|---|
| 9 | 7 | 9 | 9 |

---

## 2. Concept B: Timeline render (playhead sweep)

A mini sequence of the anatomy of an ad sits in the middle of the screen: V2 captions, V1 clips, A1 audio. The playhead sweeps left to right with progress. Clips switch from outline to filled behind it, and a render bar above the ruler turns from dashed gray to solid white.

### Wireframe: desktop

```
┌────────────────────────────────────────────────────────────────────────────┐
│ JHON MEDIA                                          RENDERING IN TO OUT    │
│                                                                            │
│          00:00        00:05        00:10     ▼   00:15        00:20        │
│  RENDER  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│- - - - - - - - - - - - -   │
│  V2      [▓▓ CAPTION ▓▓][▓▓▓ CAPTION ▓▓▓▓][▓│▓] [ caption ]  [ caption ]   │
│  V1      [▓ HOOK ▓][▓ PROBLEM ▓][▓▓ DEMO ▓▓▓│▓▓▓][ proof  ][ offer][ cta ]│
│  A1      ▁▃▅▂▇▃▁▅▃▂▆▃▁▂▅▇▃▂▁▃▅▂▁▆▃▂▅▁▃▂▇▁▃│▅▂▁▃▅▂▁▃▆▂▁▅▃▂▁▃▅▂▁▃▅▂▁       │
│                                              │                             │
│ 00:00:13:02                                                         054%   │
└────────────────────────────────────────────────────────────────────────────┘
```

### Wireframe: mobile

```
┌───────────────────────────────────┐
│ JHON MEDIA        RENDERING       │
│                                   │
│  ━━━━━━━━━━━━━━━│- - - - - - - -  │
│ [▓HOOK▓][▓DEMO▓│▓][ proof ][ cta ]│
│ ▁▃▅▂▇▃▁▅▃▂▆▃▁▂▅│▃▂▁▃▅▂▁▆▃▂▅▁▃▂▇  │
│                                   │
│ 00:00:13:02                 054%  │
└───────────────────────────────────┘
```

(Mobile has one video track and four clips: HOOK, DEMO, PROOF, CTA.)

### Copy

Top-left `JHON MEDIA`. Top-right `RENDERING IN TO OUT`, then `RENDERED`. Clip labels `HOOK`, `PROBLEM`, `DEMO`, `PROOF`, `OFFER`, `CTA`. Bottom-left 30fps timecode. Bottom-right `000%` to `100%`.

### Beats

| t (ms) | Beat | Easing |
|---|---|---|
| 0 to 200 | Tracks fade in, staggered 40ms. | opacity, `--ease-out` |
| 200 to 1800 | Playhead `translateX` 0 to 100% of the track width. Clip fills (`scaleX` from left, clipped by a parent) trail it. | cubic out to 90%, then held for readiness |
| per clip | As the playhead crosses a clip edge, the clip label goes from mute to white. | 120ms `--ease-snap` |
| F to F+200 | Run to the end. | quad out |
| C | All tracks lit. The playhead line holds for 150ms. | none |
| C+150 | The tracks collapse (`scaleY` to 0) into one hairline at centre. | 300ms `--ease-in-out` |
| C+450 | Panel lifts `translateY(-100%)`. `finishLoad()` at 60%. | 900ms `--ease-in-out` |

Total: about 3.1s fast, 3.5s max.

### Hand-off

The timeline collapses to a hairline, then the panel lifts. It reads as "render done, close sequence".

### Reduced motion

Static, fully rendered timeline with the playhead at the out point and `100%`. Hold 300ms, fade 200ms.

### Build complexity + risks

Medium. There are about 30 positioned elements, and the waveform can be a static repeating gradient. **Main risk: it previews the Anatomy section** (same tracks, same clip names, same playhead), so the site's biggest moment loses its surprise. On mobile, six labelled clips do not fit, so it has to drop to four.

### Scores

| Brand resonance | Wow | Elegance + restraint | Speed |
|---|---|---|---|
| 8 | 6 | 7 | 8 |

(Wow is scored down because it steals from Anatomy.)

---

## 3. Concept C: Slate + countdown leader + clap

A digital slate, then an Academy-style leader counting 3, 2, 1 with a sweeping hand. On the 2 there is a one-frame "2-pop" flash, an editor's in-joke. Then the clapper closes and cuts to the hero.

### Wireframe: desktop

```
Slate (0 to 700ms)                       Leader (700 to 2500ms)
┌───────────────────────────────────┐    ┌───────────────────────────────────┐
│ ╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲  (sticks)│    │                │                  │
│ ───────────────────────────────── │    │          ╭─────┼─────╮            │
│ PROD   JHON MEDIA                 │    │        ╭─╯  ╲  │     ╰─╮          │
│ ROLL   A007     SCENE  PORTFOLIO  │    │ ───────┤     ╲ 2     ├───────     │
│ TAKE   7        FPS    30         │    │        ╰─╮     │     ╭─╯          │
│ DATE   08.10.26                   │    │          ╰─────┼─────╯            │
│                                   │    │                │                  │
└───────────────────────────────────┘    └───────────────────────────────────┘
```

### Wireframe: mobile

Same, with the slate fields in one column and a leader circle of 72vw.

### Copy

`PROD JHON MEDIA`, `ROLL A007`, `SCENE PORTFOLIO`, `TAKE 7`, `FPS 30`, `DATE` (today, DD.MM.YY). Leader digits `3`, `2`, `1` at mega size, weight 700.

### Beats

| t (ms) | Beat | Easing |
|---|---|---|
| 0 to 150 | Slate fades in. | opacity linear |
| 150 to 600 | Clapper stick opens (`rotate(-14deg)`). | 450ms `--ease-out` |
| 700 | Cut to the leader at `3`. | hard cut |
| 700 to 2500 | The hand `rotate()`s 360° per second. The digit swaps every 600ms. Two half-disc masks fake the sweep fill. | linear |
| 1300 | `2` with a single 1-frame (16ms) flash at 0.4 opacity. | step |
| 2500 | Cut back to the slate, stick snaps shut (`rotate(0)`) in 80ms. | `--ease-snap` |
| 2600 | Hard cut to the hero. Preloader opacity 0 in 1 frame, `finishLoad()`. | step |

Total: 2.6 to 2.8s. **Fixed length.** A fast connection cannot shorten it, and a slow one cannot be honestly covered.

### Hand-off

The clap is the cut. Nothing eases out, which is the most "editor" hand-off of the four, but the hero entrance animation then plays on a page that has just flashed.

### Reduced motion

Slate only, static, stick closed. Hold 300ms, fade 200ms.

### Build complexity + risks

Medium to high. The sweep needs the two-half-disc rotate trick or an SVG mask to stay on transforms. Risks: the film-leader look is cinema and wedding-video, not TikTok and Meta, so it says "filmmaker" more than "performance ads". The countdown is the most skip-worthy thing on the list, since nobody wants to watch 3-2-1 on a portfolio. Flash frames need care (WCAG 2.3.1). It is also a well-worn trope.

### Scores

| Brand resonance | Wow | Elegance + restraint | Speed |
|---|---|---|---|
| 5 | 7 | 5 | 5 |

---

## 4. Concept D: Reframe to 9:16 (letterbox hand-off)

A 16:9 frame outline (four separate 1px lines) sits in the centre with a render fill rising inside it. At 50% it **reframes to 9:16**: the left and right lines slide inward and the top and bottom lines stretch. That is the move every DTC editor makes when turning a landscape shoot into a Reel. At 100 the interior fades, so the hero shows through a vertical window, then four black letterbox panels slide off to the screen edges.

(A render queue of site sections, `01_WORK.mp4`, `02_SERVICES.mp4` and so on, was considered and dropped: five rows ticking in turn reads as a list, not a moment, and feels slow.)

### Wireframe: desktop

```
Phase 1: 16:9 (0 to 900ms)                Phase 2: 9:16 (900 to 2000ms)
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│ JHON MEDIA              16:9 · 1920  │  │ JHON MEDIA          9:16 · 1080x1920 │
│      ┌──────────────────────────┐    │  │              ┌────────┐              │
│      │                          │    │  │              │        │              │
│      │        RENDERING         │    │  │              │  072%  │              │
│      │▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│    │  │              │▒▒▒▒▒▒▒▒│              │
│      └──────────────────────────┘    │  │              │▒▒▒▒▒▒▒▒│              │
│                                 031% │  │              └────────┘              │
└──────────────────────────────────────┘  └──────────────────────────────────────┘
Hand-off: interior fades, hero visible inside the 9:16 window, then panels slide out ← ↑ ↓ →
```

### Wireframe: mobile

On a portrait phone the 16:9 to 9:16 move is the same idea in a smaller box: 1:1 at 64vw becomes 9:16 at 46vw by 82vw. The letterbox hand-off works the same way.

### Copy

Top-left `JHON MEDIA`. Top-right `16:9 · 1920x1080`, then `9:16 · 1080x1920`. In the frame: `RENDERING`, then `000%` to `100%`. At 100: `READY`.

### Beats

| t (ms) | Beat | Easing |
|---|---|---|
| 0 to 900 | Fill rises (`scaleY`) to 45% inside the 16:9 frame. | cubic out |
| 900 to 1400 | Reframe: side lines `translateX` inward, top and bottom lines `scaleX`. The fill box scales to match. | 500ms `--ease-in-out` |
| 1400 to 2000 | Fill continues to 100% (held for readiness, max 2200). | cubic out |
| C | `READY`. Interior fill and label fade over 200ms, so the hero shows through the window. | linear |
| C+200 | Four panels slide out: left `-100%` X, right `+100%` X, top `-100%` Y, bottom `+100%` Y. | 800ms `--ease-in-out` |
| C+200 | `finishLoad()` fires at the start, because the hero is already partly visible. | existing |

Total: about 3.0 to 3.4s.

### Hand-off

The strongest of the four: the site literally opens as a vertical ad, then the bars part. Nothing else on the web looks quite like it.

### Reduced motion

Static 9:16 frame with `READY`. Hold 300ms, fade the whole preloader over 200ms. No panels.

### Build complexity + risks

High. The four panels must line up to the pixel with the frame at every viewport size, including resize during load. The hero is visible through a narrow window that crops the headline mid-word, which can look broken rather than intentional. On portrait phones the reframe is subtle. It also previews the Anatomy section's 9:16 program monitor, the same overlap problem as B.

### Scores

| Brand resonance | Wow | Elegance + restraint | Speed |
|---|---|---|---|
| 8 | 9 | 6 | 7 |

---

## 5. Comparison

| | Resonance | Wow | Elegance | Speed | Build | Steals from Anatomy |
|---|---|---|---|---|---|---|
| **A. Export** | **9** | 7 | **9** | **9** | Low to medium | No |
| B. Timeline render | 8 | 6 | 7 | 8 | Medium | Yes |
| C. Slate + leader | 5 | 7 | 5 | 5 | Medium to high | No |
| D. Reframe 9:16 | 8 | **9** | 6 | 7 | High | Partly |

---

## 6. Recommendation: A. Export

- **It is exactly what the client asked for**, and it is the one screen every editor has stared at for hours. "Export complete" is the moment a job is done, so it is the right first frame for a portfolio.
- **The joke does the work.** `FINAL_FINAL` to `FINAL_v7` costs zero extra time (it runs during real loading), it is human, and it tells a DTC brand that Jhon knows how revision rounds go. The 9:16 · 30FPS spec line says "I make vertical ads" without a sentence of copy.
- **It is the restrained one.** Type only, one big motion (the lift), and it keeps the site's signature thin-to-bold mega-number cut, so it feels like an upgrade, not a different site.
- **It is honest and fast.** Progress is tied to real loading, finishing in 3.0s typically and 3.5s at most. It leaves the 9:16 monitor and timeline for Anatomy to land as the big surprise.
- D has more wow but costs more to build, risks looking broken mid-hand-off and blurs into Anatomy. Its letterbox hand-off could come back later as a v2 exit for A if the client wants more.

---

## 7. Build spec: A. Export

### 7.1 DOM (replaces `index.html` lines 29 to 37)

```html
<!-- Preloader: export panel (docs/PRELOADER-OPTIONS.md §7) -->
<div class="preloader" id="preloader" aria-hidden="true">
  <div class="pl-inner" id="pl-inner">
    <div class="pl-top label">
      <span class="pl-brand">JHON MEDIA</span>
      <span class="pl-status"><i class="rec-dot"></i> <span id="pl-status">EXPORTING</span></span>
    </div>
    <div class="pl-main">
      <div class="pl-file" id="pl-file">JHON_MEDIA_PORTFOLIO.mp4</div>
      <div class="pl-spec">H.264 · 1080x1920 · 9:16 · 30FPS</div>
      <div class="pl-pct"><span class="pl-count" id="pl-count">000</span><span class="pl-sign">%</span></div>
      <div class="pl-track"><i class="pl-bar" id="pl-bar"></i></div>
      <div class="pl-stats">
        <span class="pl-stat"><span class="pl-k">FRAME</span> <span class="pl-v pl-w3" id="pl-frame">000</span> / 720</span>
        <span class="pl-stat pl-el"><span class="pl-k">ELAPSED</span> <span class="pl-v pl-w8" id="pl-el">00:00:00</span></span>
        <span class="pl-stat pl-rem"><span class="pl-k">REMAINING</span> <span class="pl-v pl-w8" id="pl-rem">--:--:--</span></span>
      </div>
      <div class="pl-log">
        <ol class="pl-log-list" id="pl-log">
          <li class="is-cur">Conforming sequence to 9:16…</li>
          <li>Encoding hook (first 3s)…</li>
          <li>Cutting dead air…</li>
          <li>Rendering captions…</li>
          <li>Color matching UGC…</li>
          <li>Syncing SFX to cuts…</li>
          <li>Muxing audio…</li>
          <li>Export complete. 0 dropped frames.</li>
        </ol>
      </div>
    </div>
  </div>
</div>
```

Notes:
- **No `data-tc="preloader"`.** The `initTimecodes()` branch for `plEl` becomes a no-op because `plEl` is null (it is already null-guarded). This removes the per-frame `offsetParent` read. Leave the JS line in place or delete it; either way is safe.
- `<main id="main" aria-busy="true">` stays as is.
- `…` is U+2026 and `·` is U+00B7. No em dashes.

### 7.2 CSS (replaces `style.css` lines 158 to 178)

```css
/* ---------- Preloader: export panel ---------- */
.preloader { display: none; }
html.js .preloader {
  display: block; position: fixed; inset: 0; z-index: 7000;
  background: var(--c-black); color: var(--c-white); overflow: hidden;
  contain: layout paint style;
  transform: translate3d(0, 0, 0);
  /* Pure-CSS failsafe: if JS dies mid-run, hide after 6s no matter what. */
  animation: pl-failsafe 1ms linear 6000ms forwards;
}
@keyframes pl-failsafe { to { opacity: 0; visibility: hidden; } }
html.js .preloader.is-exit {
  transform: translate3d(0, -100%, 0);
  transition: transform 900ms var(--ease-in-out);
  will-change: transform;
}
html.js .preloader.is-exit .pl-inner {
  transform: translate3d(0, 25vh, 0);
  transition: transform 900ms var(--ease-in-out);
}
html.js .preloader.is-fade { opacity: 0; transition: opacity 200ms linear; }
html.js .preloader.is-done, html.js.pl-skip .preloader { display: none; }

.pl-inner { position: absolute; inset: 0; padding: var(--gutter); }
.pl-top { display: flex; justify-content: space-between; align-items: baseline; }
.pl-status { color: var(--c-white); }
.preloader.is-complete .rec-dot { animation: none; opacity: 1; }

.pl-main { position: absolute; left: var(--gutter); right: var(--gutter); bottom: var(--gutter); }
.pl-file {
  font-size: clamp(13px, 1.5vw, 22px); font-weight: var(--w-reg); letter-spacing: 0.02em;
  white-space: nowrap; overflow: hidden; text-overflow: clip;
}
.pl-spec {
  margin-top: 8px; font-size: var(--t-label); letter-spacing: .12em; text-transform: uppercase; color: var(--c-mute);
}
.pl-pct {
  display: flex; align-items: flex-start; margin-top: clamp(16px, 3vw, 40px);
  font-size: var(--t-mega); line-height: .82; font-weight: var(--w-thin);
  letter-spacing: -0.035em; font-variant-numeric: tabular-nums;
}
.pl-count.is-cut { font-weight: var(--w-bold); letter-spacing: -0.055em; }
.pl-sign { font-size: .32em; line-height: 1; margin-left: .1em; padding-top: .08em; letter-spacing: 0; }
.pl-track { position: relative; height: 1px; margin-top: clamp(16px, 2vw, 32px); background: var(--c-ink-3); overflow: hidden; }
.pl-bar { position: absolute; inset: 0; background: var(--c-white); transform-origin: 0 50%; transform: scaleX(0); }

.pl-stats {
  display: grid; grid-template-columns: auto auto; justify-content: space-between; gap: 8px;
  margin-top: 12px; font-size: var(--t-label); letter-spacing: .12em; text-transform: uppercase;
  font-variant-numeric: tabular-nums; color: var(--c-mute);
}
.pl-el { display: none; }
.pl-v { display: inline-block; color: var(--c-white); text-align: left; }
.pl-w3 { min-width: 3ch; } .pl-w8 { min-width: 8ch; }

.pl-log { --lh: 1.6em; --rows: 1; margin-top: 16px; height: calc(var(--lh) * var(--rows)); overflow: hidden;
  font-size: var(--t-label); letter-spacing: .04em; line-height: var(--lh); }
.pl-log-list { list-style: none; margin: 0; padding: 0;
  transform: translate3d(0, calc(var(--shift, 0) * var(--lh) * -1), 0);
  transition: transform 240ms var(--ease-out); }
.pl-log-list li { height: var(--lh); white-space: nowrap; overflow: hidden; color: var(--c-mute);
  opacity: 0; transition: opacity 120ms linear; }
.pl-log-list li::before { content: "> "; }
.pl-log-list li.is-past { opacity: 1; }
.pl-log-list li.is-cur { opacity: 1; color: var(--c-white); }

@media (min-width: 768px) {
  .pl-stats { grid-template-columns: auto auto auto; }
  .pl-el { display: inline; }
  .pl-log { --rows: 3; }
}
@media (prefers-reduced-motion: reduce) {
  .preloader .rec-dot { animation: none !important; }
  .pl-log-list, .pl-log-list li { transition: none !important; }
}
```

The mobile log shows one row and desktop shows three. `--shift` is set by JS. The `pl-` corner classes from v1 (`.pl-tl`, `.pl-tr`, `.pl-bl`, `.pl-br`) are deleted.

### 7.3 JS (replaces `initPreloader()` in `main.js`; `finishLoad()` and `clearBusy()` unchanged)

Constants:

```js
var PL = {
  names: ['JHON_MEDIA_PORTFOLIO.mp4', 'JHON_MEDIA_PORTFOLIO_v2.mp4', 'JHON_MEDIA_PORTFOLIO_FINAL.mp4',
          'JHON_MEDIA_PORTFOLIO_FINAL_v2.mp4', 'JHON_MEDIA_PORTFOLIO_FINAL_FINAL.mp4', 'JHON_MEDIA_PORTFOLIO_FINAL_v7.mp4'],
  nameStep: 180,         // ms between filename cuts (v7 lands at 900ms)
  logAt: [0, 12, 28, 44, 60, 74, 88, 100],  // progress % that activates log line i (matches <li> order)
  frames: 720,           // FRAME xxx / 720
  fps: 30,               // elapsed / remaining format MM:SS:FF @ 30fps
  easeTo: 90, easeDur: 1300,   // 0 → 90 cubic-out over 1300ms
  minT: 1600, maxT: 2100,      // finish window
  skipAfter: 800,              // input can skip after this
  runDur: 200,                 // finish run to 100, quad-out
  hold: 300,                   // hold on EXPORT COMPLETE
  exitDur: 900, heroAt: 540, doneAt: 950,   // ms after exit starts
  remFrom: 8,                  // show REMAINING only once progress ≥ 8
  watchdog: 4500               // force-clear if anything stalls
};
function f30(ms) { // MM:SS:FF @ 30fps
  var fr = Math.max(0, Math.floor(ms * PL.fps / 1000)), s = Math.floor(fr / PL.fps);
  return pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60) + ':' + pad(fr % PL.fps);
}
```

Behaviour, in order:

1. **Lookup + skip.** Get `#preloader`, `#pl-inner`, `#pl-count`, `#pl-bar`, `#pl-file`, `#pl-status`, `#pl-frame`, `#pl-el`, `#pl-rem`, `#pl-log` and its `li`s. Session check exactly as today (`jm-preloader`, try/catch). If seen or `#preloader` is missing, add `pl-skip`, `clearBusy()`, `finishLoad()` and return.
2. **Guards.** `var heroFired = false; function hero() { if (!heroFired) { heroFired = true; finishLoad(); } }` and `function done() { pl.classList.add('is-done'); clearBusy(); clearTimeout(wd); }`. Then `var wd = setTimeout(function () { hero(); done(); }, PL.watchdog);`. Start the watchdog **before** anything else can throw.
3. **Reduced motion.** Set the final state: `pl-file` = names[5], `pl-count` = `100` plus `is-cut`, bar `scaleX(1)`, `pl-frame` = `720`, `pl-el` = `00:00:00`, `pl-rem` = `00:00:00`, `pl-status` = `EXPORT COMPLETE`, `pl.classList.add('is-complete')`, log: all `li` get `is-past`, the last gets `is-cur`, and `--shift` = `7 - (rows - 1)`. After 300ms: add `is-fade`, `hero()`, and `done()` 200ms later. Return.
4. **Readiness.** Same as today: `document.fonts.ready` plus `work.firstImgs` load/error resolves `ready = true`.
5. **Skip input.** `wheel`, `touchmove`, `keydown`, `pointerdown` (passive). If `t ≥ PL.skipAfter`, set `skip = true`. Remove all four at complete.
6. **Rows.** `rows = matchMedia('(min-width: 768px)').matches ? 3 : 1` (read once at start).
7. **rAF loop** (`start = performance.now()`, `t = now - start`):
   - Filename: `i = min(5, floor(t / PL.nameStep))`. If `i` changed, set `pl-file.textContent = names[i]`.
   - Progress `p`: before the finish trigger, `p = 90 * (1 - (1 - min(t / 1300, 1))^3)`. Trigger `fin = now; finFrom = p` when `(ready && t ≥ 1600) || t ≥ 2100 || (skip && t ≥ 800)`. After the trigger, `k = min((now - fin) / 200, 1); p = finFrom + (100 - finFrom) * (1 - (1 - k)^2)`.
   - Write only on change: `pl-count` = `pad(round(p), 3)`. Bar `scaleX(p / 100)` (every frame, it is a transform). `pl-frame` = `pad(round(p / 100 * 720), 3)`. `pl-el` = `f30(t)`.
   - Remaining: if `p < 8`, show `--:--:--`. Else `est = t * (100 - p) / p`, smoothed `remShown += (est - remShown) * 0.15` (seed `remShown = est` on first use), show `f30(remShown)`.
   - Log: `cur` = the highest `i` with `p ≥ logAt[i]`. On change, `li[j]` gets `is-past` for `j < cur`, `li[cur]` gets `is-cur` (remove `is-cur` from the previous line), and `--shift = max(0, cur - (rows - 1))` on `#pl-log`.
   - When `p ≥ 100`, go to step 8 and stop the loop.
8. **Complete (C).** `pl-count` = `100` plus `is-cut`. `pl-frame` = `720`. `pl-rem` = `00:00:00`. `pl-status` = `EXPORT COMPLETE`. `pl.classList.add('is-complete')`. Log line 7 is current (already, since logAt[7] = 100). Force `pl-file` = names[5] in case of a very early skip. Remove skip listeners.
9. **Exit.** At `C + 300`: `pl.classList.add('is-exit')`. At `C + 300 + 540`: `hero()`. At `C + 300 + 950`: `done()`.

Error safety: wrap the loop body in try/catch; on catch call `hero(); done();`. Keep `safe('preloader', initPreloader)` as is.

### 7.4 Timings (summary)

| Case | Complete (C) | Hero starts | Preloader gone |
|---|---|---|---|
| Fast load | 1800ms | 2640ms | 3050ms |
| Slow load (cap) | 2300ms | 3140ms | 3550ms |
| Skip at 800ms | 1000ms | 1840ms | 2250ms |
| Reduced motion | 0ms (static) | 300ms | 500ms |
| JS stalls mid-run | n/a | 4500ms (watchdog) | 4500ms; CSS failsafe 6000ms |
| main.js never boots | n/a | n/a | head safety timer 3500ms (unchanged) |

### 7.5 Every string

| Element | String(s) |
|---|---|
| Top-left | `JHON MEDIA` |
| Status | `EXPORTING`, then `EXPORT COMPLETE` (with `●` dot) |
| Filename | the 6 names in `PL.names` |
| Spec | `H.264 · 1080x1920 · 9:16 · 30FPS` |
| Count | `000` to `100`, sign `%` |
| Stats keys | `FRAME`, `ELAPSED`, `REMAINING`; `/ 720` |
| Stats values | `000` to `720`; `00:00:00` (MM:SS:FF); `--:--:--` before 8% |
| Log | `Conforming sequence to 9:16…`, `Encoding hook (first 3s)…`, `Cutting dead air…`, `Rendering captions…`, `Color matching UGC…`, `Syncing SFX to cuts…`, `Muxing audio…`, `Export complete. 0 dropped frames.` (each prefixed `> ` by CSS) |

### 7.6 QA checklist

- 375 × 667: the longest filename fits on one line. Stats show 2 columns. One log row. Nothing overlaps the top row.
- 60fps in the Chrome performance panel. The only per-frame style change is the bar `transform`. No forced layouts (check the `plEl` read is gone).
- Throttle to Slow 3G: completes at the 2100ms cap. Preloader gone by about 3550ms.
- Throw inside the rAF loop on purpose: the page clears at 4500ms.
- Reload in the same tab: no preloader. New tab: preloader plays.
- Reduced motion: static complete state, gone by 500ms.
- Update DESIGN.md §3.0 and §4.10 to point here once shipped.
