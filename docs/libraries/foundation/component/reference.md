# Component リファレンス

`@kiwa-lab/component` は、story を `MockNode` の canvas に解決する registry、canvas を操作する Component Testing mock、markup の差分を review する visual mock を提供します。通常は `createStoryRegistry` から始め、`mount` の canvas を `play` と `runA11y` に渡します。同じ canvas と entry を `createChromaticVisualMock` に渡せば、初回 baseline、差分、承認済み baseline の状態を確認できます。

## 設定

story には `title`、`render`、`stories` を指定します。story 単位の `args` と `parameters` は registry が解決します。

## 後始末

テストごとに registry と canvas を作り直します。

## Registry の結果

`mount` は `{ canvas, entry }` を返し、`play` は step ごとの `{ label, ok, error? }` と全体の `ok` を返します。`runA11y` は `{ violations }` を返すため、violation が空かを test 側で assertion します。`createNode` と `createCanvas` は framework に依存しない入力を組み立てるための primitive で、`findByRole` と `findByText` は canvas から対象 node を得る query です。decorator、loader、addon の実行は Storybook 実体の代替ではなく、この mock の対象外です。

Playwright CT mock は `activeMounts` と `unmountAll` を提供します。locator の unmount は全 handler を消し、mount leak を検出できます。real mode は Storybook に `STORYBOOK_URL`、Playwright CT に `PLAYWRIGHT_CT_URL`、Chromatic に `CHROMATIC_TOKEN` が必要です。不足時と無効な `KIWA_MODE` は mock に戻ります。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>ChromaticVisualMock.review — cannot accept $&#123;key&#125;, no current capture found. Run capture() first.</code> | [packages/component/src/chromatic.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/chromatic.ts#L182) |
| <code v-pre>Canvas.getByText — no node with text $&#123;JSON.stringify(text)&#125;</code> | [packages/component/src/dom.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L82) |
| <code v-pre>Canvas.getByRole — no node with role=$&#123;role&#125;$&#123;nameSuffix&#125;</code> | [packages/component/src/dom.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L90) |
| <code v-pre>expected $&#123;provider&#125; in $&#123;expected&#125; mode but resolved $&#123;resolved.mode&#125; ($&#123;resolved.reason&#125;)</code> | [packages/component/src/real-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/real-driver.ts#L49) |
| <code v-pre>startFormActionSession: formId must not be empty</code> | [packages/component/src/semantics/form-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L22) |
| <code v-pre>markFormStatusPending: form is already pending</code> | [packages/component/src/semantics/form-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L41) |
| <code v-pre>applyOptimisticUpdate: session is $&#123;session.state&#125;, not pending</code> | [packages/component/src/semantics/form-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L52) |
| <code v-pre>enableProgressiveEnhancement: actionUrl must not be empty</code> | [packages/component/src/semantics/form-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L68) |
| <code v-pre>resolveFormAction: action was not submitted</code> | [packages/component/src/semantics/form-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L83) |
| <code v-pre>rejectFormAction: resolved action cannot reject</code> | [packages/component/src/semantics/form-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L98) |
| <code v-pre>markIslandInteractive: session is $&#123;session.state&#125;</code> | [packages/component/src/semantics/islands-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L105) |
| <code v-pre>markIslandInteractive: island $&#123;islandId&#125; already interactive</code> | [packages/component/src/semantics/islands-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L108) |
| <code v-pre>assertStaticBoundary: boundary $&#123;boundaryId&#125; already asserted</code> | [packages/component/src/semantics/islands-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L127) |
| <code v-pre>bootstrapIslandsRoute: routeId must not be empty</code> | [packages/component/src/semantics/islands-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L56) |
| <code v-pre>beginIslandHydration: island $&#123;islandId&#125; not registered</code> | [packages/component/src/semantics/islands-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L88) |
| <code v-pre>beginIslandHydration: session is $&#123;session.state&#125;</code> | [packages/component/src/semantics/islands-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L91) |
| <code v-pre>initializeReactActions: actionId must not be empty</code> | [packages/component/src/semantics/react-19-actions.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/react-19-actions.ts#L48) |
| <code v-pre>beginActionTransition: session is $&#123;session.state&#125;</code> | [packages/component/src/semantics/react-19-actions.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/react-19-actions.ts#L67) |
| <code v-pre>applyOptimisticUpdate: session is $&#123;session.state&#125;</code> | [packages/component/src/semantics/react-19-actions.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/react-19-actions.ts#L81) |
| <code v-pre>resolveAction: session is $&#123;session.state&#125;</code> | [packages/component/src/semantics/react-19-actions.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/react-19-actions.ts#L93) |
| <code v-pre>startRscHarness: componentId must not be empty</code> | [packages/component/src/semantics/rsc-harness.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L21) |
| <code v-pre>beginRscRender: session is $&#123;session.state&#125;, not idle</code> | [packages/component/src/semantics/rsc-harness.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L36) |
| <code v-pre>enterSuspenseBoundary: session is $&#123;session.state&#125;, not rendering</code> | [packages/component/src/semantics/rsc-harness.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L47) |
| <code v-pre>streamHtmlChunk: session is $&#123;session.state&#125;, cannot stream</code> | [packages/component/src/semantics/rsc-harness.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L59) |
| <code v-pre>streamHtmlChunk: chunk must not be empty</code> | [packages/component/src/semantics/rsc-harness.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L62) |
| <code v-pre>completeRscRender: session is $&#123;session.state&#125;, cannot complete</code> | [packages/component/src/semantics/rsc-harness.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L75) |
| <code v-pre>failRscRender: completed session cannot fail</code> | [packages/component/src/semantics/rsc-harness.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L89) |
| <code v-pre>startStreamingSsr: routeId must not be empty</code> | [packages/component/src/semantics/streaming-ssr.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L25) |
| <code v-pre>startProgressiveHydration: $&#123;boundaryId&#125; is not pending</code> | [packages/component/src/semantics/streaming-ssr.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L72) |
| <code v-pre>completeSelectiveHydration: $&#123;boundaryId&#125; is not pending</code> | [packages/component/src/semantics/streaming-ssr.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L84) |
| <code v-pre>boundaryId must not be empty</code> | [packages/component/src/semantics/streaming-ssr.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L98) |
| <code v-pre>startViewTransitionSession: transitionId must not be empty</code> | [packages/component/src/semantics/view-transitions.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L25) |
| <code v-pre>startElementTransition: elementId must not be empty</code> | [packages/component/src/semantics/view-transitions.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L43) |
| <code v-pre>finishElementTransition: $&#123;elementId&#125; is not active</code> | [packages/component/src/semantics/view-transitions.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L55) |
| <code v-pre>startDocumentTransition: name must not be empty</code> | [packages/component/src/semantics/view-transitions.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L70) |
| <code v-pre>assertAnimation: durationMs must be &gt;= 0</code> | [packages/component/src/semantics/view-transitions.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L82) |
| <code v-pre>StoryRegistry — no entry for $&#123;id&#125;</code> | [packages/component/src/storybook.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/storybook.ts#L91) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/component/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [chromatic.ts](./api/chromatic) | 1 | 2 |
| [dom.ts](./api/dom) | 10 | 1 |
| [fixture.ts](./api/fixture) | 6 | 6 |
| [index.ts](./api/index) | 1 | 0 |
| [playwright-ct.ts](./api/playwright-ct) | 1 | 1 |
| [real-driver.ts](./api/real-driver) | 3 | 2 |
| [semantics/fidelity.ts](./api/semantics-fidelity) | 2 | 2 |
| [semantics/form-action-advanced.ts](./api/semantics-form-action-advanced) | 6 | 2 |
| [semantics/islands-architecture.ts](./api/semantics-islands-architecture) | 5 | 3 |
| [semantics/react-19-actions.ts](./api/semantics-react-19-actions) | 3 | 2 |
| [semantics/rsc-harness.ts](./api/semantics-rsc-harness) | 6 | 2 |
| [semantics/streaming-ssr.ts](./api/semantics-streaming-ssr) | 5 | 2 |
| [semantics/types.ts](./api/semantics-types) | 1 | 4 |
| [semantics/view-transitions.ts](./api/semantics-view-transitions) | 5 | 2 |
| [storybook.ts](./api/storybook) | 1 | 4 |
| [types.ts](./api/types) | 0 | 16 |

<!-- kiwa-public-api:end -->
