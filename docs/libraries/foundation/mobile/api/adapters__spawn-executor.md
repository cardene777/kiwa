---
title: "@kiwa-lab/mobile adapters__spawn-executor の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/mobile</code> <code v-pre>adapters&#95;&#95;spawn-executor</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-executor.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>executeSpawn</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-executor.ts#L64) <code v-pre>packages/mobile/src/adapters/spawn-executor.ts</code>

```ts
export declare function executeSpawn(input: SpawnExecutorInput, spawnFn?: SpawnFn): Promise<SpawnExecutorResult>;
```

#### <code v-pre>sanitizeEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-executor.ts#L43) <code v-pre>packages/mobile/src/adapters/spawn-executor.ts</code>

```ts
export declare function sanitizeEnv(command: MobileCliCommand, env: Record<string, string>): Record<string, string>;
```

### 型

#### <code v-pre>SpawnExecutorInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-executor.ts#L20) <code v-pre>packages/mobile/src/adapters/spawn-executor.ts</code>

```ts
export interface SpawnExecutorInput {
    command: MobileCliCommand;
    args: string[];
    env: Record<string, string>;
    cwd?: string;
    timeoutMs?: number;
    maxBufferBytes?: number;
}
```

#### <code v-pre>SpawnExecutorResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-executor.ts#L11) <code v-pre>packages/mobile/src/adapters/spawn-executor.ts</code>

```ts
export interface SpawnExecutorResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    timedOut: boolean;
    durationMs: number;
}
```

#### <code v-pre>SpawnFn</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-executor.ts#L29) <code v-pre>packages/mobile/src/adapters/spawn-executor.ts</code>

```ts
export type SpawnFn = typeof nodeSpawn;
```
