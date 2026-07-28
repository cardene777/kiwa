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

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/cli-test/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [expectations.ts](./api/expectations) | 3 | 0 |
| [index.ts](./api/index) | 1 | 0 |
| [semantics/cli-lifecycle-orchestrator.ts](./api/semantics-cli-lifecycle-orchestrator) | 2 | 4 |
| [setup-cli-env.ts](./api/setup-cli-env) | 1 | 0 |
| [types.ts](./api/types) | 0 | 4 |

<!-- kiwa-public-api:end -->
