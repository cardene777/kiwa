---
title: "@kiwa-lab/nextjs semantics-server-action-advanced の API 契約"
---

# <code v-pre>@kiwa-lab/nextjs</code> <code v-pre>semantics-server-action-advanced</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>redirectAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L85) <code v-pre>packages/nextjs/src/semantics/server-action-advanced.ts</code>

```ts
export declare function redirectAction(session: ServerActionAdvancedSession, url: string): AxisStep<ServerActionAdvancedState>;
```

#### <code v-pre>revalidateActionPath</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L55) <code v-pre>packages/nextjs/src/semantics/server-action-advanced.ts</code>

```ts
export declare function revalidateActionPath(session: ServerActionAdvancedSession, path: string): AxisStep<ServerActionAdvancedState>;
```

#### <code v-pre>revalidateActionTag</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L70) <code v-pre>packages/nextjs/src/semantics/server-action-advanced.ts</code>

```ts
export declare function revalidateActionTag(session: ServerActionAdvancedSession, tag: string): AxisStep<ServerActionAdvancedState>;
```

#### <code v-pre>startServerActionAdvanced</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L21) <code v-pre>packages/nextjs/src/semantics/server-action-advanced.ts</code>

```ts
export declare function startServerActionAdvanced(input: {
    target: NextTarget;
    actionId: string;
}): ServerActionAdvancedSession;
```

#### <code v-pre>submitFormAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L40) <code v-pre>packages/nextjs/src/semantics/server-action-advanced.ts</code>

```ts
export declare function submitFormAction(session: ServerActionAdvancedSession, form: Record<string, string>): AxisStep<ServerActionAdvancedState>;
```

### 型

#### <code v-pre>ServerActionAdvancedSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L10) <code v-pre>packages/nextjs/src/semantics/server-action-advanced.ts</code>

```ts
export interface ServerActionAdvancedSession {
    target: NextTarget;
    actionId: string;
    state: ServerActionAdvancedState;
    form: Record<string, string>;
    revalidatedPaths: string[];
    revalidatedTags: string[];
    redirectUrl: string | null;
    history: AxisStep<ServerActionAdvancedState>[];
}
```

#### <code v-pre>ServerActionAdvancedState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L3) <code v-pre>packages/nextjs/src/semantics/server-action-advanced.ts</code>

```ts
export type ServerActionAdvancedState = 'idle' | 'submitted' | 'path-revalidated' | 'tag-revalidated' | 'redirected';
```
