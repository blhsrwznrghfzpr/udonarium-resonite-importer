# Terrain 変換仕様

[English](terrain.md)

## 1. 対象範囲

Udonarium の `terrain` オブジェクトを Resonite の slot / component に変換する仕様を定義します。

## 2. 入力フィールド（Udonarium）

- `name`
- `position.x`（`location.x`）
- `position.y`（`location.y`）
- `position.z`（`posZ`）
- `width`
- `height`
- `depth`
- `rotate`
- `mode`
- `isLocked`
- `wallImage`
- `floorImage`

## 3. 座標・軸マッピング

基本座標変換:

- `resonite.x =  udonarium.x * SCALE_FACTOR`
- `resonite.y =  udonarium.z * SCALE_FACTOR`
- `resonite.z = -udonarium.y * SCALE_FACTOR`

terrain サイズ軸の対応:

- `width  -> X`
- `height -> Y`
- `depth  -> Z`

中心補正（Udonarium の端基準 -> Resonite の中心基準）:

- `x += width / 2`
- `y += height / 2`
- `z -= depth / 2`

## 4. 回転マッピング

- Udonarium の `rotate` は地面基準の時計回り回転として扱います。
- Resonite では Y 軸回転として適用します。
  - `rotation = (x: 0, y: rotate, z: 0)`

## 5. Slot 構造

terrain ルート slot:

- コライダーと（条件付きで）`Grabbable` を持つ
- 見た目用の子 slot を持つ

子 slot:

1. `-top`
- QuadMesh
- Position: `(0, height/2, 0)`
- Rotation: `(90, 0, 0)`
- Size: `(width, depth)`
- Texture: floor 画像優先、なければ wall/先頭画像へフォールバック

2. `-walls`（壁コンテナ slot）
- 側面壁 slot を集約
- `isActive = (mode !== 1)`

`-walls` の子:

- `-front`: pos `(0, 0, -depth/2)`, rot `(0, 0, 0)`, size `(width, height)`
- `-back`:  pos `(0, 0,  depth/2)`, rot `(0, 180, 0)`, size `(width, height)`
- `-left`:  pos `(-width/2, 0, 0)`, rot `(0, 90, 0)`, size `(depth, height)`
- `-right`: pos `( width/2, 0, 0)`, rot `(0, -90, 0)`, size `(depth, height)`

壁テクスチャ:

- wall 画像優先、なければ floor/先頭画像へフォールバック

## 6. コンポーネント

terrain ルート:

- `BoxCollider`（size: `(width, height, depth)`）
- `Grabbable`（`isLocked == false` のときのみ）

見た目 slot:

- 共通 builder を使った QuadMesh ベースの描画コンポーネント

## 7. mode による挙動

- `mode = 1`: 壁 slot は生成するが `-walls.isActive = false`（非表示）
- その他の mode: 壁を表示（`-walls.isActive = true`）

## 8. 検証観点

1. サイズ軸の一致（`width/x`, `height/y`, `depth/z`）
2. 中心補正の正しさ
3. `rotate` が Y 軸回転に反映されること
4. `mode` による壁表示切替
5. `isLocked=false` で `Grabbable` が付与されること
