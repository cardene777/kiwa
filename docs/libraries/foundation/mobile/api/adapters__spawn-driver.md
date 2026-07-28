---
title: "@kiwa-lab/mobile adapters__spawn-driver の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/mobile</code> <code v-pre>adapters&#95;&#95;spawn-driver</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>buildSpawnInvocation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L118) <code v-pre>packages/mobile/src/adapters/spawn-driver.ts</code>

```ts
export declare function buildSpawnInvocation(input: {
    command: MobileCliCommand;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
}): SpawnInvocation;
```

#### <code v-pre>cliForAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L114) <code v-pre>packages/mobile/src/adapters/spawn-driver.ts</code>

```ts
export declare function cliForAxis(axis: MobileAxis): MobileCliCommand | null;
```

#### <code v-pre>invokeMobileCli</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L59) <code v-pre>packages/mobile/src/adapters/spawn-driver.ts</code>

v0.6 実 spawn 実行 = env-gate 通過確認 + args 上限 32 + 実 child_process.spawn 実行。 `KIWA_MOBILE_MODE=real` + 対応 axis env 未設定なら throw で fail-closed。 `KIWA_MOBILE_SPAWN=dry-run` の時は v0.5 stub 相当の shape 契約を返す (実 CLI 未 install 環境向け backward compat 経路)。

```ts
export declare function invokeMobileCli(inv: SpawnInvocation): Promise<SpawnResult>;
```

#### <code v-pre>invokeMobileCliWith</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L67) <code v-pre>packages/mobile/src/adapters/spawn-driver.ts</code>

DI 経路 = spawnFn を注入可能、 test で dummy spawn を差し込んで 決定的挙動を検証できる。 default は nodeSpawn。

```ts
export declare function invokeMobileCliWith(inv: SpawnInvocation, spawnFn: SpawnFn): Promise<SpawnResult>;
```

### 型

#### <code v-pre>MobileCliCommand</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L14) <code v-pre>packages/mobile/src/adapters/spawn-driver.ts</code>

```ts
export type MobileCliCommand = 'expo build' | 'metro bundle' | 'codegen run' | 'react-native start' | 'pod install' | 'gradle build';
```

#### <code v-pre>SpawnInvocation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L22) <code v-pre>packages/mobile/src/adapters/spawn-driver.ts</code>

```ts
export interface SpawnInvocation {
    command: MobileCliCommand;
    args: string[];
    env: Record<string, string>;
    cwd?: string;
}
```

#### <code v-pre>SpawnResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/spawn-driver.ts#L29) <code v-pre>packages/mobile/src/adapters/spawn-driver.ts</code>

```ts
export interface SpawnResult {
    command: MobileCliCommand;
    args: string[];
    invoked: boolean;
    exitCode: number | null;
    stdout: string;
    stderr: string;
    durationMs: number;
}
```
