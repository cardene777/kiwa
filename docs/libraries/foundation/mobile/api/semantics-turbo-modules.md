---
title: "@kiwa-lab/mobile semantics-turbo-modules の API 契約"
---

# <code v-pre>@kiwa-lab/mobile</code> <code v-pre>semantics-turbo-modules</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>bindJsiRuntime</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L66) <code v-pre>packages/mobile/src/semantics/turbo-modules.ts</code>

```ts
export declare function bindJsiRuntime(session: TurboModulesSession): AxisStep<TurboModulesState>;
```

#### <code v-pre>initTurboModules</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L37) <code v-pre>packages/mobile/src/semantics/turbo-modules.ts</code>

```ts
export declare function initTurboModules(input: {
    target: MobileTarget;
    moduleName: string;
}): TurboModulesSession;
```

#### <code v-pre>invokeTurboMethod</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L75) <code v-pre>packages/mobile/src/semantics/turbo-modules.ts</code>

```ts
export declare function invokeTurboMethod(session: TurboModulesSession, methodName: string): AxisStep<TurboModulesState>;
```

#### <code v-pre>registerTurboSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L53) <code v-pre>packages/mobile/src/semantics/turbo-modules.ts</code>

```ts
export declare function registerTurboSpec(session: TurboModulesSession, methods: string[]): AxisStep<TurboModulesState>;
```

#### <code v-pre>unregisterTurboModule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L93) <code v-pre>packages/mobile/src/semantics/turbo-modules.ts</code>

```ts
export declare function unregisterTurboModule(session: TurboModulesSession): AxisStep<TurboModulesState>;
```

### 型

#### <code v-pre>TurboModulesSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L8) <code v-pre>packages/mobile/src/semantics/turbo-modules.ts</code>

```ts
export interface TurboModulesSession {
    target: MobileTarget;
    moduleName: string;
    state: TurboModulesState;
    registeredMethods: string[];
    methodInvocations: number;
    jsiBound: boolean;
    history: AxisStep<TurboModulesState>[];
}
```

#### <code v-pre>TurboModulesState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/turbo-modules.ts#L6) <code v-pre>packages/mobile/src/semantics/turbo-modules.ts</code>

v1.52 turbo-modules axis — React Native 0.76+ TurboModules (typed native module + JSI + spec generation)。

```ts
export type TurboModulesState = 'idle' | 'spec-registered' | 'jsi-bound' | 'method-invoked' | 'unregistered';
```
