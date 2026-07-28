---
title: "@kiwa-lab/design-check spec-conformance の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/design-check</code> <code v-pre>spec-conformance</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/spec-conformance.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>assertDesignConformance</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/spec-conformance.ts#L97) <code v-pre>packages/design-check/src/spec-conformance.ts</code>

assertion helper — spec conformance が pass しない場合 throw する。 vitest の expect と同じ contract (test body で自然に fail する)。

```ts
export declare function assertDesignConformance(spec: DesignSpec, actual: DesignActual): void;
```

#### <code v-pre>checkSpecConformance</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/spec-conformance.ts#L7) <code v-pre>packages/design-check/src/spec-conformance.ts</code>

spec conformance check — design spec と actual UI values の差分を検知する。 pass = true when 全 spec key が actual に存在 + 値一致、 false when 差分あり。

```ts
export declare function checkSpecConformance(spec: DesignSpec, actual: DesignActual): SpecConformanceResult;
```


