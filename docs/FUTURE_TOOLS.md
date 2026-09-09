# Future tools (backlog)

Ideas to implement after the MVP calculators. Do not treat these as in-scope until you explicitly start one.

## 1. Cable rating lookup (AS/NZS 3000)

Simple table lookup of current-carrying capacity from AS/NZS 3000 rating tables, given cable size, type, installation method, and related factors.

Notes:

- Distinct from the MVP IEC voltage-drop calculator.
- Source tables must be cited; do not invent ampacity values.

## 2. Protection curve plotting

Plot time–current curves for multiple protective devices on one chart, using overcurrent pickup, time delay, instantaneous (and similar) settings.

Notes:

- Needs overlay of several devices.
- Formula/curve math belongs in `lib/calc/`, not in the chart component.

## 3. Power ↔ current conversion — done

Implemented as **3-Phase Amps ↔ kW** (`/tools/amps-kw`), replacing Ohm's law. Still overlaps with the fuller 3-phase power tool.

## 4. Substation backup / tripping battery sizing

Size a DC battery system for standing loads plus a defined number of switchgear open/close operations.

Notes:

- Inputs: list of standing loads; operation counts for open/close of specified switchgear.
- Show the method/equations used on the results card.
