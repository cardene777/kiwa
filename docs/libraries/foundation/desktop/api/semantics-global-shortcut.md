---
title: "@kiwa-lab/desktop semantics-global-shortcut の API 契約"
---

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>semantics-global-shortcut</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>clearAllGlobalShortcuts</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L106) <code v-pre>packages/desktop/src/semantics/global-shortcut.ts</code>

```ts
export declare function clearAllGlobalShortcuts(session: GlobalShortcutSession): AxisStep<GlobalShortcutState>;
```

#### <code v-pre>createGlobalShortcutSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L42) <code v-pre>packages/desktop/src/semantics/global-shortcut.ts</code>

```ts
export declare function createGlobalShortcutSession(input: {
    target: DesktopTarget;
    namespace: string;
}): GlobalShortcutSession;
```

#### <code v-pre>registerGlobalShortcut</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L57) <code v-pre>packages/desktop/src/semantics/global-shortcut.ts</code>

```ts
export declare function registerGlobalShortcut(session: GlobalShortcutSession, accelerator: string): AxisStep<GlobalShortcutState>;
```

#### <code v-pre>triggerGlobalShortcut</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L75) <code v-pre>packages/desktop/src/semantics/global-shortcut.ts</code>

```ts
export declare function triggerGlobalShortcut(session: GlobalShortcutSession, accelerator: string): AxisStep<GlobalShortcutState>;
```

#### <code v-pre>unregisterGlobalShortcut</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L90) <code v-pre>packages/desktop/src/semantics/global-shortcut.ts</code>

```ts
export declare function unregisterGlobalShortcut(session: GlobalShortcutSession, accelerator: string): AxisStep<GlobalShortcutState>;
```

### 型

#### <code v-pre>GlobalShortcutSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L14) <code v-pre>packages/desktop/src/semantics/global-shortcut.ts</code>

```ts
export interface GlobalShortcutSession {
    target: DesktopTarget;
    namespace: string;
    state: GlobalShortcutState;
    registered: string[];
    triggerCounts: Record<string, number>;
    history: AxisStep<GlobalShortcutState>[];
}
```

#### <code v-pre>GlobalShortcutState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/global-shortcut.ts#L7) <code v-pre>packages/desktop/src/semantics/global-shortcut.ts</code>

Global-shortcut axis (v0.3) — register + trigger + unregister + all-clear の 4 step 遷移。 macOS Carbon RegisterEventHotKey + Windows User32.RegisterHotKey + Linux xdg-portal GlobalShortcuts を uniform 扱い。

```ts
export type GlobalShortcutState = 'idle' | 'registered' | 'triggered' | 'unregistered' | 'all-cleared';
```
