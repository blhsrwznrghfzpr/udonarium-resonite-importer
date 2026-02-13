# `resonitelink.js` → `@eth0fox/tsrl` 置き換え調査

## 結論（先に要点）
- **完全なドロップイン置き換えは不可**。現在の `ResoniteLinkClient` は `resonitelink.js` 独自の `Client`/`ClientSlot` API と `create*` ヘルパーに依存しており、`@eth0fox/tsrl` の API 形状と一致しない。
- ただし、**`src/resonite/ResoniteLinkClient.ts` にアダプタ層を実装すれば置き換え可能**。影響範囲は主に Resonite 接続層とそのテスト。
- `@eth0fox/tsrl` が対応している **reflection 機能は本プロジェクトでも有用**。特に「コンポーネント定義の追従」「検証自動化」「将来互換性の向上」に効く。

## 現在実装が依存している `resonitelink.js` API
現行コードは `lib/resonitelink.js/dist` から以下を import している。

- `Client`, `ClientSlot`
- `createString`, `createReference`, `createFloat3`, `createFloatQ`, `createBool`, `createLong`

`ResoniteLinkClient` 側で、以下のような `resonitelink.js` 専用 API を前提としている。

- 接続: `client.on/off('connected'|'disconnected')`, `client.connect()`, `client.disconnect()`
- 操作: `client.createSlot()`, `client.getSlot()`, `client.createComponent()`, `client.getComponent()`, `client.send()`
- `ClientSlot` のメソッド: `setPosition`, `setRotation`, `setScale`, `setParent`
- 子スロット参照: `slot.childrens`（ラッパー固有のプロパティ）

## `@eth0fox/tsrl` API との差分（主な非互換点）
`@eth0fox/tsrl` は `ResoniteLink` クラス中心で、`Client` クラスや `ClientSlot` ラッパーを提供しない。

1. **接続モデルが異なる**
   - `resonitelink.js`: イベント駆動（`connected/disconnected`）
   - `tsrl`: `ResoniteLink.connect(url, websocketConstructor?)` で接続済みインスタンスを返す

2. **高レベルラッパー（`ClientSlot`）がない**
   - `getSlot` 相当は `slotGet()` で生データを返す。
   - `setPosition` 等は `slotUpdate()` を使って都度更新リクエストを投げる必要がある。

3. **`create*` ヘルパーがない**
   - 現行実装は `createFloat3` 等でフィールド値を組み立てている。
   - `tsrl` では `slotAdd`, `slotUpdate`, `componentAdd`, `componentUpdate` に渡すデータを直接構築する必要がある。

4. **フィールド名差分**
   - 現行は `slot.childrens` を参照しているが、`tsrl` 側は `children`。

## reflection 機能の有用性（本プロジェクト観点）
### 1) コンポーネント変換の堅牢化
本プロジェクトは `componentType` 文字列と `members` を組み立てて `addComponent` / `updateComponent` を多用する。
reflection の `getComponentDefinition` / `getSyncObjectDefinition` により、実行時に「その型で有効なメンバー名・型」を取得できるため、
- typo や型不一致の早期検出
- Resonite 側アップデートでのフィールド追加/変更追従
が可能になる。

### 2) 変換前バリデーション
`getTypeDefinition` / `getEnumDefinition` を使えば、送信前に値の型・enum 値を検証できる。
これにより、現在は Resonite 実行時エラーで気づく問題を CLI 側で事前に落とせる。

### 3) UI/診断機能の拡張
`getComponentTypeList` でカテゴリ・コンポーネント一覧を取得できるため、
将来的に GUI 側で「利用可能なコンポーネント候補表示」「デバッグ時の型探索」を実装しやすい。

## 公式 ResoniteLink リファレンス実装との照合
公式実装（`Yellow-Dog-Man/ResoniteLink`）でも reflection 系メッセージは明示的に定義されている。

- Message 派生として `getTypeDefinition`, `getGenericTypeDefinition`, `getEnumDefinition`, `getComponentDefinition`, `getSyncObjectDefinition`, `getComponentTypeList` が列挙されている。
- 応答型として `typeDefinitionData`, `enumDefinitionData`, `componentDefinitionData`, `syncObjectDefinitionData`, `componentTypeList` が定義されている。

したがって `tsrl` の reflection サポートは、公式リファレンス実装の機能セットと整合していると判断できる。

## 置き換え時の実装方針（推奨）
最小変更で進めるなら、**既存の `ResoniteLinkClient` 公開インターフェースは維持**し、内部実装のみ `tsrl` に切り替える。

- `this.client: Client` → `this.link?: ResoniteLink`
- `connect()` で `ResoniteLink.connect('ws://host:port', WebSocket)` を呼ぶ
  - Node 実行を想定し `ws` コンストラクタを明示注入
- `addSlot()` は `slotAdd(parentId, data)` へ変換
- `updateSlot()` は `slotUpdate(slotId, data)` を使用
- `addComponent()/updateComponent()/getComponentMembers()` は `componentAdd/componentUpdate/componentGet` へ変換
- `getSlotChildIds()` は `slotGet(slotId, false, 1)` の `children` から抽出
- `reparentSlot()` は `slotUpdate(slotId, { parent: ... })` で代替
- 低レベル `send()` 依存箇所は `call()` または対応する専用メソッドへ置換

## 影響範囲の見積もり
- 必須変更
  - `src/resonite/ResoniteLinkClient.ts`
  - `src/resonite/ResoniteLinkClient.test.ts`（モック対象が `Client` から `ResoniteLink` へ変化）
- 追随変更の可能性
  - `src/resonite/integration.test.ts`（`getClient()` の返却型変化）
  - `package.json` / セットアップ手順（submodule 依存を除去するなら）
  - ドキュメント（`setup:resonitelink` の見直し）

## リスク
- `tsrl` は現行実装と API 層が別物のため、移行時に回帰点は接続管理・エラーハンドリング・型組み立てに集中する。
- 現行は submodule 同梱で API を固定化しているが、npm パッケージへ移ると upstream 更新影響を受けやすくなる。
- reflection は強力だが、都度問い合わせると通信回数が増えるため、定義情報のキャッシュ方針を設計しておくのが望ましい。

## 判定
- **置き換え可否**: 可能
- **ドロップイン可否**: 不可
- **reflection 有用性**: 高（特にバリデーションと将来互換性）
- **工数感（目安）**: 中（接続層とテストを中心に改修）
