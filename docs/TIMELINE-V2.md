# Anatomy of a Winner, V2: Design Addendum

Addendum to `docs/DESIGN.md` §3.5 (The edit timeline) and §4.6 (Scroll-linked timeline). Where this file and DESIGN.md disagree on `#anatomy`, this file wins. Everything else in DESIGN.md (tokens, type scale, copy rules, no em dashes in visible copy) still applies.

Client brief: "make it more cooler, the hook problem demo part." Goal: it should feel like watching a real ad get cut in Premiere, Resolve or CapCut, and it should be the wow moment of the site.

Hard constraints (unchanged): black, white and the five grays only. Helvetica at 700, 400 and 200. Vanilla JS, no libraries. 60fps using transforms and opacity only. Works with `prefers-reduced-motion` (static fallback) and on touch (strip mode).

---

## 0. Verdict on the proposed ideas

| # | Idea | Verdict | Refinement |
|---|---|---|---|
| 1 | Program monitor, 9:16, procedural mock ad driven by playhead | **Adopt (P0).** This is the wow. | Square-cornered 9:16 frame, not a rounded phone (`--r: 0`). One coherent mock ad runs across all six beats (a dog itch spray), so the beats tell one story instead of six demos. Generic product, no client name or logo. |
| 2 | Monitor HUD | **Adopt (P0).** | Adds a shuttle readout (`▶ 1.0×`, `◀ 2.4×`, `❚❚`) driven by scroll velocity. That one detail sells "this is an NLE". |
| 3 | Live retention curve | **Adopt (P1).** | Drawn against a dashed "AVG AD" benchmark so the flattening at cuts actually reads. Revealed with a translated mask, not `stroke-dashoffset`. |
| 4 | Timeline polish | **Adopt most (P1/P2).** | Caption track T1, sub-clip thumbnails, cut flashes, trail and waveform reaction are P1. Razor loupe, keyframe diamonds and transition markers are P2. |
| 5 | Kinetic beat titles | **Adopt (P0).** | 6-frame stutter at 24fps using `steps()`, thin/bold pairing: <thin>the</thin> **HOOK**. |
| – | "Red X" marks | Changed | White X. No color anywhere. |
| – | Full-screen white flash frames | Changed | Capped at 0.55 opacity and rate-limited to 3 per second of wall-clock time (WCAG 2.3.1), because fast scrubbing could stack flashes. |

Design principle note: DESIGN.md §1.4 says one big motion per viewport. In this section the monitor is that motion. Everything else (graph, timeline, title) stays small, gray or event-driven. The kinetic title fires only on beat changes, six times per pass.

---

## 1. Structure changes

1. `.an-head` (title + sub) moves **out of** `.an-stage` and sits above `.an-scroll`. It scrolls away normally, so the pinned stage gets the full viewport for the editor.
2. `.an-scroll` height goes from `400vh` to `560vh`, and scroll-to-time is no longer linear (see §5.1). Hook, problem and demo get 64% of the scroll.
3. New pinned-stage pieces: app bar, program monitor, retention panel, compact chapter list, timeline toolbar, T1 caption lane.
4. `#an-tc` (the timecode) moves from the viewer column into the program monitor's top bar. Same id, same `is-cut` bold flash.
5. JS: `main.js` is already 49KB, which breaks the 25KB budget in DESIGN.md §1.6. Put V2 in a new `assets/js/anatomy.js` (target ≤ 22KB unminified), loaded right after `main.js`. `main.js` exposes a small bridge (`window.JM = { S, ticks, measures, tc, swapText, mulberry32, isReduced, mqDesk }`) and drops its own `initTimeline`. Update the budget line in DESIGN.md to "main.js ≤ 50KB, anatomy.js ≤ 22KB".
6. Single source of truth: one `AD` data object in `anatomy.js` holds beats, sub-clips (cuts), caption words, keyframes and transitions. It drives the V1 sub-clips, T1 words, cut markers, monitor scenes and retention ticks. Nothing is hand-placed twice.

---

## 2. Layout

### 2.1 Desktop, ≥ 1024px (scrub mode)

```
 [03]                    ANATOMY OF AN AD               TC 00:00:51:00 → 00:01:21:00
 ANATOMY of a WINNER.
 A 30-second DTC ad, cut in front of you. Scroll to scrub.
═════════════════════════════ sticky stage, 100vh ═══════════════════════════════════
 ● WINNER_V7 · SEQ 01            1080×1920 · 24 FPS · DUR 00:00:30:00          (app bar 24px)
┌──────────── cols 1–4 ───────┬──────── cols 5–8 ────────┬────────── cols 9–12 ──────────┐
│ 01 / 06 · 00:00 → 00:03     │ PROGRAM · SEQ 01  ▶ 1.0× │ RETENTION           HOLD  41% │
│                             │   00:00:01:12  (#an-tc)  │ 100 ┐                 +11 VS AVG│
│ the                         │ ┌──────────────────────┐ │     │\                          │
│ HOOK      (kinetic title)   │ │●REC ▶  ·  00:00:01:12│ │     │ \__▪___ THIS CUT          │
│                             │ │[HOOK RATE 38%]    ◔3 │ │  50 │  \ ‾‾‾‾‾‾‾‾‾‾‾‾          │
│ Three seconds. One idea.    │ │ ┌ title safe ──────┐ │ │     │   `- - - - - AVG AD       │
│ A pattern break, a bold     │ │ │                  │ │ │   0 └┴──┴──┴──┴──┴──┴─┘ cuts  │
│ claim or a result shown     │ │ │   shot plate     │ │ ├───────────────────────────────┤
│ first. If they don't stop   │ │ │                  │▒│ │ 01 HOOK      00:00  ━━━━━──── │
│ here, nothing after this    │ │ │   STOP           │▒│ │ 02 PROBLEM   00:03  ───────── │
│ matters.                    │ │ │   SCROLLING      │ │ │ 03 DEMO      00:08  ───────── │
│                             │ │ └──────────────────┘ │ │ 04 PROOF     00:16  ───────── │
│ TARGET: 30%+ HOOK RATE      │ │F 0034/0720   B1 HOOK │ │ 05 OFFER     00:23  ───────── │
│                             │ └──────────────────────┘ │ 06 CTA       00:27  ───────── │
│                             │ ⏮  ◀  ▶  ⏭        FIT 1/1│                               │
└─────────────────────────────┴──────────────────────────┴───────────────────────────────┘
 ▸ ✂ ⇤⇥   SEQ 01   SNAP ON                                       ─────○────  (toolbar 20)
         ┌✂┐ razor loupe (P2, floats here at beat boundaries)
     00:00 ▾       00:05        00:10        00:15        00:20        00:25        00:30   ruler 24
 V2  ["Stop scrolling if…"]     [CALLOUTS][COMPARE]  [REVIEWS        ][$ OFFER CARD][TAP ↓] 28
 T1  ▮▮ ▮▮▮▮ ▮ ▮▮ ▮▮▮ ▮▮ ▮▮▮▮▮ ▮ ▮▮▮ ▮▮ ▮▮ ▮ ▮▮▮▮                                          20
 V1  [▣HOOK |▣ ][▣PROBLEM|▣|▣|▣|▣|▣][▣DEMO  |▣ ⊠|▣ ⊠|▣ ◇──◇][▣PROOF  ][▣OFFER◇◇][▣CTA ]      48
 A1▐▌ ▁▃▅▇▅▃▂▃▅▆▇█▇▅▃▂▁▂▃▅▆▅▃▂▃▅▇▆▅▃▂ ...                                                  36
          ░░▌  playhead (1px) + trail
```

Grid inside the pinned stage (12 cols, existing `--gap`):

| Row | Content | Height |
|---|---|---|
| A | App bar, full width, `--t-micro`, mute; REC dot left | 24px |
| B | Viewer (cols 1–4), monitor panel (cols 5–8), retention + chapters (cols 9–12) | `1fr` |
| C | Timeline toolbar + timeline | 20 + 196px |

Stage padding: top `calc(var(--nav-h) + var(--s-4))`, bottom `var(--s-6)`. Row gap `var(--s-5)`.

Vertical budget at a 900px viewport: 64 nav + 16 + 24 app bar + 24 + row B + 24 + 216 timeline + 32 bottom. Row B is about 500px. The monitor panel has a 20px top bar (timecode) and 20px transport, which leaves a 9:16 frame of about **452 × 254px**.

Monitor frame sizing: `height: 100%` of what is left in row B, `aspect-ratio: 9 / 16`, centered in cols 5–8, `max-width: 100%`. The frame is never wider than its columns. At 1024px wide, cols 5–8 are about 300px, so height wins.

Short viewports:
- `max-height: 820px`: hide the app bar and hide the chapter list. Retention takes all of cols 9–12.
- `max-height: 680px`: the monitor's transport row hides, and the retention graph drops to 110px tall.
- Below `max-height: 600px` (rare on desktop): fall back to strip mode.

Timeline lanes (`grid-template-rows`): ruler 24, V2 28, T1 20, V1 48, A1 36, with a 4px row gap. That is 172px plus the 20px toolbar and 4px.

### 2.2 Mobile and tablet, < 1024px (strip mode)

```
 [03]                             TC 00:00:51:00 → …
 ANATOMY of a
 WINNER.
 A 30-second DTC ad, cut in front of you. Swipe to scrub.

┌────────────────┐  01 / 06
│●REC   00:00:01 │  the
│[HOOK RATE 38%] │  HOOK            ← kinetic, clamp(1.75rem, 8vw, 2.75rem)
│                │
│  shot plate    │  00:00:01:12     ← #an-tc, --t-h2 thin, tabular
│                │
│  STOP          │  HOLD 41%        ← --t-label
│  SCROLLING     │  ╲__▪____ ▏      ← 40px sparkline (retention, P1)
└────────────────┘
 [ ▶ PLAY ]  00:30                ← 44px tap target, P2
 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
 V2 [..."Stop scrolling if…"   ]│[CALL     ← timeline strip, swipe, playhead fixed at 50%
 T1  ▮▮  ▮▮▮▮   ▮  ▮▮          │ ▮▮▮
 V1 [▣ HOOK          |▣        │▣ PROB
 A1 ▁▃▅▇▅▃▂▃▅▆▇█▇▅▃▂▁▂▃▅▆▅▃▂▃▅▇│▆▅▃▂
 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
 Three seconds. One idea. A pattern break, …
 TARGET: 30%+ HOOK RATE
```

- Two-column top block: monitor at `width: min(52vw, 240px)` (about 195 × 347px at 375px wide), side column fills the rest.
- Strip: the same as today (`480vw` track, 50% spacers, center playhead) plus the new T1 lane. Snap changes from `x mandatory` on beat starts to `x proximity` on **sub-clip** starts (15 points), so a swipe can land mid-beat and the monitor shows interesting frames, not only frame 0 of each beat.
- The monitor is driven by `t = scrollLeft / trackW * 30`. Swiping back rewinds it.
- Tablet (768–1023): same layout, monitor `min(40vw, 300px)`, retention sparkline 56px tall.
- HUD on mobile: the frame counter, beat tag and safe-zone hatching hide (too small). REC, timecode and the metric chip stay.
- P2 mobile play: a `▶ PLAY` button under the monitor plays 1× from the current t to 30s by writing `scroller.scrollLeft` each frame. While it plays, `.is-playing` turns off scroll snap. Any `pointerdown`, `wheel` or `keydown` on the strip pauses it. It autoplays once when the section is 60% in view, unless `Save-Data` is on. Desktop gets no play button, because scroll is the play.

---

## 3. Element inventory

All new elements are built by JS from `AD`, except the static containers below. Everything decorative is `aria-hidden="true"`.

### 3.1 Markup additions in `index.html`

```
section#anatomy
  .slabel                      (unchanged)
  .an-head                     (moved out of the stage)
  .an-scroll#an-scroll
    .an-stage
      .an-appbar               NEW  micro text, REC dot
      .an-viewer               (title becomes kinetic, #an-tc removed from here)
        .an-idx                NEW  "01 / 06 · 00:00 → 00:03"
        h3#an-title            "<span class=thin>the</span> HOOK", aria-live=polite
        p#an-body, p#an-stat   (unchanged)
      .pm#pm                   NEW  program monitor panel, aria-hidden, JS fills it
      .rt#rt                   NEW  retention panel, aria-hidden, JS fills it
      ol#an-chapters           (restyled compact, still buttons)
      .tl#tl                   (+ .tl-tools toolbar, + .tl-t1 lane, + V1 sub-clips)
      ol#beats-list            (unchanged copy, + .pm-still per li in static mode)
  svg.glyphs (hidden <defs>)   NEW  10 thumbnail symbols
```

### 3.2 Program monitor DOM (`.pm`)

```
.pm
  .pm-bar         "PROGRAM · SEQ 01"  |  .pm-shuttle "▶ 1.0×"  |  #an-tc
  .pm-frame       aspect-ratio 9/16, 1px --c-ink-3 border, 6px --c-ink-1 padding (bezel),
                  overflow hidden, contain: strict
    .scr          authored at 270 × 480 CSS px, transform: scale(k), origin 0 0
      .scn.scn-hook | .scn-problem | .scn-demo | .scn-proof | .scn-offer | .scn-cta
      .cap        shared caption layer (hook, problem, demo)
      .fx-flash   full-screen white, opacity driven
      .fx-shake   (not an element; applied to .scn wrapper)
      .guides     action-safe, title-safe, UI zones, center cross
      .hud        REC, shuttle, TC, chip, ring, frame counter, beat tag
  .pm-transport   ⏮ ◀ ▶ ⏭ (1px line glyphs) · "FIT" · "1/1"   (P2 on mobile: real button)
```

`k = frameInnerWidth / 270`, computed in `measure()` only. All positions and sizes in §4 are in the 270 × 480 authoring space.

Footage rule: inside `.scr` only, circles and soft gradients are allowed, because they are "footage", not UI. The radius rule still applies to all chrome around it.

Plate palette: `--c-ink-1` background, subjects `--c-ink-2`/`--c-ink-3`, highlights `#3a3a3a` and `--c-mute`, white only for type, flashes, callouts and HUD. Each plate also gets a fixed vignette (radial gradient, black 0 → 0.5 at the edges) so the gray reads as lit footage.

### 3.3 Z-order inside `.scr` (bottom to top)

| z | Layer |
|---|---|
| 0 | Plate background of the active scene |
| 1 | Scene subjects (face, dog, bottle, hand, cards) |
| 2 | Scene overlays (callouts, X marks, compare divider, zoom brackets, particles) |
| 3 | `.cap` captions |
| 4 | `.fx-flash` |
| 5 | `.guides` (opacity 0.35) |
| 6 | `.hud` |

Section level: inside `.tl-track`, clips are z 1, `.tl-cutflash` z 2, the trail z 2, the playhead z 3 and the razor loupe z 4. The site grain overlay (z 9000) sits over the monitor too, which helps it read as footage.

### 3.4 HUD (always on, in the 270 × 480 space)

| Element | Position | Spec |
|---|---|---|
| REC dot + "REC" | x 12, y 12 | 6px white circle, uses existing `.rec-dot` pulse; 9px/700 |
| Shuttle | x 44, y 12 | `▶ 1.0×` / `◀ 2.4×` / `❚❚` glyph drawn as 1px shapes, 9px/400 tabular |
| Timecode | right 12, y 12 | 9px/400 tabular, same string as `#an-tc` |
| Metric chip | x 12, y 30 | 1px white border, padding 0 5px, 16px tall, 9px/700 uppercase. Text per beat (below) |
| Countdown ring | right 14, y 28, 30 × 30 | Hook only. 12 segments (2 × 6px bars rotated 30° apart), lit count via opacity. Center digit 13px/700 |
| Frame counter | x 12, bottom 12 | `F 0034 / 0720`, 9px tabular, mute |
| Beat tag | right 12, bottom 12 | `B1 HOOK`, 9px, mute |
| Action-safe | inset 13.5 / 24 | 1px `--c-ink-3` |
| Title-safe | inset 27 / 48 | 1px `--c-ink-3`, corners only (4 L-shapes, 10px arms) |
| UI zones | right rail x 222–262, y 250–420; bottom bar y 404–452 | `repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 6px)` at opacity 0.08, label `UI` 7px |

Metric chip text (numbers are placeholders, flagged for Jhon):

| Beat | Chip |
|---|---|
| Hook | `HOOK RATE {0→38}%` counts with `eOutCubic(u)` |
| Problem | `CUT {n} · AVG 1.6s`, where n counts hard + jump cuts so far (1 to 6) |
| Demo | `SCALE {100→240}%` during D4, otherwise `SHOT {n}/4` |
| Proof | `★ 4.8 · {0→2,341}` |
| Offer | `AOV $29` |
| CTA | `CTR 2.4%` |

Shuttle logic: `rate = Δt / Δwall` (ad seconds per real second), smoothed with lerp 0.25. Below 0.05 it shows `❚❚`. The state has to hold 3 rAF frames before it switches, so it doesn't flicker. The rate shows one decimal, clamped to 9.9.

---

## 4. Monitor animation, per beat

### 4.0 Conventions

- `t` is ad time in seconds (0–30, float). `f = floor(t * 24)`, from 0 to 720.
- **The monitor renders on whole frames only.** It re-renders when `f` changes. That's 24fps footage, like a real NLE, and it cuts writes by about 60%. The playhead, trail, waveform and graph dot still move every rAF.
- Local progress: `u = (t − beat.in) / (beat.out − beat.in)`, clamped to 0..1. Local frame: `lf = f − beat.in * 24`.
- Everything is a pure function of `t`. No CSS transitions inside `.scr`. Scrubbing backwards plays the frames in reverse exactly.
- Easing (JS):
  - `eOutExpo(x) = x === 1 ? 1 : 1 − 2^(−10x)`
  - `eOutCubic(x) = 1 − (1 − x)^3`
  - `eInOutCubic(x) = x < .5 ? 4x³ : 1 − (−2x + 2)³ / 2`
  - `eInOutQuart(x) = x < .5 ? 8x⁴ : 1 − (−2x + 2)⁴ / 2`
  - `eOutBack(x) = 1 + 2.70158(x − 1)³ + 1.70158(x − 1)²`
  - `eInQuad(x) = x²`
  - `seg(u, a, b) = clamp((u − a) / (b − a), 0, 1)`
- **Flash** (shared): `flash(fCut, peak) = peak` at `f = fCut`, `peak × 0.45` at `fCut + 1`, then 0. `peak` is never above 0.55. The flash is also rate-limited: if the last flash with opacity above 0.3 fired less than 333ms of **wall-clock** time ago, cap it at 0.2. Fast scrubbing can't strobe.
- **Shake** (shared): a 4-frame table applied as `translate` to the scene wrapper: `[(5,−3), (−4,2), (2,−1), (0,0)]` px, starting at the trigger frame.
- **Caption words** (shared `.cap` layer): each word is two stacked spans, a white word (with static `text-shadow: 0 2px 0 #000`) and an inverted twin (white box, black text, 2px 4px padding). States:
  - Before its `t0`: opacity 0, except karaoke lines, where future words show at 0.35 white.
  - Active (`t0 ≤ t < next.t0`): the inverted twin shows at opacity 1. Pop: `scale = 1.4 − 0.4 × eOutBack(seg(lf, wf, wf + 3))`, where `wf` is the word's start frame. Hard on, no fade.
  - Spoken: white word at opacity 1, twin at 0.
  - Line visibility is hard on/off at the line's in/out. Captions are 700, uppercase, centered, tracking −0.02em, and sit above the bottom UI zone (baseline y ≈ 380) unless noted.

### 4.1 HOOK (0:00 → 0:03, 72 frames, u = t / 3)

Story: the thumb is mid-scroll, our ad snaps in, it punches in on a face, then cuts to the dog.

| u | Frames | What happens |
|---|---|---|
| 0.00–0.10 | 0–7 | **Feed swipe-in.** `.feed` (the previous post: ink-1 card, 3 gray text bars, an avatar dot) does `translateY(−110% × eOutExpo(u / .10))`. The ad plate does `translateY(100% → 0)` with the same curve. Six 1px white speed lines at opacity 0.25 show on f 0–5 only. |
| 0.10 | 8–9 | **Flash** `flash(8, .55)`. |
| 0.10–0.50 | 8–35 | **Shot A, face close-up.** Plate: head circle (r 62, `--c-ink-3`) and shoulders (trapezoid) on an ink-1 gradient. **Punch-in:** `scale = 1 + .22 × eOutExpo(seg(u, .10, .16)) + .04 × seg(u, .16, .50)`, origin 50% 38%. **Shake** from f 8. Mouth: a 22 × 6 bar, `scaleY = .2 + .8 × amp(t)`, where `amp` reads the waveform bar under the playhead. |
| | 9 | Caption `STOP` pops. 44px/700, line 1 of a 2-line block centered at y 200. |
| | 15 | Caption `SCROLLING` pops (line 2). Both stay until f 35. |
| 0.50 | 36–37 | **Hard cut** to Shot B. `flash(36, .55)`. |
| 0.50–1.00 | 36–71 | **Shot B, dog close-up.** Dog head (rect muzzle, 2 triangle ears, eye dots) with its back leg in frame. **Push-out:** `scale = 1.10 − .10 × eOutExpo(seg(lf, 36, 48))`. Leg scratch: `rotate = 22° × sin(2π × 6 × t)`, origin at the hip. |
| | 38, 42, 46 | `IF` `YOUR` `DOG` pop, 26px/700, line at y 360. |
| | 54, 58 | `DOES` `THIS` pop as line 2 at y 392. |
| all | 0–71 | **Countdown ring**: lit segments `= ceil(12 × (1 − u))`, digit `= max(1, ceil(3 − t))`. At `u ≥ .97` the ring scales 1.15 for 2 frames. **Chip** counts `HOOK RATE`. |

Keyframes on V1 (diamonds): t 0.33 and 0.50 (punch), t 1.50 and 2.00 (push-out).

### 4.2 PROBLEM (0:03 → 0:08, 120 frames, u = (t − 3) / 5)

Story: a talking head complains, the dog scratches, then "I tried everything" with three crossed-out fixes. This is where the stat `CUT EVERY 1.5 TO 2s` becomes visible.

Shot table (hard cuts every 1.67s, with a jump cut inside each):

| u | t | Shot | Edit in | Plate |
|---|---|---|---|---|
| 0.000–0.167 | 3.00–3.83 | P1 talking head, medium | Hard cut, `flash(72, .55)` | Face (r 44) + torso, kitchen hint: 2 gray rects for cabinets |
| 0.167–0.333 | 3.83–4.67 | P1′ same head | **Jump cut**: no flash, `scale 1.12`, `x −8px`, plus a 1-frame 4px x-offset glitch | Same |
| 0.333–0.500 | 4.67–5.50 | P2 dog side view, scratching | Hard cut, `flash(112, .55)` | Dog body rect 120 × 54, head, tail; back leg `rotate 28° × sin(2π × 7 × t)` |
| 0.500–0.667 | 5.50–6.33 | P2′ tight on paw and skin | Jump cut | `scale 1.3`, origin at the paw. 6 irritation rings (1px white, r 5–9) do `scale .9 ↔ 1.05` with `sin(2π × 2 × t + i)` |
| 0.667–0.833 | 6.33–7.17 | P3 "the drawer": 3 product cards | Hard cut, `flash(152, .55)` | Cards 64 × 92 at x 30/103/176, y 150, labeled `SHAMPOO` `CREAM` `VET $$` (9px/700) |
| 0.833–1.000 | 7.17–8.00 | P3′ same, closer | Jump cut, `scale 1.08` | Same |

Overlays:
- **Karaoke captions**, 24px/700, at y 372, words even within each line:

| Line | Visible (t) | Word starts (t) |
|---|---|---|
| `MY DOG WOULDN'T` | 3.00–4.67 | 3.08, 3.50, 3.92 |
| `STOP SCRATCHING.` | 4.67–6.33 | 4.75, 5.30 |
| `I TRIED EVERYTHING.` | 6.33–8.00 | 6.42, 6.62, 6.95 |

- **Card pops:** the 3 cards enter at u .700, .770, .840 with `translateY(24 → 0)` and opacity 0 → 1 over 3 frames (`eOutExpo`).
- **White X marks:** each X is two 2 × 78px bars rotated ±45°. Bar 1 does `scaleY 0 → 1` over 2 frames, starting at card pop + 0.03u. Bar 2 follows 2 frames later. Each X stamps with a 2-frame `scale 1.15 → 1` on the card.
- **Frustration meter:** left edge, x 10, y 140–300, 4px wide. Track `--c-ink-3`, fill white with `scaleY = .15 + .80 × eInQuad(u)`, origin bottom. When `u > .8`, it jitters `translateX(f % 2 ? 1 : −1 px)`. Label `ITCH` 7px, rotated −90°, above the bar.
- **Chip** `CUT n · AVG 1.6s`, where n steps 1 to 6 at each cut.
- Mouth flap on P1/P1′, same as in the hook.

### 4.3 DEMO (0:08 → 0:16, 192 frames, u = (t − 8) / 8)

Story: hero product turn with callouts, two sprays, before/after compare, punch to a close-up.

| u | t | Segment | Enters with |
|---|---|---|---|
| 0.00–0.25 | 8.0–10.0 | D1 hero turntable + callouts | `flash(192, .45)` (transition marker `FLASH 2f`) |
| 0.25–0.50 | 10.0–12.0 | D2 hand + 2 sprays | Hard cut |
| 0.50–0.80 | 12.0–14.4 | D3 before/after wipe | **Whip** over 5 frames: D2 `translateX(0 → −100%)`, D3 `translateX(100% → 0)`, `eInOutCubic`, 8 horizontal 1px motion lines at opacity 0.3 (marker `WHIP 5f`) |
| 0.80–1.00 | 14.4–16.0 | D4 close-up zoom | Continuous (keyframed scale) |

**D1, turntable.** The bottle is a body rect 70 × 150, neck 26 × 18, cap 34 × 22, centered at x 135, y 250. It has a label band 70 × 56 with `ITCH RELIEF` (8px/700) and 3 gray lines. Fake rotation with `θ = 360° × eInOutCubic(seg(u, 0, .25))`:
- Label content (doubled for wrap) `translateX(((θ / 360) × 140) mod 140 − 140)` inside the band, `overflow: hidden`
- Body `scaleX(.88 + .12 × |cos θ|)`
- Specular stripe (8px white, opacity 0.22) `translateX(24 × cos θ)`
- Floor shadow (ellipse, black 0.6) `scaleX` the same as the body

Callouts, three of them. Each one is an anchor dot (4px white square), a leader line (1px white, `scaleX 0 → 1` from the anchor over 5 frames, `eOutExpo`, length 52px, angled ±18°) and a label (9px/700) that fades in plus `translateX(4 → 0)` when the line finishes.

| # | Start u | Anchor | Label |
|---|---|---|---|
| 1 | 0.04 | cap | `FAST-ACTING` |
| 2 | 0.10 | label band | `NO STING` |
| 3 | 0.16 | base | `2 SPRAYS / DAY` |

All three fade out over u .23–.25. Chip: `SHOT 1/4`.

**D2, hand and spray.** A hand (palm rect 64 × 80, 4 finger rects, ink-3 with an ink-2 shade) holds the bottle. It enters `translateX(120% → 0)` over u .25–.30 (`eOutExpo`). Spray bursts start at u .34 and .42. Each burst is 12 particles (3px white squares) on fixed vectors fanned −25° to +25° toward the left. With `k = seg(u, start, start + .04)`, each particle does `translate(v × 90 × eOutCubic(k))`, `opacity 1 − k` and `scale 1 − .5k`. The bottle recoils `translateX(+3px)` for 2 frames per burst. The chip reads `SPRAY 1/2`, then `2/2`.

**D3, before/after wipe.** Two full-frame plates:
- BEFORE: fur texture (`repeating-linear-gradient(60deg, #2a2a2a 0 1px, #141414 1px 5px)`) and 7 irritation rings.
- AFTER: the same texture lighter (`#3a3a3a` / `#1f1f1f`), no rings, and 3 small sparkle crosses (1px, 8px).

The wipe uses the two-translate mask, so no clip-path animation. AFTER sits inside `.wipe` (`overflow: hidden`). `.wipe` does `translateX((w − 1) × 100%)` and its child does `translateX((1 − w) × 100%)`. The wipe position is `w = eInOutQuart(seg(u, .53, .68))` for u ≤ .68, then `1 − .5 × eOutCubic(seg(u, .68, .76))`. It sweeps fully across and then settles at the middle, like a CapCut compare slider. The divider is a 2px white line at x = w with a 20 × 20 white square handle at the center holding a black `◀▶` (1px shapes). Labels: `BEFORE · DAY 1` top-left (y 56) and `AFTER · DAY 14` top-right. The AFTER label's opacity is `seg(w, .4, .6)`. Chip: `SHOT 3/4`.

**D4, close-up zoom.** At u .80, four L-shaped corner brackets (2px white, 16px arms) appear around a target box of 90 × 90 at (150, 200), with a 4-frame `scale 1.3 → 1` stamp. Over u .83–.92 the plate scales `1 → 2.4` with `eInOutCubic`, origin at the target center. The brackets scale by `1 / plateScale × (1 + 1.6 × progress)` so they grow out to the safe area and frame the shot. Over .92–1 the plate drifts slowly `2.4 → 2.5`. A `CLOSE-UP` label (9px) sits at the bottom-left of the brackets. The chip shows `SCALE {round(100 × plateScale)}%`. Keyframe diamonds on V1 at t 14.64 and 15.36.

Demo captions (22px/700, y 384, same karaoke rules as the problem beat):

| Line | Visible (t) | Word starts (t) |
|---|---|---|
| `SO I TRIED THIS.` | 8.00–10.00 | 8.20, 8.45, 8.70, 8.95 |
| `TWO SPRAYS A DAY.` | 10.00–12.00 | 10.30, 10.60, 11.00, 11.20 |
| `TWO WEEKS LATER.` | 12.00–14.40 | 12.30, 12.60, 13.00 |
| `LOOK AT THAT COAT.` | 14.40–16.00 | 14.60, 14.85, 15.05, 15.30 |

### 4.4 PROOF (0:16 → 0:23, u = (t − 16) / 7), lighter treatment

- Plate: a calm sleeping dog silhouette on ink-1, faint.
- Header at y 70: `4.8 ★ AVG · {round(2341 × eOutCubic(u))} REVIEWS`, 10px/700, tabular. The star is a static `clip-path: polygon(…)` square, never animated.
- Three review cards (220 × 64, ink-2, 1px ink-3 border) enter at u .04, .32 and .60: `translateY(60 → 0)`, opacity 0 → 1, 6 frames, `eOutExpo`. When a new card arrives, older cards shift `translateY(−72px × depth)` and `scale(1 − .04 × depth)` over 6 frames. Each card has 5 stars that light one at a time, 2 frames apart, starting at the card's start + 0.03. Card 3 has a 20px circle avatar (the "second face").
- Quotes (11px/400): `"Stopped scratching in a week."` · `"She finally sleeps through the night."` · `"Our vet asked what we changed."`

### 4.5 OFFER (0:23 → 0:27, u = (t − 23) / 4)

- `$49` (40px/200, mute) visible from u 0. A strike line (2px white) does `scaleX 0 → 1` over u .20–.28.
- At u .30 (f 576), `$29` slams in: 96px/700, `scale 2.6 → 1` over 4 frames (`eOutExpo`), hard on, `flash(576, .35)`, shake from f 576.
- At u .55, `30% OFF. TODAY ONLY.` (12px/700) does `translateY(12 → 0)` and opacity over 4 frames.
- Keyframe diamonds at t 24.20 and 24.37.

### 4.6 CTA (0:27 → 0:30, u = (t − 27) / 3)

- The `SHOP NOW` button (180 × 44, white, black 14px/700) enters over u 0–.10, `translateY(40 → 0)`, `eOutExpo`.
- Pulse: `scale = 1 + .05 × max(0, sin(2π × 2 × t))`. It's deterministic, so it still rewinds.
- A finger cursor (24px circle, 1px white border, white fill at 0.25) moves from (210, 430) to the button center over u .20–.45 (`eOutCubic`).
- Tap at u .50: the button goes to `scale .94` for 2 frames, and a ripple ring does `scale 0 → 3` with opacity `.6 → 0` over 8 frames.
- `↓` arrow under the button bobs `translateY(4 × sin(2π × 1.5 × t))`.
- End: over u .90–1, a black overlay fades in, and `↺ LOOP` (9px) appears at the center at u ≥ .96. That pays off the stat copy, "Dead air at the end costs you the loop."

---

## 5. Timeline, panel and title behavior

### 5.1 Scroll to time (desktop)

Piecewise-linear map from section progress `p` to `t` (breakpoints `[p, t]`):

`[0, 0] [.17, 3] [.38, 8] [.64, 16] [.78, 23] [.87, 27] [.96, 30] [1, 30]`

Hook, problem and demo get 64% of the 460vh scroll distance. The last 4% holds on the final frame before the stage unpins. The playhead and ruler stay **linear in t**, so the playhead visibly crawls through the hook, like an editor slowing down on the part that matters. `jump(i)` uses the inverse map. Arrow keys still step beats, and `Home`/`End` are added.

### 5.2 Kinetic beat title (`#an-title`)

- Markup per beat: `<span class="thin">the</span><br>HOOK`. Words: HOOK, PROBLEM, DEMO, PROOF, OFFER, CTA.
- Size `clamp(2.5rem, 4.6vw, 5.5rem)`, line-height 0.86, tracking −0.05em, uppercase noun at 700, "the" at 200 and +0.02em.
- On a beat change in either direction: the text swaps instantly (a real hard cut, no slide-out), then a **6-frame stutter** plays at 24fps (`steps`, 250ms total):

| Frame | opacity | transform |
|---|---|---|
| 0 | 1 | `scale(1.32) translateX(−.04em)` |
| 1 | 0 | – (black frame) |
| 2 | 1 | `scale(1.12) translateX(.03em)` |
| 3 | 1 | `scale(1.00) translateY(2px)` |
| 4 | 0.6 | `scale(1)` |
| 5 | 1 | `none` |

  Origin: left baseline. To restart without a forced reflow, alternate between two identical keyframe names (`slamA` and `slamB`).
- If beats change faster than 250ms (fast fling or chapter jump), only the last change animates.
- `.an-idx` updates without animation. `#an-body` keeps the existing `swapText` split-line swap. `#an-stat` swaps instantly.
- `aria-live="polite"` stays on `#an-title` and announces "the HOOK".

### 5.3 Retention panel (`.rt`, P1)

- Header row: `RETENTION` (label, mute) on the left. On the right, `HOLD` (label) and the value `41%` in `--t-h2` at 200, tabular, in a fixed-width box. Under it, `+11 VS AVG` (micro, mute).
- Graph: an SVG with viewBox 300 × 150 and a plot area of x 24–296, y 10–130. Y labels 100 / 50 / 0 (micro, mute). Gridlines at 50 are 1px `--c-ink-2`.
- Curves are precomputed once into `hold[0..720]` and `avg[0..720]`:
  - Base loss rate `r(t) = a × e^(−t / 9)`.
  - **This cut:** `r(t) × Π over cuts c < t of (1 − .75 × e^(−(t − c) / .35))`, integrated per frame from 100. Fit `a` so that hold = 38 at t 3. Tune to land near **38 / 31 / 25 / 21 / 19** at t 3 / 8 / 16 / 23 / 30.
  - **Avg ad:** no cut damping, hits 30 at t 3 and 7 at t 30.
  - The cut damping makes each cut show up as a small shoulder where the slope flattens.
- Layers (bottom to top):
  1. "This cut" path, 1.5px white
  2. A reveal mask: a div with the panel's background color covering from the current x to the right edge, moved with `translateX(x)`. Transform only.
  3. "Avg ad" path in its own SVG, 1px `--c-ink-3`, `stroke-dasharray: 3 3` (static). Always fully visible as the benchmark.
  4. Current-point marker: a 5px white square at `translate(x, y(hold[f]))`
  5. Cut ticks: 1px × 6px marks on the x-axis at every cut. Each one flashes (opacity 1 → 0.3, 220ms) when the playhead crosses it.
- Legend under the graph (micro): `── THIS CUT   - - AVG AD`.
- Note under the panel in static mode only: `Illustrative curve.` (micro, mute). These are placeholder numbers, and §3.4's honesty note applies.

### 5.4 Chapter list (compact, cols 9–12)

Each row is a `button` (min-height 32px on desktop, which is fine with pointer: fine). Contents: `01` label · name (`--t-label`, white if active, `--c-ink-3` if not) · in-time (micro, mute) · a 1px track with a white fill at `scaleX(beatProgress)`. Click jumps, same as today.

### 5.5 Timeline polish

| Item | Pri | Spec |
|---|---|---|
| **Toolbar** `.tl-tools` | P2 | 20px row of 12px 1px-stroke glyphs: select arrow, razor, ripple; `SEQ 01` tab; `SNAP ON`; zoom slider glyph on the right. The razor glyph turns inverted (white square, black glyph) while the razor loupe plays. aria-hidden. |
| **Beat markers on ruler** | P1 | At each beat in-point, a 5 × 8px white marker hangs from the ruler top, with a 1px tick to the ruler bottom. |
| **V2** | P1 | Blocks change to the real motion layer: `"Stop scrolling if…"` 0–1.5, `CALLOUTS` 8–10, `COMPARE` 12–14.4, `REVIEWS` 16–23, `$ OFFER CARD` 23–27, `TAP ↓` 27–30. The repeated `CAPTIONS` blocks move to T1. |
| **T1 caption lane** (new) | P1 | One block per caption word from §4, spanning `t0` to the next `t0` or line end, 1px `--c-ink-0` gap. Fill `--c-ink-2`, active word fill white, spoken words `--c-ink-3`. No text inside (too small), so it reads as a CapCut caption track. Label `T1` in `.tl-labels`. |
| **V1 sub-clips + thumbnails** | P1 | Each beat button holds its sub-clips as aria-hidden spans with 1px black dividers. Sub-clips: hook 0/1.5; problem 3/3.83/4.67/5.5/6.33/7.17; demo 8/10/12/14.4; proof 16; offer 23; CTA 27 (15 total). Each starts with a 9:16 thumbnail 22 × 40 (ink-1, 1px ink-3) holding an `<svg><use>` glyph: face, dog, paw, cards, bottle, hand, split, zoom, stars, price, button. The beat label shows on the first sub-clip only. Existing `is-played` and `is-active` states stay. |
| **Cut flashes** | P1 | `.tl-cutflash` per sub-clip boundary: 1px white, ruler to A1 bottom, opacity 0. When the playhead crosses it in either direction: add `is-flash` (CSS `@keyframes` opacity 1 → 0, 220ms linear). At most one restart per cut per 200ms. |
| **Playhead trail** | P1 | `.tl-trail`, a child of the playhead: 64px wide, `right: 100%`, `linear-gradient(to left, rgba(255,255,255,.16), transparent)`. `opacity = clamp(|rate| / 4, 0, 1)`, lerped at 0.2. When rate < 0, `scaleX(−1)` with origin at the playhead, so the trail sits on the right. |
| **Waveform reaction** | P1 | Bars are `transform-origin: center`. The 9 bars nearest the playhead (in both copies) get `scaleY(1 + .45 × (1 − d / 5) × min(1, |rate| / 2))`, where d is the distance in bars. Bars that leave the window reset to `scaleY(1)`. That's 18 to 36 writes per frame. Silent while paused. |
| **A1 meter** | P1 | In the label column next to `A1`: two 3 × 28px bars (L/R) with `scaleY = amp(t) × min(1, |rate|)`. R uses `amp(t + 1/24)`. A peak-hold tick (1px) falls at 0.6 per second. |
| **Wave-lit mask fix** | P0 | Today `#wave-lit` animates `clip-path` every frame, which breaks the transforms-only rule. Replace it with the two-translate mask from §4.3 D3. |
| **Keyframe diamonds** | P2 | On V1, a 10px band at the clip bottom: a 1px `--c-ink-3` line between paired diamonds (7px squares rotated 45°, 1px white border). Each fills white (opacity of a fill child) once `t ≥` its time. Times: 0.33, 0.50, 1.50, 2.00, 14.64, 15.36, 24.20, 24.37. |
| **Transition markers** | P2 | 10 × 10 box with a 1px diagonal, centered on the cut at the V1 top edge: t 8.0 (`FLASH 2f`), 12.0 (`WHIP 5f`). Visible labels are omitted (too small). |
| **Razor loupe** | P2 | `.tl-razor`: a 56 × 56 square (ink-0, 1px white border) whose bottom edge sits on the ruler top, centered on the boundary x and clamped to the track. Inside are two clip edges at 3× (ink-3 rects with a 1px black gap). It fires when the playhead crosses a **beat** boundary forward at a rate ≤ 6×. Sequence at 24fps steps: f0 the box appears; f1–3 a 1px white blade line does `scaleY 0 → 1` from the top; f4–5 the halves move `translateX(∓3px)`; f6–9 hold; then opacity → 0 over 150ms. Micro label under it: `CUT 00:00:03:00`. One at a time, a new one restarts it. |

---

## 6. Copy

Body and stat copy for all six beats stays the same. Changes:

| Where | Old | New |
|---|---|---|
| `.an-sub` desktop | A 30-second DTC ad, frame by frame. Scroll to scrub. | A 30-second DTC ad, cut in front of you. Scroll to scrub. |
| `.an-sub` strip mode | (same) | A 30-second DTC ad, cut in front of you. Swipe to scrub. (JS swaps the last sentence) |
| `#an-title` | The hook | <thin>the</thin> HOOK (and PROBLEM, DEMO, PROOF, OFFER, CTA) |
| `.beats-list h3` (static) | The hook | Unchanged. Static mode keeps sentence case. |
| App bar | – | `WINNER_V7 · SEQ 01` · `1080×1920 · 24 FPS · DUR 00:00:30:00` |
| Monitor bar | – | `PROGRAM · SEQ 01` |
| Static-mode graph note | – | `Illustrative curve.` |

Mock-ad on-screen copy is listed in §4. It uses straight caps, the `’` apostrophe, no em dashes, no brand name and no client logo. The metric chip numbers in §3.4 are placeholders. Mark them in the source with `(placeholder — replace)` comments, consistent with §3.4 of DESIGN.md.

---

## 7. Reduced motion and no-JS

`prefers-reduced-motion: reduce` gives today's static mode, upgraded to a contact sheet:

- No pin, no warp, no strip, no scrubbing. `.an-head`, then the timeline drawn once with the playhead at the end and everything played, then the retention panel fully drawn (both curves, all cut ticks, no marker, the `Illustrative curve.` note), then `#beats-list`.
- Each `li` in `#beats-list` gets a **still**: a 9:16 `.pm-still` (120px wide on mobile, 160px on desktop, floated left of the text at ≥ 768px). It's a clone of `.scr` rendered once with `render(tKey)`. Key frames: hook 0.90 (punched in, `STOP SCROLLING`), problem 7.60 (all three X marks), demo 14.20 (compare settled at the middle), proof 22.50 (three cards), offer 26.00 (`$29`), CTA 28.80 (button, before the fade).
- In stills: no flash, no shake, no pulse. The HUD shows TC and the chip only, and the REC dot is static.
- The T1 lane, sub-clip thumbnails and keyframe diamonds still render (static info). Cut flashes, trail, waveform reaction, razor loupe and kinetic stutter are off.
- Live switching: the existing `listen(mqReduced, setMode)` rebuilds the mode. Stills are built lazily on first entry into static mode.
- No JS: the current markup works as it does today (static timeline + beats list). The monitor, retention and stills are JS-built, so they're just absent.

---

## 8. Performance

1. **One loop.** Everything runs in the existing shared `ticks` rAF. No new rAF, no `setInterval`.
2. **Two cadences.** Per rAF: playhead, trail, wave window, A1 meter, graph mask and marker, shuttle. Per ad frame (only when `f` changes): monitor scene, captions, chip, TC string, T1 active block, clip states. Fast scrubbing that skips frames renders only the target frame, because every scene is a pure function of `t`.
3. **Transforms and opacity only** in the hot path. No `clip-path`, `stroke-dashoffset`, `filter`, `box-shadow`, `width`, `height`, `top` or `left` animation. Static `text-shadow` and static `clip-path` (stars) are fine. Text changes (TC, counters, chip, `HOLD %`) only happen when the string changes, inside fixed-size boxes with `font-variant-numeric: tabular-nums; contain: size layout`.
4. **No layout reads in the tick.** `measure()` (on resize and the existing `measureAll`) reads `trackW`, the frame size, `k`, `top` and `height`. The tick only writes.
5. **Write cache.** A `set(el, prop, value)` helper keeps the last value on the element and skips identical writes. Expect 40 to 90 writes per ad frame in the busiest moment (D2 spray: 24 particles), about 25 per rAF otherwise.
6. **Scene isolation.** Inactive scenes get `visibility: hidden` (toggled only on beat change). `.pm-frame` and `.scr` are `contain: strict`. `.rt` and `.tl-track` are `contain: layout paint`.
7. **Layers.** `will-change: transform` only on `.scr`, the active `.scn`, `.tl-playhead` and `.tl-trail`. Never on particles, words or bars. No layer explosion.
8. **Off-screen gating.** Keep the existing "outside the section, return" check. In strip mode, add an IntersectionObserver so nothing renders when the section is out of view, and the mobile autoplay stops.
9. **DOM budget.** Monitor about 180 nodes, timeline additions about 100 (30 T1 words, 15 sub-clips, 15 thumbnails, 15 cut flashes, 8 diamonds, markers), retention about 12. No images, no fonts, glyphs are inline `<symbol>`s.
10. **Flash safety.** Wall-clock rate limit as in §4.0. Peak 0.55 inside the monitor only. No flash on the page itself.
11. **Acceptance test.** A Chrome Performance recording while scrubbing hook → demo at full speed shows no purple Layout blocks in tick frames and scripting under 4ms per frame on a 2020 MacBook Air. Strip mode holds 60fps on a Pixel 6a / iPhone 12 during a fling.

---

## 9. Build order

- **P0:** structure move, warp map, program monitor with full hook, problem and demo plus light proof, offer and CTA, HUD, kinetic title, wave-lit mask fix, reduced-motion stills.
- **P1:** retention panel, T1 lane, V1 sub-clips + thumbnails, cut flashes, trail, waveform reaction, A1 meter, ruler markers, new V2 blocks, compact chapters.
- **P2:** razor loupe, keyframe diamonds, transition markers, toolbar, mobile play button with autoplay.
