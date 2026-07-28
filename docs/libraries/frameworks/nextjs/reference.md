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

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [invoke-middleware.ts](./api/invoke-middleware) | 3 | 7 |
| [invoke-parallel-routes.ts](./api/invoke-parallel-routes) | 2 | 9 |
| [invoke-server-action.ts](./api/invoke-server-action) | 2 | 6 |
| [real-driver.ts](./api/real-driver) | 3 | 2 |
| [render-server-component.ts](./api/render-server-component) | 6 | 8 |
| [semantics/concurrent-transitions.ts](./api/semantics-concurrent-transitions) | 4 | 2 |
| [semantics/fidelity.ts](./api/semantics-fidelity) | 2 | 2 |
| [semantics/interception-routes.ts](./api/semantics-interception-routes) | 5 | 3 |
| [semantics/parallel-routes-advanced.ts](./api/semantics-parallel-routes-advanced) | 5 | 2 |
| [semantics/partial-prerendering.ts](./api/semantics-partial-prerendering) | 5 | 2 |
| [semantics/server-action-advanced.ts](./api/semantics-server-action-advanced) | 5 | 2 |
| [semantics/turbopack-hmr.ts](./api/semantics-turbopack-hmr) | 5 | 2 |
| [semantics/types.ts](./api/semantics-types) | 1 | 4 |
| [setup-next-rsc-env.ts](./api/setup-next-rsc-env) | 2 | 4 |

<!-- kiwa-public-api:end -->
