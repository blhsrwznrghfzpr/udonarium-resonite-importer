# Dice Symbol 変換仕様

## 1. 対象

Udonarium の `dice-symbol` を、Resonite の親 Slot + 面ごとの子 Slot 構造に変換する仕様です。

## 2. 入力フィールド（Udonarium）

- `name`
- `position.x` / `position.y` / `position.z`
- `size`
- `rotate`
- `face`
- `faceImages[]`
- `images[]`

## 3. 座標・回転変換

座標変換:

- `resonite.x = udonarium.x * SCALE_FACTOR`
- `resonite.y = udonarium.z * SCALE_FACTOR`
- `resonite.z = -udonarium.y * SCALE_FACTOR`

親 Slot の位置オフセット:

- `x += faceWidth / 2`
- `z -= faceWidth / 2`
- `y += maxFaceHeight / 2`

親 Slot の回転:

- `rotation = (x: 0, y: rotate, z: 0)`

## 4. 面サイズと配置ルール

- 面の横幅は `size.x` の変換値を使用
- 面の高さは画像アスペクト比から算出:
  - `faceHeight = faceWidth * aspectRatio`
  - 比率が取得できない場合は `1` を使用
- 親の高さは `maxFaceHeight = max(faceHeights...)`
- 小さい面は大きい面の底面に揃えて配置:
  - `child.position.y = -(maxFaceHeight - childHeight) / 2`

## 5. Slot 構成

### 5.1 親 Slot

- `BoxCollider` サイズ: `(x: faceWidth, y: maxFaceHeight, z: 0.05)`
- `Grabbable`

### 5.2 面の子 Slot

- id: `${parentId}-face-${index}`
- アクティブ状態: `face` と一致する面だけ active
- position: `(0, faceYOffset, 0)`
- rotation: `(0, 0, 0)`
- `QuadMesh` サイズ: `(faceWidth, faceHeight)`

## 6. テクスチャ・マテリアル

- 各面のテクスチャIDは `faceImages[index].identifier` を使用
- Material の `BlendMode` は画像ブレンドモード情報から決定:
  - 既知ID/プレフィックスの設定値（例: dice 既定は `Cutout`）
  - 未設定の場合はメタデータ判定（`Alpha` / `Opaque`）
  - 最終的に判定不能な場合は `Cutout`

## 7. テスト観点

1. 親 `rotation.y` に `rotate` が反映される
2. 親 Collider の高さが最大面高になる
3. 子 `QuadMesh` の高さが各面の比率に従う
4. 小さい面が底面揃えで配置される
5. 指定 `face` に対応する子 Slot だけが active になる
