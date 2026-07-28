---
title: "@kiwa-lab/mobile adapters__types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/mobile</code> <code v-pre>adapters&#95;&#95;types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)



### 型

#### <code v-pre>AdapterInvocation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/types.ts#L21) <code v-pre>packages/mobile/src/adapters/types.ts</code>

```ts
export interface AdapterInvocation {
    scanId: string;
    target: MobileTarget;
    mode: AdapterMode;
    metadata?: Record<string, string | number | boolean>;
}
```

#### <code v-pre>AdapterMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/types.ts#L11) <code v-pre>packages/mobile/src/adapters/types.ts</code>

```ts
export type AdapterMode = 'mock' | 'real';
```

#### <code v-pre>AdapterResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/types.ts#L28) <code v-pre>packages/mobile/src/adapters/types.ts</code>

```ts
export interface AdapterResult {
    axis: MobileAxis;
    target: MobileTarget;
    mode: AdapterMode;
    completed: boolean;
    eventCount: number;
    durationMs: number;
    history: AxisStep<string>[];
    neutralEvents: NeutralEventName[];
}
```

#### <code v-pre>MobileAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/types.ts#L39) <code v-pre>packages/mobile/src/adapters/types.ts</code>

```ts
export interface MobileAdapter {
    axis: MobileAxis;
    scan(input: AdapterInvocation): Promise<AdapterResult>;
}
```
