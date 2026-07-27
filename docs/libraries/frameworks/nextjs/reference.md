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
| `slot ${input.slot}: no default.tsx fallback supplied` | [packages/nextjs/src/invoke-parallel-routes.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L101) |
| `expected ${provider} in ${expected} mode but resolved ${resolved.mode} (${resolved.reason})` | [packages/nextjs/src/real-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/real-driver.ts#L49) |
| 'startConcurrentTransition: transitionId must not be empty' | [packages/nextjs/src/semantics/concurrent-transitions.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L50) |
| `markTransitionPending: session is ${session.state}` | [packages/nextjs/src/semantics/concurrent-transitions.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L69) |
| `interruptTransition: session is ${session.state}` | [packages/nextjs/src/semantics/concurrent-transitions.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L82) |
| `commitTransition: session is ${session.state}` | [packages/nextjs/src/semantics/concurrent-transitions.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L96) |
| 'startInterceptionRoutes: routeId must not be empty' | [packages/nextjs/src/semantics/interception-routes.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L20) |
| 'openInterceptedModal: modalRoute must not be empty' | [packages/nextjs/src/semantics/interception-routes.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L61) |
| 'openInterceptedModal: an interception match is required first' | [packages/nextjs/src/semantics/interception-routes.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L64) |
| 'intercept: from and to must start with /' | [packages/nextjs/src/semantics/interception-routes.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L83) |
| 'startParallelRoutesAdvanced: layoutId must not be empty' | [packages/nextjs/src/semantics/parallel-routes-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L25) |
| 'navigateSlot: from and to must start with /' | [packages/nextjs/src/semantics/parallel-routes-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L83) |
| 'slot must not be empty' | [packages/nextjs/src/semantics/parallel-routes-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L92) |
| 'startPartialPrerendering: routeId must not be empty' | [packages/nextjs/src/semantics/partial-prerendering.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L20) |
| `renderStaticShell: session is ${session.state}, not idle` | [packages/nextjs/src/semantics/partial-prerendering.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L38) |
| 'renderStaticShell: html must not be empty' | [packages/nextjs/src/semantics/partial-prerendering.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L41) |
| 'openDynamicHole: static shell must be rendered first' | [packages/nextjs/src/semantics/partial-prerendering.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L53) |
| 'openDynamicHole: holeId must not be empty' | [packages/nextjs/src/semantics/partial-prerendering.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L56) |
| `flushStreamingBoundary: ${input.holeId} is not an open dynamic hole` | [packages/nextjs/src/semantics/partial-prerendering.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L72) |
| 'flushStreamingBoundary: html must not be empty' | [packages/nextjs/src/semantics/partial-prerendering.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L75) |
| 'completePartialPrerendering: static shell was not rendered' | [packages/nextjs/src/semantics/partial-prerendering.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L90) |
| 'startServerActionAdvanced: actionId must not be empty' | [packages/nextjs/src/semantics/server-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L26) |
| `submitFormAction: session is ${session.state}, not idle` | [packages/nextjs/src/semantics/server-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L45) |
| 'revalidateActionPath: form action was not submitted' | [packages/nextjs/src/semantics/server-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L60) |
| 'revalidateActionPath: path must start with /' | [packages/nextjs/src/semantics/server-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L63) |
| 'revalidateActionTag: form action was not submitted' | [packages/nextjs/src/semantics/server-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L75) |
| 'revalidateActionTag: tag must not be empty' | [packages/nextjs/src/semantics/server-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L78) |
| 'redirectAction: form action was not submitted' | [packages/nextjs/src/semantics/server-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L90) |
| 'redirectAction: url must not be empty' | [packages/nextjs/src/semantics/server-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L93) |
| 'startTurbopackHmr: sessionId must not be empty' | [packages/nextjs/src/semantics/turbopack-hmr.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L44) |
| `findHmrBoundary: session is ${session.state}` | [packages/nextjs/src/semantics/turbopack-hmr.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L73) |
| `applyHmrPatch: session is ${session.state}` | [packages/nextjs/src/semantics/turbopack-hmr.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L84) |
| `completeFastRefresh: session is ${session.state}` | [packages/nextjs/src/semantics/turbopack-hmr.ts](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L96) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `applyHmrPatch`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L80) `packages/nextjs/src/semantics/turbopack-hmr.ts`

```ts
export function applyHmrPatch(
  session: TurbopackHmrSession,
): AxisStep<TurbopackHmrState>;
```

#### `assertMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/real-driver.ts#L42) `packages/nextjs/src/real-driver.ts`

```ts
export function assertMode(
  provider: NextTarget,
  expected: KiwaTestMode,
  env: Record<string, string | undefined> = process.env,
): void;
```

#### `captureParallelError`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L62) `packages/nextjs/src/semantics/parallel-routes-advanced.ts`

```ts
export function captureParallelError(
  session: ParallelRoutesAdvancedSession,
  input: { slot: string; error: Error | string },
): AxisStep<ParallelRoutesAdvancedState>;
```

#### `collectFidelityCoverage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/fidelity.ts#L56) `packages/nextjs/src/semantics/fidelity.ts`

```ts
export function collectFidelityCoverage(
  providers: NextTarget[] = ['app-router', 'pages-router', 'edge-runtime'],
): FidelityCoverage;
```

#### `commitTransition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L91) `packages/nextjs/src/semantics/concurrent-transitions.ts`

```ts
export function commitTransition(
  session: ConcurrentTransitionSession,
  committedValue: string,
): AxisStep<ConcurrentTransitionState>;
```

#### `completeFastRefresh`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L92) `packages/nextjs/src/semantics/turbopack-hmr.ts`

```ts
export function completeFastRefresh(
  session: TurbopackHmrSession,
): AxisStep<TurbopackHmrState>;
```

#### `completePartialPrerendering`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L86) `packages/nextjs/src/semantics/partial-prerendering.ts`

```ts
export function completePartialPrerendering(
  session: PartialPrerenderingSession,
): AxisStep<PartialPrerenderingState>;
```

#### `findAll`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L77) `packages/nextjs/src/render-server-component.ts`

Recursively walk an RSC tree and collect every node that satisfies the predicate. Children are read from `props.children` and are normalized to a flat array regardless of how the component spelled them.

```ts
export function findAll(tree: RscNode, predicate: (node: RscElement) => boolean): RscElement[];
```

#### `findHmrBoundary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L68) `packages/nextjs/src/semantics/turbopack-hmr.ts`

```ts
export function findHmrBoundary(
  session: TurbopackHmrSession,
  boundaryModuleId: string,
): AxisStep<TurbopackHmrState>;
```

#### `flushStreamingBoundary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L67) `packages/nextjs/src/semantics/partial-prerendering.ts`

```ts
export function flushStreamingBoundary(
  session: PartialPrerenderingSession,
  input: { holeId: string; html: string },
): AxisStep<PartialPrerenderingState>;
```

#### `FORBIDDEN_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L16) `packages/nextjs/src/render-server-component.ts`

```ts
export declare const FORBIDDEN_SYMBOL: typeof FORBIDDEN_SYMBOL;
```

#### `interceptCurrentSegment`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L32) `packages/nextjs/src/semantics/interception-routes.ts`

```ts
export function interceptCurrentSegment(
  session: InterceptionRoutesSession,
  from: string,
  to: string,
): AxisStep<InterceptionRoutesState>;
```

#### `interceptParentSegment`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L40) `packages/nextjs/src/semantics/interception-routes.ts`

```ts
export function interceptParentSegment(
  session: InterceptionRoutesSession,
  from: string,
  to: string,
): AxisStep<InterceptionRoutesState>;
```

#### `interceptRootCatchall`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L48) `packages/nextjs/src/semantics/interception-routes.ts`

```ts
export function interceptRootCatchall(
  session: InterceptionRoutesSession,
  from: string,
  to: string,
): AxisStep<InterceptionRoutesState>;
```

#### `interruptTransition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L78) `packages/nextjs/src/semantics/concurrent-transitions.ts`

```ts
export function interruptTransition(
  session: ConcurrentTransitionSession,
): AxisStep<ConcurrentTransitionState>;
```

#### `invokeMiddleware`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L120) `packages/nextjs/src/invoke-middleware.ts`

Invoke a middleware function in isolation and capture its outgoing response shape + headers + cookies. Mirrors the kiwa style of invokeServerAction: no globals, no real Next.js runtime.

```ts
export async function invokeMiddleware(opts: InvokeMiddlewareOptions): Promise<InvokeMiddlewareResult>;
```

#### `invokeParallelRoutes`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L120) `packages/nextjs/src/invoke-parallel-routes.ts`

Invoke an App Router parallel-routes layout in isolation. All slot components are rendered in parallel (Promise.all) so a slow slot cannot block fast siblings; per-slot errors are captured into `slotResults` without aborting the layout render.

```ts
export async function invokeParallelRoutes<
  TSlots extends string,
  TLayoutProps = Record<string, unknown>,
  TNode = unknown,
>(
  opts: InvokeParallelRoutesOptions<TSlots, TLayoutProps, TNode>,
): Promise<InvokeParallelRoutesResult<TSlots, TNode>>;
```

#### `invokeServerAction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L99) `packages/nextjs/src/invoke-server-action.ts`

Invoke a Next.js Server Action in isolation and capture its side-effects. The action is called as `await action(formData, ...args)`. The kiwa helper does NOT monkey-patch global `next/navigation` / `next/headers` / `next/cache` imports. Instead the action under test should accept its dependencies via an injectable seam (a parameter or a module-level setter) so tests stay deterministic. See `examples/nextjs-server-actions-poc/` for the pattern.

```ts
export async function invokeServerAction<TResult>(
  opts: ServerActionInvocation<TResult>,
): Promise<ServerActionResult<TResult>>;
```

#### `markModuleUpdated`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L56) `packages/nextjs/src/semantics/turbopack-hmr.ts`

```ts
export function markModuleUpdated(
  session: TurbopackHmrSession,
  moduleId: string,
): AxisStep<TurbopackHmrState>;
```

#### `markTransitionPending`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L65) `packages/nextjs/src/semantics/concurrent-transitions.ts`

```ts
export function markTransitionPending(
  session: ConcurrentTransitionSession,
): AxisStep<ConcurrentTransitionState>;
```

#### `MIDDLEWARE_ACTION_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L15) `packages/nextjs/src/invoke-middleware.ts`

```ts
export declare const MIDDLEWARE_ACTION_SYMBOL: typeof MIDDLEWARE_ACTION_SYMBOL;
```

#### `middlewareActions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L100) `packages/nextjs/src/invoke-middleware.ts`

Helpers your `middleware.ts` returns instead of constructing NextResponse directly. Keep the production code shape close by re-exporting these from a shared module; the helper expects the returned value to be a MiddlewareAction shaped object.

```ts
export declare const middlewareActions: { next(): MiddlewareAction; redirect(url: string, status?: number): MiddlewareAction; rewrite(url: string): MiddlewareAction; json(body: unknown, status?: number): MiddlewareAction; };
```

#### `navigateSlot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L77) `packages/nextjs/src/semantics/parallel-routes-advanced.ts`

```ts
export function navigateSlot(
  session: ParallelRoutesAdvancedSession,
  input: { slot: string; from: string; to: string },
): AxisStep<ParallelRoutesAdvancedState>;
```

#### `NEXT_AXIS_TO_EVENTS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/fidelity.ts#L16) `packages/nextjs/src/semantics/fidelity.ts`

```ts
export declare const NEXT_AXIS_TO_EVENTS: Record<NextAxis, NeutralEventName[]>;
```

#### `NOT_FOUND_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L15) `packages/nextjs/src/render-server-component.ts`

```ts
export declare const NOT_FOUND_SYMBOL: typeof NOT_FOUND_SYMBOL;
```

#### `openDynamicHole`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L48) `packages/nextjs/src/semantics/partial-prerendering.ts`

```ts
export function openDynamicHole(
  session: PartialPrerenderingSession,
  input: { holeId: string; fallback: string },
): AxisStep<PartialPrerenderingState>;
```

#### `openInterceptedModal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L56) `packages/nextjs/src/semantics/interception-routes.ts`

```ts
export function openInterceptedModal(
  session: InterceptionRoutesSession,
  modalRoute: string,
): AxisStep<InterceptionRoutesState>;
```

#### `PARALLEL_INTERCEPTION_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L20) `packages/nextjs/src/invoke-parallel-routes.ts`

```ts
export declare const PARALLEL_INTERCEPTION_SYMBOL: typeof PARALLEL_INTERCEPTION_SYMBOL;
```

#### `providerEventName`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/types.ts#L136) `packages/nextjs/src/semantics/types.ts`

```ts
export function providerEventName(target: NextTarget, neutral: NeutralEventName): string;
```

#### `REDIRECT_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L14) `packages/nextjs/src/invoke-server-action.ts`

```ts
export declare const REDIRECT_SYMBOL: typeof REDIRECT_SYMBOL;
```

#### `redirectAction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L85) `packages/nextjs/src/semantics/server-action-advanced.ts`

```ts
export function redirectAction(
  session: ServerActionAdvancedSession,
  url: string,
): AxisStep<ServerActionAdvancedState>;
```

#### `renderDefaultSlot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L38) `packages/nextjs/src/semantics/parallel-routes-advanced.ts`

```ts
export function renderDefaultSlot(
  session: ParallelRoutesAdvancedSession,
  slot: string,
  html: string,
): AxisStep<ParallelRoutesAdvancedState>;
```

#### `renderLoadingState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L49) `packages/nextjs/src/semantics/parallel-routes-advanced.ts`

```ts
export function renderLoadingState(
  session: ParallelRoutesAdvancedSession,
  slot: string,
): AxisStep<ParallelRoutesAdvancedState>;
```

#### `renderServerComponent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L127) `packages/nextjs/src/render-server-component.ts`

Invoke an async server component in isolation and capture its return tree. Throws of `notFound() / forbidden() / redirect()` from `next/navigation` should be replaced with the kiwa signals below (Pattern A from the server-action seam doc); the helper normalizes them into `result.signal` instead of leaving them as `result.error`.

```ts
export async function renderServerComponent<TProps = Record<string, unknown>>(
  opts: RenderServerComponentOptions<TProps>,
): Promise<RenderServerComponentResult>;
```

#### `renderStaticShell`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L33) `packages/nextjs/src/semantics/partial-prerendering.ts`

```ts
export function renderStaticShell(
  session: PartialPrerenderingSession,
  html: string,
): AxisStep<PartialPrerenderingState>;
```

#### `resolveAllModes`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/real-driver.ts#L35) `packages/nextjs/src/real-driver.ts`

```ts
export function resolveAllModes(
  env: Record<string, string | undefined> = process.env,
): ResolvedMode[];
```

#### `resolveMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/real-driver.ts#L17) `packages/nextjs/src/real-driver.ts`

```ts
export function resolveMode(
  provider: NextTarget,
  env: Record<string, string | undefined> = process.env,
): ResolvedMode;
```

#### `revalidateActionPath`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L55) `packages/nextjs/src/semantics/server-action-advanced.ts`

```ts
export function revalidateActionPath(
  session: ServerActionAdvancedSession,
  path: string,
): AxisStep<ServerActionAdvancedState>;
```

#### `revalidateActionTag`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L70) `packages/nextjs/src/semantics/server-action-advanced.ts`

```ts
export function revalidateActionTag(
  session: ServerActionAdvancedSession,
  tag: string,
): AxisStep<ServerActionAdvancedState>;
```

#### `RSC_ERROR_BOUNDARY_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/setup-next-rsc-env.ts#L26) `packages/nextjs/src/setup-next-rsc-env.ts`

```ts
export declare const RSC_ERROR_BOUNDARY_SYMBOL: typeof RSC_ERROR_BOUNDARY_SYMBOL;
```

#### `RSC_REDIRECT_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L17) `packages/nextjs/src/render-server-component.ts`

```ts
export declare const RSC_REDIRECT_SYMBOL: typeof RSC_REDIRECT_SYMBOL;
```

#### `setupNextRscEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/setup-next-rsc-env.ts#L199) `packages/nextjs/src/setup-next-rsc-env.ts`

Drive an async RSC stream through a single Suspense boundary and capture every chunk + the fallback + the resolved subtree + any error-boundary trigger. The helper is deterministic — chunks arrive in the order the source yields them, and the timeout is wall-clock-bounded so tests cannot hang on a stuck stream. Typical usage: const env = await setupNextRscEnv({ dataSource: streamItems(), suspenseFallback: &lt;Skeleton /&gt;, streamingTimeout: 1000, }); expect(env.fallback).toEqual(&lt;Skeleton /&gt;); expect(env.chunks).toHaveLength(3); expect(env.resolved).toEqual(&lt;ItemList items={items} /&gt;); expect(env.errorBoundary).toBeNull(); expect(env.timedOut).toBe(false);

```ts
export async function setupNextRscEnv(
  opts: SetupNextRscEnvOptions = {},
): Promise<SetupNextRscEnvResult>;
```

#### `startConcurrentTransition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L45) `packages/nextjs/src/semantics/concurrent-transitions.ts`

```ts
export function startConcurrentTransition(input: {
  target: NextTarget;
  transitionId: string;
}): ConcurrentTransitionSession;
```

#### `startInterceptionRoutes`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L15) `packages/nextjs/src/semantics/interception-routes.ts`

```ts
export function startInterceptionRoutes(input: {
  target: NextTarget;
  routeId: string;
}): InterceptionRoutesSession;
```

#### `startParallelRoutesAdvanced`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L20) `packages/nextjs/src/semantics/parallel-routes-advanced.ts`

```ts
export function startParallelRoutesAdvanced(input: {
  target: NextTarget;
  layoutId: string;
}): ParallelRoutesAdvancedSession;
```

#### `startPartialPrerendering`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L15) `packages/nextjs/src/semantics/partial-prerendering.ts`

```ts
export function startPartialPrerendering(input: {
  target: NextTarget;
  routeId: string;
}): PartialPrerenderingSession;
```

#### `startServerActionAdvanced`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L21) `packages/nextjs/src/semantics/server-action-advanced.ts`

```ts
export function startServerActionAdvanced(input: {
  target: NextTarget;
  actionId: string;
}): ServerActionAdvancedSession;
```

#### `startTurbopackHmr`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L39) `packages/nextjs/src/semantics/turbopack-hmr.ts`

```ts
export function startTurbopackHmr(input: {
  target: NextTarget;
  sessionId: string;
}): TurbopackHmrSession;
```

#### `submitFormAction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L40) `packages/nextjs/src/semantics/server-action-advanced.ts`

```ts
export function submitFormAction(
  session: ServerActionAdvancedSession,
  form: Record<string, string>,
): AxisStep<ServerActionAdvancedState>;
```

#### `textContent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L100) `packages/nextjs/src/render-server-component.ts`

Concatenate every string/number leaf of an RSC tree, joined by a single space. Useful for `expect(textContent(tree)).toContain('hello')` style assertions where the exact element structure does not matter.

```ts
export function textContent(tree: RscNode): string;
```

### 型

#### `AxisStep`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/types.ts#L47) `packages/nextjs/src/semantics/types.ts`

```ts
export interface AxisStep<TState extends string> {
  neutralEvent: NeutralEventName;
  providerEvent: string;
  state: TState;
  amountCents: number;
  metadata: Record<string, string | number | boolean>;
}
```

#### `ConcurrentTransitionSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L15) `packages/nextjs/src/semantics/concurrent-transitions.ts`

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

#### `ConcurrentTransitionState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/concurrent-transitions.ts#L8) `packages/nextjs/src/semantics/concurrent-transitions.ts`

v1.49 concurrent-transitions axis — React 18/19 concurrent features (startTransition + useTransition + useDeferredValue) を target-neutral に 扱う state machine。 interrupt-and-restart semantics も含む。

```ts
export type ConcurrentTransitionState =
  | 'idle'
  | 'started'
  | 'pending'
  | 'interrupted'
  | 'committed';
```

#### `CookieJar`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L22) `packages/nextjs/src/invoke-server-action.ts`

```ts
export interface CookieJar {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: Record<string, unknown>): void;
  delete(name: string): void;
  entries(): Array<[string, string]>;
}
```

#### `DefaultFallbackComponent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L34) `packages/nextjs/src/invoke-parallel-routes.ts`

```ts
export type DefaultFallbackComponent<TNode = unknown> = () => Promise<TNode> | TNode;
```

#### `FidelityCoverage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/fidelity.ts#L10) `packages/nextjs/src/semantics/fidelity.ts`

```ts
export interface FidelityCoverage {
  providers: NextTarget[];
  axes: NextAxis[];
  rows: FidelityRow[];
}
```

#### `FidelityRow`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/fidelity.ts#L3) `packages/nextjs/src/semantics/fidelity.ts`

```ts
export interface FidelityRow {
  provider: NextTarget;
  axis: NextAxis;
  neutralEvents: NeutralEventName[];
  providerEvents: string[];
}
```

#### `ForbiddenSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L22) `packages/nextjs/src/render-server-component.ts`

```ts
export interface ForbiddenSignal {
  readonly [FORBIDDEN_SYMBOL]: true;
}
```

#### `InterceptionMatch`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L22) `packages/nextjs/src/invoke-parallel-routes.ts`

```ts
export interface InterceptionMatch<TSlot extends string> {
  readonly [PARALLEL_INTERCEPTION_SYMBOL]: true;
  readonly slot: TSlot;
  readonly variant: 'intercepted' | 'default';
  readonly url: string;
  readonly distance: 'sibling' | 'parent' | 'root';
}
```

#### `InterceptionMatcher`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L4) `packages/nextjs/src/semantics/interception-routes.ts`

```ts
export type InterceptionMatcher = '(.)' | '(..)' | '(...)';
```

#### `InterceptionRoutesSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L6) `packages/nextjs/src/semantics/interception-routes.ts`

```ts
export interface InterceptionRoutesSession {
  target: NextTarget;
  routeId: string;
  state: InterceptionRoutesState;
  matches: Array<{ matcher: InterceptionMatcher; from: string; to: string }>;
  modalRoute: string | null;
  history: AxisStep<InterceptionRoutesState>[];
}
```

#### `InterceptionRoutesState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/interception-routes.ts#L3) `packages/nextjs/src/semantics/interception-routes.ts`

```ts
export type InterceptionRoutesState = 'idle' | 'current' | 'parent' | 'root' | 'modal-open';
```

#### `InvokeMiddlewareOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L55) `packages/nextjs/src/invoke-middleware.ts`

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

#### `InvokeMiddlewareResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L68) `packages/nextjs/src/invoke-middleware.ts`

```ts
export interface InvokeMiddlewareResult {
  readonly env: MiddlewareEnv;
  readonly error: unknown;
}
```

#### `InvokeParallelRoutesOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L57) `packages/nextjs/src/invoke-parallel-routes.ts`

```ts
export interface InvokeParallelRoutesOptions<TSlots extends string, TLayoutProps, TNode = unknown> {
  readonly layout: ParallelLayoutFunction<TSlots, TLayoutProps, TNode>;
  readonly children: SlotComponent<Record<string, unknown>, TNode>;
  readonly childrenProps?: Record<string, unknown>;
  readonly slots: ReadonlyArray<SlotInput<TSlots, TNode>>;
  readonly layoutProps?: TLayoutProps;
}
```

#### `InvokeParallelRoutesResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L73) `packages/nextjs/src/invoke-parallel-routes.ts`

```ts
export interface InvokeParallelRoutesResult<TSlots extends string, TNode = unknown> {
  readonly tree: TNode | null;
  readonly slotResults: ReadonlyArray<SlotRenderResult<TSlots, TNode>>;
  readonly childrenError: unknown;
  readonly layoutError: unknown;
}
```

#### `KiwaTestMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/real-driver.ts#L3) `packages/nextjs/src/real-driver.ts`

```ts
export type KiwaTestMode = 'mock' | 'real';
```

#### `MiddlewareAction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L19) `packages/nextjs/src/invoke-middleware.ts`

```ts
export interface MiddlewareAction {
  readonly [MIDDLEWARE_ACTION_SYMBOL]: true;
  readonly kind: MiddlewareActionKind;
  readonly url?: string;
  readonly body?: unknown;
  readonly status?: number;
}
```

#### `MiddlewareActionKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L17) `packages/nextjs/src/invoke-middleware.ts`

```ts
export type MiddlewareActionKind = 'next' | 'redirect' | 'rewrite' | 'json' | 'noop';
```

#### `MiddlewareEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L44) `packages/nextjs/src/invoke-middleware.ts`

```ts
export interface MiddlewareEnv {
  readonly responseHeaders: Map<string, string>;
  readonly responseCookies: Map<string, string>;
  readonly action: MiddlewareAction;
}
```

#### `MiddlewareFunction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L50) `packages/nextjs/src/invoke-middleware.ts`

```ts
export type MiddlewareFunction = (
  req: MiddlewareRequest,
  env: { setHeader: (name: string, value: string) => void; setCookie: (name: string, value: string) => void },
) => MiddlewareAction | Promise<MiddlewareAction>;
```

#### `MiddlewareRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-middleware.ts#L27) `packages/nextjs/src/invoke-middleware.ts`

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

#### `NeutralEventName`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/types.ts#L19) `packages/nextjs/src/semantics/types.ts`

```ts
export type NeutralEventName =
  | 'action.form_submitted'
  | 'action.revalidate_path'
  | 'action.revalidate_tag'
  | 'action.redirected'
  | 'ppr.static_shell_rendered'
  | 'ppr.dynamic_hole_opened'
  | 'ppr.streaming_boundary_flushed'
  | 'ppr.completed'
  | 'intercept.current_segment'
  | 'intercept.parent_segment'
  | 'intercept.root_catchall'
  | 'intercept.modal_opened'
  | 'parallel.default_rendered'
  | 'parallel.loading_rendered'
  | 'parallel.error_boundary_captured'
  | 'parallel.slot_navigated'
  // v1.49 turbopack-hmr
  | 'turbopack.module_updated'
  | 'turbopack.hmr_boundary_found'
  | 'turbopack.hmr_applied'
  | 'turbopack.fast_refresh_completed'
  // v1.49 concurrent-transitions
  | 'transition.started'
  | 'transition.pending'
  | 'transition.interrupted'
  | 'transition.committed';
```

#### `NextAxis`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/types.ts#L10) `packages/nextjs/src/semantics/types.ts`

```ts
export type NextAxis =
  | 'server-action-advanced'
  | 'partial-prerendering'
  | 'interception-routes'
  | 'parallel-routes-advanced'
  // v1.49 advanced III (pair 第 6 pair 3 段拡張)
  | 'turbopack-hmr'
  | 'concurrent-transitions';
```

#### `NextTarget`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/types.ts#L8) `packages/nextjs/src/semantics/types.ts`

Advanced Next.js semantics — target-neutral axis SSOT. The helpers model App Router, Pages Router, and Edge Runtime behavior as pure state machines. Tests can assert the neutral event while still seeing a target-specific dialect through providerEventName.

```ts
export type NextTarget = 'app-router' | 'pages-router' | 'edge-runtime';
```

#### `NotFoundSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L19) `packages/nextjs/src/render-server-component.ts`

```ts
export interface NotFoundSignal {
  readonly [NOT_FOUND_SYMBOL]: true;
}
```

#### `ParallelLayoutChildren`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L36) `packages/nextjs/src/invoke-parallel-routes.ts`

```ts
export interface ParallelLayoutChildren<TSlots extends string, TNode = unknown> {
  readonly children: TNode;
  readonly slots: Readonly<Record<TSlots, TNode>>;
}
```

#### `ParallelLayoutFunction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L41) `packages/nextjs/src/invoke-parallel-routes.ts`

```ts
export type ParallelLayoutFunction<TSlots extends string, TLayoutProps, TNode = unknown> = (
  props: TLayoutProps & ParallelLayoutChildren<TSlots, TNode>,
) => Promise<TNode> | TNode;
```

#### `ParallelRoutesAdvancedSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L10) `packages/nextjs/src/semantics/parallel-routes-advanced.ts`

```ts
export interface ParallelRoutesAdvancedSession {
  target: NextTarget;
  layoutId: string;
  state: ParallelRoutesAdvancedState;
  slots: Map<string, string>;
  loadingSlots: Set<string>;
  errors: Array<{ slot: string; message: string }>;
  history: AxisStep<ParallelRoutesAdvancedState>[];
}
```

#### `ParallelRoutesAdvancedState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/parallel-routes-advanced.ts#L3) `packages/nextjs/src/semantics/parallel-routes-advanced.ts`

```ts
export type ParallelRoutesAdvancedState =
  | 'idle'
  | 'default-rendered'
  | 'loading-rendered'
  | 'error-captured'
  | 'slot-navigated';
```

#### `PartialPrerenderingSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L5) `packages/nextjs/src/semantics/partial-prerendering.ts`

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

#### `PartialPrerenderingState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/partial-prerendering.ts#L3) `packages/nextjs/src/semantics/partial-prerendering.ts`

```ts
export type PartialPrerenderingState = 'idle' | 'static-shell' | 'dynamic-hole' | 'streaming' | 'completed';
```

#### `RedirectSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L16) `packages/nextjs/src/invoke-server-action.ts`

```ts
export interface RedirectSignal {
  readonly [REDIRECT_SYMBOL]: true;
  readonly url: string;
  readonly type: 'replace' | 'push';
}
```

#### `RenderServerComponentOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L41) `packages/nextjs/src/render-server-component.ts`

```ts
export interface RenderServerComponentOptions<TProps> {
  readonly component: (props: TProps) => Promise<RscNode> | RscNode;
  readonly props?: TProps;
}
```

#### `RenderServerComponentResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L46) `packages/nextjs/src/render-server-component.ts`

```ts
export interface RenderServerComponentResult {
  readonly tree: RscNode;
  readonly signal: RscSignal | null;
  readonly error: unknown;
}
```

#### `ResolvedMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/real-driver.ts#L5) `packages/nextjs/src/real-driver.ts`

```ts
export interface ResolvedMode {
  mode: KiwaTestMode;
  provider: NextTarget;
  reason: 'default-mock' | 'kiwa-mode-real' | 'missing-key' | 'invalid-mode';
}
```

#### `RscElement`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L33) `packages/nextjs/src/render-server-component.ts`

```ts
export interface RscElement {
  readonly type: string | symbol | ((props: Record<string, unknown>) => unknown);
  readonly props: Record<string, unknown>;
  readonly key: string | null;
}
```

#### `RscErrorBoundarySignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/setup-next-rsc-env.ts#L28) `packages/nextjs/src/setup-next-rsc-env.ts`

```ts
export interface RscErrorBoundarySignal {
  readonly [RSC_ERROR_BOUNDARY_SYMBOL]: true;
  readonly error: unknown;
}
```

#### `RscNode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L39) `packages/nextjs/src/render-server-component.ts`

```ts
export type RscNode = RscElement | string | number | boolean | null | undefined | RscNode[];
```

#### `RscRedirectSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L25) `packages/nextjs/src/render-server-component.ts`

```ts
export interface RscRedirectSignal {
  readonly [RSC_REDIRECT_SYMBOL]: true;
  readonly url: string;
  readonly type: 'replace' | 'push';
}
```

#### `RscSignal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/render-server-component.ts#L31) `packages/nextjs/src/render-server-component.ts`

```ts
export type RscSignal = NotFoundSignal | ForbiddenSignal | RscRedirectSignal;
```

#### `RscStreamSource`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/setup-next-rsc-env.ts#L46) `packages/nextjs/src/setup-next-rsc-env.ts`

An async source the helper consumes chunk-by-chunk. Each yielded value is one streaming frame; the helper appends it to `env.chunks` in arrival order and uses the last chunk as `env.resolved` once the source completes. Use a plain async generator for most cases: async function* source() { yield &lt;Spinner /&gt;; // initial chunk yield &lt;Skeleton rows={3} /&gt;; // partial data yield &lt;Items list={data} /&gt;; // final resolved chunk }

```ts
export type RscStreamSource = AsyncIterable<RscNode>;
```

#### `ServerActionAdvancedSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L10) `packages/nextjs/src/semantics/server-action-advanced.ts`

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

#### `ServerActionAdvancedState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/server-action-advanced.ts#L3) `packages/nextjs/src/semantics/server-action-advanced.ts`

```ts
export type ServerActionAdvancedState =
  | 'idle'
  | 'submitted'
  | 'path-revalidated'
  | 'tag-revalidated'
  | 'redirected';
```

#### `ServerActionEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L29) `packages/nextjs/src/invoke-server-action.ts`

```ts
export interface ServerActionEnv {
  readonly cookies: CookieJar;
  readonly headers: Map<string, string>;
  readonly revalidated: { paths: string[]; tags: string[] };
  readonly redirect: RedirectSignal | null;
}
```

#### `ServerActionFunction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L40) `packages/nextjs/src/invoke-server-action.ts`

```ts
export type ServerActionFunction<TResult> = (...args: any[]) => Promise<TResult> | TResult;
```

#### `ServerActionInvocation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L42) `packages/nextjs/src/invoke-server-action.ts`

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

#### `ServerActionResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-server-action.ts#L55) `packages/nextjs/src/invoke-server-action.ts`

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

#### `SetupNextRscEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/setup-next-rsc-env.ts#L48) `packages/nextjs/src/setup-next-rsc-env.ts`

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

#### `SetupNextRscEnvResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/setup-next-rsc-env.ts#L88) `packages/nextjs/src/setup-next-rsc-env.ts`

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

#### `SlotComponent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L30) `packages/nextjs/src/invoke-parallel-routes.ts`

```ts
export type SlotComponent<TProps = Record<string, unknown>, TNode = unknown> = (
  props: TProps,
) => Promise<TNode> | TNode;
```

#### `SlotInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L45) `packages/nextjs/src/invoke-parallel-routes.ts`

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

#### `SlotRenderResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/invoke-parallel-routes.ts#L65) `packages/nextjs/src/invoke-parallel-routes.ts`

```ts
export interface SlotRenderResult<TSlots extends string, TNode = unknown> {
  readonly slot: TSlots;
  readonly tree: TNode | null;
  readonly usedDefault: boolean;
  readonly interception: InterceptionMatch<TSlots> | null;
  readonly error: unknown;
}
```

#### `TurbopackHmrSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L10) `packages/nextjs/src/semantics/turbopack-hmr.ts`

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

#### `TurbopackHmrState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/semantics/turbopack-hmr.ts#L8) `packages/nextjs/src/semantics/turbopack-hmr.ts`

v1.49 turbopack-hmr axis — Next.js 15 Turbopack HMR + fast refresh を target-neutral に扱う state machine。 pages-router では webpack HMR、 edge-runtime では esbuild HMR に mapping。

```ts
export type TurbopackHmrState = 'idle' | 'updating' | 'boundary-found' | 'applied' | 'refresh-completed';
```
<!-- kiwa-public-api:end -->
