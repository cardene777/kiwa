---
title: "@kiwa-lab/nextjs semantics__interception-routes の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/nextjs</code> <code v-pre>semantics&#95;&#95;interception-routes</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>interceptCurrentSegment</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L32) <code v-pre>packages/nextjs/src/semantics/interception-routes.ts</code>

```ts
export declare function interceptCurrentSegment(session: InterceptionRoutesSession, from: string, to: string): AxisStep<InterceptionRoutesState>;
```

#### <code v-pre>interceptParentSegment</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L40) <code v-pre>packages/nextjs/src/semantics/interception-routes.ts</code>

```ts
export declare function interceptParentSegment(session: InterceptionRoutesSession, from: string, to: string): AxisStep<InterceptionRoutesState>;
```

#### <code v-pre>interceptRootCatchall</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L48) <code v-pre>packages/nextjs/src/semantics/interception-routes.ts</code>

```ts
export declare function interceptRootCatchall(session: InterceptionRoutesSession, from: string, to: string): AxisStep<InterceptionRoutesState>;
```

#### <code v-pre>openInterceptedModal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L56) <code v-pre>packages/nextjs/src/semantics/interception-routes.ts</code>

```ts
export declare function openInterceptedModal(session: InterceptionRoutesSession, modalRoute: string): AxisStep<InterceptionRoutesState>;
```

#### <code v-pre>startInterceptionRoutes</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L15) <code v-pre>packages/nextjs/src/semantics/interception-routes.ts</code>

```ts
export declare function startInterceptionRoutes(input: {
    target: NextTarget;
    routeId: string;
}): InterceptionRoutesSession;
```

### 型

#### <code v-pre>InterceptionMatcher</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L4) <code v-pre>packages/nextjs/src/semantics/interception-routes.ts</code>

```ts
export type InterceptionMatcher = '(.)' | '(..)' | '(...)';
```

#### <code v-pre>InterceptionRoutesSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L6) <code v-pre>packages/nextjs/src/semantics/interception-routes.ts</code>

```ts
export interface InterceptionRoutesSession {
    target: NextTarget;
    routeId: string;
    state: InterceptionRoutesState;
    matches: Array<{
        matcher: InterceptionMatcher;
        from: string;
        to: string;
    }>;
    modalRoute: string | null;
    history: AxisStep<InterceptionRoutesState>[];
}
```

#### <code v-pre>InterceptionRoutesState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L3) <code v-pre>packages/nextjs/src/semantics/interception-routes.ts</code>

```ts
export type InterceptionRoutesState = 'idle' | 'current' | 'parent' | 'root' | 'modal-open';
```
