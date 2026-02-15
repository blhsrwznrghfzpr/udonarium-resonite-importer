# Dice Symbol Conversion Specification

## 1. Scope

Defines conversion behavior for Udonarium `dice-symbol` objects into a Resonite parent slot with per-face child slots.

## 2. Source Fields (Udonarium)

- `name`
- `position.x` / `position.y` / `position.z`
- `size`
- `rotate`
- `face`
- `faceImages[]`
- `images[]`

## 3. Coordinate and Rotation Mapping

Base coordinate conversion:

- `resonite.x = udonarium.x * SCALE_FACTOR`
- `resonite.y = udonarium.z * SCALE_FACTOR`
- `resonite.z = -udonarium.y * SCALE_FACTOR`

Parent slot offset:

- `x += faceWidth / 2`
- `z -= faceWidth / 2`
- `y += maxFaceHeight / 2`

Parent slot rotation:

- `rotation = (x: 0, y: rotate, z: 0)`

## 4. Face Size and Alignment Rules

- Face width uses converted `size.x`
- Face height uses image aspect ratio:
  - `faceHeight = faceWidth * aspectRatio`
  - fallback ratio is `1` when not resolved
- Parent height uses `maxFaceHeight = max(faceHeights...)`
- Smaller faces are bottom-aligned to the largest face:
  - `child.position.y = -(maxFaceHeight - childHeight) / 2`

## 5. Slot Structure

### 5.1 Parent slot

- `BoxCollider` size: `(x: faceWidth, y: maxFaceHeight, z: 0.05)`
- `Grabbable`

### 5.2 Face child slots

- id: `${parentId}-face-${index}`
- active state: only the face matching `face` is active
- position: `(0, faceYOffset, 0)`
- rotation: `(0, 0, 0)`
- `QuadMesh` size: `(faceWidth, faceHeight)`

## 6. Texture and Material Rules

- Texture identifier per child face comes from `faceImages[index].identifier`
- Material `BlendMode` is selected from image blend mode metadata:
  - known mapping/prefix value if configured (e.g. dice defaults to `Cutout`)
  - otherwise, metadata-based fallback (`Alpha` or `Opaque`)
  - unresolved fallback: `Opaque`

## 7. Validation Points

1. Parent `rotation.y` reflects `rotate`
2. Parent collider uses largest face height
3. Child `QuadMesh` height follows each face aspect ratio
4. Smaller faces are bottom-aligned to the largest face
5. Exactly one face child is active for current `face`
