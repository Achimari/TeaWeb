---
name: The Tea Party
description: One enormous, abstract satin-cobalt teapot and its cup on a light gallery floor; the object is the interface, and its lid opens to let you in.
colors:
  canvas: "#f3f0ea"
  ink: "#16181f"
  muted: "#5d5c63"
  line: "#e2ddd3"
  paper: "#fffdf9"
  cobalt: "#2140a0"
  cobalt-deep: "#172f78"
  cobalt-wash: "#e8ecf8"
  cobalt-wash-edge: "#c7d0ee"
  field-edge: "#8b8578"
  field-fill: "#fffefb"
  quiet-edge: "#d3cdc1"
  hover-tint: "#f1ece2"
  error: "#9a2a1d"
  muted-high-contrast: "#3d3c42"
  line-high-contrast: "#8c8478"
typography:
  display:
    fontFamily: "Young Serif, 'Iowan Old Style', Georgia, serif"
    fontSize: "clamp(3rem, 2rem + 4vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Young Serif, 'Iowan Old Style', Georgia, serif"
    fontSize: "clamp(1.25rem, 0.9rem + 1vw, 1.75rem)"
    fontWeight: 400
    lineHeight: 1.1
  title:
    fontFamily: "Young Serif, 'Iowan Old Style', Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.15
  place:
    fontFamily: "Young Serif, 'Iowan Old Style', Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    fontFeature: "tnum"
  label-compact:
    fontFamily: "Barlow Condensed, 'Arial Narrow', sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    letterSpacing: "0.12em"
  mark:
    fontFamily: "Young Serif, 'Iowan Old Style', Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 400
    letterSpacing: "-0.01em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-small:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
  note:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Barlow Condensed, 'Arial Narrow', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    letterSpacing: "0.12em"
  corner-label:
    fontFamily: "Barlow Condensed, 'Arial Narrow', sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    letterSpacing: "0.12em"
rounded:
  input: "0.625rem"
  tile: "0.75rem"
  card: "1rem"
  pill: "999px"
  round: "50%"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1.25rem"
  tap: "2.75rem"
  edge: "clamp(1rem, 2.4vw, 2rem)"
components:
  caption:
    textColor: "{colors.cobalt}"
    typography: "{typography.label}"
    rounded: "{rounded.input}"
    padding: "0 0.625rem"
    height: "{spacing.tap}"
  caption-active:
    textColor: "{colors.cobalt-deep}"
  caption-pin:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.round}"
    size: "9px"
  caption-pin-active:
    backgroundColor: "{colors.cobalt}"
  caption-badge:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "0.1rem 0.45rem"
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "0 1.125rem"
    height: "{spacing.tap}"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-deep}"
  button-quiet:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 1.125rem"
    height: "{spacing.tap}"
  button-quiet-hover:
    backgroundColor: "{colors.hover-tint}"
  icon-button:
    rounded: "{rounded.round}"
    size: "{spacing.tap}"
  preset:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
    padding: "0.4rem 0.85rem"
    height: "3.25rem"
  preset-hover:
    backgroundColor: "{colors.cobalt-wash}"
  input:
    backgroundColor: "{colors.field-fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "0 0.875rem"
    height: "{spacing.tap}"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "1.25rem"
    width: "min(24rem, calc(100vw - 2rem))"
    height: "min(32rem, calc(100dvh - 6rem))"
  panel-sheet:
    rounded: "{rounded.card}"
    height: "min(25rem, 55dvh)"
  roster-row:
    textColor: "{colors.ink}"
    typography: "{typography.body-small}"
    padding: "0 0.5rem"
    height: "2.5rem"
  roster-row-mine:
    backgroundColor: "{colors.cobalt-wash}"
---

# Design System: The Tea Party

## Overview

**Creative North Star: "The Gallery Plinth"**

One enormous, original, abstract teapot and its cup sit on a warm gallery floor and fill the screen. They are one sculpture in a single satin cobalt glaze, lit like a studio piece. The object carries all the colour and all the interest; the interface is four short lines of type pinned to the corners, three hairline captions on the bare floor beside the parts, and at most one quiet paper card. Nothing moves unless the visitor moves it, and the one authored motion is the lid lifting open when the visitor chooses the pot.

Density is deliberately low. Interface type is small, either a soft serif voice (Young Serif) or tight condensed caps (Barlow Condensed 600), and it stays at the edges or on the floor so the sculpture is never covered. Cobalt is the single accent, borrowed from the glaze, and it marks only what you can act on.

**Key Characteristics:**
- Light warm canvas, near-black ink, one cobalt accent taken from the object.
- The 3D set is full-bleed behind the grid, and the camera is fitted exactly, every frame, to the free area between the corner type.
- Captions (pin, hairline, caps) are real buttons joined to the spout, the lid and the cup; they sit on bare floor, never on the glaze.
- One panel at a time, always the same size: a right-hand card on desktop, a bottom sheet under 700px; the set glides aside rather than being covered.
- Every hit area is at least 44px (2.75rem); reduced motion makes everything instant.

## Colors

A warm gallery white with a single deep cobalt accent; the teapot's glaze is the only saturated thing on screen.

### Primary
- **Cobalt** (cobalt): caption text, pin rings and the active pin fill, hairlines (at 50%), the caption badge, primary buttons, the running clock, focus outlines, links, your own place number. A shade darker than the glaze so text on the floor holds contrast.
- **Deep Cobalt** (cobalt-deep): caption hover, focus and active text; primary button hover.
- **Cobalt Wash** (cobalt-wash) with **Wash Edge** (cobalt-wash-edge): hover fill and border of preset tiles; the background of your own row in the line.

### Neutral
- **Gallery Floor** (canvas): page background and `theme-color`. The 3D canvas is transparent over it.
- **Ink** (ink): all body text. Also the hue of every UI shadow (`rgb(22 24 31 / …)`).
- **Muted Slate** (muted): corner labels, ledes, notes, times, place numbers, the close icon.
- **Paper** (paper): panel card, preset tiles, the centre of each caption pin, text on cobalt.
- **Hairline** (line): panel and tile borders, roster dividers.
- **Field Edge** (field-edge) and **Field Fill** (field-fill): text input stroke and fill (the stroke meets 3:1 on paper).
- **Quiet Edge** (quiet-edge): outline of quiet buttons.
- **Hover Tint** (hover-tint): hover fill for quiet buttons, icon buttons and the close button.
- **Kiln Red** (error): field borders and messages for errors.
- **High-contrast overrides**: under `prefers-contrast: more`, muted becomes muted-high-contrast and line becomes line-high-contrast.

### Named Rules
**The Glaze Is the Accent Rule.** Cobalt is the only accent colour, and in the UI it means "you can act on this" or "this is yours". Don't add a second accent hue.

**The Object Carries the Colour Rule.** Interface surfaces stay paper, canvas and hairline. Saturation belongs to the teapot.

## Typography

**Display Font:** Young Serif (with 'Iowan Old Style', Georgia, serif), self-hosted woff2, 400 only.
**Body Font:** the system UI sans (ui-sans-serif, system-ui, -apple-system, 'Segoe UI').
**Label Font:** Barlow Condensed 600 (with 'Arial Narrow'), self-hosted woff2.

**Character:** A soft, slightly rustic serif gives the few lines of voice warmth; condensed caps read like gallery placards and wall captions; the system sans does the work inside panels.

### Hierarchy
- **Display** (400, clamp(3rem, 2rem + 4vw, 4.5rem), 1, -0.02em, tabular): the timer clock only, in cobalt.
- **Headline** (400, clamp(1.25rem, 0.9rem + 1vw, 1.75rem), 1.1, max 18ch): the bottom-left welcome, "There’s always room for one more cup."
- **Title** (400, 1.5rem, 1.15, balanced): panel headings.
- **Mark** (400, 1.25rem, -0.01em): the name in the top-left corner.
- **Body** (400, 1rem/1.5): default; **body-small** (0.9375rem) for ledes, roster rows and buttons (600); **note** (0.8125rem/1.4) for notes, times and errors. Field labels are 0.875rem 600.
- **Label** (Barlow Condensed 600, 0.875rem, 0.12em, uppercase, cobalt): captions; **label-compact** (0.8125rem) under 700px.
- **Corner label** (Barlow Condensed 600, 0.8125rem, 0.12em, uppercase, muted): the hint, "Turn the pot. Stay for tea."
- Place numbers use Young Serif at 1.0625rem with tabular numerals.

### Named Rules
**The Serif Speaks Rule.** Young Serif is for voice and numbers (mark, statement, panel titles, clock, place numbers). Controls and running text are sans.

**The Tabular Time Rule.** Every number that counts (clock, badges, places, times) uses `font-variant-numeric: tabular-nums`.

## Layout

The page is one screen at normal sizes: a `min-height: 100dvh` grid with two columns and three rows (`top-left top-right / . . / bottom bottom`), padded by `--edge` (clamp(1rem, 2.4vw, 2rem)) or the safe-area inset, whichever is larger. The object's middle row keeps a minimum of 16rem, so cramped screens, high zoom or large text grow the page and scroll instead of crushing the set; once the page scrolls, the wheel scrolls the page, not the teapot. The stage is absolutely positioned full-bleed behind the grid (z 0); corners sit at z 1 with `pointer-events: none`; captions at z 2; the panel at z 3.

**Framing.** The free area is measured from the DOM: from the bottom of the top corner type to the top of the bottom corner type, plus side margins. On screens 700px and wider the insets are top = corner type + 44px (room for the lid's caption), sides 64px, bottom 72px (or the bottom type's height + 12px when large text makes it taller than 170px); an open panel claims the right 464px (26rem + 48px). Under 700px they are top = corner type + 44px, sides 20px, bottom = bottom type + 12px; with the sheet open, top + 8px, sides 16px, bottom = sheet height + 28px (captions hide, so the set may use their room). Every frame the camera is placed as close as it can be while every vertex of the set, with the lid wherever it is on its path, stays inside that area (plus 1.5% air at the binding edge). So the resting view is large (the pot is about 70% of the free height at 1440×900), no turn crops anything, and the set breathes slightly as it turns. When the free area's aspect is below 0.9, the cup moves forward and below the pot.

**Glide.** Opening or closing a panel moves the free area; the set glides to its new framing on the same critically damped spring as the lid (beside the card on desktop, above the sheet on phones). A window resize simply re-fits. Reduced motion jumps.

**Home view.** Yaw 0.3 rad on wide screens (near profile, spout to the right); -0.45 rad under 700px (spout turned toward the viewer, so the pot is narrower and larger in a narrow frame).

Under 700px: the right corner column shrinks to auto, captions shrink to label-compact and hide while the sheet is open, and the panel becomes a bottom sheet. Spacing steps are 0.25, 0.5, 0.75 and 1.25rem.

### Named Rules
**The Fit Not Clip Rule.** Fit the screen by layout (min-height, exact framing, paging), never by hiding content. When the page overflows, it scrolls.

**The Measured Margin Rule.** The object's free area is measured from the rendered corner type, never assumed, so no font size or zoom lets type overlap the sculpture.

## Elevation & Depth

The flat UI floats on a lit 3D scene. Depth comes from the scene's own light and soft floor shadow. The only UI shadow is the panel's; captions have no backing and no shadow, because they sit on bare floor.

### Shadow Vocabulary
- **Panel lift** (`box-shadow: 0 30px 60px -24px rgb(22 24 31 / 0.35)`): the open panel card only.
- **Pin ring** (`box-shadow: inset 0 0 0 2.5px` cobalt on a paper 9px disc): the caption pin. Not a shadow, a drawn ring.

### Scene and materials (not UI tokens)
- Renderer: NeutralToneMapping at default exposure, transparent background, pixel ratio capped at 2 (1.5 on coarse pointers). It renders only when something changes.
- Light: a soft gradient studio environment (PMREM of a dome fading from white overhead through `#d8d2c8` at the horizon to `#6d6a66` below), with one large gentle source high left and a faint cool rim source behind right that draws the far edge. No hard-edged panels, so the satin glaze shows long gradients, not window reflections. A gentle warm key `#fff3e2` at 1.2 from the same high left (-5, 9, 6) only lays a soft shadow (radius 8, 2048px map, 1024 on coarse pointers) on a ShadowMaterial floor at 0.13 opacity.
- Camera: 24° FOV, looking along (0.12, 0.36, 1); position solved each frame (see Layout).
- Model (`scripts/build-teapot.mjs`): one smooth, full, low body of revolution in **satin cobalt glaze** `#2846b0` (roughness 0.46, clearcoat 0.3 at roughness 0.42); a finished **cream glaze** `#efe5d1` interior down to tea `#5a2c0a`; a separate lid assembly (skirt inside the opening, cream underside, cobalt dome, cream knob) seated on the rim with a hairline gap; one tapering spout ending in a rounded torus lip; one slim oval loop on the far side, joined to the body as a single smooth cobalt surface so there is no overlapping attachment shell or shadow seam; a handleless round cup, cobalt outside and cream inside, its tea set below the rim so a cream band shows all round. The script refuses to build if the handle enters the lid's path, if the spout or handle could hit the cup.
- Highlight: the hovered or active part gets a white emissive at 0.035 intensity (never the tea). No outline, no colour change.

### Named Rules
**The One Glaze Rule.** The object is one cobalt glaze with cream only where a potter would put it (interior, lid underside, knob). No second glaze colour, no bare clay, no decoration.

## Shapes

Soft and round, echoing thrown pottery. Pills (999px) for buttons and the caption badge; circles (50%) for caption pins, icon buttons and the close button; 1rem corners for the panel card and sheet; 0.75rem for preset tiles and the turntable focus ring; 0.625rem for inputs and for the caption's focus outline. Borders are 1px hairlines, and so is the caption leader. The roster has no outer box, only top and bottom row dividers.

## Components

### Caption (signature)
A pin on the part, a short hairline, and a callout beside it. Each caption is a real `<button>` (44px tall, 0 0.625rem padding, transparent, 0.625rem radius so its focus outline is soft) in cobalt Barlow caps; there is no backing.
- **Pin:** a 9px paper disc with a 2.5px cobalt ring, on the part's anchor (SpoutLip, KnobTop, and for the cup either the right-hand edge of CupRim as seen from the camera or the front of its foot), projected each frame.
- **Hairline:** 1px, cobalt at 50%, from the pin to the nearest point of the caption, stopping 4px short.
- **Placement** (`src/lib/callouts.ts`): a callout never travels from its part. It tries eight directions around its pin at 12, 24 or 40px (a firm maximum hairline of 56px) and takes the spot that is on screen and clearest of the pot, the cup, the spout, the corner type, an open panel, the other pins and callouts already placed (glaze weighted most, a hairline crossing the sculpture penalised, nearer spots preferred). It keeps its previous side and anchor unless they have become clearly worse, so it doesn't jump as the pot turns, the lid opens or the window changes. The cup tries both its anchors. When it's tight, a callout with a badge may stack into a narrower block (name over badge). Measured on a full turn at 1440×900, 1920×1080, 390×844 and 320×568: every hairline 11–41px.
- **Hover / Focus / Active:** text deepens to cobalt-deep and a 1px underline appears (0.3em offset); the pin fills cobalt and scales 1.3 (160ms ease-out). Hovering the caption and hovering its part in 3D are the same state.
- **Behind the pot:** when the first surface on the line of sight belongs to another part, caption and pin dim to 0.4 opacity but stay clickable.
- **Badge:** a small cobalt pill with paper tabular text inside the caption: the running clock or "Ready" on the spout, your ordinal place on the pot.
- **Fallback:** before the scene loads, or if WebGL fails, the three callouts sit centred as a wrapped row without pins, with a muted note under them.

### Lid (the one authored motion)
- Choosing the pot opens its lid as the panel appears; closing, or switching part, sets it back along the same path from wherever it is.
- **Path:** lift straight up 0.16 (clear of the skirt), then tip back over the far edge of the flange to 58° and settle to lean on the rim. One path, t from 0 to 1, run backwards to close.
- **Edge:** chosen when it starts to open: the edge toward the viewer's back left, so the opening faces the viewer and the lid is seen in profile; clamped to within 40° of the pot's sides, so it never tips within 50° of the spout or the handle.
- **Spring:** critically damped (rate 9/s, settles in about two thirds of a second), no bounce, reversible mid-way, lands exactly. Under reduced motion it is simply open or shut.

### Panel
- One at a time, opened from a part. Paper card, hairline border, 1rem radius, 1.25rem padding, 0.75rem gap, panel lift shadow.
- **One size:** every panel is the same fixed size, so loading or switching never makes it jump: on desktop pinned top-right, `min(24rem, 100vw - 2rem)` wide and `min(32rem, 100dvh - 6rem)` tall; under 700px a bottom sheet (0.75rem side and bottom insets) `min(25rem, 55dvh)` tall. Content scrolls inside only when it must (`overscroll-behavior: contain`).
- **Motion:** `panel-in` 180ms ease-out (from opacity 0, scale 0.97, 4px up), with the origin at top right (bottom centre on phones); the set glides aside at the same time. Removed under reduced motion.
- **Focus:** a non-modal `role="dialog"`. On open, focus moves to the first `[data-autofocus]` control, or to the panel while it loads. Escape or the circular close button (top-right, 2.75rem) closes it and returns focus to the caption that opened it.

### Buttons
- **Shape:** pill (999px), min height 2.75rem, padding 0 1.125rem, 600 at 0.9375rem.
- **Primary:** cobalt with paper text; hover deep cobalt.
- **Quiet:** transparent with a quiet-edge border; hover tint.
- **Press:** scale 0.97 over 100ms; disabled at 0.6 opacity. Busy buttons show a spinning loader (0.9s; 2.4s under reduced motion).
- **Icon button:** a 2.75rem circle, hover tint, 0.35 opacity when disabled (the line pager's chevrons).
- **Link:** cobalt, underlined, 600 at 0.875rem, still 2.75rem tall.

### Presets grid
Two columns, 0.5rem gap. Each tile is paper with a hairline border, 0.75rem radius and 3.25rem min height, holding a 600 tea name over a muted "N min". Hover is cobalt wash with the wash edge; press is scale 0.98. The presets are Green 2, Oolong 3, Black 4 and Herbal 5 minutes. Below them, a minutes/seconds/Start row (1fr 1fr auto).

### Clock
Young Serif display size in cobalt with tabular numerals. It rounds up, so it never shows 0:00 while tea is steeping.

### Inputs / Fields
A 2.75rem tall field with a field-edge stroke, field-fill background and 0.625rem radius. A 600 label sits above at 0.875rem. Focus turns the border cobalt with a flush 2px outline. When invalid, the border turns kiln red and an error message at 0.8125rem is tied to the field with `aria-describedby`.

### Line roster and first five
Rows are exactly 2.5rem: a 2.25rem serif place number, a truncated name, and a muted tabular time, divided by hairlines. Your own row is cobalt wash, 600, with a cobalt place number and "(you)". The roster fills the room the fixed-size panel leaves (min 5rem) and pages to fit it (rows = height ÷ 2.5rem), opening on the page containing your place; chevron icon buttons page through it. The first five uses the same row, and the first place number is cobalt. An empty day says so plainly.

### Corners
Top left: the mark. Bottom left: the welcome in serif with the hint stacked beneath it, at every size. Nothing else: no status badge or mode line in the artwork. The rest belongs to the object.

### Voice and copy
Warm, plain and brief, like a host at a small table. One welcome line and one hint on the artwork; everything else lives in the panels. Action labels stay literal: **Tea timer**, **Join the line**, **The first five**, **Leave the line**, **Start**, **Stop timer**.
- Welcome: "There’s always room for one more cup." Hint: "Turn the pot. Stay for tea."
- Timer: "Good tea takes a little time. Pick a tea, or set your own." Running: "Good tea takes a little time. Ready at 4:12, even if you reload or switch tabs." Done: "Your tea is ready." / "Oolong has steeped for 3:00. Enjoy it while it’s warm."
- Join: "The table is quiet. You could be first." (or "3 people are in today’s line.") then "Pull up a chair. Leave your name in today’s line. No account needed." Joined: "You’re 2nd in line" / "Glad you’re here." Announced: "You’re in. You’re 2nd in today’s line."
- First five: "The first to pull up a chair on Monday 19 October, in the order they joined the line." Empty: "The table was quiet that day. Nobody joined the line." Fewer than five: "Just 3 people joined that day."
- Loading: "Setting the table…", "Finding yesterday’s list…".
- Never invent people, activity or numbers; never call the first five winners or say anyone was served.
- **Preview disclosure:** without the shared backend, the line panel (and only the line panel, where people join) ends with "Preview: your place is saved only on this device." No technical words (demo, local storage, backend) anywhere visible.

### Brand mark (favicons)
The teapot reduced to a cream silhouette (body, lid with knob, spout, loop handle) on a cobalt `#2140a0` tile with 14/64 rounded corners: `src/app/icon.svg` (any size), `src/app/favicon.ico` (16, 32 and 48px, rendered from the SVG at each size), and `src/app/apple-icon.png` (180px, full-bleed square, the pot at 82% so iOS's mask doesn't crop it). Next's metadata file conventions emit the `<link>` tags.

### Turntable interaction
- Three parts, three panels: the spout opens the tea timer, the pot (body, lid, knob, handle) opens the line, and the cup opens the first five. Picking raycasts the visible meshes plus the invisible, deliberately fat hit volumes HitSpout and HitSpoutTip (double-sided, so a ray can enter the spout's open end) and HitCup, so it works at every angle and while the lid moves.
- **Wheel:** turns the teapot (1400px per full turn, line and page deltas normalised), eased with an exponential of time constant 70ms that lands exactly on target. Ctrl+wheel (zoom) is ignored, and the wheel is not hijacked when the page itself overflows.
- **Drag:** 1:1 with no easing; the full width turns it half way. Movement under 6px counts as a click. The cursor is grab/grabbing, and a pointer over a part.
- **Flick to coast:** let go while moving and it keeps turning. Release velocity comes from the last 100ms of the drag (the release itself is the last sample, so a held finger throws nothing), capped at 0.02 rad/ms, then slows exponentially with a 325ms time constant and stops exactly. Any touch, wheel or key catches it. None under reduced motion.
- **Keys:** the focusable turntable turns 15° with the left and right arrows; Home returns to the nearest home yaw.
- **Reduced motion:** turns are instant, nothing coasts, the lid and the set jump to their end state, and all transitions are removed.

## Do's and Don'ts

### Do:
- **Do** keep cobalt (#2140a0) for actionable or "yours" states only, with paper text on cobalt fills.
- **Do** give every control a 2.75rem minimum hit area, including captions, links and icon buttons.
- **Do** keep each callout within a short hairline of its part, clear of the sculpture, the corner type, the panel and each other where there is room, and dim it to 0.4 when its part is hidden instead of removing it.
- **Do** fit the camera to the measured free area every frame, and glide the set aside for an open panel instead of covering it.
- **Do** keep every panel the same size, keep one open at a time, return focus to its caption on close, and close it with Escape.
- **Do** make every motion land exactly (turn easing, coast, lid spring, glide) and make it instant under reduced motion.
- **Do** use tabular numerals for every clock, place and time.

### Don't:
- **Don't** put labels, pills or any backing on the glaze, or send a callout far from its part to find space.
- **Don't** show status or prototype language ("Local demo", "Shared line") in the artwork; disclose preview mode only where people join.
- **Don't** let the lid tip over the spout or the handle, or bounce.
- **Don't** add a second accent hue or a second glaze; the object carries the colour.
- **Don't** hijack the wheel when the page overflows, or animate anything the visitor didn't start.
- **Don't** clip content to keep one screen; let the page or the panel scroll.
- **Don't** use heavy or hard shadows. The panel's lift is the only UI shadow, soft and ink-tinted.
- **Don't** set running text in Barlow caps or Young Serif; panels use the system sans.
