---
title: "@kiwa-lab/desktop semantics__dark-mode の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>semantics&#95;&#95;dark-mode</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>notifyThemeChange</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L64) <code v-pre>packages/desktop/src/semantics/dark-mode.ts</code>

```ts
export declare function notifyThemeChange(session: DarkModeSession, newTheme: ThemeMode): AxisStep<DarkModeState>;
```

#### <code v-pre>recordUserPreference</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L83) <code v-pre>packages/desktop/src/semantics/dark-mode.ts</code>

```ts
export declare function recordUserPreference(session: DarkModeSession, preference: ThemeMode): AxisStep<DarkModeState>;
```

#### <code v-pre>subscribeDarkMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L45) <code v-pre>packages/desktop/src/semantics/dark-mode.ts</code>

```ts
export declare function subscribeDarkMode(input: {
    target: DesktopTarget;
    observerId: string;
    initialTheme: ThemeMode;
}): DarkModeSession;
```

#### <code v-pre>unsubscribeDarkMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L98) <code v-pre>packages/desktop/src/semantics/dark-mode.ts</code>

```ts
export declare function unsubscribeDarkMode(session: DarkModeSession): AxisStep<DarkModeState>;
```

### 型

#### <code v-pre>DarkModeSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L16) <code v-pre>packages/desktop/src/semantics/dark-mode.ts</code>

```ts
export interface DarkModeSession {
    target: DesktopTarget;
    observerId: string;
    state: DarkModeState;
    currentTheme: ThemeMode;
    userPreference: ThemeMode;
    changeCount: number;
    history: AxisStep<DarkModeState>[];
}
```

#### <code v-pre>DarkModeState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L7) <code v-pre>packages/desktop/src/semantics/dark-mode.ts</code>

Dark-mode axis (v0.3) — subscribe + theme-change + user-preferred + unsubscribe の 4 step 遷移。 macOS AppleInterfaceTheme + Windows ImmersiveColorSet + Linux xdg-portal Settings color-scheme を uniform 扱い。

```ts
export type DarkModeState = 'idle' | 'subscribed' | 'theme-changed' | 'user-preferred' | 'unsubscribed';
```

#### <code v-pre>ThemeMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/dark-mode.ts#L14) <code v-pre>packages/desktop/src/semantics/dark-mode.ts</code>

```ts
export type ThemeMode = 'light' | 'dark' | 'no-preference';
```
