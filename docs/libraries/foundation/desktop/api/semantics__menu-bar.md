---
title: "@kiwa-lab/desktop semantics__menu-bar の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>semantics&#95;&#95;menu-bar</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>appendMenuBarItem</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L59) <code v-pre>packages/desktop/src/semantics/menu-bar.ts</code>

```ts
export declare function appendMenuBarItem(session: MenuBarSession, item: MenuBarItem): AxisStep<MenuBarState>;
```

#### <code v-pre>buildMenuBar</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L44) <code v-pre>packages/desktop/src/semantics/menu-bar.ts</code>

```ts
export declare function buildMenuBar(input: {
    target: DesktopTarget;
    menuId: string;
}): MenuBarSession;
```

#### <code v-pre>clickMenuBarItem</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L79) <code v-pre>packages/desktop/src/semantics/menu-bar.ts</code>

```ts
export declare function clickMenuBarItem(session: MenuBarSession, itemId: string): AxisStep<MenuBarState>;
```

#### <code v-pre>destroyMenuBar</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L95) <code v-pre>packages/desktop/src/semantics/menu-bar.ts</code>

```ts
export declare function destroyMenuBar(session: MenuBarSession): AxisStep<MenuBarState>;
```

### 型

#### <code v-pre>MenuBarItem</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L9) <code v-pre>packages/desktop/src/semantics/menu-bar.ts</code>

```ts
export interface MenuBarItem {
    id: string;
    label: string;
    accelerator: string | null;
}
```

#### <code v-pre>MenuBarSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L15) <code v-pre>packages/desktop/src/semantics/menu-bar.ts</code>

```ts
export interface MenuBarSession {
    target: DesktopTarget;
    menuId: string;
    state: MenuBarState;
    items: MenuBarItem[];
    clickCount: number;
    destroyed: boolean;
    history: AxisStep<MenuBarState>[];
}
```

#### <code v-pre>MenuBarState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/menu-bar.ts#L7) <code v-pre>packages/desktop/src/semantics/menu-bar.ts</code>

Menu-bar axis (v0.2) — build + item + click + destroy の 4 step 遷移。 macOS NSMenu + Windows WM_MENU + Linux GTK menubar の 3 target を uniform 扱い。

```ts
export type MenuBarState = 'idle' | 'built' | 'item-appended' | 'item-clicked' | 'destroyed';
```
