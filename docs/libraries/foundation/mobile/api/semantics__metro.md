---
title: "@kiwa-lab/mobile semantics__metro の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/mobile</code> <code v-pre>semantics&#95;&#95;metro</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>applyMetroHmr</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L71) <code v-pre>packages/mobile/src/semantics/metro.ts</code>

```ts
export declare function applyMetroHmr(session: MetroSession, moduleId: string): AxisStep<MetroState>;
```

#### <code v-pre>completeMetroBundle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L86) <code v-pre>packages/mobile/src/semantics/metro.ts</code>

```ts
export declare function completeMetroBundle(session: MetroSession): AxisStep<MetroState>;
```

#### <code v-pre>resolveMetroModule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L56) <code v-pre>packages/mobile/src/semantics/metro.ts</code>

```ts
export declare function resolveMetroModule(session: MetroSession, modulePath: string): AxisStep<MetroState>;
```

#### <code v-pre>startMetroBundle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L37) <code v-pre>packages/mobile/src/semantics/metro.ts</code>

```ts
export declare function startMetroBundle(input: {
    target: MobileTarget;
    bundleId: string;
}): MetroSession;
```

### 型

#### <code v-pre>MetroSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L9) <code v-pre>packages/mobile/src/semantics/metro.ts</code>

```ts
export interface MetroSession {
    target: MobileTarget;
    bundleId: string;
    state: MetroState;
    resolvedModules: string[];
    hmrUpdateCount: number;
    history: AxisStep<MetroState>[];
}
```

#### <code v-pre>MetroState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/metro.ts#L7) <code v-pre>packages/mobile/src/semantics/metro.ts</code>

Metro axis — bundle start + module resolve + HMR + bundle complete の 4 step deterministic state machine。

```ts
export type MetroState = 'idle' | 'bundling' | 'resolved' | 'hmr-applied' | 'completed';
```
