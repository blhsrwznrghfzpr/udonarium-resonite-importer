# Card Stack Conversion Specification

## 1. Scope

Defines conversion behavior for Udonarium `card-stack` objects into a Resonite parent slot with card child slots.

## 2. Source Fields (Udonarium)

- `name`
- `position.x` / `position.y` / `position.z`
- `rotate`
- `cards[]`
  - per-card `size`
  - per-card `frontImage.identifier` / `backImage.identifier`
  - per-card `isFaceUp`

## 3. Coordinate and Rotation Mapping

Base coordinate conversion:

- `resonite.x = udonarium.x * SCALE_FACTOR`
- `resonite.y = udonarium.z * SCALE_FACTOR`
- `resonite.z = -udonarium.y * SCALE_FACTOR`

Parent slot offset:

- `x += cardWidth / 2`
- `z -= cardHeight / 2`
- `y += 0.001`

Parent slot rotation:

- `rotation = (x: 0, y: rotate, z: 0)`

## 4. Size and Aspect Ratio

- `cardWidth = cards[0]?.size ?? 1`
- `cardHeight = cardWidth * cardAspect`

How `cardAspect` is resolved:

1. Resolve front/back aspect candidates from the first card
2. Switch priority by first card `isFaceUp`
3. Fallback to `1` if unresolved

Note:

- Parent stack sizing and offset are based on the first card derived dimensions.

## 5. Slot Structure

### 5.1 Parent slot

- `BoxCollider` size: `(x: cardWidth, y: 0.05, z: cardHeight)`
- `Grabbable`

### 5.2 Child card slots

- Child cards are added in reverse order (`reverse()`)
- Local child position:
  - `x = 0`
  - `y = index * 0.0005`
  - `z = 0`

## 6. Validation Points

1. Parent slot has both `BoxCollider` and `Grabbable`
2. Parent `rotation.y` reflects `rotate`
3. Child card order is reversed
4. Child cards are stacked on Y at `0.0005` increments
5. Parent `z` size follows first-card aspect resolution
