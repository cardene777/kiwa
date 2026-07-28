---
title: "@kiwa-lab/cli-test expectations の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/cli-test</code> <code v-pre>expectations</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/cli-test/src/expectations.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>expectExitCode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cli-test/src/expectations.ts#L3) <code v-pre>packages/cli-test/src/expectations.ts</code>

```ts
export declare function expectExitCode(result: CliRunResult, expected: number, expect: {
    (actual: unknown): {
        toBe: (expected: unknown) => void;
    };
}): void;
```

#### <code v-pre>expectStderrContains</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cli-test/src/expectations.ts#L19) <code v-pre>packages/cli-test/src/expectations.ts</code>

```ts
export declare function expectStderrContains(result: CliRunResult, needle: string, expect: {
    (actual: unknown): {
        toContain: (expected: string) => void;
    };
}): void;
```

#### <code v-pre>expectStdoutContains</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cli-test/src/expectations.ts#L11) <code v-pre>packages/cli-test/src/expectations.ts</code>

```ts
export declare function expectStdoutContains(result: CliRunResult, needle: string, expect: {
    (actual: unknown): {
        toContain: (expected: string) => void;
    };
}): void;
```


