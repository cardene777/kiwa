---
title: "@kiwa-lab/mobile semantics__expo の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/mobile</code> <code v-pre>semantics&#95;&#95;expo</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>completeExpoBuild</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L95) <code v-pre>packages/mobile/src/semantics/expo.ts</code>

```ts
export declare function completeExpoBuild(session: ExpoSession): AxisStep<ExpoState>;
```

#### <code v-pre>loadExpoBuildConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L38) <code v-pre>packages/mobile/src/semantics/expo.ts</code>

```ts
export declare function loadExpoBuildConfig(input: {
    target: MobileTarget;
    appSlug: string;
    configHash: string;
}): ExpoSession;
```

#### <code v-pre>receivePushNotification</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L79) <code v-pre>packages/mobile/src/semantics/expo.ts</code>

```ts
export declare function receivePushNotification(session: ExpoSession, input: {
    notificationId: string;
    category: string;
}): AxisStep<ExpoState>;
```

#### <code v-pre>resolveDeepLink</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L62) <code v-pre>packages/mobile/src/semantics/expo.ts</code>

```ts
export declare function resolveDeepLink(session: ExpoSession, input: {
    scheme: string;
    path: string;
}): AxisStep<ExpoState>;
```

### 型

#### <code v-pre>ExpoSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L9) <code v-pre>packages/mobile/src/semantics/expo.ts</code>

```ts
export interface ExpoSession {
    target: MobileTarget;
    appSlug: string;
    state: ExpoState;
    resolvedLinks: string[];
    pushNotifications: string[];
    configHash: string | null;
    history: AxisStep<ExpoState>[];
}
```

#### <code v-pre>ExpoState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/expo.ts#L7) <code v-pre>packages/mobile/src/semantics/expo.ts</code>

Expo axis — build config load + deep link resolve + push notification + build complete の 4 step deterministic state machine。

```ts
export type ExpoState = 'idle' | 'config-loaded' | 'link-resolved' | 'push-received' | 'build-completed';
```
