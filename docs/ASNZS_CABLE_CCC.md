# AS/NZS cable current-carrying capacity (CCC)

Lookup tool slug: `cable-ccc-asnzs` (Cable CCC (AS/NZS 3008)).

This MVP is a **fail-closed table lookup**. It does not invent ampacity, interpolate between sizes, or apply correction factors.

## Standards (verify against a licensed copy)

| Document | Role |
| --- | --- |
| **AS/NZS 3000:2018** (Wiring Rules) | Installation / selection obligation: conductors must be selected with adequate current-carrying capacity. The Wiring Rules **refer to AS/NZS 3008** for tabulated CCC and selection methodology; they do not own the main rating tables. |
| **AS/NZS 3008.1.1:2017** | Intended data file for this tool: CCC tables and correction factors for **typical Australian installation conditions**, cables up to 0.6/1 kV. |
| **AS/NZS 3008.1.1:2025** | Current Part 1.1 edition (Standards Australia, published **19 December 2025**). Table numbering and installation-method columns may differ from 2017. Set `edition` on the JSON to the copy you load. |
| **AS/NZS 3008.1.2:2017** | Typical **New Zealand** installation conditions. Not loaded. Treat as backlog. |

Public previews and secondary sources (Standards Australia store text, USQ thesis quoting AS/NZS 3000:2007 cl. 3.4.1, practice notes) agree that 3000 requires CCC “in accordance with AS/NZS 3008”, while 3008 holds the tables. Clause numbers inside 3000 (3.4 vs 3.5 in secondary articles) should be checked in a licensed Wiring Rules copy.

## What is embedded

**No tabulated ampacity and no correction-factor numbers.**

Shipped files:

- `data/asnzs3008/ccc-base.json` — eight MVP **paths** (copper/aluminium × V-90/X-90 × multicore × unenclosed-air / enclosed-air) with **empty** `ratings` arrays.
- `data/asnzs3008/correction-factors.json` — empty `factors` array. The engine refuses to apply factor tables in this MVP even if that file is later populated.

A rating is accepted only when the path has both `tableId` and `columnId` **and** a matching `sizeMm2` row. Missing paths, empty tables, and intermediate sizes error clearly.

## Copyright / sourcing

AS/NZS 3008 tables are copyright Standards Australia / Standards New Zealand.

Investigation for this MVP (not a licence):

- Full CCC tables were **not** found as a free, legally republishable dataset.
- Commercial sites that reprint multi-row “Table 13” (or similar) blocks, and unauthorized PDF copies of the standard, were **not** used.
- Manufacturer catalogues that say ratings are “based on AS/NZS 3008.1.1” (for example older Prysmian / Olex guides) do not quote a standard **table and column ID** per cell in a form this tool can cite; they were not transcribed.
- Blog “approximate” amperes (for example “about 86 A”) are not exact table cells and were not used.

**Verify every loaded value against the current licensed standard** before relying on a result.

## How to load licensed data

1. Obtain a licensed copy of the edition you will cite (2017 or 2025 Part 1.1, or 3008.1.2 for NZ).
2. Open `data/asnzs3008/ccc-base.json`.
3. Set `standard`, `edition`, `title`, and the notes so they match **that** copy.
4. For each path you fill:

```json
{
  "id": "cu-x90-mc-unenclosed-air",
  "tableId": "13",
  "columnId": "<column as printed in the licensed table>",
  "conditions": "<copy the table notes: ambient, loaded cores, sunlight, …>",
  "ratings": [
    { "sizeMm2": 16, "currentA": "<value from that table cell>" }
  ]
}
```

Use the real table and column identifiers from the licensed edition. Do not invent IDs. The example `13` above is a **placeholder for the identifier you read in your copy** (2017 vs 2025 numbering differs in secondary sources).

5. Leave unused paths with empty `ratings`. Do not guess those columns.
6. Run `npm test`. A path with ratings but empty `tableId`/`columnId` is rejected.
7. Do **not** populate `correction-factors.json` until a later derating release; the lookup engine currently fails closed if any factors are present.

Manufacturer datasheets are acceptable only when they **explicitly** reproduce a standard table cell **with table and column ID**. Copy that citation into `tableId` / `columnId`.

## MVP inputs / outputs

Inputs: conductor (Cu/Al), insulation family present in the dataset (V-90, X-90), size (mm²), installation path (unenclosed in air, enclosed in air). Arrangement is multicore in the shipped path list.

Outputs: I_z in amperes plus standard / edition / table / column / conditions, or a fail-closed error. No ambient or grouping factors.

## Backlog (not this PR)

- Full derating matrix (ambient, grouping, soil resistivity, burial depth) from cited 3008 factor tables.
- AS/NZS 3008.1.2 NZ-condition tables.
- AS/NZS 3008.1.1:2025 table set (new IDs, DC appendix).
- Single-core, buried, V-75, and other installation columns.
- AS/NZS 3000 voltage-drop / earth-loop / max-demand suite (separate tools).
