---
title: "@kiwa-lab/edge semantics__fidelity の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/edge</code> <code v-pre>semantics&#95;&#95;fidelity</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/fidelity.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>AXIS&#95;TO&#95;EVENTS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/fidelity.ts#L22) <code v-pre>packages/edge/src/semantics/fidelity.ts</code>

```ts
export declare const AXIS_TO_EVENTS: Record<EdgeAxis, NeutralEventName[]>;
```

#### <code v-pre>collectFidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/fidelity.ts#L114) <code v-pre>packages/edge/src/semantics/fidelity.ts</code>

Collect the platform × axis coverage grid. `platforms` is the list of platforms to inspect — usually all 3 (`cloudflare`, `vercel`, `deno`). The output is a flat row list `platforms.length * 16 = 48` for the default setup (8 v0.2 axes + 8 v1.2 advanced axes), plus `platforms` + `axes` roll-up lists so callers can assert on the grid dimensions.

```ts
export declare function collectFidelityCoverage(platforms: EdgePlatform[]): FidelityCoverage;
```

### 型

#### <code v-pre>FidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/fidelity.ts#L16) <code v-pre>packages/edge/src/semantics/fidelity.ts</code>

```ts
export interface FidelityCoverage {
    platforms: EdgePlatform[];
    axes: EdgeAxis[];
    rows: FidelityRow[];
}
```

#### <code v-pre>FidelityRow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/fidelity.ts#L9) <code v-pre>packages/edge/src/semantics/fidelity.ts</code>

Fidelity harness — collects the platform × axis coverage grid that downstream release-gate reports on. Not a runner (no side effect emit); pure inspection so tests / release-gate can assert "3 platform × 8 axis" without walking every neutral event by hand.

```ts
export interface FidelityRow {
    platform: EdgePlatform;
    axis: EdgeAxis;
    neutralEvents: NeutralEventName[];
    platformEvents: string[];
}
```
