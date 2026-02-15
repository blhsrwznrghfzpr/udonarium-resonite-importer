# Card Stack 変換仕様

## 1. 対象

Udonarium の `card-stack` を Resonite の親 Slot + 複数カード子 Slot に変換する仕様。

## 2. 入力フィールド（Udonarium）

- `name`
- `position.x` / `position.y` / `position.z`
- `rotate`
- `cards[]`
  - 各 `card` の `size`
  - 各 `card` の `frontImage.identifier` / `backImage.identifier`
  - 各 `card` の `isFaceUp`

## 3. 座標と回転

基礎座標変換:

- `resonite.x = udonarium.x * SCALE_FACTOR`
- `resonite.y = udonarium.z * SCALE_FACTOR`
- `resonite.z = -udonarium.y * SCALE_FACTOR`

親 Slot の補正:

- `x += cardWidth / 2`
- `z -= cardHeight / 2`
- `y += 0.001`

親 Slot 回転:

- `rotation = (x: 0, y: rotate, z: 0)`

## 4. サイズとアスペクト比

- `cardWidth = cards[0]?.size ?? 1`
- `cardHeight = cardWidth * cardAspect`

`cardAspect` の決定:

1. 先頭カードの表裏識別子からアスペクト比を解決
2. `isFaceUp` に応じて表/裏の優先順を切替
3. 解決できない場合はフォールバック比率 `1`

注意:

- 山札親 Slot のサイズ・位置補正は「先頭カード由来」の `cardWidth/cardHeight` を使用

## 5. Slot 構成

### 5.1 親 Slot

- `BoxCollider` サイズ: `(x: cardWidth, y: 0.05, z: cardHeight)`
- `Grabbable`

### 5.2 子カード Slot

- `cards` は逆順（`reverse()`）で並べ替えて追加
- 各子のローカル位置:
  - `x = 0`
  - `y = index * 0.0005`
  - `z = 0`

## 6. 検証ポイント

1. 親 Slot に `BoxCollider` と `Grabbable` が付与される
2. 親の `rotation.y` に `rotate` が反映される
3. 子カード順が逆順で配置される
4. 子カードが `0.0005` 間隔で Y 積層される
5. 先頭カードのアスペクト比で親 `z` サイズが決まる
