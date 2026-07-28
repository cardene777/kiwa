---
title: "@kiwa-lab/cli-test types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/cli-test</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/cli-test/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)



### 型

#### <code v-pre>CliRunOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cli-test/src/types.ts#L12) <code v-pre>packages/cli-test/src/types.ts</code>

```ts
export interface CliRunOptions {
    cmd: string;
    args?: string[];
    /** stdin to pipe to the child (string is utf8-encoded) */
    stdin?: string;
    /** override env merged on top of the env captured at setupCliEnv() */
    env?: Record<string, string>;
    /** cwd within the temp dir; absolute paths are passed through unchanged */
    cwd?: string;
    /** Timeout for the process in ms (default 10s) */
    timeoutMs?: number;
}
```

#### <code v-pre>CliRunResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cli-test/src/types.ts#L25) <code v-pre>packages/cli-test/src/types.ts</code>

```ts
export interface CliRunResult {
    exitCode: number;
    signal: NodeJS.Signals | null;
    stdout: string;
    stderr: string;
    durationMs: number;
}
```

#### <code v-pre>CliTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cli-test/src/types.ts#L33) <code v-pre>packages/cli-test/src/types.ts</code>

```ts
export interface CliTestEnv extends TestEnvBase<'mock'> {
    tempDir: string;
    /** Run a CLI in the isolated tempdir with merged env */
    runCli: (opts: CliRunOptions) => Promise<CliRunResult>;
    /** Read a file relative to tempDir as utf8 */
    readFile: (relPath: string) => Promise<string>;
    /** Write a file relative to tempDir (creates parents) */
    writeFile: (relPath: string, content: string | Buffer) => Promise<void>;
    /** List files relative to tempDir */
    listFiles: (relDir?: string) => Promise<string[]>;
    /** Returns true when the relPath exists */
    fileExists: (relPath: string) => Promise<boolean>;
}
```

#### <code v-pre>SetupCliEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cli-test/src/types.ts#L3) <code v-pre>packages/cli-test/src/types.ts</code>

```ts
export interface SetupCliEnvOptions {
    /** Optional initial files seeded into the isolated tempdir before tests run */
    seedFiles?: Record<string, string | Buffer>;
    /** Optional env overrides applied to every runCli invocation */
    env?: Record<string, string>;
    /** Optional subdir name within OS tempdir (default "kiwa-cli-") */
    prefix?: string;
}
```
