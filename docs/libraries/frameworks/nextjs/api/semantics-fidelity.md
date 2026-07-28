---
title: "@kiwa-lab/nextjs semantics-fidelity の API 契約"
---

# <code v-pre>@kiwa-lab/nextjs</code> <code v-pre>semantics-fidelity</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/fidelity.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>collectFidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/fidelity.ts#L56) <code v-pre>packages/nextjs/src/semantics/fidelity.ts</code>

```ts
export declare function collectFidelityCoverage(providers?: NextTarget[]): FidelityCoverage;
```

#### <code v-pre>NEXT&#95;AXIS&#95;TO&#95;EVENTS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/fidelity.ts#L16) <code v-pre>packages/nextjs/src/semantics/fidelity.ts</code>

```ts
export declare const NEXT_AXIS_TO_EVENTS: Record<NextAxis, NeutralEventName[]>;
```

### 型

#### <code v-pre>FidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/fidelity.ts#L10) <code v-pre>packages/nextjs/src/semantics/fidelity.ts</code>

```ts
export interface FidelityCoverage {
    providers: NextTarget[];
    axes: NextAxis[];
    rows: FidelityRow[];
}
```

#### <code v-pre>FidelityRow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/fidelity.ts#L3) <code v-pre>packages/nextjs/src/semantics/fidelity.ts</code>

```ts
export interface FidelityRow {
    provider: NextTarget;
    axis: NextAxis;
    neutralEvents: NeutralEventName[];
    providerEvents: string[];
}
```
