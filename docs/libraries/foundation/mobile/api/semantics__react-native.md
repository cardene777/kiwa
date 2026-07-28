---
title: "@kiwa-lab/mobile semantics__react-native の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/mobile</code> <code v-pre>semantics&#95;&#95;react-native</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>invokeNativeModule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L56) <code v-pre>packages/mobile/src/semantics/react-native.ts</code>

```ts
export declare function invokeNativeModule(session: ReactNativeSession, moduleName: string): AxisStep<ReactNativeState>;
```

#### <code v-pre>mountReactNativeComponent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L37) <code v-pre>packages/mobile/src/semantics/react-native.ts</code>

```ts
export declare function mountReactNativeComponent(input: {
    target: MobileTarget;
    componentId: string;
}): ReactNativeSession;
```

#### <code v-pre>recognizeGesture</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L71) <code v-pre>packages/mobile/src/semantics/react-native.ts</code>

```ts
export declare function recognizeGesture(session: ReactNativeSession, gesture: 'tap' | 'pan' | 'pinch' | 'rotation' | 'swipe'): AxisStep<ReactNativeState>;
```

#### <code v-pre>unmountReactNativeComponent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L86) <code v-pre>packages/mobile/src/semantics/react-native.ts</code>

```ts
export declare function unmountReactNativeComponent(session: ReactNativeSession): AxisStep<ReactNativeState>;
```

### 型

#### <code v-pre>ReactNativeSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L9) <code v-pre>packages/mobile/src/semantics/react-native.ts</code>

```ts
export interface ReactNativeSession {
    target: MobileTarget;
    componentId: string;
    state: ReactNativeState;
    nativeModuleInvocations: number;
    gesturesRecognized: string[];
    history: AxisStep<ReactNativeState>[];
}
```

#### <code v-pre>ReactNativeState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/react-native.ts#L7) <code v-pre>packages/mobile/src/semantics/react-native.ts</code>

React Native axis — component mount + native module invocation + gesture recognition + unmount の 4 step deterministic state machine。

```ts
export type ReactNativeState = 'idle' | 'mounted' | 'native-invoked' | 'gesture-recognized' | 'unmounted';
```
