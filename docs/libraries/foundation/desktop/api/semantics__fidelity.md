---
title: "@kiwa-lab/desktop semantics__fidelity の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>semantics&#95;&#95;fidelity</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fidelity.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>collectFidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fidelity.ts#L94) <code v-pre>packages/desktop/src/semantics/fidelity.ts</code>

```ts
export declare function collectFidelityCoverage(providers?: DesktopTarget[]): FidelityCoverage;
```

#### <code v-pre>DESKTOP&#95;AXIS&#95;TO&#95;EVENTS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fidelity.ts#L16) <code v-pre>packages/desktop/src/semantics/fidelity.ts</code>

```ts
export declare const DESKTOP_AXIS_TO_EVENTS: Record<DesktopAxis, NeutralEventName[]>;
```

### 型

#### <code v-pre>FidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fidelity.ts#L10) <code v-pre>packages/desktop/src/semantics/fidelity.ts</code>

```ts
export interface FidelityCoverage {
    providers: DesktopTarget[];
    axes: DesktopAxis[];
    rows: FidelityRow[];
}
```

#### <code v-pre>FidelityRow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/fidelity.ts#L3) <code v-pre>packages/desktop/src/semantics/fidelity.ts</code>

```ts
export interface FidelityRow {
    provider: DesktopTarget;
    axis: DesktopAxis;
    neutralEvents: NeutralEventName[];
    providerEvents: string[];
}
```
