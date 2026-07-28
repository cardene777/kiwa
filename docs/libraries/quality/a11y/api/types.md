---
title: "@kiwa-lab/a11y types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/a11y</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>AuditOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/types.ts#L17) <code v-pre>packages/a11y/src/types.ts</code>

```ts
export interface AuditOptions {
    /** Element / selector / Document to scan (default: document) */
    context?: Element | Document | string;
    /** axe-core run options (passed verbatim) */
    runOptions?: Record<string, unknown>;
    /** Maximum impact level allowed before reportViolations throws */
    maxImpact?: 'minor' | 'moderate' | 'serious' | 'critical';
}
```

#### <code v-pre>AxeResults</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/types.ts#L10) <code v-pre>packages/a11y/src/types.ts</code>

```ts
export interface AxeResults {
    violations: AxeViolation[];
    passes: Array<{
        id: string;
    }>;
    incomplete: Array<{
        id: string;
    }>;
    inapplicable: Array<{
        id: string;
    }>;
}
```

#### <code v-pre>AxeRunModule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/types.ts#L26) <code v-pre>packages/a11y/src/types.ts</code>

```ts
export interface AxeRunModule {
    run: (context?: Element | Document | string, options?: Record<string, unknown>) => Promise<AxeResults>;
}
```

#### <code v-pre>AxeViolation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/types.ts#L1) <code v-pre>packages/a11y/src/types.ts</code>

```ts
export interface AxeViolation {
    id: string;
    impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
    description: string;
    help: string;
    helpUrl: string;
    nodes: Array<{
        target: string[];
        html: string;
        failureSummary?: string;
    }>;
}
```
