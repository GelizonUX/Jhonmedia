# Jhon Media: Design Spec + Final Copy

Version 1.0. Source of truth for the build agent. Plain static site: vanilla HTML, CSS, JS. No build step, no frameworks, no external libraries. Everything below is final unless marked `(placeholder — replace)`.

Copy rule for the whole site: no em dashes in visible copy, no buzzwords, short sentences. The only place "—" appears is inside the `(placeholder — replace)` markers, which are comments for Jhon and must never render on the page. In HTML, put those markers in `<!-- -->` comments next to the value.

---

## 0. File structure

```
/index.html
/assets/css/style.css
/assets/js/work.js        <- Jhon edits this. Work items only.
/assets/js/main.js        <- all interactions
/assets/thumbs/01.jpg ... 09.jpg   <- Jhon drops thumbnails here (9:16, 1080x1920 or 720x1280)
/assets/img/og.jpg        <- 1200x630 social share image (placeholder)
/assets/favicon.svg       <- white "J" on #000 square
```

One page. Anchor navigation. No routing.

---

## 1. Design principles

1. **The page is an edit.** Everything borrows from an editing suite: timecode, REC dot, frame counters, track lanes, playheads, in/out points. Used as structure and labels, never as decoration for its own sake.
2. **Type does the work.** No illustrations, no icons beyond a few 1px line glyphs. Huge Helvetica, bold against thin, is the visual.
3. **Monochrome only.** Black, white, five grays. Hierarchy comes from size, weight and gray value. Never color.
4. **Restraint over noise.** Every animation has one job. Max one "big" motion per viewport. If two things move at once, one of them is wrong.
5. **Thumbnails are the product.** The work grid gets the most space and the cleanest treatment. The site exists to get someone to tap a thumbnail and then the email.
6. **Fast.** No webfonts to load (system Helvetica). No libraries. Target: LCP under 1.5s. JS budget (unminified): main.js ≤ 50KB, anatomy.js ≤ 22KB.

---

## 2. Tokens

### 2.1 Color

| Token | Hex | Use |
|---|---|---|
| `--c-black` | `#000000` | Page background, preloader |
| `--c-ink-0` | `#0a0a0a` | Alternate section background (Stats, Process, FAQ) |
| `--c-ink-1` | `#141414` | Cards, thumbnail placeholder base, inputs |
| `--c-ink-2` | `#1f1f1f` | Hairlines on black, card hover background, track lanes |
| `--c-ink-3` | `#2a2a2a` | Stronger borders, placeholder gradient end, disabled |
| `--c-mute` | `#8a8a8a` | Secondary text, labels, metadata, timecode |
| `--c-white` | `#ffffff` | Primary text, buttons, playhead, REC dot |

Rules:
- Body text is `--c-white` on black at 400 weight. Secondary text `--c-mute`. Contrast: #8a8a8a on #000 = 6.2:1 (passes AA for all sizes). #8a8a8a on #141414 = 5.4:1 (passes AA).
- Do not use `--c-mute` for text below 13px.
- Inverted moments (primary buttons, contact section hover, cursor) are white bg + black text.
- Selection: `::selection { background:#fff; color:#000 }`.
- The REC dot is white, not red. It pulses opacity. No accent colors anywhere, including focus rings.

### 2.2 Typography

Stack: `--font: "Helvetica Neue", Helvetica, Arial, sans-serif;`
Mono-feel for timecode: same stack with `font-variant-numeric: tabular-nums;` (no monospace font). Numbers must never jitter while counting.

Weights (only three, visually):
- `--w-bold: 700`
- `--w-reg: 400`
- `--w-thin: 200` (falls back to 300 where 200 is missing; Helvetica Neue has UltraLight/Thin on macOS. Arial fallback will render 400, accepted.)

Rendering: `-webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; font-kerning: normal;`

Type scale (fluid, 375 to 1440):

| Token | Size | Line height | Tracking | Weight | Use |
|---|---|---|---|---|---|
| `--t-mega` | `clamp(4rem, 17vw, 17rem)` | 0.82 | -0.055em | 700 / 200 | Hero headline, contact headline |
| `--t-d1` | `clamp(3rem, 10vw, 10rem)` | 0.86 | -0.05em | 700 / 200 | Section titles ("Selected work") |
| `--t-d2` | `clamp(2.25rem, 6vw, 6rem)` | 0.9 | -0.04em | 700 / 200 | Stat numbers, sub-displays |
| `--t-h1` | `clamp(1.75rem, 3.6vw, 3.5rem)` | 1.0 | -0.03em | 700 | Service titles, process step titles |
| `--t-h2` | `clamp(1.25rem, 2vw, 1.75rem)` | 1.15 | -0.02em | 400 | Intro paragraphs, testimonial quotes |
| `--t-body` | `clamp(1rem, 1.1vw, 1.125rem)` | 1.5 | -0.005em | 400 | Body |
| `--t-small` | `0.875rem` | 1.45 | 0 | 400 | Card metadata, FAQ answers on mobile |
| `--t-label` | `0.75rem` | 1.2 | 0.12em, UPPERCASE | 400 | Labels, timecode, nav, eyebrows |
| `--t-micro` | `0.6875rem` | 1.2 | 0.14em, UPPERCASE | 400 | Frame counters, legal |

Display rules:
- Bold display = tight tracking (as above). Thin display = loosen by +0.02em relative to bold (thin strokes clump less but read cramped at -0.055em).
- Contrast pattern: one or two words in a bold line are set in thin. Thin words are the "soft" words (verbs, connectors), bold words are the nouns that matter. Example: **ADS THAT** <thin>stop</thin> **THE SCROLL.**
- Headlines are UPPERCASE for mega/d1 only. Everything else sentence case.
- Max line length for body: 60ch.
- Hanging punctuation on big quotes: `hanging-punctuation: first;` plus a -0.4em text-indent fallback.

### 2.3 Spacing

Base unit 4px. Tokens:
`--s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-5: 24px; --s-6: 32px; --s-7: 48px; --s-8: 64px; --s-9: 96px; --s-10: 128px; --s-11: 192px;`

Section vertical padding: `--section-y: clamp(96px, 14vw, 224px)`.
Page gutter: `--gutter: clamp(16px, 3.2vw, 48px)`.

### 2.4 Grid

- 12 columns desktop, 8 tablet, 4 mobile.
- Column gap `--gap: clamp(12px, 1.6vw, 24px)`.
- Max content width: none. The site runs edge to edge minus `--gutter`. Body copy blocks are constrained by `ch`, not containers.
- Hairline grid: optional 1px `--c-ink-2` vertical lines at column 1, 4, 7, 10 edges, `position: fixed`, `opacity: .5`, behind content, desktop only. Gives the "editing UI" structure. Off on mobile.

### 2.5 Radii

`--r: 0`. Everything is square. Only exceptions: REC dot and cursor are circles (`50%`).

### 2.6 Borders

`--line: 1px solid var(--c-ink-2)`. Stronger: `1px solid var(--c-ink-3)`. On white backgrounds: `1px solid #000`.

### 2.7 Motion

Easing:
- `--ease-out: cubic-bezier(0.16, 1, 0.3, 1);` (expo out. Default for reveals.)
- `--ease-in-out: cubic-bezier(0.76, 0, 0.24, 1);` (quart in-out. Preloader wipe, lightbox, menu.)
- `--ease-snap: cubic-bezier(0.2, 0, 0, 1);` (hover states, cursor label)
- `--ease-linear: linear;` (marquees, timecode)

Durations:
- `--d-1: 150ms` (hover color, focus)
- `--d-2: 300ms` (cursor scale, button fills)
- `--d-3: 600ms` (card hover scale, accordion)
- `--d-4: 900ms` (line reveals)
- `--d-5: 1200ms` (preloader wipe, hero entrance)
- Stagger between split lines: `80ms`. Between grid cards: `60ms`.

Smooth-scroll lerp factor: `0.1` (see 4.4).

### 2.8 Z-index

`grain 9000 / cursor 8000 / preloader 7000 / lightbox 6000 / nav 5000 / menu overlay 4900 / content 1`.

---

## 3. Sections, in order

Global layout note: each section starts with a **section label row**: a full-width hairline on top, then a 3-part row in `--t-label`: left = section index (e.g. `[02]`), center = section name, right = a timecode in/out range (e.g. `TC 00:00:14:00 → 00:00:31:12`). This repeats down the page and is the main rhythm device. On mobile, center item hides.

The timecode ranges are cosmetic and increase down the page so the whole site reads like one timeline.

---

### 3.0 Preloader

> Superseded by `docs/PRELOADER-OPTIONS.md` §7 (concept A, export panel), shipped with beats trimmed to a ~3.1s cap. The text below is the original v1 spec.

**Layout:** Full viewport, `--c-black`. Center: huge counter `000` → `100` in `--t-mega`, weight 200, tabular nums. Bottom-left: `JHON MEDIA` label. Bottom-right: running timecode `00:00:00:00` at 24fps. Top-left: `● REC` (dot pulses). Top-right: `LOADING FOOTAGE`.

A 1px white progress line runs across the bottom edge, width tied to the counter.

**Behavior:**
- Counts 0 to 100 over ~1.6s with an ease-out curve (fast start, slight hang at 90s, then snaps to 100). Real progress: tie to `document.fonts.ready` + first 4 thumbnails `load`/`error`, but never shorter than 1.2s or longer than 2.8s.
- At 100: counter number switches from thin to bold (single-frame weight swap, like a cut), holds 150ms, then the whole preloader wipes up with `clip-path: inset(0 0 100% 0)` over `--d-5` `--ease-in-out`.
- Shown once per session (`sessionStorage` flag, wrapped in try/catch). Second visit in same session: skip.
- Reduced motion: no counter animation. Show `100` statically for 300ms, fade out 200ms.
- `aria-hidden="true"`, and the main content has `aria-busy="true"` until it clears.

**Copy:**
- Top-left: `● REC`
- Top-right: `LOADING FOOTAGE`
- Bottom-left: `JHON MEDIA`
- Bottom-right: live timecode

---

### 3.1 Fixed nav

**Layout:** Fixed top, height 64px desktop / 56px mobile, full width, `--gutter` padding. Transparent over hero. `mix-blend-mode: difference` with white text, so it reads on both black and the white contact section.

- Left: wordmark `Jhon Media`, 700, 15px, tracking -0.02em.
- Center (desktop only): live local timecode `● 14:32:08:16` (hours:min:sec:frames of Jhon's local time, placeholder timezone `Asia/Manila (placeholder — replace)`), label `--t-label`, color mute. Dot pulses.
- Right: links `Work`, `Services`, `Process`, `FAQ` in `--t-label`, then a boxed CTA `Book a call` (1px white border, 12px/20px padding).
- Mobile: right side becomes `Menu` text button. Opens full-screen overlay (`--c-black`) with links in `--t-d1` bold, stacked, staggered line reveal, plus email at bottom. Close text: `Close`.

**Behavior:**
- Hides on scroll down (translateY -100%, `--d-3`), shows on scroll up. Always visible when at top or when menu open.
- Link hover: text rolls up. Each link has its label duplicated; on hover the first copy slides up 100% and the second slides in from below (`--d-2`, `--ease-snap`). Overflow hidden.
- Active section: a 1px underline under the current link (IntersectionObserver).

**Copy:**
- Wordmark: `Jhon Media`
- Links: `Work` / `Services` / `Process` / `FAQ`
- CTA: `Book a call`
- Mobile menu footer: `hello@jhonmedia.com` and `TikTok @jhonmedia`

---

### 3.2 Hero

**Layout (desktop):**
- Full viewport height minimum (`min-height: 100svh`).
- Top band (below nav, 96px down): 3-column label row.
  - Left: `[00] VIDEO EDITOR`
  - Center: `● REC  00:00:00:00` (timecode runs live from page load at 24fps)
  - Right: `AVAILABLE · Q4 2026 (placeholder — replace)` rendered as `AVAILABLE FOR Q4`
- Headline, `--t-mega`, uppercase, left aligned, 3 lines, each line a separate mask for the reveal:
  - Line 1: **ADS** <thin>that</thin>
  - Line 2: <thin>stop the</thin> **THUMB.**
  - Line 3: **EDITED** <thin>to</thin> **SELL.**
  Line 2 is indented 2 columns on desktop (offset rhythm, editorial). Line 3 aligns right.
- Below headline, a 12-col row:
  - Cols 1-5: intro paragraph, `--t-h2`, weight 400.
  - Cols 9-12: two stacked buttons: primary `See the work` (white fill, black text), secondary `Book a call` (outline).
- Bottom edge: a full-bleed marquee strip (see below), height ~72px, top and bottom hairlines.
- Bottom-left above marquee: `Scroll` label with a 1px vertical line that animates (a white segment travels down the line, 1.6s loop).

**Framing device:** four 16px corner brackets (1px white L shapes) sit at the hero corners like a camera viewfinder / safe-area guide. Very thin. Desktop and tablet only.

**Hero marquee (strip at bottom of hero):**
Infinite horizontal loop, `--t-h1` size, alternating bold and thin items separated by a small `●`:
`UGC EDITS ● Hook-driven short form ● PRODUCT DEMOS ● Talking heads ● MOTION TEXT ● TikTok ● REELS ● Meta ads ●`
Uppercase items bold, sentence-case items thin. Speed: 40s per loop. Scroll velocity nudges speed (up to 2.5x while scrolling, eases back) and scroll direction flips the marquee direction. Pauses on hover. Reduced motion: static, single line, overflow hidden.

**Entrance (after preloader):**
1. Label row fades in (300ms).
2. Headline lines slide up from `translateY(105%)` inside their masks, 80ms stagger, `--d-5`, `--ease-out`.
3. Thin words come in 120ms later than bold words on the same line (subtle "two-layer" feel).
4. Paragraph + buttons fade/slide 16px, delay 500ms.
5. Corner brackets draw in (scale from 0 at their corner).
6. Marquee fades in last.

**Copy:**
- Eyebrow: `[00] VIDEO EDITOR`
- Center label: `● REC` + timecode
- Right label: `AVAILABLE FOR Q4` (placeholder — replace)
- Headline: `ADS that / stop the THUMB. / EDITED to SELL.`
- Intro: `I edit performance ads for DTC brands. UGC, product demos, talking heads, motion text. Built for TikTok, Reels and Meta. Every cut has one job: keep the viewer watching until the offer.`
- Primary CTA: `See the work`
- Secondary CTA: `Book a call`
- Scroll cue: `Scroll`

---

### 3.3 Selected work (the grid)

Section label: `[01]  SELECTED WORK  TC 00:00:08:00 → 00:00:42:12`

**Header layout:**
- Title, `--t-d1`: **SELECTED** <thin>work</thin>
- Right side, aligned to baseline of title: count `(09)` in `--t-d2` thin, tabular nums. Updates when filters change (`(04)` etc.), with a quick digit roll.
- Under the title, a short line in `--c-mute`, `--t-body`: `Real ads. Real spend behind them. Tap any one to watch it on TikTok.`
- Filter bar: a row of text buttons in `--t-label`:
  `All (09)` / `UGC (03)` / `Product Demo (02)` / `Talking Head (02)` / `Motion (02)`
  Counts are computed from `work.js`, not hardcoded. Active filter: white text + 1px underline that slides between buttons (`--d-3`, `--ease-out`). Inactive: `--c-mute`, white on hover.
  Mobile: filter row scrolls horizontally, no scrollbar, fade mask on the right edge.

**Grid:**
- Desktop 1440: 4 columns. Tablet 768: 3 columns. Mobile 375: 2 columns. Under 340px: 1 column.
- Every card is a 9:16 box (`aspect-ratio: 9 / 16`).
- Editorial stagger: on desktop, columns 2 and 4 are offset down by 96px (`translateY` on the column, or margin-top on every even card). Gives a "contact sheet" rhythm. Off on mobile (2 cols, offset column 2 by 48px instead).
- Gap: `--gap`.

**Card anatomy:**
```
┌─────────────────┐
│ 01        0:00  │  <- top: index (label) + duration-ish frame label "9:16"
│                 │
│   [thumbnail]   │
│                 │
│                 │
│ ── hover ────── │
│ BRAND           │  <- metadata panel slides up on hover
│ UGC · 0:24      │
│ 2.4x ROAS       │
└─────────────────┘
Title of the ad          <- below card, --t-small, white
Brand · Category         <- --t-micro, mute
```
- Top-left overlay: index `01` in `--t-label`. Top-right: `9:16`. Both white, `mix-blend-mode: difference`.
- Below the card (always visible): title in `--t-body` 700, and `Brand · Category` in `--t-label` mute.

**Placeholder thumbnail (when image missing):**
- `<img>` with `onerror` / `load` check. On error, the card gets class `is-placeholder` and the img is hidden.
- Placeholder fill: `linear-gradient(160deg, #1f1f1f 0%, #141414 45%, #0a0a0a 100%)` plus a second faint radial highlight `radial-gradient(120% 60% at 50% 0%, rgba(255,255,255,0.06), transparent 60%)`.
- Centered giant number `01` in `--t-d2`, weight 200, color `--c-mute` at 35% opacity (decorative; the index is also in the top-left label). Below it, `--t-micro` mute: `THUMBNAIL 9:16`.
- Faint 1px safe-area frame inset 8% (TikTok UI safe zone), `--c-ink-3`, so the placeholder still looks deliberate.
- Grain overlay applies on top so it reads as footage, not an empty box.

**Hover (pointer devices):**
- Thumbnail image scales 1 → 1.06 over `--d-3` `--ease-out`. The card frame does not scale; the image scales inside an `overflow:hidden` box. (Clean, no layout shift.)
- Siblings dim to `opacity: .4` (grid gets `.is-hovering`, hovered card stays 1). `--d-2`.
- Metadata panel slides up from bottom (`translateY(100%) → 0`), background `rgba(0,0,0,.72)` with `backdrop-filter: blur(8px)` (fallback solid `#0a0a0a`). Contains:
  - Brand: `--t-label` mute
  - Format line: `UGC · 0:24 · 9:16`
  - Metric: `--t-h1` bold, e.g. `2.4x ROAS`, with a `--t-micro` mute label under it: `RESULT`.
- A thin white "playhead" line scrubs left to right across the bottom edge of the card over 2.4s while hovered (loops). Signature micro-detail tying to the timeline theme.
- Custom cursor grows and reads `PLAY` (see 4.1).

**Touch devices:** no hover. Metadata (brand + metric) is always shown in a compact bar inside the bottom of the card. First tap opens the link (no two-tap).

**Click behavior:** Two options, build option A as default, B behind a flag in `work.js` (`WORK_CONFIG.mode = "newtab" | "lightbox"`).

- **A. New tab (default):** Card is an `<a href="{tiktok}" target="_blank" rel="noopener">`. Simplest, always works, no embed weight.
- **B. Lightbox:** Card is a `<button>`. Opens a full-screen overlay `rgba(0,0,0,.94)`. Centered 9:16 frame (max height 86vh) containing TikTok embed via `https://www.tiktok.com/embed/v2/{videoId}` in an `<iframe>` (videoId parsed from URL: digits after `/video/`). Right side (desktop) or below (mobile): title, brand, format, metric, and a text link `Open on TikTok ↗`. Close: `Close` text button top-right, `Esc`, click backdrop. Arrow keys / swipe: previous/next within current filter. Focus trapped, focus returned to card on close. If videoId can't be parsed, fall back to new tab.
  Open animation: overlay fades `--d-2`, frame clips in from `inset(50% 0 50% 0)` to `inset(0)` over `--d-4` `--ease-in-out`.

**Filter animation:**
- Outgoing cards: fade to 0 + scale .96, 250ms.
- Re-layout instantly (hide via `hidden` attribute).
- Incoming cards: fade + translateY 24px → 0, 60ms stagger, `--d-3`.
- Use FLIP if the build agent is comfortable; otherwise the fade approach above is fine.
- Update the `(09)` count and URL hash (`#work/ugc`) so filters are linkable.

**Below grid:**
- Center: text link `More on TikTok @jhonmedia ↗` in `--t-h2`, underline draws in on hover.

**Copy:**
- Title: `SELECTED work`
- Sub: `Real ads. Real spend behind them. Tap any one to watch it on TikTok.`
- Filters: `All` / `UGC` / `Product Demo` / `Talking Head` / `Motion`
- Card hover label (cursor): `PLAY`
- Lightbox link: `Open on TikTok ↗`; close: `Close`
- Footer link: `More on TikTok @jhonmedia ↗`
- Empty filter state (should not happen, but): `Nothing here yet. Check back soon.`

---

### 3.4 Results (stats counters)

Background `--c-ink-0`. Section label: `[02]  RESULTS  TC 00:00:42:12 → 00:00:51:00`

**Layout:**
- Intro line on the left, `--t-h2`, cols 1-6: `Views are nice. These are the numbers I get judged on.`
- Below: 4-column row of stats (2x2 on mobile). Each stat cell has a 1px top border, 24px padding top.
  - Number: `--t-d2`, bold, tabular nums. Suffix (`%`, `+`, `x`) in thin weight.
  - Label: `--t-label`, white.
  - Note: `--t-small`, mute, one line.

**Stats (all placeholder — replace):**
1. `38%` / `AVG HOOK RATE` / `3-second views ÷ impressions across Meta ads I've cut.` (placeholder — replace)
2. `400+` / `ADS DELIVERED` / `Finished, launched, not drafts.` (placeholder — replace)
3. `30+` / `DTC BRANDS` / `Skincare, supplements, apparel, home, pets.` (placeholder — replace)
4. `48h` / `FIRST CUT` / `Standard turnaround on a single ad.` (placeholder — replace)

Note under the row in `--t-micro` mute: `Numbers from client ad accounts. Your results depend on offer, product and spend.`

**Behavior:**
- Numbers count up from 0 when the row is 40% in view, 1.4s, `--ease-out`, once. Use `requestAnimationFrame`, tabular nums so width doesn't jump.
- Suffix fades in after count finishes (100ms).
- Top border of each cell draws left to right (scaleX 0 → 1, transform-origin left), 80ms stagger.
- Reduced motion: final values, no count.
- Each number has `aria-label` with the final value so screen readers never read "0".

---

### 3.5 The edit timeline (signature piece)

Section label: `[03]  ANATOMY OF AN AD  TC 00:00:51:00 → 00:01:21:00`

This is the "how a winning 30-second ad is built" section, visualized as an NLE timeline that scrubs as you scroll. It's the thing people remember.

**Layout (desktop):**
- Section is a tall scroll container: `height: 400vh`. Inside it, a `position: sticky; top: 0; height: 100vh` stage.
- Stage top: title `--t-d1`: **ANATOMY** <thin>of a</thin> **WINNER.** Under it, mute: `A 30-second DTC ad, frame by frame. Scroll to scrub.`
- Stage middle: a large **viewer** readout on the left (cols 1-5):
  - Giant timecode `00:00:03:12` in `--t-d2` thin, tabular nums. Updates live with scroll.
  - Current beat title in `--t-h1` bold (e.g. `The hook`).
  - Beat description in `--t-body`, max 40ch.
  - Beat stat (mute, `--t-label`), e.g. `TARGET: 30%+ HOOK RATE`.
- Stage right (cols 6-12): a stacked list of beat names, the active one white, others `--c-ink-3`. Acts like a chapter list. Click to jump (scrolls to that beat).
- Stage bottom: the **timeline** itself, full width minus gutter:
  - Ruler row: tick marks every second (1px, `--c-ink-3`), labels every 5s `00:05` in `--t-micro` mute.
  - Track `V2` (text/motion layer): blocks for on-screen text cards.
  - Track `V1` (footage): clip blocks of varying widths for each beat, each block `--c-ink-2` with 1px `--c-ink-3` border, label inside (`HOOK`, `PROBLEM`, `DEMO`, `PROOF`, `OFFER`, `CTA`) in `--t-micro`.
  - Track `A1` (audio): a waveform drawn as ~240 thin vertical bars of random-but-seeded heights (generated once in JS, deterministic seed so it looks the same every load), `--c-ink-3`.
  - Track labels on the left of each lane: `V2`, `V1`, `A1` in `--t-micro`.
  - **Playhead:** a 1px white vertical line spanning all tracks, with a small white square handle on the ruler. Its x position maps to scroll progress 0 → 1 across the 30s timeline.
  - Clips the playhead has passed turn brighter (`--c-ink-3` fill, white label). The active clip gets a white 1px outline.
- Lane height 40px, gap 4px.

**Beats (copy, in order; time ranges drive clip widths):**

| # | In → Out | Clip label | Title | Body | Stat line |
|---|---|---|---|---|---|
| 1 | 00:00 → 00:03 | HOOK | The hook | Three seconds. One idea. A pattern break, a bold claim or a result shown first. If they don't stop here, nothing after this matters. | `TARGET: 30%+ HOOK RATE` |
| 2 | 00:03 → 00:08 | PROBLEM | The problem | Name the exact thing that annoys them. Their words, not the brand's. This is where they decide the ad is about them. | `CUT EVERY 1.5 TO 2s` |
| 3 | 00:08 → 00:16 | DEMO | The demo | Show the product doing the job. Hands, close-ups, before and after. No b-roll for the sake of b-roll. | `SHOW, DON'T CLAIM` |
| 4 | 00:16 → 00:23 | PROOF | The proof | Reviews, numbers, a second face. Stack enough proof that the price stops being the question. | `REDUCE DOUBT` |
| 5 | 00:23 → 00:27 | OFFER | The offer | What they get, what it costs, why now. Said once, clearly, on screen and in voice. | `ONE OFFER. NO MENU.` |
| 6 | 00:27 → 00:30 | CTA | The CTA | Tell them what to tap. Then end the ad. Dead air at the end costs you the loop. | `END ON THE ACTION` |

V2 text blocks (motion layer): `"Stop scrolling if…"` at 0:00 to 0:02, `CAPTIONS` across 0:03 to 0:23 as thin repeated blocks, `$ OFFER CARD` at 0:23 to 0:27, `TAP ↓` at 0:27 to 0:30.

**Behavior:**
- Scroll progress through the 400vh container (0 → 1) maps linearly to 0 → 30s.
- Timecode shows `HH:MM:SS:FF` at 24fps: `frames = floor(progress * 30 * 24)`.
- When the beat changes: beat title/body swap with a split-line reveal (old lines slide up and out, new lines slide up and in, `--d-3`). Chapter list highlight moves.
- Waveform bars left of the playhead are white at 60% opacity, right of it `--c-ink-3`.
- Clicking a beat in the chapter list or a clip on V1 scrolls to the start of that beat (smooth).
- Keyboard: the timeline region is focusable (`tabindex="0"`, `role="region"`, `aria-label="Ad timeline"`). Left/right arrow keys jump to previous/next beat.
- `aria-live="polite"` on the beat title so screen readers announce the beat change (throttled, only on beat change, not every frame).

**Mobile / tablet (< 1024px):**
- No sticky scrub (too finicky on touch). Instead: the timeline becomes a **horizontal scroll-snap strip**. The ruler + V1 track scale up so each beat clip is ~80vw wide; user swipes horizontally. Beat text sits under the timeline and updates to the snapped clip. Playhead fixed at the center of the strip.
- Timecode still updates as they swipe.

**Reduced motion:** No sticky scrub. Render all 6 beats as a static numbered list with the timeline drawn once above it (playhead at the end, all clips "played").

---

### 3.6 Services

Section label: `[04]  SERVICES  TC 00:01:21:00 → 00:01:38:00`

**Layout:**
- Title `--t-d1`: **WHAT** <thin>I</thin> **CUT.**
- Below: a stacked list, full width. Each row is a 12-col grid with hairline top border:
  - Col 1: index `01` `--t-label` mute
  - Cols 2-6: service name `--t-h1` bold
  - Cols 7-11: description `--t-body`, mute, plus a deliverables line in `--t-label` white
  - Col 12: `+` / `−` glyph (1px lines, not a font character) at right edge
- **Row hover (desktop):** a white bar wipes in from the left behind the row (`scaleX 0 → 1`, `--d-3`, `--ease-in-out`), text flips to black. The service name shifts right 24px. Rows are not links, so the cursor stays in its default state. The `+` glyph rotates 45°.
- Mobile: rows stack (index + name on one line, description under).

**Services (copy):**

1. **UGC ad edits**
   You send raw creator footage. I find the best 3 seconds and build the ad around it. Captions, pacing, b-roll, music.
   Deliverables: `3 HOOK VARIATIONS PER AD · 9:16 + 4:5 · CAPTIONED`

2. **Hook testing packs**
   One body, many openers. The fastest way to find a winner without reshooting. Swap the first 3 seconds, keep everything else.
   Deliverables: `5 TO 10 HOOKS ON ONE BODY · NAMED FOR ADS MANAGER`

3. **Product demos**
   Close-ups, hands, before and after. The product does the selling. I cut it so nobody has to read a spec sheet.
   Deliverables: `15s + 30s CUTS · TEXT CALLOUTS · SOUND DESIGN`

4. **Talking heads**
   Founder or expert to camera. Cut the ums, tighten the argument, punch in on the lines that land. Keeps the person real. Keeps it moving.
   Deliverables: `JUMP CUTS · ZOOMS · ANIMATED CAPTIONS`

5. **Motion text ads**
   No creator footage yet? Kinetic type, product shots and a strong script. Cheap to make, easy to iterate.
   Deliverables: `TYPE-LED · BRAND FONTS + COLORS · 6s TO 30s`

6. **Iteration on winners**
   Your best ad is fatiguing. I cut new versions from what's already working: new hooks, new order, new first frame. Same proof.
   Deliverables: `WEEKLY BATCHES · BUILT FROM YOUR AD DATA`

---

### 3.7 Process

Background `--c-ink-0`. Section label: `[05]  PROCESS  TC 00:01:38:00 → 00:01:52:00`

**Layout:**
- Title `--t-d1`: <thin>How it</thin> **WORKS.**
- **Horizontal scroll section (desktop):** pinned stage (`height: 300vh` container, sticky inner). Steps sit in a row of 5 panels, each panel 38vw wide, translating left as you scroll (`translateX` mapped to progress). A thin progress bar at the top of the stage fills as you go, labeled `STEP 01 / 05`.
- Each panel: giant step number `01` in `--t-mega` thin, `--c-ink-3` color (huge, ghosted), overlapping it the step title `--t-h1` bold white, then body `--t-body`, then a `--t-label` timing note.
- Mobile/tablet + reduced motion: vertical stack, no pin. Each step with a left hairline and number.

**Steps (copy):**

01. **Brief**
    You send the product, the offer, the footage and what's running now. If you have ad account numbers, send those too. I want to know what's already winning.
    `DAY 0`

02. **Hooks first**
    I pull 3 to 5 hook options before I touch the body. We agree on the angle. This saves a full revision round.
    `DAY 1`

03. **First cut**
    Full ad, captioned, sound designed, exported for every placement you need.
    `48 HOURS` (placeholder — replace)

04. **Revisions**
    Two rounds included. Notes in Frame.io or a Loom. Specific notes get specific fixes.
    `24 HOURS PER ROUND`

05. **Launch and iterate**
    You launch. We look at hook rate, hold rate and CPA after 3 to 5 days. The next batch is built from what the data says, not what we like.
    `ONGOING`

---

### 3.8 Brands marquee

No section label (a breather). Full-bleed, two rows, hairline above and below each row.

- Row 1 moves left, row 2 moves right. Row 1: brand names in `--t-d2` bold. Row 2: same size, thin, different order.
- Items separated by a 1px × 0.6em vertical line.
- Hover on a row: slows to 25% speed.
- Small label above, centered, `--t-label` mute: `BRANDS I'VE CUT FOR` with `(placeholder names — replace)` as an HTML comment.

**Placeholder brand names (all placeholder — replace with real clients or remove):**
Row 1: `NORTHBOUND` · `SOLACE` · `KINFOLK SKIN` · `ATLAS SUPPLY` · `HALO PET` · `FIELD & OAK`
Row 2: `BRIGHTWELL` · `MERIDIAN` · `LOOP ACTIVE` · `VERA HOME` · `TIDAL` · `OAKWELL`

If Jhon has fewer than 6 real brands, replace row 2 with categories: `SKINCARE · SUPPLEMENTS · APPAREL · HOME · PET · FITNESS`.

---

### 3.9 Testimonials

Section label: `[06]  CLIENTS  TC 00:01:52:00 → 00:02:04:00`

**Layout:**
- One testimonial at a time, huge. Quote in `--t-h1` weight 400 (not bold), max 22ch per line desktop, hanging open quote mark in thin `--t-mega` size, `--c-ink-3`.
- Under the quote: name (700) + role/brand (mute), `--t-label`.
- Bottom row: counter `01 / 03` tabular nums left; `Prev` / `Next` text buttons right (magnetic). A thin progress line under the counter fills over 8s, then auto-advances. Auto-advance pauses on hover, focus, or when the tab is hidden. No autoplay under reduced motion.
- Transition: outgoing quote lines slide up out of masks, incoming lines slide up in (split-line, 60ms stagger).
- Swipe on touch.

**Testimonials (all placeholder — replace with real quotes, with permission):**

1. "We sent Jhon 40 minutes of creator footage. He sent back 6 ads and 18 hooks in two days. Two of them are still our best performers three months later."
   `MARIA C. · GROWTH LEAD, KINFOLK SKIN` (placeholder — replace)

2. "He asks for the numbers. Hook rate, hold rate, CPA. Most editors don't. That's why his second batch beat the first."
   `DANIEL R. · FOUNDER, ATLAS SUPPLY` (placeholder — replace)

3. "Fast, clear, no hand-holding. Notes on Monday, new cuts Tuesday morning."
   `PRIYA S. · MEDIA BUYER, HALO PET` (placeholder — replace)

---

### 3.10 Packages (pricing)

Section label: `[07]  PACKAGES  TC 00:02:04:00 → 00:02:16:00`

Optional, but build it. Jhon can delete the section if he prefers quote-only.

**Layout:**
- Title `--t-d1`: **PACK**<thin>ages</thin>. Under it, mute: `Fixed scope. Fixed price. No hourly billing.`
- 3 columns desktop (1 col mobile). Columns separated by 1px vertical hairlines, no card backgrounds. Middle column is "inverted" on hover only (white bg, black text, `--d-3` wipe up from bottom). No permanent highlight.
- Each column: name `--t-label`, price `--t-d2` bold with `/batch` thin, one-line summary, list of inclusions (each with a 1px line glyph, not a checkmark icon), CTA text button `Start with {name} →`.

**Packages (prices are placeholder — replace):**

1. `TEST`
   Price: `$450` thin suffix ` / batch` (placeholder — replace)
   Summary: `For brands testing a new angle.`
   - 3 ads, up to 30s
   - 3 hooks per ad (9 versions total)
   - 9:16 and 4:5 exports
   - 2 revision rounds
   - 3-day delivery
   CTA: `Start with Test →`

2. `SCALE`
   Price: `$1,200` / batch (placeholder — replace)
   Summary: `For brands with a winner to build on.`
   - 8 ads, up to 45s
   - 5 hooks per ad (40 versions total)
   - All placements, captions burned in
   - 2 revision rounds
   - 5-day delivery
   CTA: `Start with Scale →`

3. `RETAINER`
   Price: `$3,500` / month (placeholder — replace)
   Summary: `For brands launching new creative every week.`
   - 20 to 25 ads per month
   - Weekly iteration from your ad data
   - Priority 24h turnaround
   - Shared Slack channel
   - Monthly creative review call
   CTA: `Start a retainer →`

Note under, `--t-small` mute: `Need something else? Send me the brief and I'll quote it within a day.`

All CTAs link to `#contact` and prefill subject via `mailto:` fallback (see 3.12).

---

### 3.11 FAQ

Background `--c-ink-0`. Section label: `[08]  FAQ  TC 00:02:16:00 → 00:02:24:00`

**Layout:**
- 12-col: Title in cols 1-4 (sticky on desktop, `top: 120px`): **QUEST**<thin>ions</thin>. Under it, mute: `Still unsure? Email me. I reply within 24 hours.`
- Accordion in cols 6-12. Each item: hairline top, question `--t-h2` 400 weight, `+` glyph right built from two 1px lines (vertical line rotates 90° to make `−` on open, `--d-3`).
- Answer: `--t-body` mute, max 60ch, padding bottom 32px.

**Behavior:**
- Native `<details>`/`<summary>` for accessibility and no-JS fallback. JS enhances with height animation (measure `scrollHeight`, animate `height` 0 → auto via `--d-3` `--ease-out`, then set `height:auto`).
- Only one open at a time (JS). First item open by default.
- Hovered question nudges right 8px.

**Questions (copy):**

1. **What do you need from me to start?**
   Raw footage, your product page, the offer, and any ads running now. Ad account screenshots help a lot. If I can see what's winning, I can build on it instead of guessing.

2. **Do you write scripts or only edit?**
   Mostly edit. I'll write hooks and on-screen text on every project, and I can outline a script for creators if you need one. Full scripting is quoted separately.

3. **How fast is turnaround?**
   First cut in 48 hours for a single ad. Batches take 3 to 5 days. Revisions come back within 24 hours. (placeholder — replace)

4. **How many revisions do I get?**
   Two rounds per batch. Clear, specific notes get fixed fast. If the brief changes halfway through, we talk scope.

5. **Which platforms do you edit for?**
   TikTok, Instagram Reels, Facebook and Instagram feed, YouTube Shorts. I export 9:16, 4:5 and 1:1, named so your media buyer can upload without asking what's what.

6. **Do you guarantee results?**
   No. Nobody honest can. Results depend on the offer, the product, the audience and the spend. What I guarantee: every ad is built to hold attention and get to the offer. And I'll use your data to make the next batch better.

7. **What software do you use?**
   Premiere Pro and After Effects. CapCut when a native TikTok look is the goal. Frame.io for review.

8. **How do I pay?**
   50% upfront, 50% on delivery for batches. Retainers are paid monthly in advance. Wise, PayPal or bank transfer. (placeholder — replace)

---

### 3.12 Contact CTA

**Inverted section:** background `--c-white`, text `#000`. This is the one big inversion on the page. Entering it, the custom cursor inverts automatically via `mix-blend-mode: difference`.

Section label (in black): `[09]  CONTACT  TC 00:02:24:00 → 00:02:30:00`

**Layout:**
- Small line above, `--t-label`: `● REC  NEXT AD STARTS HERE`
- Headline `--t-mega`, uppercase, 2 lines:
  - **GOT** <thin>footage?</thin>
  - <thin>Let's</thin> **CUT IT.**
- Under: `--t-h2`: `Send me the product, the offer and what's running now. I'll reply within 24 hours with how I'd approach it.`
- Big email link, `--t-d2` bold, underline draws on hover (1px black line scaleX): `hello@jhonmedia.com`. Next to it, a `Copy` text button. On click: copies to clipboard, label changes to `Copied` for 1.6s. Fallback if clipboard API fails: select the text.
- Two magnetic buttons (black fill, white text; and outline black):
  - `Book a 15-min call` → `https://cal.com/jhonmedia (placeholder — replace)` new tab
  - `DM on TikTok` → `https://www.tiktok.com/@jhonmedia` new tab
- Response line, `--t-small`: `Usually replies in under 24 hours. Based in the Philippines, works with US, UK and AU brands. (placeholder — replace)`

No contact form (keeps it static, no backend). Email + booking link is enough.

**Hover detail:** on desktop, the headline has a subtle pointer parallax (moves up to 12px opposite to the pointer). FINE pointers only, off under reduced motion.

---

### 3.13 Footer

Background `--c-black` (back from inversion with a hard cut, no gradient).

**Layout:**
- Row 1 (4 cols desktop, 2 tablet, 1 mobile), `--t-label` headers mute, links white `--t-body`:
  - `CONTACT`: `hello@jhonmedia.com`, `Book a call`
  - `SOCIAL`: `TikTok`, `Instagram`, `LinkedIn` (placeholder URLs — replace)
  - `SITE`: `Work`, `Services`, `Process`, `FAQ`
  - `LOCAL TIME`: live clock `14:32 PHT` (placeholder timezone — replace)
- Row 2: the full-width wordmark **JHON** <thin>MEDIA</thin> sized so it spans edge to edge (`font-size: 21.5vw` approx, tune so both words fit gutter to gutter on one line), line-height .8, sitting at the very bottom, clipped by the viewport edge by ~8% (cropped, intentional). Reveals by sliding up from below when footer enters view.
- Row 3 (tiny, `--t-micro` mute), between row 1 and wordmark: left `© 2026 Jhon Media`, center `Edited, not templated.`, right `Back to top ↑` (smooth scroll to top, magnetic).

---

## 4. Advanced interactions

All interactions live in `main.js`, each as a small init function. Every one checks two flags at start:
```js
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE    = matchMedia('(hover: hover) and (pointer: fine)').matches;
```
Listen for changes to both and degrade live.

### 4.1 Custom cursor (FINE only)
- Two elements: a 6px white dot that follows the pointer exactly, and a 36px ring (1px white border, transparent) that follows with lerp `0.15`. Both `mix-blend-mode: difference`, `pointer-events:none`, `position:fixed`, transform only.
- States (set via `data-cursor` attribute on hovered element, read on `pointerover`):
  - Default: dot + ring.
  - `data-cursor="link"`: ring scales to 56px, dot hides.
  - `data-cursor="play"` (work cards): ring becomes a solid white 96px circle, label `PLAY` in black `--t-label` centered. Scale in `--d-2` `--ease-snap`. Same label in both newtab and lightbox modes. Cards without a real link show `SOON` (see section 5).
  - `data-cursor="view"`: 80px solid circle, label `VIEW`. Used on the `More on TikTok` link and brand marquee rows.
  - `data-cursor="drag"` (testimonials, mobile timeline on desktop narrow): 80px circle, label `DRAG`.
  - `data-cursor="hidden"` (inside lightbox iframe area): hide.
- Hide native cursor with `cursor:none` on `html.has-cursor` only. Never hide it on inputs or text fields (none exist, but guard anyway).
- Hide custom cursor when the pointer leaves the window.

### 4.2 Magnetic buttons (FINE + not REDUCED)
- Applies to `[data-magnetic]`: primary/secondary CTAs, nav CTA, Prev/Next, Back to top, contact buttons.
- On pointermove within the element bounds + 24px padding: translate the element toward the pointer by 30% of the offset, and its inner label by 15% more (two-layer parallax). On leave: spring back with `--d-3` `--ease-out` (CSS transition on transform).
- Max travel 16px.

### 4.3 Split-line text reveals
- Applies to `[data-split]` headings and key paragraphs.
- On load, JS splits text into lines (measure word `offsetTop`, group words by line, wrap each line in `<span class="line"><span class="line-inner">…</span></span>`). Keep thin/bold `<span>`s intact by splitting on word boundaries inside existing children. Re-split on resize (debounced 200ms) only if width changes.
- `.line { overflow:hidden; display:block }`, `.line-inner { display:block; transform: translateY(105%) }`. When in view (IntersectionObserver, threshold .2, rootMargin `0px 0px -10% 0px`): `transform: none`, `--d-4`, `--ease-out`, stagger 80ms per line.
- Screen readers: the wrapper spans do not change reading order, so no aria attributes are added. Text stays natural.
- No-JS: nothing is hidden (initial hidden state is only applied under `html.js`).
- Generic `[data-reveal]` for blocks: fade + 24px translate, same observer.

### 4.4 Smooth scroll feel
- Native scroll stays native (no scroll hijacking, no fake scroll container). That keeps accessibility, find-in-page, anchors and mobile momentum intact.
- "Smoothness" comes from:
  1. `html { scroll-behavior: smooth }` for anchor jumps (off under reduced motion).
  2. A single rAF loop that lerps a `smoothY` value toward `scrollY` (factor 0.1) and uses it to drive scroll-linked effects: parallax, marquee velocity, timeline playhead, process translate. Effects feel buttery while the page itself scrolls natively.
  3. Subtle parallax on `[data-speed]` elements (e.g. hero headline lines at 0.9, 0.95, 1.0; section big numbers at 0.85). `translate3d(0, (smoothY - offset) * (1 - speed), 0)`.
- The rAF loop sleeps when nothing changes (stop after |scrollY - smoothY| < 0.1 and no active marquees in view).

### 4.5 Film grain / noise overlay
- Fixed full-screen `<div class="grain">`, `pointer-events:none`, z 9000.
- Implementation: a 256×256 noise tile generated once on a `<canvas>` (random gray per pixel, alpha 255), exported via `toDataURL()` to `background-image`. Opacity `0.06`. `mix-blend-mode: overlay` (fallback normal at 0.04).
- Animate by shifting `background-position` in steps every 80ms (12fps, film-like) with `steps()` keyframes across 8 random offsets. Pure CSS animation once the image is set.
- Reduced motion: grain static (no position animation), still visible.
- Mobile: opacity 0.04, animation off (battery).

### 4.6 Scroll-linked timeline (signature)
See 3.5. Plus: as the playhead crosses each clip boundary, a 1-frame "cut" flash: the viewer timecode briefly switches to bold for 80ms. Tiny, but it's the detail.

### 4.7 Process (replaced)
Superseded by `docs/PROCESS-V2.md` §7: static grid with an After Effects-style selection box gliding between steps, plus a one-time slot-roll entrance. The pinned horizontal scroll is retired.

### 4.8 Marquees
- One reusable component `[data-marquee]` with `data-speed` and `data-direction`.
- Build: duplicate inner track until it's at least 2× viewport width, then animate `translateX` in the rAF loop (not CSS keyframes) so scroll velocity can modulate speed. `x = (x - speed * dir * velocityBoost) % trackWidth`.
- `velocityBoost = 1 + min(abs(scrollDelta) * 0.04, 1.5)`, eased back to 1.
- Paused when off-screen (IntersectionObserver).
- Reduced motion: no movement; show first set of items, `overflow:hidden`.
- `aria-hidden="true"` on the duplicate tracks; the first track is readable.

### 4.9 Counters
See 3.4. Shared `countUp(el, to, duration)` util. Respects decimals (`2.4x`) via `data-decimals`.

### 4.10 Page-load sequence (total ~3s, interruptible)

> Superseded by `docs/PRELOADER-OPTIONS.md` §7 (export panel). Exit is a transform lift, hero entrance at 60% of it.
1. 0.0s: preloader counter 0 → 100 (1.2–2.8s depending on load).
2. +0.15s: weight cut on `100`, preloader wipes up (1.2s).
3. Overlapping at 60% of the wipe: hero label row in, headline lines stagger up, thin words trail by 120ms.
4. +0.5s: intro paragraph + buttons.
5. +0.7s: corner brackets draw, nav fades in, marquee in, REC dot starts pulsing, timecode starts.
6. Grain is visible from frame one (on the preloader too).
If the user scrolls or presses a key during the preloader after 1.2s, skip to the end.

### 4.11 Live timecodes
- Nav clock (local time, 24fps frames, tabular nums).
- Hero REC timecode (time since load).
- Preloader timecode.
- Update via one shared rAF tick, textContent only, no layout thrash. Reduced motion: update once per second (no frames field animation; show `:00`).

### 4.12 Misc micro-interactions
- Link underline: 1px line under text, `scaleX(0)` origin right → on hover `scaleX(1)` origin left. `--d-3`.
- Buttons: primary has a black fill that wipes up from the bottom on hover, text color flips to white, text rolls (same roll as nav).
- Section label row timecodes tick up (count from in-point to out-point) once when the label enters view. 600ms.
- Focus-visible: 2px white outline, 3px offset (on white section: 2px black). Never removed.

### 4.13 Performance rules
- Animate `transform` and `opacity` only (plus `clip-path` for wipes).
- `will-change` added just before an animation and removed after.
- All scroll reads in one rAF; no listeners doing layout reads per event.
- Images: `loading="lazy"`, `decoding="async"`, explicit `width/height` (1080×1920) so no CLS. First 4 thumbnails `loading="eager"`, `fetchpriority="high"` on first 2.
- `content-visibility: auto` on sections below the fold (with `contain-intrinsic-size`).

---

## 5. Data model: `assets/js/work.js`

This is the only file Jhon needs to touch to update the work grid. It is a plain script (not a module) so it works by double-clicking `index.html` with no server. Load it before `main.js`.

```js
/* ============================================================
   JHON MEDIA · WORK GRID
   ============================================================
   HOW TO UPDATE YOUR WORK (2 minutes):

   1. THUMBNAIL
      Export a vertical frame from the ad. 9:16. 1080x1920 is ideal
      (720x1280 is fine). JPG, under 250KB.
      Name it 01.jpg, 02.jpg ... and drop it in /assets/thumbs/.
      No image yet? Leave the path. The site shows a gray numbered
      placeholder until the file exists.

   2. TIKTOK LINK
      Open the video on TikTok > Share > Copy link.
      Paste the full link into "tiktok". It should look like:
      https://www.tiktok.com/@jhonmedia/video/7351234567890123456
      (Short links like vm.tiktok.com work in "newtab" mode but NOT
      in "lightbox" mode. Open them once in a browser and copy the
      long link from the address bar.)

   3. DETAILS
      title    : short name of the ad. 2 to 5 words.
      brand    : client name. Use "Confidential" if under NDA.
      category : must be one of "UGC", "Product Demo",
                 "Talking Head", "Motion". This drives the filters.
      format   : length + ratio, e.g. "0:24 · 9:16".
      metric   : the one result you can share, e.g. "2.4x ROAS",
                 "41% hook rate", "$0.92 CPC". Leave "" to hide it.

   4. ORDER
      The grid shows items in the order below. Put your best first.

   5. ADD OR REMOVE
      Copy a { ... } block, paste it, change the values.
      Keep the comma between blocks. Delete a block to remove it.
      8 or 12 items look best on desktop (4 columns).
   ============================================================ */

window.WORK_CONFIG = {
  // "newtab"  : clicking a card opens TikTok in a new tab (recommended)
  // "lightbox": clicking plays the TikTok embed on the page
  mode: "newtab",
  profile: "https://www.tiktok.com/@jhonmedia" // placeholder — replace
};

window.WORK = [
  {
    title: "The 3-second skin reveal",
    brand: "Kinfolk Skin",            // placeholder — replace
    category: "UGC",
    format: "0:24 · 9:16",
    metric: "2.4x ROAS",              // placeholder — replace
    thumbnail: "assets/thumbs/01.jpg",
    tiktok: "https://www.tiktok.com/@jhonmedia/video/0000000000000000001" // placeholder — replace
  },
  {
    title: "Desk setup in 15 seconds",
    brand: "Atlas Supply",            // placeholder — replace
    category: "Product Demo",
    format: "0:15 · 9:16",
    metric: "41% hook rate",          // placeholder — replace
    thumbnail: "assets/thumbs/02.jpg",
    tiktok: "https://www.tiktok.com/@jhonmedia/video/0000000000000000002" // placeholder — replace
  },
  {
    title: "Founder explains the formula",
    brand: "Solace",                  // placeholder — replace
    category: "Talking Head",
    format: "0:38 · 9:16",
    metric: "-32% CPA",               // placeholder — replace
    thumbnail: "assets/thumbs/03.jpg",
    tiktok: "https://www.tiktok.com/@jhonmedia/video/0000000000000000003" // placeholder — replace
  },
  {
    title: "Why my dog stopped scratching",
    brand: "Halo Pet",                // placeholder — replace
    category: "UGC",
    format: "0:29 · 9:16",
    metric: "3.1x ROAS",              // placeholder — replace
    thumbnail: "assets/thumbs/04.jpg",
    tiktok: "https://www.tiktok.com/@jhonmedia/video/0000000000000000004" // placeholder — replace
  },
  {
    title: "Five reasons, zero footage",
    brand: "Meridian",                // placeholder — replace
    category: "Motion",
    format: "0:12 · 9:16",
    metric: "$0.71 CPC",              // placeholder — replace
    thumbnail: "assets/thumbs/05.jpg",
    tiktok: "https://www.tiktok.com/@jhonmedia/video/0000000000000000005" // placeholder — replace
  },
  {
    title: "Unboxing, then the twist",
    brand: "Vera Home",               // placeholder — replace
    category: "Product Demo",
    format: "0:21 · 9:16",
    metric: "38% hold rate",          // placeholder — replace
    thumbnail: "assets/thumbs/06.jpg",
    tiktok: "https://www.tiktok.com/@jhonmedia/video/0000000000000000006" // placeholder — replace
  },
  {
    title: "Three creators, one hook",
    brand: "Loop Active",             // placeholder — replace
    category: "UGC",
    format: "0:26 · 9:16",
    metric: "18 hooks tested",        // placeholder — replace
    thumbnail: "assets/thumbs/07.jpg",
    tiktok: "https://www.tiktok.com/@jhonmedia/video/0000000000000000007" // placeholder — replace
  },
  {
    title: "The dermatologist breakdown",
    brand: "Brightwell",              // placeholder — replace
    category: "Talking Head",
    format: "0:44 · 9:16",
    metric: "2.0x ROAS",              // placeholder — replace
    thumbnail: "assets/thumbs/08.jpg",
    tiktok: "https://www.tiktok.com/@jhonmedia/video/0000000000000000008" // placeholder — replace
  },
  {
    title: "Kinetic type launch spot",
    brand: "Tidal",                   // placeholder — replace
    category: "Motion",
    format: "0:09 · 9:16",
    metric: "1.2M views",             // placeholder — replace
    thumbnail: "assets/thumbs/09.jpg",
    tiktok: "https://www.tiktok.com/@jhonmedia/video/0000000000000000009" // placeholder — replace
  }
];
```

**Build-agent notes for rendering:**
- Categories and filter counts are derived from `WORK`. Filter order is fixed: `All`, `UGC`, `Product Demo`, `Talking Head`, `Motion`. A category with 0 items hides its filter button.
- Index numbers (`01`, `02`…) come from array order, zero-padded.
- Placeholder detection: create the `<img>`, listen for `error` → add `.is-placeholder` to the card and remove the img. Also treat empty `thumbnail` as placeholder.
- Placeholder IDs (`000000…`) in `tiktok`: if the URL contains `/video/0000`, treat it as unset. The card still renders, but clicking opens `WORK_CONFIG.profile` instead, and the hover label says `SOON` instead of `PLAY`. That way the site works before Jhon has links.
- Escape all strings when inserting (use `textContent`, never `innerHTML` with data).
- Card is rendered as `<a>` in newtab mode with `aria-label="{title}, {brand}, {category}. Opens TikTok in a new tab."`.
- `metric: ""` hides the metric line.
- Lightbox videoId parse: `/\/video\/(\d+)/`.
- If `WORK` is missing or empty, show the section with the empty-state copy and the TikTok profile link.

---

## 6. Accessibility

- Semantic landmarks: `<header>` (nav), `<main>`, each section a `<section aria-labelledby>`, `<footer>`.
- Skip link first in DOM: `Skip to work` (visually hidden until focused, then white box top-left).
- One `<h1>`: the hero headline. Section titles are `<h2>`. Services/steps/FAQ items `<h3>`.
- Mixed-weight headlines are one heading element with inner `<span class="thin">`. Reads as a normal sentence.
- Decorative stuff (`grain`, `cursor`, corner brackets, waveform, duplicate marquee tracks, section-label timecodes, preloader) gets `aria-hidden="true"`.
- Live timecodes and clocks: `aria-hidden="true"`. They would be noise to a screen reader.
- Color contrast: all text pairs meet WCAG AA. Verified pairs: #fff/#000 21:1, #8a8a8a/#000 6.2:1, #8a8a8a/#0a0a0a 5.9:1, #8a8a8a/#141414 5.4:1, #000/#fff 21:1. Never put `--c-mute` text on `--c-ink-2` or lighter. Ghosted numbers in `--c-ink-3` are decorative only and duplicated in readable text.
- Keyboard: every interactive element reachable, visible focus (4.12). Filters are `<button aria-pressed>`. Accordion is `<details>`. Lightbox: `role="dialog" aria-modal="true"`, focus trap, Esc closes, focus returns. Mobile menu: same dialog rules. Testimonial carousel: Prev/Next buttons, `aria-live="polite"` on the quote region, auto-advance stops on focus.
- Reduced motion (`prefers-reduced-motion: reduce`): no preloader count, no split reveals (content visible), no marquee movement, no parallax, no magnetic, no sticky scrub (timeline + process become static lists), grain static, no testimonial auto-advance, `scroll-behavior: auto`. Hover color changes and focus states remain.
- Touch / coarse pointer: no custom cursor, no magnetic, card metadata always visible, no hover-dependent info.
- No-JS: page is fully readable. Work grid: the HTML ships with a `<noscript>` block containing a link to the TikTok profile. Everything else is static HTML.
- Language: `<html lang="en">`. Page title: `Jhon Media · DTC Video Ad Editor`. Meta description: `Jhon edits performance video ads for DTC brands. UGC, product demos, talking heads and motion text for TikTok, Reels and Meta.`
- Links opening a new tab show `↗` and include "opens in a new tab" in their accessible name.

---

## 7. Responsive

Breakpoints (min-width, mobile first):
- **Base / mobile: 375** (design target; must work down to 320).
- **Tablet: 768** (`@media (min-width: 768px)`).
- **Laptop: 1024** (`@media (min-width: 1024px)`): sticky timeline scrub and horizontal process turn on here.
- **Desktop: 1440** (`@media (min-width: 1440px)`): design target. Above 1440, type keeps scaling via clamp up to its max, layout stays fluid.

| Element | 375 | 768 | 1440 |
|---|---|---|---|
| Grid columns | 4 | 8 | 12 |
| Nav | Wordmark + `Menu` | Wordmark + `Menu` | Full links + clock + CTA |
| Hero headline | ~64px, 3 lines, no indent, thin/bold kept | ~120px, line 2 indent 1 col | ~245px, line 2 indent 2 cols, line 3 right |
| Hero buttons | Full width, stacked | Inline | Stacked, cols 9-12 |
| Corner brackets | Off | On | On |
| Work grid | 2 cols, col 2 offset 48px | 3 cols, col 2 offset 64px | 4 cols, cols 2 & 4 offset 96px |
| Card metadata | Always visible bar | Always visible on touch, hover on pointer | Hover reveal |
| Stats | 2×2 | 4 in a row | 4 in a row |
| Timeline | Horizontal snap strip | Horizontal snap strip | Sticky scroll scrub |
| Services | Stacked rows | 12-col rows, no hover wipe on touch | Rows with hover wipe |
| Process | Vertical list | Vertical list | Horizontal pinned scroll |
| Packages | 1 col | 1 col (3 col at 900+) | 3 col |
| FAQ | Title above accordion | Title above | Title sticky left |
| Footer wordmark | Spans width, crops | Spans width | Spans width |
| Grain | 0.04, static | 0.05 | 0.06, animated |

Mobile specifics:
- Tap targets min 44×44.
- Use `100svh` not `100vh` for hero.
- No horizontal page scroll anywhere. The only horizontal scrollers are the filter bar and timeline strip, both contained.
- Side gutter at 375 is 16px.

---

## 8. Build checklist for the next agent

1. Tokens as CSS custom properties on `:root` exactly as section 2.
2. Static HTML for all sections with final copy. Placeholder markers only in HTML comments.
3. `work.js` exactly as section 5. `main.js` renders the grid from it.
4. Interactions in this order of priority (ship top first): grid + filters + placeholders, split reveals, preloader, cursor, timeline scrub, marquees, counters, magnetic, process horizontal, grain, lightbox.
5. Test: 375 / 768 / 1440, reduced motion on, keyboard only, JS disabled, all thumbnails missing, all thumbnails present.
