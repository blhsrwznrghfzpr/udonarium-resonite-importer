# Table Conversion Specification

[日本語版](table.ja.md)

## 1. Scope

Defines conversion behavior for Udonarium table objects (`table` and `game-table`) into Resonite slots/components.

## 2. Source Fields (Udonarium)

- `name`
- `width`
- `height`
- `gridType`
- `gridColor`
- `image.imageIdentifier` (`table`) or `imageIdentifier` (`game-table`)
- `selected` (`game-table`, optional)
- `children` (`game-table` nested objects such as terrain/table-mask/card-stack/etc.)

## 3. Parser Behavior

`parseTable(...)` and `parseGameTable(...)` normalize both source shapes into `GameTable`.

Stored fields:

- `type = "table"`
- `position = (0, 0, 0)` (table object itself is origin-based in current implementation)
- `images[0]` from table surface identifier when present
- `children` (for `game-table`) from nested supported objects
- `selected` from `game-table.selected` when present

Defaults:

- `width = 20` (`game-table`), `20` (`table`)
- `height = 15` (`game-table`), `20` (`table`)
- `gridType = "SQUARE"`
- `gridColor = "#000000"`

## 4. Coordinate and Rotation Mapping

Root slot:

- base position uses shared conversion:
  - `resonite.x =  udonarium.x * SCALE_FACTOR`
  - `resonite.y =  udonarium.z * SCALE_FACTOR`
  - `resonite.z = -udonarium.y * SCALE_FACTOR`
- table root rotation is forced to `(0, 0, 0)`

Surface child slot (`-surface`):

- `position = (width / 2, 0, -height / 2)`
- `rotation = (90, 0, 0)`

This keeps the table container transform stable while aligning the visual mesh to table coordinates.

## 5. Slot Structure

Table root slot:

- no direct components
- contains:
  1. `-surface` visual slot
  2. converted child objects (terrain, table-mask, card-stack, etc.)

Surface slot (`-surface`):

- `QuadMesh` (`Size = (width, height)`)
- `XiexeToonMaterial`
- `MeshRenderer`
- optional texture chain from `buildQuadMeshComponents(...)`
- `BoxCollider` (`Size = (width, height, 0)`)

## 6. Material and Texture Rules

- surface texture identifier is `images[0]?.identifier`
- texture value is resolved through `resolveTextureValue(...)`
  - local placeholder: `texture://<identifier>`
  - shared reference: `texture-ref://<identifier>`
- `BlendMode` is resolved from image alpha metadata (`lookupImageBlendMode(...)`)
  - default: `Opaque`

## 7. Multi-Table Visibility Rule

After object conversion, table slot visibility (`isActive`) is adjusted:

- if table count is `0` or `1`: no table visibility override
- if table count is `2+` and no table has `selected=true`: no table visibility override
- if table count is `2+` and at least one table has `selected=true`:
  - selected tables: `isActive = true`
  - non-selected tables: `isActive = false`

This ensures only selected table(s) are visible when multiple tables are present.

## 8. Validation Points

1. surface slot is created with center offset `(width/2, 0, -height/2)`
2. table root rotation remains `(0,0,0)`
3. surface has `QuadMesh` + `BoxCollider`
4. child objects under the source table are converted as root children after `-surface`
5. blend mode follows image alpha map, fallback `Opaque`
6. in multi-table data, `selected=true` table is active and others are hidden
