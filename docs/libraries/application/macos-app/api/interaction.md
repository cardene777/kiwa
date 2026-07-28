---
title: "@kiwa-lab/macos-app interaction の API 契約"
---

# <code v-pre>@kiwa-lab/macos-app</code> <code v-pre>interaction</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/interaction.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>simulateUserInteraction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/interaction.ts#L27) <code v-pre>packages/macos-app/src/interaction.ts</code>

view tree を walk して target id を探索、 見つかったら enabled かつ mode-specific な dispatchable node であれば event を eventLog に記録する。 responder chain (AppKit) や SwiftUI の

```ts
export declare function simulateUserInteraction(env: MacAppEnv, event: InteractionEvent): InteractionResult;
```

### 型

#### <code v-pre>InteractionEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/interaction.ts#L5) <code v-pre>packages/macos-app/src/interaction.ts</code>

```ts
export interface InteractionEvent {
    type: InteractionType;
    target: string;
    key?: string;
    gesture?: 'swipe' | 'pinch' | 'rotate' | 'longPress';
    modifiers?: Array<'cmd' | 'ctrl' | 'opt' | 'shift'>;
}
```

#### <code v-pre>InteractionResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/interaction.ts#L13) <code v-pre>packages/macos-app/src/interaction.ts</code>

```ts
export interface InteractionResult {
    dispatched: boolean;
    targetFound: boolean;
    targetType?: string;
    handled: boolean;
    reason?: string;
}
```

#### <code v-pre>InteractionType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/interaction.ts#L3) <code v-pre>packages/macos-app/src/interaction.ts</code>

```ts
export type InteractionType = 'click' | 'keypress' | 'gesture' | 'focus';
```
