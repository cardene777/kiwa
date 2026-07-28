---
title: "@kiwa-lab/mobile semantics__new-architecture の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/mobile</code> <code v-pre>semantics&#95;&#95;new-architecture</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>bridgeLegacyModule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L70) <code v-pre>packages/mobile/src/semantics/new-architecture.ts</code>

```ts
export declare function bridgeLegacyModule(session: NewArchitectureSession, moduleName: string): AxisStep<NewArchitectureState>;
```

#### <code v-pre>enableConcurrentReact</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L59) <code v-pre>packages/mobile/src/semantics/new-architecture.ts</code>

```ts
export declare function enableConcurrentReact(session: NewArchitectureSession): AxisStep<NewArchitectureState>;
```

#### <code v-pre>initNewArchitecture</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L36) <code v-pre>packages/mobile/src/semantics/new-architecture.ts</code>

```ts
export declare function initNewArchitecture(input: {
    target: MobileTarget;
    appName: string;
}): NewArchitectureSession;
```

#### <code v-pre>markNewArchReady</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L86) <code v-pre>packages/mobile/src/semantics/new-architecture.ts</code>

```ts
export declare function markNewArchReady(session: NewArchitectureSession): AxisStep<NewArchitectureState>;
```

#### <code v-pre>startNewArchInit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L51) <code v-pre>packages/mobile/src/semantics/new-architecture.ts</code>

```ts
export declare function startNewArchInit(session: NewArchitectureSession): AxisStep<NewArchitectureState>;
```

### 型

#### <code v-pre>NewArchitectureSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L8) <code v-pre>packages/mobile/src/semantics/new-architecture.ts</code>

```ts
export interface NewArchitectureSession {
    target: MobileTarget;
    appName: string;
    state: NewArchitectureState;
    concurrentEnabled: boolean;
    bridgedLegacyModules: string[];
    history: AxisStep<NewArchitectureState>[];
}
```

#### <code v-pre>NewArchitectureState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/new-architecture.ts#L6) <code v-pre>packages/mobile/src/semantics/new-architecture.ts</code>

v1.52 new-architecture axis — React Native 0.76+ New Architecture (async init + concurrent React + interop layer)。

```ts
export type NewArchitectureState = 'idle' | 'initializing' | 'concurrent-enabled' | 'interop-bridged' | 'ready';
```
