---
title: "@kiwa-lab/realtime semantics-fidelity の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>semantics-fidelity</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics-fidelity.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>measureSemanticsAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics-fidelity.ts#L83) <code v-pre>packages/realtime/src/semantics-fidelity.ts</code>

単一 axis の fidelity 計測。 mock を初期化 → scenario を実行 → event 列を 収集 → metrics + events を返す。

```ts
export declare function measureSemanticsAxis(input: SemanticsFidelityInput): Promise<SemanticsFidelityRow>;
```

#### <code v-pre>measureSemanticsGrid</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics-fidelity.ts#L123) <code v-pre>packages/realtime/src/semantics-fidelity.ts</code>

```ts
export declare function measureSemanticsGrid(input: SemanticsGridScenarios): Promise<SemanticsFidelityRow[]>;
```

#### <code v-pre>SEMANTICS&#95;GRID</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics-fidelity.ts#L28) <code v-pre>packages/realtime/src/semantics-fidelity.ts</code>

3 protocol × 8 axis = 24 row grid の SSOT 定義。

```ts
export declare const SEMANTICS_GRID: SemanticsGridRow[];
```

### 型

#### <code v-pre>SemanticsFidelityInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics-fidelity.ts#L58) <code v-pre>packages/realtime/src/semantics-fidelity.ts</code>

```ts
export interface SemanticsFidelityInput {
    mock: SemanticsMock;
    /** scenario 実行本体 — mock を操作して event を発火させる。 */
    scenario: () => Promise<void>;
    /** collect timeout (ms、 default 3000)。 */
    timeoutMs?: number;
}
```

#### <code v-pre>SemanticsFidelityRow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics-fidelity.ts#L66) <code v-pre>packages/realtime/src/semantics-fidelity.ts</code>

```ts
export interface SemanticsFidelityRow {
    protocol: SemanticsProtocol;
    axis: SemanticsAxis;
    applicable: boolean;
    eventsEmitted: number;
    streamsOpened: number;
    streamsClosed: number;
    streamsReset: number;
    backpressureCount: number;
    /** scenario 実行中に発生した event 列 (順序保持)。 */
    events: SemanticsEvent[];
}
```

#### <code v-pre>SemanticsGridRow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics-fidelity.ts#L20) <code v-pre>packages/realtime/src/semantics-fidelity.ts</code>

```ts
export interface SemanticsGridRow {
    protocol: SemanticsProtocol;
    axis: SemanticsAxis;
    /** 該当 protocol × axis の組合せが有効か。 false なら計測不要。 */
    applicable: boolean;
}
```

#### <code v-pre>SemanticsGridScenarios</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics-fidelity.ts#L116) <code v-pre>packages/realtime/src/semantics-fidelity.ts</code>

grid 全 24 row 分の scenario を map に登録して一括計測。 applicable=false の row は placeholder row として返す (visual matrix の 24 row を保つため)。

```ts
export interface SemanticsGridScenarios {
    scenarios: Map<SemanticsAxis, {
        mock: SemanticsMock;
        scenario: () => Promise<void>;
    }>;
}
```
