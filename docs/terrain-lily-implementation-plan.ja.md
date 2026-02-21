# Udonarium Lily 地形対応 実装計画

## 目的
- `sample-terrain-lily.zip` に含まれる地形データを、既存の `terrain` 変換フローで破綻なく取り込めるようにする。
- まずは **高度 (`altitude`)** と **傾斜 (`isSlope` / `slopeDirection`)** を対象に、段階的に対応する。

## 現状と差分
- 現状実装は `Terrain` に `width/height/depth/mode/rotate/isLocked` までを持つ。
  - `src/domain/UdonariumObject.ts`
  - `src/parser/objects/TerrainParser.ts`
  - `src/converter/objectConverters/terrainConverter.ts`
- Lily では地形に以下が追加される。
  - 属性: `isSlope`, `slopeDirection`（`<terrain ...>` 属性）
  - common data: `altitude`（`<data name="common"><data name="altitude">...</data>`）
- `sample-terrain-lily.zip` には以下ケースが含まれる。
  - `altitude = -0.5` の地形
  - `isSlope = true` かつ `slopeDirection = 1/2/3/4`（上/下/左/右）

## 実装方針
- 互換性優先で、以下の2段階で進める。
- 派生機能は `domain/UdonariumObject` の必須プロパティにしない。
  - `Terrain` の既存必須項目は維持する。
  - Lily 固有値（`altitude/isSlope/slopeDirection`）は **拡張メタデータ** として別管理する。
  - 例: `ParsedObjectExtensions`（`terrain` の主要属性から作るオブジェクトキーを使う拡張情報マップ）を parser -> converter に渡す。

### Phase 1: データ保持と高度反映（最小価値を先に出す）
- parser で Lily 拡張値を抽出し、拡張メタデータに保持する。
- converter では `altitude` を地形ルートの Y オフセットに反映する。
  - 基本式: `baseY += altitude`
  - 既存 `posZ`（`position.z`）との合成で最終高さを決定する。
- `isSlope/slopeDirection` はこの段階では **保持のみ**（描画は既存直方体のまま）。

### Phase 2: 傾斜形状の可視化対応
- `isSlope=true` のとき、上面を傾け、傾斜方向に対応する壁を抑制する。
- 方向マッピング（Lily `SlopeDirection`）を固定する。
  - `1=TOP`, `2=BOTTOM`, `3=LEFT`, `4=RIGHT`, `0=NONE`
- コライダー方針はまず安全側。
  - 初期は既存 `BoxCollider` を維持（見た目先行）
  - 必要なら後続で斜面追従コライダー（または近似分割）を検討

## 具体タスク
1. 型定義拡張
- `src/domain/UdonariumObject.ts` の `Terrain` 必須項目は変更しない。
- 拡張値用の型を新設する（例）。
  - `src/parser/extensions/ObjectExtensions.ts`
  - `TerrainLilyExtension`（`altitude/isSlope/slopeDirection`）
  - `ParsedObjectExtensions`（識別子未設定オブジェクトでも衝突しないキーで保持）

2. Parser 拡張
- `src/parser/objects/TerrainParser.ts`
  - `common.altitude` / `@_isSlope` / `@_slopeDirection` を抽出
  - `Terrain` 本体とは別に `ParsedObjectExtensions` へ格納
  - 未指定時デフォルトは `0/false/0`
- `src/parser/XmlParser.ts`
  - 戻り値に `extensions` を追加（`objects` と並行して返す）
- `src/parser/objects/TerrainParser.test.ts`
  - altitude 正負・小数の取得
  - slope 系属性の取得
  - 未指定時デフォルト

3. Converter 拡張（Phase 1）
- `src/converter/ObjectConverter.ts`
  - `extensions` を object converter へ受け渡し
- `src/converter/objectConverters/terrainConverter.ts`
  - 対象 `terrain.id` の拡張メタデータを参照して `altitude` を適用
  - 既存 mode=1 分岐、isLocked 分岐に影響がないことを担保
- `src/converter/objectConverters/terrainConverter.test.ts`
  - altitude 反映ケース追加
  - 既存ケースの回帰確認

4. fixture 統合テスト追加
- `src/parser/integration.test.ts`
  - `sample-terrain-lily.zip` を追加し、terrain から altitude/slope が読めることを検証
- `src/converter/integration.test.ts`
  - Lily fixture で変換後 slot の高さ・子構造が期待通りであることを検証

5. Converter 拡張（Phase 2）
- `src/converter/objectConverters/terrainConverter.ts`
  - `extensions` の `isSlope/slopeDirection` を参照
  - `isSlope=true` で top 面の回転/位置を方向別に切り替え
  - `slopeDirection` に応じて 1 面の wall を非生成
  - mode=1（床のみ）との優先順位を明確化（`mode=1` は壁なしを優先）
- `src/converter/objectConverters/terrainConverter.test.ts`
  - 4方向それぞれの top rotation / 壁欠落を検証
  - `isSlope=false` の既存地形に影響しないことを検証

6. 仕様ドキュメント更新
- `docs/object-conversion/terrain.md`
- `docs/object-conversion/terrain.ja.md`
  - Lily 拡張フィールド、高度計算、傾斜方向の対応表を追記

## 受け入れ条件（Definition of Done）
- `sample-terrain-lily.zip` の parser 結果で、対象 terrain の `altitude/isSlope/slopeDirection` が欠落しない。
- 既存 fixture（`sample-terrain.zip` など）のテストが回帰しない。
- Phase 1 完了時点で、高度が反映され、未対応の傾斜はデータ保持される。
- Phase 2 完了時点で、4方向の傾斜見た目が再現され、方向に応じた壁の欠落が再現される。

## リスクと対策
- リスク: Lily の見た目（CSS 3D）と Resonite メッシュ表現の差で完全一致しない。
  - 対策: まず「方向・高低が分かる」ことを優先し、ピクセル一致を目標にしない。
- リスク: 斜面上の物理挙動（CharacterCollider）が期待とずれる。
  - 対策: 初期は既存 BoxCollider 維持、必要なら別チケットで物理改善。
- リスク: 既存 terrain 仕様との競合。
  - 対策: mode/isLocked の既存テストを維持し、Lily ケースを追加して網羅する。

## 実施順序（推奨）
1. Phase 1（型・parser・converter高度・テスト）を1PRで完了
2. Phase 2（傾斜形状）を別PRで導入
3. docs の仕様更新と fixture 追加検証を同時に完了
