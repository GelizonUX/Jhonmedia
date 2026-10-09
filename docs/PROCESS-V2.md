# Process V2: Concepts + Build Spec

Addendum to `docs/DESIGN.md` §3.7 (Process) and §4.7 (Horizontal scroll). Where this file and DESIGN.md disagree on `#process`, this file wins. §4.7 (the pinned horizontal scroll) is retired. Tokens, type scale and copy rules (no em dashes in visible copy) are unchanged.

Client brief: "really cool", step by step like motion graphics, but still minimal and clean.

Hard constraints: black, white and grays. Helvetica 700 / 400 / 200. Vanilla JS. Animate transforms and opacity only (clip-path only if static). 60fps. No long pin: at most about 1.5 screens on desktop and about 2 on mobile. Reduced-motion static fallback. Works on touch at 375px.

---

## 0. What exists today (audit, main @ 91e3f51)

- Markup `index.html` 333–372: `section#process.alt` > `.slabel` > `h2.d1[data-split]` > `.pr-scroll#pr-scroll` > `.pr-stage` > `ol.pr-row#pr-row` > 5 × `li.pr-panel` (`span.pr-num.mega` ghost number, `h3.h1`, `p` body, `p.label.muted` timing).
- CSS `style.css` 623–628, 813–814, 822–830: a mobile stack with a left hairline, 3 columns at 1024–1279, 5 columns from 1280, the number in `--c-ink-3` at weight 200, and the title pulled up over it with `margin-top: -.9em`. Titles reserve 2 lines on desktop.
- JS: none. `initProcess()` is gone. `#pr-scroll` and `.pr-stage` are leftover wrappers with no behavior, and the only reference is the nav section observer (`'process'` in the id list).
- Scroll cost today: about 1.2 screens on desktop at 1440 × 900 (section padding, label, title, one row of about 420px). About 2.2 screens on mobile at 375 × 667 (5 stacked steps of about 300px each).

Already spent elsewhere, so not reused here:
- **Anatomy** (`TIMELINE-V2.md`): NLE timeline, playhead, clips, waveform, program monitor, keyframe diamonds on clips, retention graph.
- **Preloader v3**: editing-timeline loader.
- **Hero**: four corner viewfinder brackets (`.bk`).

So Process should borrow from the **motion-graphics** side of the craft (After Effects comps, broadcast graphics, layer transforms), not the NLE side.

---

## 1. Concept A: Kinetic type sequence

Each step builds in like a title sequence the first time the row comes into view. The ghost number rolls like a slot counter to its digit, the title rises out of a mask, body and label follow, and a thin motion path draws from step to step.

### Wireframe: desktop (≥ 1280)

```
 [05]                         PROCESS                   TC 00:01:38:00 → 00:01:52:00
 How it WORKS.

  ┊0┊1          ┊0┊2          ┊0┊3          ┊0┊4          ┊0┊5        ← digits roll ↑ in a mask
 │Brief        │Hooks first  │First cut    │Revisions    │Launch and
 │             │             │             │             │iterate
 │You send the │I pull 3 to 5│Full ad, ... │Two rounds...│You launch...
 │DAY 0        │DAY 1        │48 HOURS     │24 HOURS ... │ONGOING
 ●─ ─ ─ ─ ─ ─ ─●─ ─ ─ ─ ─ ─ ─●─ ─ ─ ─ ─ ─ ─●─ ─ ─ ─ ─ ─ ─●              ← motion path draws L→R
```

### Wireframe: mobile (375)

```
 How it
 WORKS.
 ●  0┊1  Brief
 ┊       You send the product, ...
 ┊       DAY 0
 ●  0┊2  Hooks first
 ┊       ...
```

### Motion
- Trigger: an IntersectionObserver on `.pr-row` at threshold 0.3 on desktop. On mobile, each `li` has its own observer at 0.4. Plays once.
- Number: the last digit sits in a 1em mask and a strip of digits `0..n` slides up, `translateY(0 → −n em)`, 900ms `--ease-out`, stagger 90ms per step.
- Title: the existing split-line reveal (`line-inner` translateY 105% → 0), 900ms `--ease-out`, delay `200 + i × 90` ms.
- Body and label: opacity 0 → 1 and translateY 12 → 0, 600ms `--ease-out`, delay `320 + i × 90` ms.
- Motion path: a dashed 1px line (static dashed background) under the row, revealed by `scaleX 0 → 1` from the left over 1200ms `--ease-in-out`. Node dots (5px squares) pop at the moment the line reaches them.

**Scroll cost:** 0 extra (about 1.2 screens on desktop, about 2.2 on mobile unless the mobile layout tweak from §6 is used).

**Reduced motion:** final state, no roll, no path draw.

**Complexity and risks:** low, about 1.5KB of JS. The risk is that it is a one-shot entrance, so it reads as a nicer version of every other reveal on the site, and nothing happens after the first second. The path and node dots also edge close to Anatomy's keyframe language.

**Scores (1–5):** Wow 3 · Minimal 4 · Readability 5 · Scroll cost 5

---

## 2. Concept B: Lower thirds on a spine

Each step is built like a broadcast lower-third. A white bar wipes in, the text appears behind it, then the bar wipes out to the right and leaves the title on black. The steps are stacked down a vertical spine with a progress dot that follows scroll.

### Wireframe: desktop (≥ 1024, a 5-row table)

```
 How it WORKS.
 ┃
 ●  01   ████████████▶          You send the product, the offer...        DAY 0
 ┃
 ┃  02   Hooks first            I pull 3 to 5 hook options before...      DAY 1
 ┃
 ┃  03   First cut              Full ad, captioned, sound designed...     48 HOURS
 ┃  ...
   cols:  2   3–5                  6–10                                    11–12
```

### Wireframe: mobile

```
 ┃ 01
 ● ███████▶            ← bar mid-wipe
 ┃ You send the product, ...
 ┃ DAY 0
 ┃ 02  Hooks first
```

### Motion
- Trigger: each row, when its top crosses 75% of the viewport height. **Time-based, not scrubbed.** A scrubbed bar can freeze half over the title when the user stops scrolling, which kills readability.
- Bar: a white block behind the title, `scaleX 0 → 1` (origin left, 280ms `--ease-in-out`). The title switches to opacity 1 under full cover. Then `scaleX 1 → 0` (origin right, 280ms `--ease-in-out`). Total 600ms.
- Number: opacity 0 → 1 at 0ms. Body and label: translateY 12 → 0 and opacity, 500ms `--ease-out`, starting at 450ms.
- Spine dot: a 7px white square on the 1px spine, `translateY` = the y of the last triggered row, 500ms `--ease-out` transition.

**Scroll cost:** about 1.4 screens on desktop (the rows are about 110px each as a table), about 2.1 on mobile.

**Reduced motion:** no bars, the rows show final, the dot sits at row 05.

**Complexity and risks:** medium-low. Lower thirds read as TV/news more than DTC ads. A white bar flashing five times is a lot of "big motion" for a supporting section (DESIGN.md §1.4). The desktop table layout is a real rewrite of the current grid.

**Scores:** Wow 3 · Minimal 3 · Readability 5 · Scroll cost 4

---

## 3. Concept C: Sticky number, flipping 01 → 05

A short pinned stage. A giant number on the left flips from 01 to 05 (split-flap, `rotateX`) as you scroll, and the step text on the right crossfades.

### Wireframe: desktop

```
 ┌──────────────────── sticky 100vh ────────────────────┐
 │                                                       │
 │   ██████  ██            Hooks first                   │
 │   ██  ██  ██            I pull 3 to 5 hook options... │
 │   ██████  ██ ← flap     DAY 1                         │
 │                         ● ● ○ ○ ○                     │
 └───────────────────────────────────────────────────────┘
```

### Wireframe: mobile

```
 ┌ sticky ─────────────┐
 │  02                 │
 │  Hooks first        │
 │  I pull 3 to 5 ...  │
 └─────────────────────┘
```

### Motion
- Container `250vh`, stage `100vh`, so 1.5 screens of pinned travel, 0.3 screens per step.
- Digit flip: the top half `rotateX(0 → −90deg)` over 180ms, then the bottom half `rotateX(90 → 0)` over 180ms, `--ease-in-out`, with perspective 800px.
- Text crossfade: old text opacity 1 → 0 and y 0 → −12 (200ms), new text 0 → 1 and y 12 → 0 (300ms, `--ease-out`).

**Scroll cost:** about 2.7 screens on desktop in total (title + 2.5 pinned). That is over budget. Cutting it to 1.5 total leaves 0.1 screens per step, which is a flick.

**Reduced motion:** a static stack (today's mobile layout).

**Complexity and risks:** medium. It brings back the problem that got the old version removed (pinned scroll that costs screens). Only one step is visible at a time, so a client can't scan the process. It also repeats Anatomy's "pinned stage, scroll to advance" pattern.

**Scores:** Wow 4 · Minimal 4 · Readability 2 · Scroll cost 1

---

## 4. Concept D: Selected layer (After Effects transform box), recommended

The steps stay a calm, fully readable grid. On top of it, **one** After Effects-style selection box glides from step to step as you scroll. It has a 1px bounding box, 8 square handles, an anchor-point crosshair and a white layer tag (`02 / 05  HOOKS FIRST`). The section looks like a comp where Jhon is clicking through his own layers. On first reveal, the steps also build in with A's slot-roll numbers and masked titles.

Why it wins: it is the only concept that adds motion **after** the entrance and keeps every step readable at all times. It costs zero extra scroll. It speaks motion-graphics (AE layers and transform handles), not NLE, so it doesn't repeat Anatomy, the preloader or the hero brackets. Only one thing moves at a time, which fits DESIGN.md §1.4.

### Wireframe: desktop (≥ 1280, 5 columns)

```
 [05]                         PROCESS                   TC 00:01:38:00 → 00:01:52:00
 How it WORKS.
               [02 / 05  HOOKS FIRST]          ← layer tag (white chip, black text)
 01           □───────────□───────────□  03            04            05
│Brief        │ 02                    │ │First cut    │Revisions    │Launch and
│             │ Hooks first           │ │             │             │iterate
│You send the □ I pull 3 to 5 hook  ┼ □ │Full ad, ... │Two rounds...│You launch...
│product, ... │ options before I...   │ │             │             │
│DAY 0        │ DAY 1                 │ │48 HOURS     │24 HOURS ... │ONGOING
              □───────────□───────────□
              ↑ box glides here as you scroll; ghost number 02 brightens to 0.5
```

At 1024–1279 (3 + 2 grid) the box travels 01 → 02 → 03, then drops to row 2 for 04 → 05.

### Wireframe: mobile (375)

```
 How it
 WORKS.
   [02 / 05  HOOKS FIRST]
   □─────────────□───────────────□
   │ 02   Hooks first            │
   │      I pull 3 to 5 hook     │
   □      options before I touch □   ← box hugs the step crossing 60% of the viewport
   │      the body. We agree...  │
   │      DAY 1                  │
   □─────────────□───────────────□
  │ 03   First cut
  │      Full ad, captioned, ...
```

Mobile layout tweak: the number moves into a left column next to the title (instead of a ghost above it). That saves about 50px per step and brings the section from about 2.2 to about 1.9 screens.

### Motion (summary, full numbers in §7)
- **Entrance**, once per step: the slot roll on the number's last digit, then the masked title, then body and label.
- **Selection:** active step = the step whose trigger line has been crossed (§7.4). The box glides there over 560ms `--ease-out`. Corner handles lead and edge handles trail 40ms, which gives a slight rubbery settle. The tag follows 80ms later and swaps its text with a 120ms opacity dip. The active number rises from opacity 0.16 to 0.5.
- **Hover/tap:** on a fine pointer, hovering a step selects it, and leaving the row hands control back to scroll. On touch, tapping a step selects it until the next scroll-driven change.
- **First appearance:** the box draws on. Edges go `scale 0 → 1` from the anchor outward over 420ms and the handles pop with a 20ms stagger.

**Scroll cost:** 0 extra. About 1.2 screens on desktop, about 1.9 on mobile with the layout tweak.

**Reduced motion:** no box, no roll, no reveals. This is today's static layout, with the mobile layout tweak.

**Complexity and risks:** medium-low, about 3KB of JS and 2KB of CSS. Risks and their fixes:
1. 1px lines blur when scaled. Fix: round all positions to whole px and scale from a 100px base, never from 1px.
2. Measurement drift after fonts or reflow. Fix: measure on `fonts.ready`, resize and the shared `measureAll`. Use `offset*` values, which transforms don't affect.
3. At ≥ 1280 all five steps are on screen at once, so the hops are paced by a scroll window (§7.4), not by each step's position.
4. Taste risk: the tag must stay small, or it reads as UI clutter.

**Scores:** Wow 4 · Minimal 4 · Readability 5 · Scroll cost 5

---

## 5. Comparison

| | Wow | Minimal | Readability | Scroll cost | Extra scroll (desktop / mobile) | Repeats another section? |
|---|---|---|---|---|---|---|
| A Kinetic type | 3 | 4 | 5 | 5 | 0 / 0 | Close to Anatomy keyframes (path nodes) |
| B Lower thirds | 3 | 3 | 5 | 4 | +0.2 / 0 | No, but off-tone (broadcast news) |
| C Sticky flip | 4 | 4 | 2 | 1 | +1.5 / +1.5 | Pinned pattern, like Anatomy |
| **D Selected layer** | **4** | **4** | **5** | **5** | **0 / −0.3** | **No** |

## 6. Recommendation: D, with A's entrance

Build **D (Selected layer)** and use A's slot-roll numbers and masked titles as the one-time entrance. Skip A's motion path, because it competes with the box. Skip B and C.

---

## 7. Build spec: D (Selected layer)

### 7.1 DOM (`index.html`, `#process`)

Keep the section, label, title, `ol#pr-row` and the five `li.pr-panel` with their copy. Changes:

```html
<div class="pr-wrap" id="pr-wrap">                    <!-- replaces .pr-scroll + .pr-stage -->
  <ol class="pr-row" id="pr-row">
    <li class="pr-panel" data-step="1" data-name="BRIEF">
      <span class="pr-num mega" aria-hidden="true">01</span>
      <h3 class="h1">Brief</h3>
      <p>…unchanged…</p>
      <p class="label muted">DAY 0</p>
    </li>
    … steps 2–5, data-name: HOOKS FIRST, FIRST CUT, REVISIONS, LAUNCH AND ITERATE
  </ol>
  <div class="pr-sel" id="pr-sel" aria-hidden="true">
    <i class="sel-e sel-et"></i><i class="sel-e sel-er"></i><i class="sel-e sel-eb"></i><i class="sel-e sel-el"></i>
    <i class="sel-h" data-h="nw"></i><i class="sel-h" data-h="n"></i><i class="sel-h" data-h="ne"></i>
    <i class="sel-h" data-h="e"></i><i class="sel-h" data-h="se"></i><i class="sel-h" data-h="s"></i>
    <i class="sel-h" data-h="sw"></i><i class="sel-h" data-h="w"></i>
    <i class="sel-a"></i>
    <span class="sel-tag micro"><span class="sel-n">01 / 05</span><span class="sel-name">BRIEF</span></span>
  </div>
</div>
```

- `#pr-scroll` and `.pr-stage` are removed (dead since the unpin).
- JS builds the slot digits. The source stays `01` for no-JS and screen readers, and the number is `aria-hidden` anyway.
- The box is decorative. Steps stay a plain `ol`. No `tabindex` and no ARIA changes.

### 7.2 CSS

```
.pr-wrap { position: relative; }
.pr-sel  { position: absolute; left: 0; top: 0; width: 0; height: 0; pointer-events: none; z-index: 2; opacity: 0; transition: opacity 200ms linear; }
.pr-sel.is-on { opacity: 1; }
```

- **Edges** `.sel-e`: `position: absolute; left: 0; top: 0; background: #fff; transform-origin: 0 0;`
  - `.sel-et` and `.sel-eb` are 100px × 1px, placed with `translate(x, y) scaleX(w / 100)`.
  - `.sel-el` and `.sel-er` are 1px × 100px, placed with `translate(x, y) scaleY(h / 100)`.
- **Handles** `.sel-h`: 7 × 7px, `border: 1px solid #fff; background: var(--c-ink-0);`, at `translate(px − 3, py − 3)`.
- **Anchor** `.sel-a`: an 11px crosshair (two 1px pseudo-elements). No circle (radius rule). Sits at the box center.
- **Tag** `.sel-tag`: white background, black text, `--t-micro`, padding 3px 6px, `white-space: nowrap`. Sits at `translate(x, y − 22)`, so 22px above the top-left handle. `.sel-n` is weight 400 and `.sel-name` is 700, with a 8px gap between them.
- **Transitions** (only when `.pr-sel.is-live`, which is added after the first placement so the first frame doesn't fly in from 0,0):
  - Edges and corner handles (`nw ne se sw`): `transform 560ms var(--ease-out)`.
  - Mid handles (`n e s w`) and anchor: same, plus `transition-delay: 40ms`.
  - Tag: same, plus `transition-delay: 80ms`. Its text swap is in §7.5.
- **Numbers** `.pr-num`: switch from `color: var(--c-ink-3)` to `color: #fff; opacity: .16`. White at 0.16 over `#0a0a0a` looks the same as ink-3, so there's no visible change at rest. `.pr-panel.is-sel .pr-num { opacity: .5; }` with `transition: opacity 300ms var(--ease-snap)`.
- **Slot digit**:
  - `.pr-num .slot { display: inline-block; height: 1em; overflow: hidden; vertical-align: top; }`
  - `.pr-num .strip { display: block; transform: translateY(0); }`
  - `.pr-num .strip span { display: block; height: 1em; line-height: 1; }`
  - The number's own line-height becomes 1 inside `.pr-num` so the mask doesn't cut the glyphs.
- **Mobile tweak** (`max-width: 1023px`):
  - `.pr-panel { display: grid; grid-template-columns: 3.2ch 1fr; column-gap: var(--s-4); }`
  - The number spans rows 1–4 in column 1 with `font-size: clamp(2.5rem, 12vw, 3.5rem)` and `align-self: start`.
  - Title, body and label go in column 2.
  - The `.h1` loses the `margin-top: -.9em` overlap.
  - `.pr-row` gap goes to `var(--s-6)`.
  - Desktop keeps the ghost-number-over-title look.
- **Reduced motion:** `.pr-sel { display: none !important; }`. The slot strip is shown at its final position with `transform: none` (the JS doesn't build strips in reduced mode anyway).

### 7.3 Box geometry

For each panel, measured in `measure()` relative to `.pr-wrap` using `offsetLeft`, `offsetTop`, `offsetWidth` and `offsetHeight` (walk up to `.pr-wrap`):

- `x = left − padX`, `y = top − padY`, `w = width + 2 × padX`, `h = height + 2 × padY`
- `padX = 10px` desktop and 8px mobile, `padY = 12px` desktop and 10px mobile
- Clamp `x ≥ −gutter + 6` and `x + w ≤ wrapWidth + gutter − 6`, so the box never touches the viewport edge
- Round everything to whole px

Handle points: corners `(x, y)`, `(x + w, y)`, `(x + w, y + h)`, `(x, y + h)`. Mids at `w / 2` and `h / 2`. Anchor at `(x + w / 2, y + h / 2)`. At ≥ 1024 the anchor sits over the gap between title and body, which is fine because it's 11px and 1px thin.

### 7.4 Which step is active

Panels are grouped by row (same `offsetTop`). For panel `j` of `k` in a row, its trigger line is:

```
triggerY = rowDocTop + (j / k) × max(rowHeight, 0.45 × vh)
active   = last panel with triggerY ≤ scrollY + 0.65 × vh     (−1 if none)
```

- **≥ 1280** (one row of 5): the hops spread over about 420px of scroll, so 01 → 05 happens while the row moves through the middle of the screen.
- **1024–1279** (3 + 2): row 1 hops across 3 steps, then row 2 across 2.
- **Mobile** (k = 1): each step activates when its top crosses 65% of the viewport.

After the last trigger it stays on 05. Scrolling back reverses it. Scrolling above the first trigger (`active = −1`) fades the box out (`.is-on` off).

**Manual override:**
- On `(hover: hover) and (pointer: fine)`, `pointerenter` on a panel sets `manual = i`, and `pointerleave` on `.pr-row` clears it.
- On touch, `click` on a panel sets `manual = i` until the scroll-derived `active` next changes.
- Effective selection = `manual ?? active`.

### 7.5 JS behaviour (`initProcess()` in `main.js`, about 3KB)

1. **Setup.** If `REDUCED`, return after adding `.is-static` (nothing else). Otherwise build the slot strips: for each `.pr-num` with text `0n`, keep the `0` as text and replace the `n` with `<span class="slot"><span class="strip"><span>0</span>…<span>n</span></span></span>`. Set the strip to `translateY(0)`.
2. **Entrance.** Observe `.pr-row` with an IntersectionObserver at threshold 0.25 on desktop. On mobile observe each `li` at 0.4. On entry, once per panel `i` (i is the index within the batch that entered together, 0 for single panels on mobile):
   - Strip: `translateY(−n em)` with `transition: transform 900ms var(--ease-out) (i × 90)ms`.
   - Title: the existing `revealLines(h3, 80)`, started after a `200 + i × 90` ms timeout. Titles get `data-split` for the split, but are kept out of the global reveal observer (mark them `data-split-manual`, and have `initReveals` skip that attribute).
   - Body and label: add `is-in` with a `320 + i × 90` ms delay. They use the existing `[data-reveal]` CSS (24px rise, 900ms), so add `data-reveal` to both `p` elements and keep them out of the global observer the same way (`data-reveal-manual`).
3. **Selection tick.** Push one function into the shared `ticks` array:
   - If the section is out of range (`S.y` outside `secTop − vh … secBottom`), return.
   - Compute `active` (§7.4). This is pure arithmetic on cached numbers, no layout reads.
   - If the effective selection is unchanged, return.
   - Otherwise call `place(i)`. Writes happen only on change, which is at most a few times per second.
4. **`place(i)`.**
   - Write 4 edge transforms, 8 handle transforms, the anchor transform and the tag transform.
   - Toggle `.is-sel` on panels.
   - Tag text: set `opacity 0` (no transition), swap `.sel-n` and `.sel-name` on the next rAF, then restore with `transition: opacity 120ms linear`. The text is `0i / 05` and the panel's `data-name`.
   - **First placement:** place with no transition, add `.is-on`, and play the draw-on: edges start at `scale(0)` about their own midpoints and go to their final transforms over 420ms `--ease-out`; handles go opacity 0 → 1 with a 20ms stagger in nw, n, ne, e, se, s, sw, w order; the tag fades in at 200ms. Then add `.is-live`.
5. **`measure()`.** Recompute panel rects, row groups, trigger lines, `secTop` and `secBottom`. If a box is placed, re-place it without transition: remove `.is-live`, write, then re-add `.is-live` on the next rAF. Register it in `measures` and also run it after `document.fonts.ready`.
6. **Media changes.** `listen(mqReduced, …)`: switching to reduced hides the box and finalizes the strips. `mqDesk` changes call `measure()`.

### 7.6 Timings (summary)

| Item | Duration | Easing | Delay / stagger |
|---|---|---|---|
| Number slot roll | 900ms | `--ease-out` | `i × 90`ms |
| Title line reveal | 900ms (existing) | `--ease-out` | `200 + i × 90`ms, 80ms between lines |
| Body + label | 900ms (existing `[data-reveal]`) | `--ease-out` | `320 + i × 90`ms |
| Box draw-on (first time) | 420ms | `--ease-out` | handles 20ms stagger, tag at 200ms |
| Box glide | 560ms | `--ease-out` | mids +40ms, tag +80ms |
| Tag text swap | 120ms fade-in | linear | after 1 rAF |
| Active number | 300ms | `--ease-snap` | none |
| Box fade on/off | 200ms | linear | none |

### 7.7 Copy

No copy changes. The step titles, bodies and labels stay as they are, including the `48 HOURS` placeholder comment. New strings are the tag layer names only: `BRIEF`, `HOOKS FIRST`, `FIRST CUT`, `REVISIONS`, `LAUNCH AND ITERATE`, shown as `01 / 05  BRIEF`. On mobile at 375px the longest tag (`05 / 05  LAUNCH AND ITERATE`, about 200px at micro size) fits inside the box width.

### 7.8 Reduced motion and no-JS

- **Reduced motion:** no selection box, no slot roll, no staggered reveals (the global reduced rule already shows split lines and `[data-reveal]` instantly). Numbers at the resting opacity of 0.16. Layout identical to the animated version, including the mobile two-column tweak. Hover does nothing.
- **No JS:** the same static layout. The box markup is present but `opacity: 0`, which is harmless. The numbers show `01`–`05` as plain text.

### 7.9 Performance

- Hot path: one tick with a few comparisons per frame, and DOM writes only when the selection changes. The motion itself is CSS transitions on 14 small elements (transform) and 5 numbers (opacity). No layout reads in the tick.
- No `will-change` (the elements are tiny and idle most of the time). No clip-path animation. The slot mask is a static `overflow: hidden`.
- Crispness: integer translates. Lines scale from a 100px base, not 1px, so the scale factor stays around 1 to 6 and solid 1px lines don't smear.
- QA: a Chrome Performance recording of a scroll through the section shows no Layout in tick frames. Check 375 × 667, 1024 × 768, 1280 × 800 and 1440 × 900. Hover and tap override work. Reduced motion shows no box. The DESIGN.md §4.7 entry is replaced by a pointer to this file.
