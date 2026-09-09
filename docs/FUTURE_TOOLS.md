# Future tools (backlog)

Ideas that are **not** in scope until you explicitly start one. Live calculators are on the home page; this file is only what remains.

## Cable rating lookup (AS/NZS 3000)

Simple table lookup of current-carrying capacity from AS/NZS 3000 rating tables, given cable size, type, installation method, and related factors.

Notes:

- Distinct from the IEC voltage-drop calculator (resistivity + optional reactance only).
- Source tables must be cited; do not invent ampacity values.
- Same family as the deferred AS/NZS CCC tool below — implement once, with cited tables.

## Other remaining ideas

- Power ↔ current conversion (amps ↔ kW from voltage and PF). Overlaps the 3-phase tool; keep a dedicated converter only if the UX is faster for that job.

## Deferred from later epics

Tracked here so the backlog matches the product (not in the current assumptions / validation work):

- Shareable URLs for calculator state
- Copy results / copy link
- Worked-example presets (“load example”)
- Home search filtering of tool cards
- AS/NZS 3000 current-carrying capacity (CCC) tool
- Protection-curve depth (CT ratio on the TCC, extra characteristics, manufacturer fuse files)

## Already live (do not re-add)

- Ohm’s law & power — `ohms-law`
- 3-phase power & current — `three-phase`
- AC voltage drop (simplified IEC resistivity + optional reactance) — `voltage-drop`
- IDMT protection curves (IEC 60255-151, optional generic fuse overlays) — `protection-curves`
- Protection CT ALF — `protection-ct-alf`
- Metering CT burden — `metering-ct-burden`
- DC / substation tripping-battery sizing — `battery-sizing`
