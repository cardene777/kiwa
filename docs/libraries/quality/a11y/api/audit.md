---
title: "@kiwa-lab/a11y audit の API 契約"
---

# <code v-pre>@kiwa-lab/a11y</code> <code v-pre>audit</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/audit.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>expectNoViolations</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/audit.ts#L57) <code v-pre>packages/a11y/src/audit.ts</code>

```ts
export declare function expectNoViolations(results: AxeResults, expect: {
    (actual: unknown): {
        toBe: (expected: unknown) => void;
    };
}, opts?: {
    maxImpact?: AuditOptions['maxImpact'];
}): void;
```

#### <code v-pre>reportViolations</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/audit.ts#L40) <code v-pre>packages/a11y/src/audit.ts</code>

```ts
export declare function reportViolations(results: AxeResults, opts?: {
    maxImpact?: AuditOptions['maxImpact'];
}): ViolationReport;
```

#### <code v-pre>runAxe</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/audit.ts#L24) <code v-pre>packages/a11y/src/audit.ts</code>

```ts
export declare function runAxe(opts?: AuditOptions): Promise<AxeResults>;
```

### 型

#### <code v-pre>ViolationReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/audit.ts#L34) <code v-pre>packages/a11y/src/audit.ts</code>

```ts
export interface ViolationReport {
    violations: AxeViolation[];
    blocking: AxeViolation[];
    summary: string;
}
```
