---
title: "@kiwa-lab/desktop adapters__native-invoke の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>adapters&#95;&#95;native-invoke</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/native-invoke.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>probeAndInvoke</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/native-invoke.ts#L46) <code v-pre>packages/desktop/src/adapters/native-invoke.ts</code>

probeAndInvoke = probe + invoke 統合経路。 1. shouldSkipAxis(axis, target) = skip 判定 → 'axis-skipped' 2. cliForAxis(axis) = null (semantics-only axis) → 'no-cli-mapping' 3. probeCliAvailable(cmd) = 実 CLI 存在確認 → 未 install 時 'cli-unavailable' 4. 実 CLI 存在確認 OK → invokeDesktopCliWith で 実 spawn 呼出 → 'invoked' shape 契約 preserving = SpawnResult 構造保持、 skip 時は spawnResult=null で明示。

```ts
export declare function probeAndInvoke(input: NativeInvokeInput): Promise<NativeInvokeResult>;
```

#### <code v-pre>probeAndInvokeAll</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/native-invoke.ts#L118) <code v-pre>packages/desktop/src/adapters/native-invoke.ts</code>

```ts
export declare function probeAndInvokeAll(input?: {
    axes?: DesktopAxis[];
    targets?: DesktopTarget[];
    args?: string[];
    env?: Record<string, string>;
    spawnFn?: SpawnFn;
}): Promise<NativeInvokeMatrixSummary>;
```

### 型

#### <code v-pre>InvokeStatus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/native-invoke.ts#L18) <code v-pre>packages/desktop/src/adapters/native-invoke.ts</code>

```ts
export type InvokeStatus = 'invoked' | 'cli-unavailable' | 'axis-skipped' | 'no-cli-mapping';
```

#### <code v-pre>NativeInvokeInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/native-invoke.ts#L28) <code v-pre>packages/desktop/src/adapters/native-invoke.ts</code>

```ts
export interface NativeInvokeInput {
    axis: DesktopAxis;
    target: DesktopTarget;
    args?: string[];
    env?: Record<string, string>;
    spawnFn?: SpawnFn;
}
```

#### <code v-pre>NativeInvokeMatrixSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/native-invoke.ts#L110) <code v-pre>packages/desktop/src/adapters/native-invoke.ts</code>

probeAndInvokeAll = 12 axis × 3 target の probe + invoke matrix 集計。 status 別に集計、 dogfood workflow で使用。

```ts
export interface NativeInvokeMatrixSummary {
    total: number;
    invoked: NativeInvokeResult[];
    cliUnavailable: NativeInvokeResult[];
    axisSkipped: NativeInvokeResult[];
    noCliMapping: NativeInvokeResult[];
}
```

#### <code v-pre>NativeInvokeResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/native-invoke.ts#L20) <code v-pre>packages/desktop/src/adapters/native-invoke.ts</code>

```ts
export interface NativeInvokeResult {
    axis: DesktopAxis;
    target: DesktopTarget;
    status: InvokeStatus;
    reason: string | null;
    spawnResult: SpawnResult | null;
}
```
