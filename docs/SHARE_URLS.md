# Shareable calculation URLs

Each calculator stores its current inputs (and mode/tabs) in the **query string** of `/tools/<slug>`. Opening the same URL in a fresh session restores the same calculation.

The URL is kept in sync with `history.replaceState` as you type. **Copy link** copies that URL. Unknown query keys are ignored. Invalid enum values (units, materials, modes, …) fall back to the tool default.

Values are the same strings the form shows (including SI prefixes). Lists use `{prefix}{index}{field}` keys, 0-based with no gaps.

## Common keys

| Key | Meaning |
| --- | --- |
| `m` | Mode / tab |
| `v`, `vu` | Voltage and unit (`V`, `kV`, …) |
| `i`, `iu` | Current and unit (`A`, `kA`, …) |
| `p`, `pu` | Power and unit |
| `pf` | Power factor (0–1) |
| `mat` | Conductor material (`copper` \| `aluminium`) |
| `l`, `lu` | Length and unit |
| `t`, `tu` | Time / temperature (tool-specific) |

## Tools

### `amps-kw`

`m` `amps-to-kw` \| `kw-to-amps` · `v` `vu` `i` `iu` `p` (kW) `pf`

`/tools/amps-kw?m=amps-to-kw&v=400&vu=V&i=10&iu=A&p=5.543&pf=0.8`

### `three-phase`

`m` `from-current` \| `from-power` · `v` `vu` `i` `iu` `p` `pu` `pf`

### `voltage-drop`

`mat` `cir` (`three-phase` \| `single-phase`) · `l` `lu` `i` `iu` `a` (mm²) `t` (°C) `pf` `x` (Ω/km) `vn` `vu`

`/tools/voltage-drop?mat=copper&cir=three-phase&l=100&lu=m&i=100&iu=A&a=25&t=20&pf=1&x=0&vn=400&vu=V`

### `adiabatic`

`mat` `ins` (`pvc` \| `xlpe` \| `custom-k`) · `ti` `tf` `k` `i` `iu` `t` `tu`

### `protection-curves`

Scalars: `mf` `mfu` `xf` `xfu` (min/max fault).

Devices (`d`, max 6): `id` `n` (name) `k` (`relay` \| `fuse`) `c` (IEC curve) `fc` (`gg` \| `am`) `p` `pu` (I>) `r` `ru` (fuse In) `tms` `dt` (t>) `ip` `ipu` `it` (I>> / t>>).

`/tools/protection-curves?mf=1000&mfu=A&xf=1000&xfu=A&d0id=device-1&d0n=Relay%201&d0k=relay&d0c=iec-si&d0p=100&d0pu=A&d0tms=1`

### `protection-ct-alf`

`ctp` `ctpu` `cts` (`1` \| `5`) `alf` `if` `ifu` `s` (VA) `rct` `rctu` `rr` `rru` `l` `lu` `a` (mm²) `sf`

### `metering-ct-burden`

`s` `su` (load VA) `v` `vu` `vpu` `ctp` `ctpu` `cts` `l` `lu` `a` `rr` `rru` `rx` `rxu` `b` (rated VA)

### `battery-sizing`

Scalars: `v` `vu` `t` `tu` (autonomy) `age` `kth` `mar`.

Standing loads (`l`, max 12): `id` `n` `p` `pu` `i` `iu` `e` (`power` \| `current`).

Switchgear (`g`, max 8): `id` `n` `q` · trip `ti` `tiu` `tt` `ttu` `tn` · close `ci` `ciu` `ct` `ctu` `cn` · motor `mi` `miu` `mt` `mtu` `mn`.
