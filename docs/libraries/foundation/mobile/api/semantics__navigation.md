---
title: "@kiwa-lab/mobile semantics__navigation の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/mobile</code> <code v-pre>semantics&#95;&#95;navigation</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>initNavigation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L38) <code v-pre>packages/mobile/src/semantics/navigation.ts</code>

```ts
export declare function initNavigation(input: {
    target: MobileTarget;
    navigatorId: string;
}): NavigationSession;
```

#### <code v-pre>navigateDeepLink</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L72) <code v-pre>packages/mobile/src/semantics/navigation.ts</code>

```ts
export declare function navigateDeepLink(session: NavigationSession, url: string): AxisStep<NavigationState>;
```

#### <code v-pre>openNavigationModal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L65) <code v-pre>packages/mobile/src/semantics/navigation.ts</code>

```ts
export declare function openNavigationModal(session: NavigationSession, modalId: string): AxisStep<NavigationState>;
```

#### <code v-pre>pushNavigationStack</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L51) <code v-pre>packages/mobile/src/semantics/navigation.ts</code>

```ts
export declare function pushNavigationStack(session: NavigationSession, screenName: string): AxisStep<NavigationState>;
```

#### <code v-pre>switchNavigationTab</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L58) <code v-pre>packages/mobile/src/semantics/navigation.ts</code>

```ts
export declare function switchNavigationTab(session: NavigationSession, tabName: string): AxisStep<NavigationState>;
```

### 型

#### <code v-pre>NavigationSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L9) <code v-pre>packages/mobile/src/semantics/navigation.ts</code>

```ts
export interface NavigationSession {
    target: MobileTarget;
    navigatorId: string;
    state: NavigationState;
    stackHistory: string[];
    activeTab: string | null;
    activeModals: string[];
    history: AxisStep<NavigationState>[];
}
```

#### <code v-pre>NavigationState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/navigation.ts#L7) <code v-pre>packages/mobile/src/semantics/navigation.ts</code>

v1.51 navigation axis — React Navigation / Expo Router を統一。 stack push + tab switch + modal open + deep link navigate。

```ts
export type NavigationState = 'idle' | 'stack-pushed' | 'tab-switched' | 'modal-opened' | 'deep-linked';
```
