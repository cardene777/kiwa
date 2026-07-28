---
title: "@kiwa-lab/mobile semantics__fidelity の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/mobile</code> <code v-pre>semantics&#95;&#95;fidelity</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fidelity.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>collectFidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fidelity.ts#L87) <code v-pre>packages/mobile/src/semantics/fidelity.ts</code>

```ts
export declare function collectFidelityCoverage(providers?: MobileTarget[]): FidelityCoverage;
```

#### <code v-pre>MOBILE&#95;AXIS&#95;TO&#95;EVENTS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fidelity.ts#L16) <code v-pre>packages/mobile/src/semantics/fidelity.ts</code>

```ts
export declare const MOBILE_AXIS_TO_EVENTS: Record<MobileAxis, NeutralEventName[]>;
```

### 型

#### <code v-pre>FidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fidelity.ts#L10) <code v-pre>packages/mobile/src/semantics/fidelity.ts</code>

```ts
export interface FidelityCoverage {
    providers: MobileTarget[];
    axes: MobileAxis[];
    rows: FidelityRow[];
}
```

#### <code v-pre>FidelityRow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/fidelity.ts#L3) <code v-pre>packages/mobile/src/semantics/fidelity.ts</code>

```ts
export interface FidelityRow {
    provider: MobileTarget;
    axis: MobileAxis;
    neutralEvents: NeutralEventName[];
    providerEvents: string[];
}
```
