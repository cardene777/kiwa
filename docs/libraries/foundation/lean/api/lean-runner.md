---
title: "@kiwa-lab/lean lean-runner の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/lean</code> <code v-pre>lean-runner</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/lean-runner.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)



### 型

#### <code v-pre>LeanRunOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/lean/src/lean-runner.ts#L35) <code v-pre>packages/lean/src/lean-runner.ts</code>

```ts
export interface LeanRunOptions {
    /**
     * Lean toolchain to pin, written to `lean-toolchain` beside the source.
     *
     * `elan` reads that file from the working directory and runs the version it
     * names, downloading it first if the machine does not have it. Left unset, the
     * machine's own Lean does the work.
     */
    leanToolchain?: string;
    /** Override for the Lean executable. Default: `lean` on PATH. */
    leanBin?: string;
    /** Where the scratch directory is created. Default: the OS temp directory. */
    workDir?: string;
    /** Timeout for the Lean subprocess in ms. Default: 60_000. */
    timeoutMs?: number;
    /**
     * How many bytes Lean may print before the rest is thrown away.
     *
     * Default: 64 MiB, about a million cells. A run that exceeds it reports
     * `output-too-large` rather than a verdict, since the answer existed and was
     * lost.
     */
    maxOutputBytes?: number;
}
```
