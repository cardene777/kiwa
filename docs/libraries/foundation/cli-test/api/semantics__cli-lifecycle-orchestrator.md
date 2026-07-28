---
title: "@kiwa-lab/cli-test semantics__cli-lifecycle-orchestrator の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/cli-test</code> <code v-pre>semantics&#95;&#95;cli-lifecycle-orchestrator</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/cli-test/src/semantics/cli-lifecycle-orchestrator.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

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
