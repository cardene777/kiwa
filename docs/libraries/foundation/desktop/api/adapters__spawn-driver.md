---
title: "@kiwa-lab/desktop adapters__spawn-driver の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>adapters&#95;&#95;spawn-driver</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-driver.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>buildSpawnInvocation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-driver.ts#L121) <code v-pre>packages/desktop/src/adapters/spawn-driver.ts</code>

```ts
export declare function buildSpawnInvocation(input: {
    command: DesktopCliCommand;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
}): SpawnInvocation;
```

#### <code v-pre>cliForAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-driver.ts#L117) <code v-pre>packages/desktop/src/adapters/spawn-driver.ts</code>

```ts
export declare function cliForAxis(axis: DesktopAxis): DesktopCliCommand | null;
```

#### <code v-pre>invokeDesktopCli</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-driver.ts#L62) <code v-pre>packages/desktop/src/adapters/spawn-driver.ts</code>

v0.6 実 spawn 実行 = env-gate 通過確認 + args 上限 32 + 実 child_process.spawn 実行。 `KIWA_DESKTOP_MODE=real` + 対応 axis env 未設定なら throw で fail-closed。 `KIWA_DESKTOP_SPAWN=dry-run` の時は v0.5 stub 相当の shape 契約を返す (実 CLI 未 install 環境向け backward compat 経路)。

```ts
export declare function invokeDesktopCli(inv: SpawnInvocation): Promise<SpawnResult>;
```

#### <code v-pre>invokeDesktopCliWith</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-driver.ts#L70) <code v-pre>packages/desktop/src/adapters/spawn-driver.ts</code>

DI 経路 = spawnFn を注入可能、 test で dummy spawn を差し込んで 決定的挙動を検証できる。 default は nodeSpawn。

```ts
export declare function invokeDesktopCliWith(inv: SpawnInvocation, spawnFn: SpawnFn): Promise<SpawnResult>;
```

### 型

#### <code v-pre>DesktopCliCommand</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-driver.ts#L14) <code v-pre>packages/desktop/src/adapters/spawn-driver.ts</code>

```ts
export type DesktopCliCommand = 'electron-builder' | 'electron-updater' | 'ffmpeg' | 'xclip' | 'osascript' | 'notify-send' | 'defaults' | 'reg';
```

#### <code v-pre>SpawnInvocation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-driver.ts#L24) <code v-pre>packages/desktop/src/adapters/spawn-driver.ts</code>

```ts
export interface SpawnInvocation {
    command: DesktopCliCommand;
    args: string[];
    env: Record<string, string>;
    cwd?: string;
}
```

#### <code v-pre>SpawnResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/spawn-driver.ts#L31) <code v-pre>packages/desktop/src/adapters/spawn-driver.ts</code>

```ts
export interface SpawnResult {
    command: DesktopCliCommand;
    args: string[];
    invoked: boolean;
    exitCode: number | null;
    stdout: string;
    stderr: string;
    durationMs: number;
}
```
