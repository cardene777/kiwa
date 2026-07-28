---
title: "@kiwa-lab/mobile semantics-reanimated の API 契約"
---

# <code v-pre>@kiwa-lab/mobile</code> <code v-pre>semantics-reanimated</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>completeReanimatedAnimation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L83) <code v-pre>packages/mobile/src/semantics/reanimated.ts</code>

```ts
export declare function completeReanimatedAnimation(session: ReanimatedSession): AxisStep<ReanimatedState>;
```

#### <code v-pre>executeWorklet</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L61) <code v-pre>packages/mobile/src/semantics/reanimated.ts</code>

```ts
export declare function executeWorklet(session: ReanimatedSession, workletName: string): AxisStep<ReanimatedState>;
```

#### <code v-pre>initReanimated</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L36) <code v-pre>packages/mobile/src/semantics/reanimated.ts</code>

```ts
export declare function initReanimated(input: {
    target: MobileTarget;
    animationId: string;
}): ReanimatedSession;
```

#### <code v-pre>startReanimatedAnimation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L71) <code v-pre>packages/mobile/src/semantics/reanimated.ts</code>

```ts
export declare function startReanimatedAnimation(session: ReanimatedSession, input: {
    durationMs: number;
    easing: 'linear' | 'ease' | 'spring';
}): AxisStep<ReanimatedState>;
```

#### <code v-pre>updateSharedValue</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L48) <code v-pre>packages/mobile/src/semantics/reanimated.ts</code>

```ts
export declare function updateSharedValue(session: ReanimatedSession, input: {
    name: string;
    value: number;
}): AxisStep<ReanimatedState>;
```

### 型

#### <code v-pre>ReanimatedSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L8) <code v-pre>packages/mobile/src/semantics/reanimated.ts</code>

```ts
export interface ReanimatedSession {
    target: MobileTarget;
    animationId: string;
    state: ReanimatedState;
    sharedValueUpdates: number;
    workletExecutions: number;
    history: AxisStep<ReanimatedState>[];
}
```

#### <code v-pre>ReanimatedState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/reanimated.ts#L6) <code v-pre>packages/mobile/src/semantics/reanimated.ts</code>

v1.51 reanimated axis — Reanimated 3 shared value + worklet + animation。

```ts
export type ReanimatedState = 'idle' | 'value-updated' | 'worklet-run' | 'animating' | 'completed';
```
