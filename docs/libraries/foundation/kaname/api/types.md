---
title: "@kiwa-lab/kaname types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/kaname</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>ClassifyIssue</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/types.ts#L56) <code v-pre>packages/kaname/src/types.ts</code>

```ts
export interface ClassifyIssue {
    itemId: string;
    reason: 'duplicate-id' | 'empty-statement' | 'unknown-layer' | 'empty-verify-by' | 'both-layers-touch-same-artifact';
    message: string;
}
```

#### <code v-pre>ClassifyReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/types.ts#L67) <code v-pre>packages/kaname/src/types.ts</code>

```ts
export interface ClassifyReport {
    ok: boolean;
    issues: readonly ClassifyIssue[];
    perLayer: Readonly<Record<SpecLayer, number>>;
}
```

#### <code v-pre>SpecDoc</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/types.ts#L33) <code v-pre>packages/kaname/src/types.ts</code>

```ts
export interface SpecDoc {
    /** Human-readable title of the whole specification. */
    title: string;
    /** GitHub issue / Linear ID this spec covers, if any. */
    issueRef?: string;
    /** Ordered list of specification items. Order = source order. */
    items: readonly SpecItem[];
}
```

#### <code v-pre>SpecItem</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/types.ts#L15) <code v-pre>packages/kaname/src/types.ts</code>

```ts
export interface SpecItem {
    /** Stable identifier, e.g. `AC-001`. Must be unique within a SpecDoc. */
    id: string;
    /** One-sentence acceptance criterion. */
    statement: string;
    /** Layer this item must be verified in. */
    layer: SpecLayer;
    /**
     * How this item will be verified.
     * - formal → Lean namespace or orchestrator name (e.g., `Transaction`)
     * - runtime → test path or category (e.g., `tests/integration/auth.test.ts`)
     * - human   → review checkpoint (e.g., `UX walkthrough`, `Product approval`)
     */
    verifyBy: string;
    /** Optional freeform notes. */
    notes?: string;
}
```

#### <code v-pre>SpecLayer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/types.ts#L13) <code v-pre>packages/kaname/src/types.ts</code>

```ts
export type SpecLayer = 'formal' | 'runtime' | 'human';
```

#### <code v-pre>SplitResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/kaname/src/types.ts#L42) <code v-pre>packages/kaname/src/types.ts</code>

```ts
export interface SplitResult {
    /** Contents of `specFormal.md` — items with `layer === 'formal'`. */
    specFormal: string;
    /** Contents of `specRuntime.md` — items with `layer === 'runtime'` or `'human'`. */
    specRuntime: string;
    /** Coverage summary for downstream tooling. */
    summary: {
        total: number;
        formalCount: number;
        runtimeCount: number;
        humanCount: number;
    };
}
```
