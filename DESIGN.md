---
name: The Tea Party
description: One enormous, graffiti-painted satin-cobalt teapot and its cup on a light gallery floor, with loud art-directed type talking over it without touching it; the object is the interface, and its lid opens to let you in.
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
  spray: "#df6448"
  spray-ink: "#b33f27"
  field-edge: "#8b8578"
  field-fill: "#fffefb"
  quiet-edge: "#d3cdc1"
  hover-tint: "#f1ece2"
  error: "#9a2a1d"
  muted-high-contrast: "#3d3c42"
  line-high-contrast: "#8c8478"
typography:
  shout:
    fontFamily: "Bricolage Grotesque, 'Arial Narrow', Arial, sans-serif"
    fontSize: "clamp(2.75rem, 1.2rem + 5.6vw, 7.25rem)"
    fontWeight: 800
    lineHeight: 0.8
    letterSpacing: "-0.015em"
    fontVariation: "'wdth' 78"
  shout-phone:
    fontFamily: "Bricolage Grotesque, 'Arial Narrow', Arial, sans-serif"
    fontSize: "clamp(3.25rem, 14vw, 4.75rem)"
    fontWeight: 800
    lineHeight: 0.8
    letterSpacing: "-0.015em"
    fontVariation: "'wdth' 78"
  shout-short:
    fontFamily: "Bricolage Grotesque, 'Arial Narrow', Arial, sans-serif"
    fontSize: "clamp(2.25rem, 1rem + 5vw, 5rem)"
    fontWeight: 800
    lineHeight: 0.8
    letterSpacing: "-0.015em"
    fontVariation: "'wdth' 78"
  sticker:
    fontFamily: "Bricolage Grotesque, 'Arial Narrow', Arial, sans-serif"
    fontSize: "max(0.32em, 1.15rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 90"
  chaos-thin:
    fontFamily: "Bricolage Grotesque, 'Arial Narrow', Arial, sans-serif"
    fontSize: "clamp(1.6rem, 0.85rem + 2.5vw, 3.6rem)"
    fontWeight: 250
    lineHeight: 0.86
    letterSpacing: "0.01em"
    fontVariation: "'wdth' 100"
  chaos-heavy:
    fontFamily: "Bricolage Grotesque, 'Arial Narrow', Arial, sans-serif"
    fontSize: "clamp(1.6rem, 0.85rem + 2.5vw, 3.6rem)"
    fontWeight: 800
    lineHeight: 0.86
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 75"
  chaos-phone:
    fontFamily: "Bricolage Grotesque, 'Arial Narrow', Arial, sans-serif"
    fontSize: "clamp(2rem, 9vw, 2.75rem)"
    fontWeight: 800
    lineHeight: 0.86
  tag:
    fontFamily: "Bricolage Grotesque, 'Arial Narrow', Arial, sans-serif"
    fontSize: "clamp(1.25rem, 0.8rem + 1.3vw, 2.1rem)"
    fontWeight: 800
    lineHeight: 1
    fontVariation: "'wdth' 75"
  display:
    fontFamily: "Bricolage Grotesque, 'Arial Narrow', Arial, sans-serif"
    fontSize: "clamp(3.5rem, 2.5rem + 4vw, 5.25rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
    fontVariation: "'wdth' 85"
  title:
    fontFamily: "Bricolage Grotesque, 'Arial Narrow', Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.005em"
    fontVariation: "'wdth' 80"
  place:
    fontFamily: "Bricolage Grotesque, 'Arial Narrow', Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 750
    fontFeature: "tnum"
    fontVariation: "'wdth' 85"
  mark:
    fontFamily: "Bricolage Grotesque, 'Arial Narrow', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.14em"
    fontVariation: "'wdth' 75"
  label:
    fontFamily: "Bricolage Grotesque, 'Arial Narrow', Arial, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 750
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 75"
  label-compact:
    fontFamily: "Bricolage Grotesque, 'Arial Narrow', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 750
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 75"
  hint:
    fontFamily: "Bricolage Grotesque, 'Arial Narrow', Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 650
    letterSpacing: "0.12em"
    fontVariation: "'wdth' 75"
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
  sticker:
    backgroundColor: "{colors.spray}"
    textColor: "{colors.ink}"
    typography: "{typography.sticker}"
    padding: "0.14em 0.3em 0.08em"
  tag:
    textColor: "{colors.spray-ink}"
    typography: "{typography.tag}"
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

**Creative North Star: "The Painted Plinth"**

One enormous, original, abstract teapot and its cup sit on a warm gallery floor and fill the screen. They are one sculpture in a satin cobalt glaze, sprayed with cream and vermilion street-art marks curved over the clay (a worn "ЧАЙ" stencil, "take five", "NO RUSH", "SIP SLOW / STAY LONG", a "T.P." throw-up, drips, stars, arrows and smaller scrawls), lit like a studio piece. Around it, the artwork talks: two bands of loud type, a top band and a bottom band, set in one variable grotesque and art-directed like a poster pasted on the gallery wall. The type is loud but never touches the sculpture; the stage measures every block of it and frames the set in what is left.

The interface itself stays quiet. Three cobalt callouts on the bare floor beside the spout, the lid and the cup are the controls, and at most one paper card opens from them. Nothing moves unless the visitor moves it, and the one authored motion is the lid lifting open when the visitor chooses the pot. Cobalt, borrowed from the glaze, marks only what you can act on; vermilion, borrowed from the paint, belongs to the artwork's voice and never to a control.

**Key Characteristics:**
- Light warm canvas, near-black ink, one cobalt action colour from the glaze, one vermilion voice colour from the paint.
- One self-hosted variable family (Bricolage Grotesque) for every display role, pushed between thin/wide and heavy/condensed; panels run in the system sans.
- Two bands of loud type with fixed tilts and offsets, measured so the sculpture, its callouts and the panel always keep clear of them.
- The 3D set is full-bleed behind the grid, and the camera is fitted to one envelope for a full turn within the measured free area.
- One panel at a time, always the same size: a right-hand card on desktop, a bottom sheet under 700px; the set glides aside rather than being covered.
- Every hit area is at least 44px (2.75rem); reduced motion makes everything instant.

## Colors

A warm gallery white with one deep cobalt action colour and one vermilion voice colour, both lifted from the painted teapot.

### Primary
- **Cobalt** (cobalt): callout text, pin rings and the active pin fill, hairlines (at 50%), the callout badge, primary buttons, the running clock, focus outlines, links, your own place number. A shade darker than the glaze so text on the floor holds contrast.
- **Deep Cobalt** (cobalt-deep): callout hover, focus and active text; primary button hover.
- **Cobalt Wash** (cobalt-wash) with **Wash Edge** (cobalt-wash-edge): hover fill and border of preset tiles; the background of your own row in the line.

### Secondary
- **Spray Vermilion** (spray): the teapot's own vermilion paint, used in the UI as a fill only: the "WHO’S NEXT?" sticker, with ink text on it (5.1:1).
- **Spray Ink** (spray-ink): vermilion for text on the canvas, the "PULL UP. POUR UP." tag and its underline (5.05:1 on canvas).

### Neutral
- **Gallery Floor** (canvas): page background and `theme-color`. The 3D canvas is transparent over it.
- **Ink** (ink): the shout, the chaos lines, the mark, and all body text. Also the hue of every UI shadow (`rgb(22 24 31 / …)`).
- **Muted Slate** (muted): the hint, ledes, notes, times, place numbers, loading lines, the close icon.
- **Paper** (paper): panel card, preset tiles, the centre of each pin, text on cobalt.
- **Hairline** (line): panel and tile borders, roster dividers.
- **Field Edge** (field-edge) and **Field Fill** (field-fill): text input stroke and fill (the stroke meets 3:1 on paper).
- **Quiet Edge** (quiet-edge): outline of quiet buttons.
- **Hover Tint** (hover-tint): hover fill for quiet buttons, icon buttons and the close button.
- **Kiln Red** (error): field borders, validation messages, and the plain "can’t be reached" message when the server is unavailable.
- **High-contrast overrides**: under `prefers-contrast: more`, muted becomes muted-high-contrast and line becomes line-high-contrast.

### Named Rules
**The Glaze Is the Action Rule.** Cobalt is the only action colour, meaning "you can act on this" or "this is yours". Every control, link, focus ring and badge is cobalt; nothing else is.

**The Paint Is the Voice Rule.** Vermilion comes from the pot's paint and appears only in the artwork's type: spray as a fill (the sticker), spray-ink as text on the canvas (the tag). It never marks a control, a state or an error, and vermilion text is always spray-ink, never spray.

**The Object Carries the Colour Rule.** Interface surfaces stay paper, canvas and hairline. Saturation belongs to the teapot and to the type that speaks for it.

## Typography

**Display Font:** Bricolage Grotesque, self-hosted variable woff2 (`src/app/fonts/bricolage-grotesque-latin.woff2`; weight 200–800, width 75–100%, optical size 12–96, `font-optical-sizing: auto`), loaded with `next/font/local` as `--font-display` with an Arial-adjusted fallback, then 'Arial Narrow', Arial, sans-serif.
**Body Font:** the system UI sans (ui-sans-serif, system-ui, -apple-system, 'Segoe UI').

**Character:** One grotesque with a lot of range, played at both ends: hairline-thin and wide against heavy and condensed, in uppercase, tilted a few degrees like paste-ups and stickers on a wall. The same family, quieter, sets the mark, callouts, panel titles, the clock and place numbers, so the poster and the controls read as one voice. The system sans does the reading work inside panels.

### Hierarchy
All display roles are uppercase.
- **Shout** (800, width 78%, clamp(2.75rem, 1.2rem + 5.6vw, 7.25rem), 0.8, -0.015em, tilted -2.5° from the bottom left; clamp(2.25rem, 1rem + 5vw, 5rem) on screens under 640px tall): "THE POT’S ON." in ink, top left.
- **Sticker** (800, width 90%, max(0.32em of the shout, 1.15rem), 1, 0.01em, tilted +6°): "WHO’S NEXT?" slapped under the shout on a spray block (padding 0.14em 0.3em 0.08em), ink text.
- **Chaos** (clamp(1.6rem, 0.85rem + 2.5vw, 3.6rem), 0.86): "A LITTLE CHAOS." thin (250, width 100%, 0.01em) stacked over "A LOT OF TEA." heavy (800, width 75%, -0.01em), offset `min(2.2em, 7vw)` right (it steps out from the margin, but never past a narrow screen's edge) and tilted -1.5°. Bottom left, ink. Phones: clamp(2rem, 9vw, 2.75rem).
- **Tag** (800, width 75%, clamp(1.25rem, 0.8rem + 1.3vw, 2.1rem), 1, tilted -6° and lifted 0.6em; -4° on phones): "PULL UP. POUR UP." in spray-ink with a 0.12em spray-ink underline at 0.18em offset. Bottom right; hidden on screens under 640px tall.
- **Mark** (700, width 75%, 0.875rem, 1, 0.14em): the h1 "THE TEA PARTY" in ink, small, top right on desktop, above the shout on phones.
- **Hint** (650, width 75%, 0.8125rem, 0.12em, muted): "SPIN THE POT. TAP THE SPOUT, THE POT OR THE CUP." The one functional line, under the chaos.
- **Display / Clock** (800, width 85%, clamp(3.5rem, 2.5rem + 4vw, 5.25rem), 0.9, -0.02em, tabular, cobalt): the running timer only.
- **Title** (800, width 80%, 1.75rem, 1, -0.005em, balanced): panel headings.
- **Label / Callout** (750, width 75%, 0.9375rem, 0.06em, cobalt): callouts; **label-compact** 0.875rem under 700px.
- **Place** (750, width 85%, 1.125rem, tabular): place numbers in the line and the first five.
- **Body** (400, 1rem/1.5): default; **body-small** (0.9375rem) for ledes, roster rows and buttons (600); **note** (0.8125rem/1.4) for notes, times and errors. Field labels are 0.875rem 600.

### Named Rules
**The One Family Rule.** Every display role is Bricolage Grotesque. Contrast comes from its axes (weight 250 against 800, width 100% against 75%), size and tilt, never from a second display face.

**The Loud Type, Clear Object Rule.** The artwork's type may be as big as it likes, but it never covers the sculpture, its parts, the callouts, the badges or a panel. Every block is measured and the set is framed around it.

**The Sans Reads Rule.** Running text inside panels is the system sans. The display family is for voice, titles and numbers.

**The Tabular Time Rule.** Every number that counts (clock, badges, places, times) uses `font-variant-numeric: tabular-nums`.

## Layout

The page is one screen at normal sizes: a `min-height: 100dvh` grid with two columns and three rows (`top top / . . / bottom bottom`), padded by `--edge` (clamp(1rem, 2.4vw, 2rem)) or the safe-area inset, whichever is larger. The object's middle row keeps a minimum of 16rem, so cramped screens, high zoom or large text grow the page and scroll instead of crushing the set; once the page scrolls, the wheel scrolls the page, not the teapot. The stage is absolutely positioned full-bleed behind the grid (z 0); the type bands sit at z 1 with `pointer-events: none`; callouts at z 2; the panel at z 3.

**The two bands.** The top band wraps in a row: the shout with its sticker on the left, the mark pushed to the far right (`margin-left: auto`). The bottom band is `space-between`: the chaos on the left, the tag on the right, and the hint on its own full-width line beneath. Under 700px both bands stack in a column: the shout (clamp(3.25rem, 14vw, 4.75rem)) and sticker first, then the mark as a right-aligned signature under them, never a label over the heading (0.4rem gaps); and the bottom band runs chaos, hint, then the tag pushed to the right edge (0.35rem gaps). Tilts and offsets are fixed in CSS (shout -2.5°, sticker +6°, heavy chaos min(2.2em, 7vw) right and -1.5°, tag -6° or -4° on phones), never random. Every block is a `.say`. The shout and the hint wrap with `text-wrap: balance`, so a short last word never sits alone.

**Framing.** The free area is measured from the DOM: every `.say` rectangle, tilts included. On screens 700px and wider the stage offers two candidate free areas and the scene keeps the one whose camera distance is smallest, so the sculpture is drawn largest:
- **Between the bands:** top = lowest top-band type + 44px (room for the lid's callout), bottom = highest bottom-band type + 16px, left 64px.
- **Beside the type:** top = lowest right-hand top type (the mark) + 44px, bottom = highest right-hand bottom type (the tag, or the hint when the tag is hidden) + 16px, left = 32px past the right edge of the left-hand type (at least 64px).

In both, the right inset is 64px, or 464px (26rem + 48px) while a panel is open. Under 700px the bands are always used: top = top band + 44px, sides 20px, bottom = bottom band + 12px; with the sheet open, top band + 8px, sides 16px, bottom = sheet height + 28px (the callouts hide, so the set may use their room). The camera is fitted to the full rotational envelope of the pot plus the fixed cup, with 1.5% air at the binding edge. It remains still through a turn and refits only when the lid, panel, viewport, fonts or cup placement change. When the free area's aspect is below 0.9, the cup moves forward and below the pot.

**Glide.** Opening or closing a panel moves the free area; the set glides to its new framing on the same critically damped spring as the lid (beside the card on desktop, above the sheet on phones). A window resize simply re-fits. Reduced motion jumps.

**Home view.** Yaw 0.3 rad on wide screens (near profile, spout to the right); -0.45 rad under 700px (spout turned toward the viewer, so the pot is narrower and larger in a narrow frame).

Under 700px, callouts shrink to label-compact and hide while the sheet is open, and the panel becomes a bottom sheet. Under 640px tall, the tag steps aside and the shout shrinks so the pot keeps its room. Spacing steps are 0.25, 0.5, 0.75 and 1.25rem.

### Named Rules
**The Fit Not Clip Rule.** Fit the screen by layout (min-height, exact framing, paging), never by hiding content. When the page overflows, it scrolls. The tag on short screens is the one deliberate exception, because it is voice, not content.

**The Measured Margin Rule.** The object's free area is measured from the rendered type, tilts included, never assumed, so no font size, zoom or late font load lets type overlap the sculpture.

**The Largest Pot Rule.** Where the type allows more than one free area, the layout that draws the sculpture largest wins.

## Elevation & Depth

The flat UI floats on a lit 3D scene. Depth comes from the scene's own light and soft floor shadow. The only UI shadow token is the panel's; callouts have no backing and no shadow, because they sit on bare floor.

### Shadow Vocabulary
- **Panel lift** (`box-shadow: 0 30px 60px -24px rgb(22 24 31 / 0.35)`): the open panel card only.
- **Pin ring** (`box-shadow: inset 0 0 0 2.5px` cobalt on a paper 9px disc): the callout pin. Not a shadow, a drawn ring.

### Scene and materials (not UI tokens)
- Renderer: NeutralToneMapping at default exposure, transparent background, pixel ratio capped at 2 (1.5 on coarse pointers). It renders only when something changes.
- Light: a soft gradient studio environment (PMREM of a dome fading from white overhead through `#d8d2c8` at the horizon to `#6d6a66` below), with one large gentle source high left and a faint cool rim source behind right that draws the far edge. A gentle warm key `#fff3e2` at 1.2 from (-5, 9, 6) only lays a soft shadow (radius 8, 2048px map, 1024 on coarse pointers) on a ShadowMaterial floor at 0.13 opacity.
- Camera: 24° FOV, looking along (0.12, 0.36, 1); position solved from the chosen free area (see Layout).
- Model (`scripts/build-teapot.mjs`): one smooth, full, low body of revolution in **satin cobalt glaze** `#2846b0` (roughness 0.46, clearcoat 0.3 at roughness 0.42); a cream glaze `#efe5d1` interior down to tea `#5a2c0a`; a separate lid assembly (skirt, cream underside, cobalt dome, cream knob) seated on the rim with a hairline gap; one tapering spout ending in a rounded lip; one slim oval loop handle joined as a single smooth surface; a handleless round cup, cobalt outside and cream inside. The script refuses to build if the handle enters the lid's path or the spout or handle could hit the cup.
- Highlight: the hovered or active part gets a white emissive at 0.035 intensity (never the tea). No outline, no colour change.

### Named Rules
**The One Glaze Rule.** The object keeps one cobalt glaze with cream inside the pot and on the lid underside and knob. The outside paint is cream (`#f6edd7`) and vermilion (the spray colour) with deep-cobalt shadows, not another glaze: transparent curved layers in `src/lib/teapot-art.ts`, following the shared profile in `src/lib/body-profile.mjs`, seeded so their placement is authored and stable across visits.

## Shapes

Soft and round, echoing thrown pottery, against the hard, square-cut type. Pills (999px) for buttons and the callout badge; circles (50%) for pins, icon buttons and the close button; 1rem corners for the panel card and sheet; 0.75rem for preset tiles and the turntable focus ring; 0.625rem for inputs and the callout's focus outline. The sticker is the one square block, a paste-up with no radius. Borders are 1px hairlines, and so is the callout leader. The roster has no outer box, only row dividers.

## Components

### The artwork's voice (signature)
Two bands of `.say` blocks, read top to bottom as one poster: "THE POT’S ON." / "WHO’S NEXT?" up top, "A LITTLE CHAOS." / "A LOT OF TEA." and "PULL UP. POUR UP." below, and the functional hint "Spin the pot. Tap the spout, the pot or the cup." under them. The h1 is the small mark, not the shout. The bands are decoration plus one instruction; they take no pointer events and carry no status, counts or mode lines.
- **Shout:** heavy, condensed, huge, tilted -2.5°; the sticker hangs from its lower left at +6°.
- **Sticker:** spray fill, ink text, square-cut, tilted against the shout. It lifts with a soft shadow (`0 0.06em 0.16em`, ink at 28%), never a hard offset edge.
- **Chaos:** the thin line sits straight; the heavy line is pushed min(2.2em, 7vw) right and tilted against it.
- **Tag:** spray-ink, underlined like a marker stroke, leaning the other way at the bottom right; it drops out under 640px tall.

### Callout
A pin on the part, a short hairline, and a callout beside it. Each callout is a real `<button>` (44px tall, 0 0.625rem padding, transparent, 0.625rem radius so its focus outline is soft) in cobalt display caps; there is no backing.
- **Pin:** a 9px paper disc with a 2.5px cobalt ring on the part's anchor (SpoutLip, KnobTop, and for the cup either the right-hand rim edge as seen from the camera or the front of its foot), projected each frame.
- **Hairline:** 1px, cobalt at 50%, from the pin to the nearest point of the callout.
- **Placement** (`src/lib/callouts.ts`): a callout never travels from its part. It tries eight directions around its pin at 12, 24 or 40px (a firm maximum hairline of 56px) and takes the spot that is on screen and clearest of the pot, the cup, the spout, every `.say` block and the open panel (each grown by 8px), the other pins and the callouts already placed (the sculpture weighted most, a hairline crossing it penalised, nearer spots preferred). There is no memory of earlier placements: the layout is a pure function of what is on screen (ties go to the part's usual anchor, then right first), so the same pot, angle and viewport always give the same callouts, and closing a panel restores exactly the layout from before it opened. When it's tight, a callout with a badge may stack into a narrower block (name over badge). Callouts clear while the visitor turns the pot and while the lid or the framing glides (the stage carries `data-turning` / `data-moving`), and fade back in (180ms) placed for the settled scene. The framing for a panel change is chosen for where the lid is going, never for its mid-swing pose.
- **Hover / Focus / Active:** text deepens to cobalt-deep and a 1px underline appears (0.3em offset); the pin fills cobalt and scales 1.3 (160ms ease-out). Hovering the callout and hovering its part in 3D are the same state.
- **Behind the pot:** when the first surface on the line of sight belongs to another part, callout and pin dim to 0.4 opacity but stay clickable.
- **Badge:** a small cobalt pill with paper tabular text inside the callout: the shared clock or "Ready" on the spout, your ordinal place on the pot.
- **Fallback:** before the scene loads, or if WebGL fails, the three callouts sit centred as a wrapped row without pins, with a muted note: "The 3D teapot could not be shown on this device. The three parts are still here as buttons."

### Lid (the one authored motion)
- Choosing the pot opens its lid as the panel appears; closing, or switching part, sets it back along the same path from wherever it is.
- **Path:** lift straight up 0.16 (clear of the skirt), then tip back over the far edge of the flange to 58° and settle to lean on the rim. One path, run backwards to close.
- **Edge:** chosen when it starts to open, toward the viewer's back left, clamped to within 40° of the pot's sides, so it never tips toward the spout or the handle.
- **Spring:** critically damped (rate 9/s, settles in about two thirds of a second), no bounce, reversible mid-way, lands exactly. Under reduced motion it is simply open or shut.

### Panel
- One at a time, opened from a part. Paper card, hairline border, 1rem radius, 1.25rem padding, 0.75rem gap, panel lift shadow.
- **One size:** on desktop pinned top-right (2.5rem below the top edge, clear of the mark), `min(24rem, 100vw - 2rem)` wide and `min(32rem, 100dvh - 6rem)` tall; under 700px a bottom sheet (0.75rem side and bottom insets) `min(25rem, 55dvh)` tall. Content scrolls inside only when it must (`overscroll-behavior: contain`), and then soft scroll shadows at the top or bottom edge say there is more. The last block of each panel rests at its foot (`.panel-foot`): the custom time under the teas, the name field and Join under who is already in line, the notification choice under a running clock, the archive note under the first five. So short content reads as composed rather than stopping half way. On screens under 640px tall the four teas share one row, so the custom time and Start stay inside the sheet.
- **Motion:** `panel-in` 180ms ease-out (from opacity 0, scale 0.97, 4px up), origin top right (bottom centre on phones); the set glides aside at the same time. Removed under reduced motion.
- **Focus:** a non-modal `role="dialog"`. When a panel first opens, focus moves to its first `[data-autofocus]` control, or to the panel while it loads. After that it moves only for your own action: your Start or Stop moves it to the new content's first control, your join to Leave. Live changes from other people (their timer, your place moving up, new names) never move it; if one removes the control you were on, focus rests on the panel itself. Escape or the circular close button (top-right, 2.75rem) closes it and returns focus to the callout that opened it.
- **Server state:** the line and the tea timer are shared by everyone through the server. A panel only ever shows the server's state; when the server can't be reached it shows a plain Kiln Red message and disables joining, leaving and the timer controls. There is no device-only or preview mode.

### Buttons
- **Shape:** pill (999px), min height 2.75rem, padding 0 1.125rem, 600 at 0.9375rem.
- **Primary:** cobalt with paper text; hover deep cobalt.
- **Quiet:** transparent with a quiet-edge border; hover tint.
- **Press:** scale 0.97 over 100ms; disabled at 0.6 opacity. Busy buttons show a spinning loader (0.9s; 2.4s under reduced motion).
- **Icon button:** a 2.75rem circle, hover tint, 0.35 opacity when disabled (the line pager's chevrons).
- **Link:** cobalt, underlined, 600 at 0.875rem, still 2.75rem tall (used for the notification opt-in).

### Presets grid
Two columns, 0.5rem gap. Each tile is paper with a hairline border, 0.75rem radius and 3.25rem min height, holding a 600 tea name over a muted "N min". Hover is cobalt wash with the wash edge; press is scale 0.98. The presets are Green 2, Oolong 3, Black 4 and Herbal 5 minutes. Below them, a minutes/seconds/Start row (1fr 1fr auto).

### Clock
Display size in cobalt with tabular numerals. It rounds up, so it never shows 0:00 while tea is steeping.

### Inputs / Fields
A 2.75rem tall field with a field-edge stroke, field-fill background and 0.625rem radius. A 600 label sits above at 0.875rem. Focus turns the border cobalt with a flush 2px outline. When invalid, the border turns Kiln Red and an error message at 0.8125rem is tied to the field with `aria-describedby`.

### Line roster and first five
Rows are exactly 2.5rem: a 2.25rem display place number, a truncated name, and a muted tabular time, divided by hairlines. Your own row is cobalt wash, 600, with a cobalt place number and "(you)". The roster fills the room the fixed-size panel leaves (min 5rem) and pages to fit it, opening on the page containing your place; chevron icon buttons page through it. The first five uses the same row, and the first place number is cobalt. Before you join, the line panel lists who is already in today's line (`.roster-preview`, the same rows without paging) between the count and the name field; it takes whatever height is left and scrolls, and on the shortest sheets it gives way to the field and Join, leaving the count in the lede.

### Voice and copy
Warm, plain and brief, like a host at a small table, with the poster allowed to shout. The artwork says only its four phrases and the hint; everything else lives in the panels. Action labels stay literal: **Tea timer**, **Join the line**, **The first five**, **Start**, **Stop the timer**, **Clear the timer**, **Brew another Oolong**, **Leave the line**.
- Artwork: "THE POT’S ON." / "WHO’S NEXT?" / "A LITTLE CHAOS. A LOT OF TEA." / "PULL UP. POUR UP." Hint: "Spin the pot. Tap the spout, the pot or the cup."
- Timer, idle: "One timer for the whole party. Put the pot on and everyone here watches it count down." Running: "One pot for the whole party: every screen here counts down to 4:12. Anyone can stop it." Ready: "The pot’s ready." / "Oolong has steeped for 3:00. Pour up." Someone else got there first: "Someone else put the pot on first. This is their timer." Stale stop: "That timer had already changed. This is the current one." Bad custom time: "Choose between 1 second and 60 minutes."
- Notifications (this device only, asked on press): "Notify me on this device when it’s ready"; on: "This device will show a notification when the pot’s ready, while this page is open in the background." with "Turn off"; blocked: "Notifications are blocked for this site in your browser settings."
- Join: "Nobody’s here yet. You could be first." (or "3 people are in today’s line.") then "Pull up a chair: a name is all it takes, no account." Joined: "You’re 2nd in line" / "Just you so far. The kettle’s warming." or "3 people are in today’s line, and it updates as people come and go." Announced: "You’re in. You’re 2nd in today’s line." / "You left the line."
- First five: "The first to pull up a chair on Monday 19 October, in the order they joined the line." Empty: "The table was quiet that day. Nobody joined the line." Fewer than five: "Just 3 people joined that day."
- Loading: "Checking the pot…", "Finding the line…", "Finding yesterday’s list…".
- Unavailable: "The line and the timer can’t be reached right now. Try again in a little while." (the line adds "Joining is paused until it’s back."); the first five: "The first five can’t be reached right now."
- Never invent people, activity or numbers; never call the first five winners or say anyone was served. No technical words (demo, local storage, backend, database) anywhere visible.

### Brand mark (favicons)
The teapot reduced to a cream silhouette (body, lid with knob, spout, loop handle) on a cobalt `#2140a0` tile with 14/64 rounded corners: `src/app/icon.svg`, `src/app/favicon.ico` (16, 32 and 48px), and `src/app/apple-icon.png` (180px, full-bleed, the pot at 82% so iOS's mask doesn't crop it).

### Turntable interaction
- Three parts, three panels: the spout opens the tea timer, the pot (body, lid, knob, handle) opens the line, and the cup opens the first five. Picking raycasts the visible meshes plus invisible, deliberately fat hit volumes (HitSpout, HitSpoutTip, HitCup), so it works at every angle and while the lid moves.
- **Wheel:** turns the teapot (1400px per full turn, line and page deltas normalised), eased with a 70ms time constant and a 0.012 rad/ms speed cap; it lands exactly on target. Ctrl+wheel is ignored, and the wheel is not hijacked when the page itself overflows.
- **Drag:** 1:1 with no easing; the full width turns it half way. Movement under 6px counts as a click. The cursor is grab/grabbing, and a pointer over a part.
- **Flick to coast:** release velocity from the last 100ms of the drag, capped at 0.02 rad/ms, then slows exponentially with a 325ms time constant and stops exactly. Any touch, wheel or key catches it. None under reduced motion.
- **Keys:** the focusable turntable turns 15° with the left and right arrows; Home returns to the nearest home yaw.
- **Reduced motion:** turns are instant, nothing coasts, the lid and the set jump to their end state, and all transitions are removed.

## Do's and Don'ts

### Do:
- **Do** keep cobalt (#2140a0) for actionable or "yours" states only, with paper text on cobalt fills.
- **Do** set every display role in Bricolage Grotesque and get contrast from its weight and width axes, size and fixed tilt.
- **Do** use spray (#df6448) only as a fill with ink text on it, and spray-ink (#b33f27) for any vermilion text on the canvas.
- **Do** make every artwork block a measured `.say`, so the camera and the callouts keep clear of it, tilts included.
- **Do** fix every tilt and offset in CSS (shout -2.5°, sticker +6°, heavy chaos min(2.2em, 7vw) and -1.5°, tag -6°).
- **Do** give every control a 2.75rem minimum hit area, including callouts, links and icon buttons.
- **Do** keep each callout within a short hairline of its part, clear of the sculpture, the type, the panel and each other where there is room, and dim it to 0.4 when its part is hidden instead of removing it.
- **Do** fit one camera frame to the full turn in the measured free area, keep the candidate that draws the sculpture largest, and glide the set aside for an open panel instead of covering it.
- **Do** keep every panel the same size, keep one open at a time, return focus to its callout on close, and close it with Escape.
- **Do** show a plain error and disable joining and the timer when the server can't be reached.
- **Do** make every motion land exactly (turn easing, coast, lid spring, glide) and make it instant under reduced motion.
- **Do** use tabular numerals for every clock, place and time.

### Don't:
- **Don't** let the type cover the sculpture, its parts, the callouts, the badges or a panel, however loud it gets.
- **Don't** randomise tilts, offsets or placement of the type or the paint; the art direction is fixed.
- **Don't** add a second display family or bring back a serif; the system sans is for running text only.
- **Don't** use vermilion in controls, states or errors, or set vermilion text in spray.
- **Don't** put labels, pills or any backing on the glaze, or send a callout far from its part to find space.
- **Don't** put status, counts or prototype language in the artwork's type, and don't show a preview or device-only mode anywhere.
- **Don't** let the lid tip over the spout or the handle, or bounce.
- **Don't** add a second glaze; the outside paint stays cream and vermilion.
- **Don't** hijack the wheel when the page overflows, or animate anything the visitor didn't start.
- **Don't** clip content to keep one screen; let the page or the panel scroll.
- **Don't** set running text in the display face; panels use the system sans.
- **Don't** use heavy or hard shadows. The panel's lift and the sticker's small lift are the only shadows, both soft and ink-tinted.
