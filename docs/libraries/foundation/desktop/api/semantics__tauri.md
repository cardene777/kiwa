---
title: "@kiwa-lab/desktop semantics__tauri の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>semantics&#95;&#95;tauri</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>closeTauriWindow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L90) <code v-pre>packages/desktop/src/semantics/tauri.ts</code>

```ts
export declare function closeTauriWindow(session: TauriSession, windowLabel: string): AxisStep<TauriState>;
```

#### <code v-pre>emitTauriEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L76) <code v-pre>packages/desktop/src/semantics/tauri.ts</code>

```ts
export declare function emitTauriEvent(session: TauriSession, input: {
    eventName: string;
    payload: string;
}): AxisStep<TauriState>;
```

#### <code v-pre>invokeTauriCommand</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L60) <code v-pre>packages/desktop/src/semantics/tauri.ts</code>

```ts
export declare function invokeTauriCommand(session: TauriSession, input: {
    commandName: string;
    payload: string;
}): AxisStep<TauriState>;
```

#### <code v-pre>registerTauriCommand</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L50) <code v-pre>packages/desktop/src/semantics/tauri.ts</code>

```ts
export declare function registerTauriCommand(session: TauriSession, commandName: string): AxisStep<TauriState>;
```

#### <code v-pre>startTauriApp</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L37) <code v-pre>packages/desktop/src/semantics/tauri.ts</code>

```ts
export declare function startTauriApp(input: {
    target: DesktopTarget;
    appName: string;
}): TauriSession;
```

### 型

#### <code v-pre>TauriSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L8) <code v-pre>packages/desktop/src/semantics/tauri.ts</code>

```ts
export interface TauriSession {
    target: DesktopTarget;
    appName: string;
    state: TauriState;
    registeredCommands: string[];
    invocations: number;
    emittedEvents: number;
    history: AxisStep<TauriState>[];
}
```

#### <code v-pre>TauriState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/tauri.ts#L6) <code v-pre>packages/desktop/src/semantics/tauri.ts</code>

Tauri axis — invoke_handler register + invoke command + emit event + window close。

```ts
export type TauriState = 'idle' | 'command-registered' | 'command-invoked' | 'event-emitted' | 'window-closed';
```
