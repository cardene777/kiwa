# @kiwa-lab/nextjs リファレンス

## Server Action

`invokeServerAction` は action、`formData`、追加の `args`、初期 cookie、header を受け取ります。FormData は最初の引数として action に渡されます。`useFormState` のように前の state を受け取る action では、追加引数を `args` に指定します。

戻り値は `result`、`error`、`env` を持ちます。`env.cookies` と `env.headers` は invocation に渡した初期値を保持します。helper は action に env を渡さず、`next/headers` や `next/cache` の副作用を捕捉しません。redirect signal だけは `error` に入らず `env.redirect` へ正規化されます。cookie、header、revalidate を action の中で扱う場合は、アプリケーション側で injectable seam を作り、その seam を unit test で stub します。

## middleware

`invokeMiddleware` と `middlewareActions` は next、redirect、rewrite、JSON response の分岐を扱います。middleware が返す response header と URL の変換は、画面遷移とは別にこの結果で確認します。

## Server Component

`renderServerComponent` は単一 tree と not found、forbidden、redirect signal を対象にします。実 React renderer や Flight wire format は含みません。

## RSC stream

`setupNextRscEnv` は `dataSource` または component を受け取ります。`dataSource` がある場合はこちらが優先されます。`suspenseFallback` は最初の chunk、`streamingTimeout` は完了を待つ上限です。結果には `chunks`、`fallback`、`resolved`、`errorBoundary`、`timedOut` が含まれます。

## 制約

複数 Suspense boundary の並行 interleave、client hydration、ブラウザ上の UI は扱いません。redirect 以外の throw は Server Action では `error`、RSC では `errorBoundary` として assertion します。cookie、header、stream を test 間で共有しないでください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>slot $&#123;input.slot&#125;: no default.tsx fallback supplied</code> | [packages/nextjs/src/invoke-parallel-routes.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L101) |
| <code v-pre>expected $&#123;provider&#125; in $&#123;expected&#125; mode but resolved $&#123;resolved.mode&#125; ($&#123;resolved.reason&#125;)</code> | [packages/nextjs/src/real-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/real-driver.ts#L49) |
| <code v-pre>startConcurrentTransition: transitionId must not be empty</code> | [packages/nextjs/src/semantics/concurrent-transitions.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L50) |
| <code v-pre>markTransitionPending: session is $&#123;session.state&#125;</code> | [packages/nextjs/src/semantics/concurrent-transitions.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L69) |
| <code v-pre>interruptTransition: session is $&#123;session.state&#125;</code> | [packages/nextjs/src/semantics/concurrent-transitions.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L82) |
| <code v-pre>commitTransition: session is $&#123;session.state&#125;</code> | [packages/nextjs/src/semantics/concurrent-transitions.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L96) |
| <code v-pre>startInterceptionRoutes: routeId must not be empty</code> | [packages/nextjs/src/semantics/interception-routes.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L20) |
| <code v-pre>openInterceptedModal: modalRoute must not be empty</code> | [packages/nextjs/src/semantics/interception-routes.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L61) |
| <code v-pre>openInterceptedModal: an interception match is required first</code> | [packages/nextjs/src/semantics/interception-routes.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L64) |
| <code v-pre>intercept: from and to must start with /</code> | [packages/nextjs/src/semantics/interception-routes.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L83) |
| <code v-pre>startParallelRoutesAdvanced: layoutId must not be empty</code> | [packages/nextjs/src/semantics/parallel-routes-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L25) |
| <code v-pre>navigateSlot: from and to must start with /</code> | [packages/nextjs/src/semantics/parallel-routes-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L83) |
| <code v-pre>slot must not be empty</code> | [packages/nextjs/src/semantics/parallel-routes-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L92) |
| <code v-pre>startPartialPrerendering: routeId must not be empty</code> | [packages/nextjs/src/semantics/partial-prerendering.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L20) |
| <code v-pre>renderStaticShell: session is $&#123;session.state&#125;, not idle</code> | [packages/nextjs/src/semantics/partial-prerendering.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L38) |
| <code v-pre>renderStaticShell: html must not be empty</code> | [packages/nextjs/src/semantics/partial-prerendering.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L41) |
| <code v-pre>openDynamicHole: static shell must be rendered first</code> | [packages/nextjs/src/semantics/partial-prerendering.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L53) |
| <code v-pre>openDynamicHole: holeId must not be empty</code> | [packages/nextjs/src/semantics/partial-prerendering.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L56) |
| <code v-pre>flushStreamingBoundary: $&#123;input.holeId&#125; is not an open dynamic hole</code> | [packages/nextjs/src/semantics/partial-prerendering.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L72) |
| <code v-pre>flushStreamingBoundary: html must not be empty</code> | [packages/nextjs/src/semantics/partial-prerendering.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L75) |
| <code v-pre>completePartialPrerendering: static shell was not rendered</code> | [packages/nextjs/src/semantics/partial-prerendering.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L90) |
| <code v-pre>startServerActionAdvanced: actionId must not be empty</code> | [packages/nextjs/src/semantics/server-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L26) |
| <code v-pre>submitFormAction: session is $&#123;session.state&#125;, not idle</code> | [packages/nextjs/src/semantics/server-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L45) |
| <code v-pre>revalidateActionPath: form action was not submitted</code> | [packages/nextjs/src/semantics/server-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L60) |
| <code v-pre>revalidateActionPath: path must start with /</code> | [packages/nextjs/src/semantics/server-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L63) |
| <code v-pre>revalidateActionTag: form action was not submitted</code> | [packages/nextjs/src/semantics/server-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L75) |
| <code v-pre>revalidateActionTag: tag must not be empty</code> | [packages/nextjs/src/semantics/server-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L78) |
| <code v-pre>redirectAction: form action was not submitted</code> | [packages/nextjs/src/semantics/server-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L90) |
| <code v-pre>redirectAction: url must not be empty</code> | [packages/nextjs/src/semantics/server-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L93) |
| <code v-pre>startTurbopackHmr: sessionId must not be empty</code> | [packages/nextjs/src/semantics/turbopack-hmr.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L44) |
| <code v-pre>findHmrBoundary: session is $&#123;session.state&#125;</code> | [packages/nextjs/src/semantics/turbopack-hmr.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L73) |
| <code v-pre>applyHmrPatch: session is $&#123;session.state&#125;</code> | [packages/nextjs/src/semantics/turbopack-hmr.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L84) |
| <code v-pre>completeFastRefresh: session is $&#123;session.state&#125;</code> | [packages/nextjs/src/semantics/turbopack-hmr.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L96) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>applyHmrPatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L80) <code v-pre>packages/nextjs/src/semantics/turbopack-hmr.ts</code>

```ts
export declare function applyHmrPatch(session: TurbopackHmrSession): AxisStep<TurbopackHmrState>;
```

#### <code v-pre>assertMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/real-driver.ts#L42) <code v-pre>packages/nextjs/src/real-driver.ts</code>

```ts
export declare function assertMode(provider: NextTarget, expected: KiwaTestMode, env?: Record<string, string | undefined>): void;
```

#### <code v-pre>captureParallelError</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L62) <code v-pre>packages/nextjs/src/semantics/parallel-routes-advanced.ts</code>

```ts
export declare function captureParallelError(session: ParallelRoutesAdvancedSession, input: {
    slot: string;
    error: Error | string;
}): AxisStep<ParallelRoutesAdvancedState>;
```

#### <code v-pre>collectFidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/fidelity.ts#L56) <code v-pre>packages/nextjs/src/semantics/fidelity.ts</code>

```ts
export declare function collectFidelityCoverage(providers?: NextTarget[]): FidelityCoverage;
```

#### <code v-pre>commitTransition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L91) <code v-pre>packages/nextjs/src/semantics/concurrent-transitions.ts</code>

```ts
export declare function commitTransition(session: ConcurrentTransitionSession, committedValue: string): AxisStep<ConcurrentTransitionState>;
```

#### <code v-pre>completeFastRefresh</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L92) <code v-pre>packages/nextjs/src/semantics/turbopack-hmr.ts</code>

```ts
export declare function completeFastRefresh(session: TurbopackHmrSession): AxisStep<TurbopackHmrState>;
```

#### <code v-pre>completePartialPrerendering</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L86) <code v-pre>packages/nextjs/src/semantics/partial-prerendering.ts</code>

```ts
export declare function completePartialPrerendering(session: PartialPrerenderingSession): AxisStep<PartialPrerenderingState>;
```

#### <code v-pre>findAll</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L77) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

Recursively walk an RSC tree and collect every node that satisfies the predicate. Children are read from `props.children` and are normalized to a flat array regardless of how the component spelled them.

```ts
export declare function findAll(tree: RscNode, predicate: (node: RscElement) => boolean): RscElement[];
```

#### <code v-pre>findHmrBoundary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L68) <code v-pre>packages/nextjs/src/semantics/turbopack-hmr.ts</code>

```ts
export declare function findHmrBoundary(session: TurbopackHmrSession, boundaryModuleId: string): AxisStep<TurbopackHmrState>;
```

#### <code v-pre>flushStreamingBoundary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L67) <code v-pre>packages/nextjs/src/semantics/partial-prerendering.ts</code>

```ts
export declare function flushStreamingBoundary(session: PartialPrerenderingSession, input: {
    holeId: string;
    html: string;
}): AxisStep<PartialPrerenderingState>;
```

#### <code v-pre>FORBIDDEN&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L16) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export declare const FORBIDDEN_SYMBOL: unique symbol;
```

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

#### <code v-pre>interruptTransition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L78) <code v-pre>packages/nextjs/src/semantics/concurrent-transitions.ts</code>

```ts
export declare function interruptTransition(session: ConcurrentTransitionSession): AxisStep<ConcurrentTransitionState>;
```

#### <code v-pre>invokeMiddleware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L120) <code v-pre>packages/nextjs/src/invoke-middleware.ts</code>

Invoke a middleware function in isolation and capture its outgoing response shape + headers + cookies. Mirrors the kiwa style of invokeServerAction: no globals, no real Next.js runtime.

```ts
export declare function invokeMiddleware(opts: InvokeMiddlewareOptions): Promise<InvokeMiddlewareResult>;
```

#### <code v-pre>invokeParallelRoutes</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L120) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

Invoke an App Router parallel-routes layout in isolation. All slot components are rendered in parallel (Promise.all) so a slow slot cannot block fast siblings; per-slot errors are captured into `slotResults` without aborting the layout render.

```ts
export declare function invokeParallelRoutes<TSlots extends string, TLayoutProps = Record<string, unknown>, TNode = unknown>(opts: InvokeParallelRoutesOptions<TSlots, TLayoutProps, TNode>): Promise<InvokeParallelRoutesResult<TSlots, TNode>>;
```

#### <code v-pre>invokeServerAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L99) <code v-pre>packages/nextjs/src/invoke-server-action.ts</code>

Invoke a Next.js Server Action in isolation and capture its side-effects. The action is called as `await action(formData, ...args)`. The kiwa helper does NOT monkey-patch global `next/navigation` / `next/headers` / `next/cache` imports. Instead the action under test should accept its dependencies via an injectable seam (a parameter or a module-level setter) so tests stay deterministic. See `examples/nextjs-server-actions-poc/` for the pattern.

```ts
export declare function invokeServerAction<TResult>(opts: ServerActionInvocation<TResult>): Promise<ServerActionResult<TResult>>;
```

#### <code v-pre>markModuleUpdated</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L56) <code v-pre>packages/nextjs/src/semantics/turbopack-hmr.ts</code>

```ts
export declare function markModuleUpdated(session: TurbopackHmrSession, moduleId: string): AxisStep<TurbopackHmrState>;
```

#### <code v-pre>markTransitionPending</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L65) <code v-pre>packages/nextjs/src/semantics/concurrent-transitions.ts</code>

```ts
export declare function markTransitionPending(session: ConcurrentTransitionSession): AxisStep<ConcurrentTransitionState>;
```

#### <code v-pre>MIDDLEWARE&#95;ACTION&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L15) <code v-pre>packages/nextjs/src/invoke-middleware.ts</code>

```ts
export declare const MIDDLEWARE_ACTION_SYMBOL: unique symbol;
```

#### <code v-pre>middlewareActions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L100) <code v-pre>packages/nextjs/src/invoke-middleware.ts</code>

Helpers your `middleware.ts` returns instead of constructing NextResponse directly. Keep the production code shape close by re-exporting these from a shared module; the helper expects the returned value to be a MiddlewareAction shaped object.

```ts
export declare const middlewareActions: {
    next(): MiddlewareAction;
    redirect(url: string, status?: number): MiddlewareAction;
    rewrite(url: string): MiddlewareAction;
    json(body: unknown, status?: number): MiddlewareAction;
};
```

#### <code v-pre>navigateSlot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L77) <code v-pre>packages/nextjs/src/semantics/parallel-routes-advanced.ts</code>

```ts
export declare function navigateSlot(session: ParallelRoutesAdvancedSession, input: {
    slot: string;
    from: string;
    to: string;
}): AxisStep<ParallelRoutesAdvancedState>;
```

#### <code v-pre>NEXT&#95;AXIS&#95;TO&#95;EVENTS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/fidelity.ts#L16) <code v-pre>packages/nextjs/src/semantics/fidelity.ts</code>

```ts
export declare const NEXT_AXIS_TO_EVENTS: Record<NextAxis, NeutralEventName[]>;
```

#### <code v-pre>NOT&#95;FOUND&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L15) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export declare const NOT_FOUND_SYMBOL: unique symbol;
```

#### <code v-pre>openDynamicHole</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L48) <code v-pre>packages/nextjs/src/semantics/partial-prerendering.ts</code>

```ts
export declare function openDynamicHole(session: PartialPrerenderingSession, input: {
    holeId: string;
    fallback: string;
}): AxisStep<PartialPrerenderingState>;
```

#### <code v-pre>openInterceptedModal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L56) <code v-pre>packages/nextjs/src/semantics/interception-routes.ts</code>

```ts
export declare function openInterceptedModal(session: InterceptionRoutesSession, modalRoute: string): AxisStep<InterceptionRoutesState>;
```

#### <code v-pre>PARALLEL&#95;INTERCEPTION&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L20) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

```ts
export declare const PARALLEL_INTERCEPTION_SYMBOL: unique symbol;
```

#### <code v-pre>providerEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/types.ts#L136) <code v-pre>packages/nextjs/src/semantics/types.ts</code>

```ts
export declare function providerEventName(target: NextTarget, neutral: NeutralEventName): string;
```

#### <code v-pre>REDIRECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L14) <code v-pre>packages/nextjs/src/invoke-server-action.ts</code>

```ts
export declare const REDIRECT_SYMBOL: unique symbol;
```

#### <code v-pre>redirectAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L85) <code v-pre>packages/nextjs/src/semantics/server-action-advanced.ts</code>

```ts
export declare function redirectAction(session: ServerActionAdvancedSession, url: string): AxisStep<ServerActionAdvancedState>;
```

#### <code v-pre>renderDefaultSlot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L38) <code v-pre>packages/nextjs/src/semantics/parallel-routes-advanced.ts</code>

```ts
export declare function renderDefaultSlot(session: ParallelRoutesAdvancedSession, slot: string, html: string): AxisStep<ParallelRoutesAdvancedState>;
```

#### <code v-pre>renderLoadingState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L49) <code v-pre>packages/nextjs/src/semantics/parallel-routes-advanced.ts</code>

```ts
export declare function renderLoadingState(session: ParallelRoutesAdvancedSession, slot: string): AxisStep<ParallelRoutesAdvancedState>;
```

#### <code v-pre>renderServerComponent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L127) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

Invoke an async server component in isolation and capture its return tree. Throws of `notFound() / forbidden() / redirect()` from `next/navigation` should be replaced with the kiwa signals below (Pattern A from the server-action seam doc); the helper normalizes them into `result.signal` instead of leaving them as `result.error`.

```ts
export declare function renderServerComponent<TProps = Record<string, unknown>>(opts: RenderServerComponentOptions<TProps>): Promise<RenderServerComponentResult>;
```

#### <code v-pre>renderStaticShell</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L33) <code v-pre>packages/nextjs/src/semantics/partial-prerendering.ts</code>

```ts
export declare function renderStaticShell(session: PartialPrerenderingSession, html: string): AxisStep<PartialPrerenderingState>;
```

#### <code v-pre>resolveAllModes</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/real-driver.ts#L35) <code v-pre>packages/nextjs/src/real-driver.ts</code>

```ts
export declare function resolveAllModes(env?: Record<string, string | undefined>): ResolvedMode[];
```

#### <code v-pre>resolveMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/real-driver.ts#L17) <code v-pre>packages/nextjs/src/real-driver.ts</code>

```ts
export declare function resolveMode(provider: NextTarget, env?: Record<string, string | undefined>): ResolvedMode;
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

#### <code v-pre>RSC&#95;ERROR&#95;BOUNDARY&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/setup-next-rsc-env.ts#L26) <code v-pre>packages/nextjs/src/setup-next-rsc-env.ts</code>

```ts
export declare const RSC_ERROR_BOUNDARY_SYMBOL: unique symbol;
```

#### <code v-pre>RSC&#95;REDIRECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L17) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export declare const RSC_REDIRECT_SYMBOL: unique symbol;
```

#### <code v-pre>setupNextRscEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/setup-next-rsc-env.ts#L199) <code v-pre>packages/nextjs/src/setup-next-rsc-env.ts</code>

Drive an async RSC stream through a single Suspense boundary and capture every chunk + the fallback + the resolved subtree + any error-boundary trigger. The helper is deterministic — chunks arrive in the order the source yields them, and the timeout is wall-clock-bounded so tests cannot hang on a stuck stream. Typical usage: const env = await setupNextRscEnv({ dataSource: streamItems(), suspenseFallback: &lt;Skeleton /&gt;, streamingTimeout: 1000, }); expect(env.fallback).toEqual(&lt;Skeleton /&gt;); expect(env.chunks).toHaveLength(3); expect(env.resolved).toEqual(&lt;ItemList items={items} /&gt;); expect(env.errorBoundary).toBeNull(); expect(env.timedOut).toBe(false);

```ts
export declare function setupNextRscEnv(opts?: SetupNextRscEnvOptions): Promise<SetupNextRscEnvResult>;
```

#### <code v-pre>startConcurrentTransition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L45) <code v-pre>packages/nextjs/src/semantics/concurrent-transitions.ts</code>

```ts
export declare function startConcurrentTransition(input: {
    target: NextTarget;
    transitionId: string;
}): ConcurrentTransitionSession;
```

#### <code v-pre>startInterceptionRoutes</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L15) <code v-pre>packages/nextjs/src/semantics/interception-routes.ts</code>

```ts
export declare function startInterceptionRoutes(input: {
    target: NextTarget;
    routeId: string;
}): InterceptionRoutesSession;
```

#### <code v-pre>startParallelRoutesAdvanced</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L20) <code v-pre>packages/nextjs/src/semantics/parallel-routes-advanced.ts</code>

```ts
export declare function startParallelRoutesAdvanced(input: {
    target: NextTarget;
    layoutId: string;
}): ParallelRoutesAdvancedSession;
```

#### <code v-pre>startPartialPrerendering</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L15) <code v-pre>packages/nextjs/src/semantics/partial-prerendering.ts</code>

```ts
export declare function startPartialPrerendering(input: {
    target: NextTarget;
    routeId: string;
}): PartialPrerenderingSession;
```

#### <code v-pre>startServerActionAdvanced</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L21) <code v-pre>packages/nextjs/src/semantics/server-action-advanced.ts</code>

```ts
export declare function startServerActionAdvanced(input: {
    target: NextTarget;
    actionId: string;
}): ServerActionAdvancedSession;
```

#### <code v-pre>startTurbopackHmr</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L39) <code v-pre>packages/nextjs/src/semantics/turbopack-hmr.ts</code>

```ts
export declare function startTurbopackHmr(input: {
    target: NextTarget;
    sessionId: string;
}): TurbopackHmrSession;
```

#### <code v-pre>submitFormAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L40) <code v-pre>packages/nextjs/src/semantics/server-action-advanced.ts</code>

```ts
export declare function submitFormAction(session: ServerActionAdvancedSession, form: Record<string, string>): AxisStep<ServerActionAdvancedState>;
```

#### <code v-pre>textContent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L100) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

Concatenate every string/number leaf of an RSC tree, joined by a single space. Useful for `expect(textContent(tree)).toContain('hello')` style assertions where the exact element structure does not matter.

```ts
export declare function textContent(tree: RscNode): string;
```

### 型

#### <code v-pre>AxisStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/types.ts#L47) <code v-pre>packages/nextjs/src/semantics/types.ts</code>

```ts
export interface AxisStep<TState extends string> {
    neutralEvent: NeutralEventName;
    providerEvent: string;
    state: TState;
    amountCents: number;
    metadata: Record<string, string | number | boolean>;
}
```

#### <code v-pre>ConcurrentTransitionSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L15) <code v-pre>packages/nextjs/src/semantics/concurrent-transitions.ts</code>

```ts
export interface ConcurrentTransitionSession {
    target: NextTarget;
    transitionId: string;
    interruptions: number;
    pendingCount: number;
    state: ConcurrentTransitionState;
    committedValue: string | null;
    history: AxisStep<ConcurrentTransitionState>[];
}
```

#### <code v-pre>ConcurrentTransitionState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L8) <code v-pre>packages/nextjs/src/semantics/concurrent-transitions.ts</code>

v1.49 concurrent-transitions axis — React 18/19 concurrent features (startTransition + useTransition + useDeferredValue) を target-neutral に 扱う state machine。 interrupt-and-restart semantics も含む。

```ts
export type ConcurrentTransitionState = 'idle' | 'started' | 'pending' | 'interrupted' | 'committed';
```

#### <code v-pre>CookieJar</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L22) <code v-pre>packages/nextjs/src/invoke-server-action.ts</code>

```ts
export interface CookieJar {
    get(name: string): string | undefined;
    set(name: string, value: string, options?: Record<string, unknown>): void;
    delete(name: string): void;
    entries(): Array<[string, string]>;
}
```

#### <code v-pre>DefaultFallbackComponent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L34) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

```ts
export type DefaultFallbackComponent<TNode = unknown> = () => Promise<TNode> | TNode;
```

#### <code v-pre>FidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/fidelity.ts#L10) <code v-pre>packages/nextjs/src/semantics/fidelity.ts</code>

```ts
export interface FidelityCoverage {
    providers: NextTarget[];
    axes: NextAxis[];
    rows: FidelityRow[];
}
```

#### <code v-pre>FidelityRow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/fidelity.ts#L3) <code v-pre>packages/nextjs/src/semantics/fidelity.ts</code>

```ts
export interface FidelityRow {
    provider: NextTarget;
    axis: NextAxis;
    neutralEvents: NeutralEventName[];
    providerEvents: string[];
}
```

#### <code v-pre>ForbiddenSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L22) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export interface ForbiddenSignal {
    readonly [FORBIDDEN_SYMBOL]: true;
}
```

#### <code v-pre>InterceptionMatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L22) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

```ts
export interface InterceptionMatch<TSlot extends string> {
    readonly [PARALLEL_INTERCEPTION_SYMBOL]: true;
    readonly slot: TSlot;
    readonly variant: 'intercepted' | 'default';
    readonly url: string;
    readonly distance: 'sibling' | 'parent' | 'root';
}
```

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

#### <code v-pre>InvokeMiddlewareOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L55) <code v-pre>packages/nextjs/src/invoke-middleware.ts</code>

```ts
export interface InvokeMiddlewareOptions {
    readonly middleware: MiddlewareFunction;
    readonly url: string;
    readonly method?: string;
    readonly headers?: Record<string, string>;
    readonly cookies?: Record<string, string>;
    readonly geo?: {
        readonly country?: string;
        readonly region?: string;
        readonly city?: string;
    };
}
```

#### <code v-pre>InvokeMiddlewareResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L68) <code v-pre>packages/nextjs/src/invoke-middleware.ts</code>

```ts
export interface InvokeMiddlewareResult {
    readonly env: MiddlewareEnv;
    readonly error: unknown;
}
```

#### <code v-pre>InvokeParallelRoutesOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L57) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

```ts
export interface InvokeParallelRoutesOptions<TSlots extends string, TLayoutProps, TNode = unknown> {
    readonly layout: ParallelLayoutFunction<TSlots, TLayoutProps, TNode>;
    readonly children: SlotComponent<Record<string, unknown>, TNode>;
    readonly childrenProps?: Record<string, unknown>;
    readonly slots: ReadonlyArray<SlotInput<TSlots, TNode>>;
    readonly layoutProps?: TLayoutProps;
}
```

#### <code v-pre>InvokeParallelRoutesResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L73) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

```ts
export interface InvokeParallelRoutesResult<TSlots extends string, TNode = unknown> {
    readonly tree: TNode | null;
    readonly slotResults: ReadonlyArray<SlotRenderResult<TSlots, TNode>>;
    readonly childrenError: unknown;
    readonly layoutError: unknown;
}
```

#### <code v-pre>KiwaTestMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/real-driver.ts#L3) <code v-pre>packages/nextjs/src/real-driver.ts</code>

```ts
export type KiwaTestMode = 'mock' | 'real';
```

#### <code v-pre>MiddlewareAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L19) <code v-pre>packages/nextjs/src/invoke-middleware.ts</code>

```ts
export interface MiddlewareAction {
    readonly [MIDDLEWARE_ACTION_SYMBOL]: true;
    readonly kind: MiddlewareActionKind;
    readonly url?: string;
    readonly body?: unknown;
    readonly status?: number;
}
```

#### <code v-pre>MiddlewareActionKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L17) <code v-pre>packages/nextjs/src/invoke-middleware.ts</code>

```ts
export type MiddlewareActionKind = 'next' | 'redirect' | 'rewrite' | 'json' | 'noop';
```

#### <code v-pre>MiddlewareEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L44) <code v-pre>packages/nextjs/src/invoke-middleware.ts</code>

```ts
export interface MiddlewareEnv {
    readonly responseHeaders: Map<string, string>;
    readonly responseCookies: Map<string, string>;
    readonly action: MiddlewareAction;
}
```

#### <code v-pre>MiddlewareFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L50) <code v-pre>packages/nextjs/src/invoke-middleware.ts</code>

```ts
export type MiddlewareFunction = (req: MiddlewareRequest, env: {
    setHeader: (name: string, value: string) => void;
    setCookie: (name: string, value: string) => void;
}) => MiddlewareAction | Promise<MiddlewareAction>;
```

#### <code v-pre>MiddlewareRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L27) <code v-pre>packages/nextjs/src/invoke-middleware.ts</code>

```ts
export interface MiddlewareRequest {
    readonly url: string;
    readonly method: string;
    readonly headers: ReadonlyMap<string, string>;
    readonly cookies: ReadonlyMap<string, string>;
    readonly nextUrl: {
        readonly pathname: string;
        readonly search: string;
        readonly searchParams: URLSearchParams;
    };
    readonly geo: {
        readonly country?: string;
        readonly region?: string;
        readonly city?: string;
    };
}
```

#### <code v-pre>NeutralEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/types.ts#L19) <code v-pre>packages/nextjs/src/semantics/types.ts</code>

```ts
export type NeutralEventName = 'action.form_submitted' | 'action.revalidate_path' | 'action.revalidate_tag' | 'action.redirected' | 'ppr.static_shell_rendered' | 'ppr.dynamic_hole_opened' | 'ppr.streaming_boundary_flushed' | 'ppr.completed' | 'intercept.current_segment' | 'intercept.parent_segment' | 'intercept.root_catchall' | 'intercept.modal_opened' | 'parallel.default_rendered' | 'parallel.loading_rendered' | 'parallel.error_boundary_captured' | 'parallel.slot_navigated' | 'turbopack.module_updated' | 'turbopack.hmr_boundary_found' | 'turbopack.hmr_applied' | 'turbopack.fast_refresh_completed' | 'transition.started' | 'transition.pending' | 'transition.interrupted' | 'transition.committed';
```

#### <code v-pre>NextAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/types.ts#L10) <code v-pre>packages/nextjs/src/semantics/types.ts</code>

```ts
export type NextAxis = 'server-action-advanced' | 'partial-prerendering' | 'interception-routes' | 'parallel-routes-advanced' | 'turbopack-hmr' | 'concurrent-transitions';
```

#### <code v-pre>NextTarget</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/types.ts#L8) <code v-pre>packages/nextjs/src/semantics/types.ts</code>

Advanced Next.js semantics — target-neutral axis SSOT. The helpers model App Router, Pages Router, and Edge Runtime behavior as pure state machines. Tests can assert the neutral event while still seeing a target-specific dialect through providerEventName.

```ts
export type NextTarget = 'app-router' | 'pages-router' | 'edge-runtime';
```

#### <code v-pre>NotFoundSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L19) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export interface NotFoundSignal {
    readonly [NOT_FOUND_SYMBOL]: true;
}
```

#### <code v-pre>ParallelLayoutChildren</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L36) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

```ts
export interface ParallelLayoutChildren<TSlots extends string, TNode = unknown> {
    readonly children: TNode;
    readonly slots: Readonly<Record<TSlots, TNode>>;
}
```

#### <code v-pre>ParallelLayoutFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L41) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

```ts
export type ParallelLayoutFunction<TSlots extends string, TLayoutProps, TNode = unknown> = (props: TLayoutProps & ParallelLayoutChildren<TSlots, TNode>) => Promise<TNode> | TNode;
```

#### <code v-pre>ParallelRoutesAdvancedSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L10) <code v-pre>packages/nextjs/src/semantics/parallel-routes-advanced.ts</code>

```ts
export interface ParallelRoutesAdvancedSession {
    target: NextTarget;
    layoutId: string;
    state: ParallelRoutesAdvancedState;
    slots: Map<string, string>;
    loadingSlots: Set<string>;
    errors: Array<{
        slot: string;
        message: string;
    }>;
    history: AxisStep<ParallelRoutesAdvancedState>[];
}
```

#### <code v-pre>ParallelRoutesAdvancedState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L3) <code v-pre>packages/nextjs/src/semantics/parallel-routes-advanced.ts</code>

```ts
export type ParallelRoutesAdvancedState = 'idle' | 'default-rendered' | 'loading-rendered' | 'error-captured' | 'slot-navigated';
```

#### <code v-pre>PartialPrerenderingSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L5) <code v-pre>packages/nextjs/src/semantics/partial-prerendering.ts</code>

```ts
export interface PartialPrerenderingSession {
    target: NextTarget;
    routeId: string;
    state: PartialPrerenderingState;
    shellHtml: string | null;
    dynamicHoles: Map<string, string>;
    streamedBoundaries: string[];
    history: AxisStep<PartialPrerenderingState>[];
}
```

#### <code v-pre>PartialPrerenderingState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L3) <code v-pre>packages/nextjs/src/semantics/partial-prerendering.ts</code>

```ts
export type PartialPrerenderingState = 'idle' | 'static-shell' | 'dynamic-hole' | 'streaming' | 'completed';
```

#### <code v-pre>RedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L16) <code v-pre>packages/nextjs/src/invoke-server-action.ts</code>

```ts
export interface RedirectSignal {
    readonly [REDIRECT_SYMBOL]: true;
    readonly url: string;
    readonly type: 'replace' | 'push';
}
```

#### <code v-pre>RenderServerComponentOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L41) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export interface RenderServerComponentOptions<TProps> {
    readonly component: (props: TProps) => Promise<RscNode> | RscNode;
    readonly props?: TProps;
}
```

#### <code v-pre>RenderServerComponentResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L46) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export interface RenderServerComponentResult {
    readonly tree: RscNode;
    readonly signal: RscSignal | null;
    readonly error: unknown;
}
```

#### <code v-pre>ResolvedMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/real-driver.ts#L5) <code v-pre>packages/nextjs/src/real-driver.ts</code>

```ts
export interface ResolvedMode {
    mode: KiwaTestMode;
    provider: NextTarget;
    reason: 'default-mock' | 'kiwa-mode-real' | 'missing-key' | 'invalid-mode';
}
```

#### <code v-pre>RscElement</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L33) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export interface RscElement {
    readonly type: string | symbol | ((props: Record<string, unknown>) => unknown);
    readonly props: Record<string, unknown>;
    readonly key: string | null;
}
```

#### <code v-pre>RscErrorBoundarySignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/setup-next-rsc-env.ts#L28) <code v-pre>packages/nextjs/src/setup-next-rsc-env.ts</code>

```ts
export interface RscErrorBoundarySignal {
    readonly [RSC_ERROR_BOUNDARY_SYMBOL]: true;
    readonly error: unknown;
}
```

#### <code v-pre>RscNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L39) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export type RscNode = RscElement | string | number | boolean | null | undefined | RscNode[];
```

#### <code v-pre>RscRedirectSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L25) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export interface RscRedirectSignal {
    readonly [RSC_REDIRECT_SYMBOL]: true;
    readonly url: string;
    readonly type: 'replace' | 'push';
}
```

#### <code v-pre>RscSignal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L31) <code v-pre>packages/nextjs/src/render-server-component.ts</code>

```ts
export type RscSignal = NotFoundSignal | ForbiddenSignal | RscRedirectSignal;
```

#### <code v-pre>RscStreamSource</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/setup-next-rsc-env.ts#L46) <code v-pre>packages/nextjs/src/setup-next-rsc-env.ts</code>

An async source the helper consumes chunk-by-chunk. Each yielded value is one streaming frame; the helper appends it to `env.chunks` in arrival order and uses the last chunk as `env.resolved` once the source completes. Use a plain async generator for most cases: async function* source() { yield &lt;Spinner /&gt;; // initial chunk yield &lt;Skeleton rows={3} /&gt;; // partial data yield &lt;Items list={data} /&gt;; // final resolved chunk }

```ts
export type RscStreamSource = AsyncIterable<RscNode>;
```

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

#### <code v-pre>ServerActionEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L29) <code v-pre>packages/nextjs/src/invoke-server-action.ts</code>

```ts
export interface ServerActionEnv {
    readonly cookies: CookieJar;
    readonly headers: Map<string, string>;
    readonly revalidated: {
        paths: string[];
        tags: string[];
    };
    readonly redirect: RedirectSignal | null;
}
```

#### <code v-pre>ServerActionFunction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L40) <code v-pre>packages/nextjs/src/invoke-server-action.ts</code>

```ts
export type ServerActionFunction<TResult> = (...args: any[]) => Promise<TResult> | TResult;
```

#### <code v-pre>ServerActionInvocation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L42) <code v-pre>packages/nextjs/src/invoke-server-action.ts</code>

```ts
export interface ServerActionInvocation<TResult> {
    /** The `'use server'` async function under test. */
    readonly action: ServerActionFunction<TResult>;
    /** Optional FormData first argument (default empty). */
    readonly formData?: FormData;
    /** Extra positional args appended after FormData (e.g. previous state for useFormState). */
    readonly args?: unknown[];
    /** Initial cookie jar entries (name → value). */
    readonly cookies?: Record<string, string>;
    /** Initial request headers (case-insensitive). */
    readonly headers?: Record<string, string>;
}
```

#### <code v-pre>ServerActionResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L55) <code v-pre>packages/nextjs/src/invoke-server-action.ts</code>

```ts
export interface ServerActionResult<TResult> {
    /** Resolved return value (or `undefined` if the action threw a redirect signal). */
    readonly result: TResult | undefined;
    /** Error thrown by the action (excluding redirect signals which are normalized). */
    readonly error: unknown;
    /** Side-effects captured during the invocation. */
    readonly env: ServerActionEnv;
}
```

#### <code v-pre>SetupNextRscEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/setup-next-rsc-env.ts#L48) <code v-pre>packages/nextjs/src/setup-next-rsc-env.ts</code>

```ts
export interface SetupNextRscEnvOptions {
    /**
     * The async server component under test. If `dataSource` is omitted, the
     * helper awaits this function once and treats its return value as the only
     * (resolved) chunk — equivalent to a synchronous resolution.
     *
     * The component may throw to trigger the error boundary path. See
     * `injectError` for the test-side variant.
     */
    readonly component?: (props: Record<string, unknown>) => Promise<RscNode> | RscNode;
    /**
     * Optional props forwarded to `component`. Defaults to `{}`.
     */
    readonly props?: Record<string, unknown>;
    /**
     * Explicit streaming source. When provided, the helper iterates this and
     * ignores `component`. Useful when the production code already produces a
     * stream and the test wants to feed a deterministic sequence.
     */
    readonly dataSource?: RscStreamSource;
    /**
     * Markup shown while the (first) chunk is pending. Captured as
     * `env.fallback` so tests can assert that `<Suspense fallback={...}>`
     * surfaces the right loading state before the data arrives.
     */
    readonly suspenseFallback?: RscNode;
    /**
     * Hard timeout (ms) for the whole stream. If the source has not completed
     * by this deadline, the helper resolves with `env.timedOut = true` and the
     * chunks collected so far. Default 5000ms.
     */
    readonly streamingTimeout?: number;
    /**
     * Test-side error injection. When set, the helper short-circuits before
     * iterating the source and routes the error into `env.errorBoundary` —
     * the same shape a production `error.tsx` boundary would see.
     */
    readonly injectError?: unknown;
}
```

#### <code v-pre>SetupNextRscEnvResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/setup-next-rsc-env.ts#L88) <code v-pre>packages/nextjs/src/setup-next-rsc-env.ts</code>

```ts
export interface SetupNextRscEnvResult {
    /**
     * Streaming chunks in arrival order. For a Suspense boundary, the first
     * chunk is typically the fallback markup and the last chunk is the
     * resolved subtree.
     */
    readonly chunks: RscNode[];
    /**
     * The fallback markup captured before the source produced its first
     * non-fallback chunk. `null` when the test did not pass `suspenseFallback`
     * or when the source resolved synchronously without an explicit fallback.
     */
    readonly fallback: RscNode | null;
    /**
     * The last chunk yielded by the source — the markup a real Next.js page
     * would settle on after streaming finishes. `null` when the source threw
     * or timed out before producing any chunk.
     */
    readonly resolved: RscNode | null;
    /**
     * Set when the component or source threw, or when `injectError` was
     * provided. Mirrors the value a production `error.tsx` boundary receives.
     * `null` for happy-path streams.
     */
    readonly errorBoundary: RscErrorBoundarySignal | null;
    /**
     * `true` when `streamingTimeout` elapsed before the source completed.
     * `chunks` still contains any chunks that arrived before the deadline.
     */
    readonly timedOut: boolean;
}
```

#### <code v-pre>SlotComponent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L30) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

```ts
export type SlotComponent<TProps = Record<string, unknown>, TNode = unknown> = (props: TProps) => Promise<TNode> | TNode;
```

#### <code v-pre>SlotInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L45) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

```ts
export interface SlotInput<TSlots extends string, TNode = unknown> {
    readonly slot: TSlots;
    readonly component: SlotComponent<Record<string, unknown>, TNode> | null;
    readonly props?: Record<string, unknown>;
    readonly defaultFallback?: DefaultFallbackComponent<TNode>;
    readonly intercepting?: {
        readonly variant: 'intercepted' | 'default';
        readonly url: string;
        readonly distance?: 'sibling' | 'parent' | 'root';
    };
}
```

#### <code v-pre>SlotRenderResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L65) <code v-pre>packages/nextjs/src/invoke-parallel-routes.ts</code>

```ts
export interface SlotRenderResult<TSlots extends string, TNode = unknown> {
    readonly slot: TSlots;
    readonly tree: TNode | null;
    readonly usedDefault: boolean;
    readonly interception: InterceptionMatch<TSlots> | null;
    readonly error: unknown;
}
```

#### <code v-pre>TurbopackHmrSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L10) <code v-pre>packages/nextjs/src/semantics/turbopack-hmr.ts</code>

```ts
export interface TurbopackHmrSession {
    target: NextTarget;
    sessionId: string;
    updatedModuleIds: string[];
    boundaryModuleId: string | null;
    state: TurbopackHmrState;
    history: AxisStep<TurbopackHmrState>[];
}
```

#### <code v-pre>TurbopackHmrState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L8) <code v-pre>packages/nextjs/src/semantics/turbopack-hmr.ts</code>

v1.49 turbopack-hmr axis — Next.js 15 Turbopack HMR + fast refresh を target-neutral に扱う state machine。 pages-router では webpack HMR、 edge-runtime では esbuild HMR に mapping。

```ts
export type TurbopackHmrState = 'idle' | 'updating' | 'boundary-found' | 'applied' | 'refresh-completed';
```
<!-- kiwa-public-api:end -->
