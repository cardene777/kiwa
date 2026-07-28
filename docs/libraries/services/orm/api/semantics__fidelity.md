---
title: "@kiwa-lab/orm semantics__fidelity の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>semantics&#95;&#95;fidelity</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fidelity.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>AXIS&#95;TO&#95;EVENTS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fidelity.ts#L36) <code v-pre>packages/orm/src/semantics/fidelity.ts</code>

Static axis → neutral event lookup. Kept as a `Record&lt;OrmAxis, NeutralEventName[]&gt;` so the compiler enforces that every axis is present and every neutral event is spelled correctly.

```ts
export declare const AXIS_TO_EVENTS: Record<OrmAxis, NeutralEventName[]>;
```

#### <code v-pre>collectFidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fidelity.ts#L143) <code v-pre>packages/orm/src/semantics/fidelity.ts</code>

Collect the provider × backend × axis coverage grid. Callers pass the providers + backends to inspect — usually all 3 × 3. The output row count is `providers.length * backends.length * axes.length` (144 for the default 3 × 3 × 16 grid) plus roll-up lists so callers can assert on grid dimensions.

```ts
export declare function collectFidelityCoverage(input: {
    providers: OrmProvider[];
    backends: OrmBackend[];
}): FidelityCoverage;
```

### 型

#### <code v-pre>FidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fidelity.ts#L24) <code v-pre>packages/orm/src/semantics/fidelity.ts</code>

```ts
export interface FidelityCoverage {
    providers: OrmProvider[];
    backends: OrmBackend[];
    axes: OrmAxis[];
    rows: FidelityRow[];
}
```

#### <code v-pre>FidelityRow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fidelity.ts#L16) <code v-pre>packages/orm/src/semantics/fidelity.ts</code>

Fidelity harness — collects the provider × backend × axis coverage grid that downstream release-gate reports on. Not a runner (no side effect emit); pure inspection so tests / release-gate can assert "3 provider × 3 backend × 16 axis = 144 row" grid without walking every neutral event by hand.

```ts
export interface FidelityRow {
    provider: OrmProvider;
    backend: OrmBackend;
    axis: OrmAxis;
    neutralEvents: NeutralEventName[];
    backendEvents: string[];
}
```
