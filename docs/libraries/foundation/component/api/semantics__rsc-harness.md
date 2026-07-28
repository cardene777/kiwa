---
title: "@kiwa-lab/component semantics__rsc-harness の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/component</code> <code v-pre>semantics&#95;&#95;rsc-harness</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>beginRscRender</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L34) <code v-pre>packages/component/src/semantics/rsc-harness.ts</code>

```ts
export declare function beginRscRender(session: RscHarnessSession): AxisStep<RscHarnessState>;
```

#### <code v-pre>completeRscRender</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L73) <code v-pre>packages/component/src/semantics/rsc-harness.ts</code>

```ts
export declare function completeRscRender(session: RscHarnessSession): AxisStep<RscHarnessState>;
```

#### <code v-pre>enterSuspenseBoundary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L42) <code v-pre>packages/component/src/semantics/rsc-harness.ts</code>

```ts
export declare function enterSuspenseBoundary(session: RscHarnessSession, fallback?: string): AxisStep<RscHarnessState>;
```

#### <code v-pre>failRscRender</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L84) <code v-pre>packages/component/src/semantics/rsc-harness.ts</code>

```ts
export declare function failRscRender(session: RscHarnessSession, error: Error | string): AxisStep<RscHarnessState>;
```

#### <code v-pre>startRscHarness</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L15) <code v-pre>packages/component/src/semantics/rsc-harness.ts</code>

```ts
export declare function startRscHarness(input: {
    target: ComponentTarget;
    componentId: string;
    suspenseFallback?: string;
}): RscHarnessSession;
```

#### <code v-pre>streamHtmlChunk</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L54) <code v-pre>packages/component/src/semantics/rsc-harness.ts</code>

```ts
export declare function streamHtmlChunk(session: RscHarnessSession, chunk: string): AxisStep<RscHarnessState>;
```

### 型

#### <code v-pre>RscHarnessSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L5) <code v-pre>packages/component/src/semantics/rsc-harness.ts</code>

```ts
export interface RscHarnessSession {
    target: ComponentTarget;
    componentId: string;
    state: RscHarnessState;
    chunks: string[];
    suspenseFallback: string | null;
    history: AxisStep<RscHarnessState>[];
    error: string | null;
}
```

#### <code v-pre>RscHarnessState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L3) <code v-pre>packages/component/src/semantics/rsc-harness.ts</code>

```ts
export type RscHarnessState = 'idle' | 'rendering' | 'suspended' | 'streaming' | 'completed' | 'errored';
```
