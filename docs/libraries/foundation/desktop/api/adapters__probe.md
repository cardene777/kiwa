---
title: "@kiwa-lab/desktop adapters__probe の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>adapters&#95;&#95;probe</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/probe.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>computeSkipMatrix</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/probe.ts#L169) <code v-pre>packages/desktop/src/adapters/probe.ts</code>

全 12 axis × 3 target の skip decision matrix を計算。 v0.8 fidelity harness で skip した pair を追跡するのに使用。

```ts
export declare function computeSkipMatrix(): {
    axis: DesktopAxis;
    target: DesktopTarget;
    skip: boolean;
    reason: string | null;
}[];
```

#### <code v-pre>platformGate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/probe.ts#L44) <code v-pre>packages/desktop/src/adapters/probe.ts</code>

DesktopTarget と NodePlatform の互換性 gate。 macOS target = darwin のみ、 windows target = win32 のみ、 linux target = linux のみ。

```ts
export declare function platformGate(target: DesktopTarget): PlatformGate;
```

#### <code v-pre>probeCliAvailable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/probe.ts#L65) <code v-pre>packages/desktop/src/adapters/probe.ts</code>

CLI availability probe = which (unix) / where (windows) で CLI 存在確認。 DI 経路 = spawnFn 注入で test 環境で decode 可能。

```ts
export declare function probeCliAvailable(input: ProbeInput): Promise<ProbeResult>;
```

#### <code v-pre>shouldSkipAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/probe.ts#L121) <code v-pre>packages/desktop/src/adapters/probe.ts</code>

axis + target の組合せで skip 判定。 platform-specific CLI (osascript = darwin only / defaults = darwin only / reg = win32 only) は 該当 platform 以外の target で常に skip。

```ts
export declare function shouldSkipAxis(axis: DesktopAxis, target: DesktopTarget): {
    skip: boolean;
    reason: string | null;
};
```

### 型

#### <code v-pre>NodePlatform</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/probe.ts#L18) <code v-pre>packages/desktop/src/adapters/probe.ts</code>

```ts
export type NodePlatform = 'darwin' | 'linux' | 'win32' | 'other';
```

#### <code v-pre>PlatformGate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/probe.ts#L34) <code v-pre>packages/desktop/src/adapters/probe.ts</code>

```ts
export interface PlatformGate {
    target: DesktopTarget;
    platform: NodePlatform;
    compatible: boolean;
}
```

#### <code v-pre>ProbeInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/probe.ts#L20) <code v-pre>packages/desktop/src/adapters/probe.ts</code>

```ts
export interface ProbeInput {
    command: DesktopCliCommand;
    platform?: NodePlatform;
    spawnFn?: SpawnFn;
}
```

#### <code v-pre>ProbeResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/probe.ts#L26) <code v-pre>packages/desktop/src/adapters/probe.ts</code>

```ts
export interface ProbeResult {
    command: DesktopCliCommand;
    platform: NodePlatform;
    available: boolean;
    probePath: string | null;
    durationMs: number;
}
```
