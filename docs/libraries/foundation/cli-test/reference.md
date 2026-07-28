# @kiwa-lab/cli-test リファレンス

temporary directory、child process 実行、file helper、CLI lifecycle の公開 API です。

## setupCliEnv

`setupCliEnv({ seedFiles, env, prefix })` は `{ mode: "mock", tempDir, runCli, readFile, writeFile, listFiles, fileExists, stop }` を返します。prefix の既定値は `kiwa-cli-` です。

| option | 内容 |
| --- | --- |
| `seedFiles` | temp directory 作成直後に書く relative path と string または Buffer の record |
| `env` | `process.env` に重ねる environment variable |
| `prefix` | OS temporary directory 内に作る directory 名の prefix |

`stop()` は `tempDir` を recursive、force 指定で削除します。stop 後に environment を再利用しないでください。

## runCli

`runCli({ cmd, args, stdin, env, cwd, timeoutMs })` は child process の終了を待ちます。既定 cwd は temp directory、既定 timeout は 10,000 ms です。

| result | 内容 |
| --- | --- |
| `exitCode` | child の exit code。code が null の signal 終了では 0 |
| `signal` | signal 終了なら signal 名、通常終了なら null |
| `stdout` | UTF-8 に結合した standard output |
| `stderr` | UTF-8 に結合した standard error |
| `durationMs` | 起動から close event までの経過時間 |

object body はありません。`cmd` と `args` は直接 `spawn` に渡されるため、shell expansion、pipe、redirect は解釈されません。shell を検証する必要がある場合は shell executable を `cmd` にし、script を argument として渡します。

timeout と spawn error は Promise reject です。timeout では child を SIGKILL しますが result は返りません。

## file helper

`readFile` と `writeFile` は UTF-8 text または Buffer を扱います。`writeFile` は親 directory を作ります。`listFiles(relDir)` は指定 directory を再帰的に探索し、temp directory からの relative path を返します。存在しない directory は空配列です。`fileExists` は stat error を false として返します。

path validation は行いません。relative path に `../` を含める、absolute `cwd` を指定するなどで temp directory の外を扱えます。

## assertion helper

`expectExitCode(result, expected, expect)`、`expectStdoutContains(result, needle, expect)`、`expectStderrContains(result, needle, expect)` は第三引数の assertion function を使います。Vitest では `expect` を渡します。

## lifecycle helper

`startCli({ timestamp })` は spawning state の `CliSession` を作ります。公開 entry point の `dispatchCliEvent({ session, event, timestamp })` は state と counters を更新し、`summarizeCli(session)` は event 数、invalid event 数、terminal event 数、stream chunk 数などを返します。

state は `spawning`、`running`、`signaled`、`exited`、`cleaned` です。invalid event は例外にせず log へ記録します。

<!-- kiwa-public-api:start -->
## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/cli-test/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>dispatchCliEvent</code>

公開 entry point から解決しています。

<code v-pre>dispatchEvent</code> を <code v-pre>dispatchCliEvent</code> として公開しています。

```ts
export {
  startCli,
  dispatchEvent as dispatchCliEvent,
  summarizeCli,
} from './cli-lifecycle-orchestrator.js';
```

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

#### <code v-pre>setupCliEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cli-test/src/setup-cli-env.ts#L106) <code v-pre>packages/cli-test/src/setup-cli-env.ts</code>

```ts
export declare function setupCliEnv(opts?: SetupCliEnvOptions): Promise<CliTestEnv>;
```

#### <code v-pre>startCli</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cli-test/src/semantics/cli-lifecycle-orchestrator.ts#L36) <code v-pre>packages/cli-test/src/semantics/cli-lifecycle-orchestrator.ts</code>

```ts
export declare function startCli(input: {
    timestamp: string;
}): CliSession;
```

#### <code v-pre>summarizeCli</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cli-test/src/semantics/cli-lifecycle-orchestrator.ts#L132) <code v-pre>packages/cli-test/src/semantics/cli-lifecycle-orchestrator.ts</code>

```ts
export declare function summarizeCli(session: CliSession): CliSummary;
```

### 型

#### <code v-pre>CliEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cli-test/src/semantics/cli-lifecycle-orchestrator.ts#L14) <code v-pre>packages/cli-test/src/semantics/cli-lifecycle-orchestrator.ts</code>

```ts
export type CliEvent = 'spawn-succeeded' | 'stdout-received' | 'stderr-received' | 'signal-sent' | 'exit-detected' | 'cleanup-requested' | 'zombie-detected' | 'timeout';
```

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

#### <code v-pre>CliSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cli-test/src/semantics/cli-lifecycle-orchestrator.ts#L24) <code v-pre>packages/cli-test/src/semantics/cli-lifecycle-orchestrator.ts</code>

```ts
export interface CliSession {
    state: CliState;
    spawns: number;
    stdoutChunks: number;
    stderrChunks: number;
    signals: number;
    cleanups: number;
    zombies: number;
    lastEventAt: string;
    events: string[];
}
```

#### <code v-pre>CliState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cli-test/src/semantics/cli-lifecycle-orchestrator.ts#L7) <code v-pre>packages/cli-test/src/semantics/cli-lifecycle-orchestrator.ts</code>

v0.6 cli-lifecycle-orchestrator = CLI process lifecycle (spawn + IO stream + signal + exit code + cleanup) の 継続合成 layer。 depth-5 pattern 13 例目 candidate、 backend systems layer 第 5 例 (backend layer 完全普及)、 systematic pattern 55 度目。

```ts
export type CliState = 'spawning' | 'running' | 'signaled' | 'exited' | 'cleaned';
```

#### <code v-pre>CliSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cli-test/src/semantics/cli-lifecycle-orchestrator.ts#L118) <code v-pre>packages/cli-test/src/semantics/cli-lifecycle-orchestrator.ts</code>

```ts
export interface CliSummary {
    currentState: CliState;
    totalEvents: number;
    validEvents: number;
    invalidEvents: number;
    terminalEvents: number;
    spawns: number;
    stdoutChunks: number;
    stderrChunks: number;
    signals: number;
    cleanups: number;
    zombies: number;
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
<!-- kiwa-public-api:end -->
