# Future tools (backlog)

Ideas that are **not** in scope until you explicitly start one. Live calculators are on the home page; this file is only what remains.

## Cable rating lookup (AS/NZS 3000)

Simple table lookup of current-carrying capacity from AS/NZS 3000 rating tables, given cable size, type, installation method, and related factors.

Notes:

- Distinct from the IEC voltage-drop calculator (resistivity + optional reactance only) and from the adiabatic short-circuit CSA tool.
- Source tables must be cited; do not invent ampacity values.
- Same family as the deferred AS/NZS CCC tool below — implement once, with cited tables.

## Deferred from later epics

Tracked here so the backlog matches the product:

- AS/NZS 3000 current-carrying capacity (CCC) tool
- Protection-curve depth (CT ratio on the TCC, extra characteristics, manufacturer fuse files)

## Shipped in the search / mobile layout work

- Home search filtering of tool cards (header query uses `searchTools` and filters the home grid plus sidebar)
- Narrow-viewport polish (~390px): stacked form columns, header/search shrink, mobile nav overlay

## Shipped in the share / copy / examples work

- Shareable URLs for calculator state (`docs/SHARE_URLS.md`)
- Copy results / copy link (toolbar next to Print)
- Worked-example presets (“load example”)

## Already live (do not re-add)

- 3-phase amps ↔ kW — `amps-kw` (replaces Ohm’s law; `/tools/ohms-law` redirects here). Still overlaps the fuller 3-phase power tool.
- 3-phase power & current — `three-phase`
- AC voltage drop (simplified IEC resistivity + optional reactance) — `voltage-drop`
- Adiabatic short-circuit CSA — `adiabatic`
- IDMT protection curves (IEC 60255-151, optional generic fuse overlays) — `protection-curves`
- Protection CT ALF — `protection-ct-alf`
- Metering CT burden — `metering-ct-burden`
- DC / substation tripping-battery sizing — `battery-sizing`
