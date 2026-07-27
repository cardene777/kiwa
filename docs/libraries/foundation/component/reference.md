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
| `ChromaticVisualMock.review — cannot accept ${key}, no current capture found. Run capture() first.` | [packages/component/src/chromatic.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/chromatic.ts#L182) |
| `Canvas.getByText — no node with text ${JSON.stringify(text)}` | [packages/component/src/dom.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L82) |
| `Canvas.getByRole — no node with role=${role}${nameSuffix}` | [packages/component/src/dom.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L90) |
| `expected ${provider} in ${expected} mode but resolved ${resolved.mode} (${resolved.reason})` | [packages/component/src/real-driver.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/real-driver.ts#L49) |
| 'startFormActionSession: formId must not be empty' | [packages/component/src/semantics/form-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L22) |
| 'markFormStatusPending: form is already pending' | [packages/component/src/semantics/form-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L41) |
| `applyOptimisticUpdate: session is ${session.state}, not pending` | [packages/component/src/semantics/form-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L52) |
| 'enableProgressiveEnhancement: actionUrl must not be empty' | [packages/component/src/semantics/form-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L68) |
| 'resolveFormAction: action was not submitted' | [packages/component/src/semantics/form-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L83) |
| 'rejectFormAction: resolved action cannot reject' | [packages/component/src/semantics/form-action-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L98) |
| `markIslandInteractive: session is ${session.state}` | [packages/component/src/semantics/islands-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L105) |
| `markIslandInteractive: island ${islandId} already interactive` | [packages/component/src/semantics/islands-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L108) |
| `assertStaticBoundary: boundary ${boundaryId} already asserted` | [packages/component/src/semantics/islands-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L127) |
| 'bootstrapIslandsRoute: routeId must not be empty' | [packages/component/src/semantics/islands-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L56) |
| `beginIslandHydration: island ${islandId} not registered` | [packages/component/src/semantics/islands-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L88) |
| `beginIslandHydration: session is ${session.state}` | [packages/component/src/semantics/islands-architecture.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L91) |
| 'initializeReactActions: actionId must not be empty' | [packages/component/src/semantics/react-19-actions.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/react-19-actions.ts#L48) |
| `beginActionTransition: session is ${session.state}` | [packages/component/src/semantics/react-19-actions.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/react-19-actions.ts#L67) |
| `applyOptimisticUpdate: session is ${session.state}` | [packages/component/src/semantics/react-19-actions.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/react-19-actions.ts#L81) |
| `resolveAction: session is ${session.state}` | [packages/component/src/semantics/react-19-actions.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/react-19-actions.ts#L93) |
| 'startRscHarness: componentId must not be empty' | [packages/component/src/semantics/rsc-harness.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L21) |
| `beginRscRender: session is ${session.state}, not idle` | [packages/component/src/semantics/rsc-harness.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L36) |
| `enterSuspenseBoundary: session is ${session.state}, not rendering` | [packages/component/src/semantics/rsc-harness.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L47) |
| `streamHtmlChunk: session is ${session.state}, cannot stream` | [packages/component/src/semantics/rsc-harness.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L59) |
| 'streamHtmlChunk: chunk must not be empty' | [packages/component/src/semantics/rsc-harness.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L62) |
| `completeRscRender: session is ${session.state}, cannot complete` | [packages/component/src/semantics/rsc-harness.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L75) |
| 'failRscRender: completed session cannot fail' | [packages/component/src/semantics/rsc-harness.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L89) |
| 'startStreamingSsr: routeId must not be empty' | [packages/component/src/semantics/streaming-ssr.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L25) |
| `startProgressiveHydration: ${boundaryId} is not pending` | [packages/component/src/semantics/streaming-ssr.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L72) |
| `completeSelectiveHydration: ${boundaryId} is not pending` | [packages/component/src/semantics/streaming-ssr.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L84) |
| 'boundaryId must not be empty' | [packages/component/src/semantics/streaming-ssr.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L98) |
| 'startViewTransitionSession: transitionId must not be empty' | [packages/component/src/semantics/view-transitions.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L25) |
| 'startElementTransition: elementId must not be empty' | [packages/component/src/semantics/view-transitions.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L43) |
| `finishElementTransition: ${elementId} is not active` | [packages/component/src/semantics/view-transitions.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L55) |
| 'startDocumentTransition: name must not be empty' | [packages/component/src/semantics/view-transitions.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L70) |
| 'assertAnimation: durationMs must be >= 0' | [packages/component/src/semantics/view-transitions.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L82) |
| `StoryRegistry — no entry for ${id}` | [packages/component/src/storybook.ts](https://github.com/cardene777/kiwa/blob/main/packages/component/src/storybook.ts#L91) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/component/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `addHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L53) `packages/component/src/dom.ts`

event handler を登録、 同一 event に複数 handler を許容する。

```ts
export function addHandler(node: MockNode, event: string, handler: (event: MockEvent) => void): void;
```

#### `appendChild`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L47) `packages/component/src/dom.ts`

node に child を追加、 parent back reference も更新する。

```ts
export function appendChild(parent: MockNode, child: MockNode): void;
```

#### `applyOptimisticUpdate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L47) `packages/component/src/semantics/form-action-advanced.ts`

```ts
export function applyOptimisticUpdate<TForm extends Record<string, unknown>>(
  session: FormActionSession<TForm>,
  patch: Partial<TForm>,
): AxisStep<FormActionState>;
```

#### `applyReactActionOptimistic`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/react-19-actions.ts#L76) `packages/component/src/semantics/react-19-actions.ts`

```ts
export function applyReactActionOptimistic(
  session: ReactActionsSession,
  optimisticValue: string,
): AxisStep<ReactActionsState>;
```

#### `assertAnimation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L77) `packages/component/src/semantics/view-transitions.ts`

```ts
export function assertAnimation(
  session: ViewTransitionSession,
  input: { assertionId: string; durationMs: number; easing?: string },
): AxisStep<ViewTransitionState>;
```

#### `assertMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/real-driver.ts#L42) `packages/component/src/real-driver.ts`

```ts
export function assertMode(
  provider: ComponentTarget,
  expected: KiwaTestMode,
  env: Record<string, string | undefined> = process.env,
): void;
```

#### `assertStaticBoundary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L122) `packages/component/src/semantics/islands-architecture.ts`

```ts
export function assertStaticBoundary(
  session: IslandsSession,
  boundaryId: string,
): AxisStep<IslandsState>;
```

#### `beginActionTransition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/react-19-actions.ts#L63) `packages/component/src/semantics/react-19-actions.ts`

```ts
export function beginActionTransition(
  session: ReactActionsSession,
): AxisStep<ReactActionsState>;
```

#### `beginIslandHydration`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L82) `packages/component/src/semantics/islands-architecture.ts`

```ts
export function beginIslandHydration(
  session: IslandsSession,
  islandId: string,
): AxisStep<IslandsState>;
```

#### `beginRscRender`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L34) `packages/component/src/semantics/rsc-harness.ts`

```ts
export function beginRscRender(session: RscHarnessSession): AxisStep<RscHarnessState>;
```

#### `bootstrapIslandsRoute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L51) `packages/component/src/semantics/islands-architecture.ts`

```ts
export function bootstrapIslandsRoute(input: {
  target: ComponentTarget;
  routeId: string;
}): IslandsSession;
```

#### `buildButton`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L31) `packages/component/src/fixture.ts`

Button — text label + optional click handler + disabled state。 variant は class 属性に反映 (chromatic diff で variant 別 baseline を持てる)。

```ts
export declare const buildButton: ComponentRender<ButtonArgs>;
```

#### `buildCard`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L234) `packages/component/src/fixture.ts`

Card — title / body / optional footer の 3 slot。 chromatic diff で variant 別 baseline を持つ用途の代表 pattern。

```ts
export declare const buildCard: ComponentRender<CardArgs>;
```

#### `buildForm`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L112) `packages/component/src/fixture.ts`

Form — title + 複数 input + submit button。 submit 時に全 field の value を 集めて onSubmit に渡す。 required field 未入力なら submit を発火しない (validation)、 UI 側で「必須」 表示を出す責務。

```ts
export declare const buildForm: ComponentRender<FormArgs>;
```

#### `buildInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L66) `packages/component/src/fixture.ts`

Input — label + input の pair、 label[for] で id を関連付ける (a11y label rule を pass する)。 onChange は input event で発火。

```ts
export declare const buildInput: ComponentRender<InputArgs>;
```

#### `buildModal`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L177) `packages/component/src/fixture.ts`

Modal — open=false なら空 div を返す (closed 状態を表現)。 open=true で backdrop + dialog を組む。 backdrop click / close button click で onClose を発火。

```ts
export declare const buildModal: ComponentRender<ModalArgs>;
```

#### `captureErrorBoundary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L48) `packages/component/src/semantics/streaming-ssr.ts`

```ts
export function captureErrorBoundary(
  session: StreamingSsrSession,
  input: { boundaryId: string; error: Error | string; recoverable?: boolean },
): AxisStep<StreamingSsrState>;
```

#### `collectFidelityCoverage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/fidelity.ts#L56) `packages/component/src/semantics/fidelity.ts`

```ts
export function collectFidelityCoverage(
  providers: ComponentTarget[] = ['storybook8', 'playwright-ct', 'chromatic'],
): FidelityCoverage;
```

#### `completeRscRender`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L73) `packages/component/src/semantics/rsc-harness.ts`

```ts
export function completeRscRender(session: RscHarnessSession): AxisStep<RscHarnessState>;
```

#### `completeSelectiveHydration`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L78) `packages/component/src/semantics/streaming-ssr.ts`

```ts
export function completeSelectiveHydration(
  session: StreamingSsrSession,
  boundaryId: string,
): AxisStep<StreamingSsrState>;
```

#### `COMPONENT_AXIS_TO_EVENTS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/fidelity.ts#L16) `packages/component/src/semantics/fidelity.ts`

```ts
export declare const COMPONENT_AXIS_TO_EVENTS: Record<ComponentAxis, NeutralEventName[]>;
```

#### `componentFixtures`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L260) `packages/component/src/fixture.ts`

全 component の render function を 1 record にまとめる (test 一括登録用)。

```ts
export declare const componentFixtures: Record<string, ComponentRender<Record<string, unknown>>>;
```

#### `createCanvas`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L76) `packages/component/src/dom.ts`

CanvasElement 生成 — root node と lookup helpers を wrap する。 mount 完了後 story / component test / visual capture の全経路で使う。

```ts
export function createCanvas(root: MockNode): CanvasElement;
```

#### `createChromaticVisualMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/chromatic.ts#L73) `packages/component/src/chromatic.ts`

ChromaticVisualMock を新規作成する。 baseline / current / review を全て in-memory Map で保持し、 reset() で全 clear できる (test isolation 用)。

```ts
export function createChromaticVisualMock(config: ChromaticConfig = {}): ChromaticVisualMock;
```

#### `createNode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L17) `packages/component/src/dom.ts`

node factory — attrs / children / text / value を任意で与える。

```ts
export function createNode(tag: string, options: NodeOptions = {}): MockNode;
```

#### `createPlaywrightCTMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/playwright-ct.ts#L46) `packages/component/src/playwright-ct.ts`

PlaywrightCTMock を新規作成する。 mount 毎に in-memory canvas を組み、 ComponentLocator に wrap して返す。 activeMounts count は resource leak 検出用 (test で unmount 忘れを assert できる)。

```ts
export function createPlaywrightCTMock(): PlaywrightCTMock;
```

#### `createStoryRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/storybook.ts#L75) `packages/component/src/storybook.ts`

Registry を新規作成する。 内部は `Map&lt;storyId, StoryEntry&gt;`、 story id は `title--storyName` (Storybook 8 の SB URL param 互換 lowercase / kebab-case)。

```ts
export function createStoryRegistry(): StoryRegistry;
```

#### `enableProgressiveEnhancement`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L63) `packages/component/src/semantics/form-action-advanced.ts`

```ts
export function enableProgressiveEnhancement<TForm extends Record<string, unknown>>(
  session: FormActionSession<TForm>,
  input: { method?: 'post' | 'get'; actionUrl: string },
): AxisStep<FormActionState>;
```

#### `enterSuspenseBoundary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L42) `packages/component/src/semantics/rsc-harness.ts`

```ts
export function enterSuspenseBoundary(
  session: RscHarnessSession,
  fallback: string = session.suspenseFallback ?? '<template data-suspense="pending"></template>',
): AxisStep<RscHarnessState>;
```

#### `failRscRender`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L84) `packages/component/src/semantics/rsc-harness.ts`

```ts
export function failRscRender(
  session: RscHarnessSession,
  error: Error | string,
): AxisStep<RscHarnessState>;
```

#### `findByRole`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L144) `packages/component/src/dom.ts`

role 属性 (`role="button"`) or implicit role (button tag) と、 aria-label / text で一致する node を返す。 mock は最小 subset (button / link / heading / textbox / checkbox) のみ。

```ts
export function findByRole(node: MockNode, role: string, accessibleName?: string): MockNode | null;
```

#### `findByText`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L130) `packages/component/src/dom.ts`

text 一致で最初に見つかった node を返す。 深い node を優先する — root 側の aggregated text ではなく、 実際に text を持つ leaf 相当の node を先に返す (Storybook / Testing Library の getByText 挙動と揃える)。

```ts
export function findByText(node: MockNode, text: string): MockNode | null;
```

#### `finishElementTransition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L50) `packages/component/src/semantics/view-transitions.ts`

```ts
export function finishElementTransition(
  session: ViewTransitionSession,
  elementId: string,
): AxisStep<ViewTransitionState>;
```

#### `fireEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L64) `packages/component/src/dom.ts`

event を発火する。 実 DOM のような bubble はせず target 単発、 mock harness では component 側で bubble 相当を実装する。 fill 相当は input event を発火。

```ts
export function fireEvent(node: MockNode, event: MockEvent): void;
```

#### `hashMarkup`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L121) `packages/component/src/dom.ts`

markup 文字列を deterministic SHA-256 hex substring (先頭 16) に変換。

```ts
export function hashMarkup(markup: string): string;
```

#### `initializeReactActions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/react-19-actions.ts#L43) `packages/component/src/semantics/react-19-actions.ts`

```ts
export function initializeReactActions(input: {
  target: ComponentTarget;
  actionId: string;
}): ReactActionsSession;
```

#### `markFormStatusPending`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L36) `packages/component/src/semantics/form-action-advanced.ts`

```ts
export function markFormStatusPending<TForm extends Record<string, unknown>>(
  session: FormActionSession<TForm>,
  submitter: string,
): AxisStep<FormActionState>;
```

#### `markIslandInteractive`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L100) `packages/component/src/semantics/islands-architecture.ts`

```ts
export function markIslandInteractive(
  session: IslandsSession,
  islandId: string,
): AxisStep<IslandsState>;
```

#### `markSuspensePending`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L38) `packages/component/src/semantics/streaming-ssr.ts`

```ts
export function markSuspensePending(
  session: StreamingSsrSession,
  boundaryId: string,
): AxisStep<StreamingSsrState>;
```

#### `providerEventName`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/types.ts#L112) `packages/component/src/semantics/types.ts`

```ts
export function providerEventName(target: ComponentTarget, neutral: NeutralEventName): string;
```

#### `query`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L215) `packages/component/src/dom.ts`

querySelector の最小 subset。 tag / .class / #id / [attr=value] / 子孫 (space) 結合子を support する。 実 CSS selector 全対応ではないが、 mock 用途では十分。 MockNode tree では canvas.root が component 自体を指すため、 root も検査対象 に含める (実 DOM の `document.querySelector` は container を除くが、 mock は component rendering root = 検索対象という semantics に揃える)。

```ts
export function query(root: MockNode, selector: string, all: boolean): MockNode[];
```

#### `registerIsland`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L69) `packages/component/src/semantics/islands-architecture.ts`

```ts
export function registerIsland(
  session: IslandsSession,
  island: IslandSpec,
): AxisStep<IslandsState>;
```

#### `rejectFormAction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L93) `packages/component/src/semantics/form-action-advanced.ts`

```ts
export function rejectFormAction<TForm extends Record<string, unknown>>(
  session: FormActionSession<TForm>,
  error: Error | string,
): AxisStep<FormActionState>;
```

#### `renderMarkup`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L105) `packages/component/src/dom.ts`

MockNode subtree を deterministic な pseudo-HTML 文字列に変換する。 event handler は含めず、 tag / attrs / text / children のみ。 Chromatic の hash / markup 保存に使う。

```ts
export function renderMarkup(node: MockNode): string;
```

#### `resolveAction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/react-19-actions.ts#L88) `packages/component/src/semantics/react-19-actions.ts`

```ts
export function resolveAction(
  session: ReactActionsSession,
  resolvedValue: string,
): AxisStep<ReactActionsState>;
```

#### `resolveAllModes`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/real-driver.ts#L35) `packages/component/src/real-driver.ts`

```ts
export function resolveAllModes(
  env: Record<string, string | undefined> = process.env,
): ResolvedMode[];
```

#### `resolveFormAction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L78) `packages/component/src/semantics/form-action-advanced.ts`

```ts
export function resolveFormAction<TForm extends Record<string, unknown>>(
  session: FormActionSession<TForm>,
  result: Partial<TForm>,
): AxisStep<FormActionState>;
```

#### `resolveMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/real-driver.ts#L17) `packages/component/src/real-driver.ts`

```ts
export function resolveMode(
  provider: ComponentTarget,
  env: Record<string, string | undefined> = process.env,
): ResolvedMode;
```

#### `startDocumentTransition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L65) `packages/component/src/semantics/view-transitions.ts`

```ts
export function startDocumentTransition(
  session: ViewTransitionSession,
  input: { name: string; fromUrl: string; toUrl: string },
): AxisStep<ViewTransitionState>;
```

#### `startElementTransition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L38) `packages/component/src/semantics/view-transitions.ts`

```ts
export function startElementTransition(
  session: ViewTransitionSession,
  input: { elementId: string; from: string; to: string },
): AxisStep<ViewTransitionState>;
```

#### `startFormActionSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L16) `packages/component/src/semantics/form-action-advanced.ts`

```ts
export function startFormActionSession<TForm extends Record<string, unknown>>(input: {
  target: ComponentTarget;
  formId: string;
  initial: TForm;
}): FormActionSession<TForm>;
```

#### `startProgressiveHydration`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L66) `packages/component/src/semantics/streaming-ssr.ts`

```ts
export function startProgressiveHydration(
  session: StreamingSsrSession,
  boundaryId: string,
): AxisStep<StreamingSsrState>;
```

#### `startRscHarness`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L15) `packages/component/src/semantics/rsc-harness.ts`

```ts
export function startRscHarness(input: {
  target: ComponentTarget;
  componentId: string;
  suspenseFallback?: string;
}): RscHarnessSession;
```

#### `startStreamingSsr`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L20) `packages/component/src/semantics/streaming-ssr.ts`

```ts
export function startStreamingSsr(input: {
  target: ComponentTarget;
  routeId: string;
}): StreamingSsrSession;
```

#### `startViewTransitionSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L20) `packages/component/src/semantics/view-transitions.ts`

```ts
export function startViewTransitionSession(input: {
  target: ComponentTarget;
  transitionId: string;
}): ViewTransitionSession;
```

#### `streamHtmlChunk`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L54) `packages/component/src/semantics/rsc-harness.ts`

```ts
export function streamHtmlChunk(
  session: RscHarnessSession,
  chunk: string,
): AxisStep<RscHarnessState>;
```

### 型

#### `A11yViolation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L132) `packages/component/src/types.ts`

a11y violation を 1 件模倣。 実 axe-core の Result と field を揃える。 (mock harness では injectViolations で外部から注入して test 対象にする)

```ts
export interface A11yViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  helpUrl?: string;
  nodes: Array<{ target: string[]; html: string }>;
}
```

#### `AxisStep`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/types.ts#L47) `packages/component/src/semantics/types.ts`

```ts
export interface AxisStep<TState extends string> {
  neutralEvent: NeutralEventName;
  providerEvent: string;
  state: TState;
  amountCents: number;
  metadata: Record<string, string | number | boolean>;
}
```

#### `ButtonArgs`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L20) `packages/component/src/fixture.ts`

5 pattern の共通 component fixture。 Storybook story / Playwright CT mount / Chromatic capture の 3 経路で共有できる framework agnostic renderer。 実 SB / PW CT / Chromatic に持込む時は各 framework (React / Vue / Svelte / Solid) の component として書換えるが、 test だけ回す用途はこの fixture で完結する。 5 pattern の選定理由 = SaaS frontend で頻出する 5 primitive を全 cover する。 - Button (interactive、 click event、 disabled state) - Input (controlled、 input event、 label association) - Form (submit event、 field 集約、 validation) - Modal (open/close state、 backdrop click、 escape close) - Card (content wrapping、 title + body、 optional footer)

```ts
export interface ButtonArgs {
  label: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: (event: MockEvent) => void;
}
```

#### `CanvasElement`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L82) `packages/component/src/types.ts`

mount 済 root の抽象 handle。 実 DOM ではなく、 in-memory な要素 tree として 扱う。 test は `getByText` / `getByRole` / `querySelector` の subset を通じて 要素を取り出し、 `click` / `fill` / `assert` を実行する。

```ts
export interface CanvasElement {
  /** mount 時に render された root node。 */
  root: MockNode;
  /** 要素 lookup helpers (最小 subset)。 */
  getByText(text: string): MockNode;
  getByRole(role: string, options?: { name?: string }): MockNode;
  querySelector(selector: string): MockNode | null;
  querySelectorAll(selector: string): MockNode[];
  /** capture 時のセルフ dump (Chromatic に渡す markup 表現)。 */
  toMarkup(): string;
}
```

#### `CardArgs`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L223) `packages/component/src/fixture.ts`

```ts
export interface CardArgs {
  title: string;
  body: string;
  footer?: string;
  variant?: 'default' | 'outlined' | 'elevated';
}
```

#### `ChromaticConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/chromatic.ts#L200) `packages/component/src/chromatic.ts`

```ts
export interface ChromaticConfig {
  /** viewport 名の default (未指定 story の 1 件 capture 時に使う)。 */
  defaultViewport?: string;
  /** parameters.chromatic.diffThreshold 未指定時の default。 default = 0 (完全一致で pass)。 */
  defaultDiffThreshold?: number;
  /** capturedAt / reviewedAt 用の deterministic time source (test 決定性)。 */
  now?: () => number;
}
```

#### `ChromaticVisualMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/chromatic.ts#L29) `packages/component/src/chromatic.ts`

Chromatic 型の visual regression mock。 real Chromatic は Storybook 8 を headless で snapshot 撮り、 baseline JSON を server 側に置いて diff を pixel single で計算する。 mock harness は browser を起動せず、 mount 後の MockNode を `renderMarkup` で pseudo-HTML 化 → SHA-256 hash → hash 比較で changed 判定を行う (pixel diff は hash 完全一致 = 0、 不一致 = 1、 partial diff の連続値は mock 対象外)。 mock で意味のある semantic は 4 つ ... (1) baseline capture (未登録なら status='new'、 hash を保存) (2) current capture + diff (hash 一致で passed、 不一致で failed / changed) (3) diffThreshold の適用 (StoryEntry.parameters.chromatic.diffThreshold) (4) accept / reject workflow (accept で baseline を current で置換) multi viewport support = parameters.chromatic.viewports に列挙された viewport 名を 1 回ずつ capture し、 viewport × storyId 単位で baseline / diff を管理。

```ts
export interface ChromaticVisualMock {
  /** baseline / current 群を全 clear。 test 間の isolation 用。 */
  reset(): void;
  /** baseline を明示 seed (test setup で初期状態を作る時使う)。 */
  seedBaseline(input: {
    storyId: string;
    viewport: string;
    markup: string;
    capturedAt?: number;
  }): VisualBaseline;
  /** 1 story × 1 viewport を capture、 baseline 不在なら status='new'。 */
  capture(input: {
    entry: StoryEntry;
    canvas: CanvasElement;
    viewport?: string;
    now?: number;
  }): VisualDiff;
  /**
   * 1 story を parameters.chromatic.viewports 全 viewport で一括 capture。
   * viewports 未指定 or 空なら 'default' viewport 1 件のみ。 disabled story は
   * skip (空配列を返す)。
   */
  captureAll(input: {
    entry: StoryEntry;
    canvas: CanvasElement;
    now?: number;
  }): VisualDiff[];
  /** accept / reject 1 件。 accept は baseline を current 相当で置換する。 */
  review(input: {
    storyId: string;
    viewport: string;
    action: VisualReviewAction;
    reviewedAt?: number;
  }): VisualReviewEntry;
  /** review 履歴一覧 (test で workflow を assert する時使う)。 */
  reviewHistory(): VisualReviewEntry[];
  /** baseline 一覧 (test 用 introspection)。 */
  baselines(): VisualBaseline[];
}
```

#### `ComponentAxis`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/types.ts#L10) `packages/component/src/semantics/types.ts`

```ts
export type ComponentAxis =
  | 'rsc-harness'
  | 'streaming-ssr'
  | 'view-transitions'
  | 'form-action-advanced'
  // v1.49 advanced III (pair 第 6 pair 3 段拡張)
  | 'react-19-actions'
  | 'islands-architecture';
```

#### `ComponentLocator`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L159) `packages/component/src/types.ts`

Playwright CT の `mount(component)` が返す ComponentLocator の subset。 実 Playwright CT は `Locator` を返して page 全体を操作するが、 mock は mount 済 canvas を直接返して interact に集中する。

```ts
export interface ComponentLocator {
  /** mount 時に生成された canvas。 */
  canvas: CanvasElement;
  /** locator chain の起点 element。 */
  root: MockNode;
  /** テキスト locator の subset。 */
  getByText(text: string): NodeLocator;
  getByRole(role: string, options?: { name?: string }): NodeLocator;
  /** element を unmount して event handler を全 clear する。 */
  unmount(): void;
}
```

#### `ComponentProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L17) `packages/component/src/types.ts`

どの integration が emit した mock かを識別する。 release-gate 11 軸 dispatch の provider prefix として使う。

```ts
export type ComponentProvider = 'storybook' | 'playwright-ct' | 'chromatic';
```

#### `ComponentRender`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L100) `packages/component/src/types.ts`

mount 対象の component 表現。 実 React / Vue / Svelte component を直接 扱わず、 純関数 `(args) =&gt; MockNode` として抽象化する。 mock harness は framework agnostic — Storybook の render callback / Playwright CT の component 引数 / Chromatic の capture 対象を同じ関数で表現する。

```ts
export type ComponentRender<TArgs = Record<string, unknown>> = (args: TArgs) => MockNode;
```

#### `ComponentTarget`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/types.ts#L8) `packages/component/src/semantics/types.ts`

Advanced component semantics — target-neutral axis SSOT. The component package spans Storybook 8, Playwright Component Testing, and Chromatic. These helpers model the observable semantics without importing any of those runtimes, so the same axis can be replayed against each target.

```ts
export type ComponentTarget = 'storybook8' | 'playwright-ct' | 'chromatic';
```

#### `FidelityCoverage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/fidelity.ts#L10) `packages/component/src/semantics/fidelity.ts`

```ts
export interface FidelityCoverage {
  providers: ComponentTarget[];
  axes: ComponentAxis[];
  rows: FidelityRow[];
}
```

#### `FidelityRow`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/fidelity.ts#L3) `packages/component/src/semantics/fidelity.ts`

```ts
export interface FidelityRow {
  provider: ComponentTarget;
  axis: ComponentAxis;
  neutralEvents: NeutralEventName[];
  providerEvents: string[];
}
```

#### `FormActionSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L5) `packages/component/src/semantics/form-action-advanced.ts`

```ts
export interface FormActionSession<TForm extends Record<string, unknown> = Record<string, unknown>> {
  target: ComponentTarget;
  formId: string;
  state: FormActionState;
  form: TForm;
  optimisticPatches: Array<Partial<TForm>>;
  enhanced: boolean;
  history: AxisStep<FormActionState>[];
  error: string | null;
}
```

#### `FormActionState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L3) `packages/component/src/semantics/form-action-advanced.ts`

```ts
export type FormActionState = 'idle' | 'pending' | 'optimistic' | 'enhanced' | 'resolved' | 'rejected';
```

#### `FormArgs`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L100) `packages/component/src/fixture.ts`

```ts
export interface FormArgs {
  title: string;
  fields: FormField[];
  submitLabel?: string;
  onSubmit?: (data: Record<string, string>) => void;
}
```

#### `FormField`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L92) `packages/component/src/fixture.ts`

```ts
export interface FormField {
  id: string;
  label: string;
  type?: InputArgs['type'];
  required?: boolean;
  value?: string;
}
```

#### `InputArgs`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L52) `packages/component/src/fixture.ts`

```ts
export interface InputArgs {
  id: string;
  label: string;
  value?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  required?: boolean;
  placeholder?: string;
  onChange?: (event: MockEvent) => void;
}
```

#### `IslandSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L15) `packages/component/src/semantics/islands-architecture.ts`

```ts
export interface IslandSpec {
  islandId: string;
  loadStrategy: 'load' | 'idle' | 'visible' | 'media' | 'only';
  interactiveBoundary: boolean;
}
```

#### `IslandsSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L21) `packages/component/src/semantics/islands-architecture.ts`

```ts
export interface IslandsSession {
  target: ComponentTarget;
  routeId: string;
  islands: IslandSpec[];
  state: IslandsState;
  hydratedIslandIds: string[];
  staticBoundaryIds: string[];
  history: AxisStep<IslandsState>[];
}
```

#### `IslandsState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/islands-architecture.ts#L8) `packages/component/src/semantics/islands-architecture.ts`

v1.49 islands-architecture axis — Astro / Deno Fresh / Solid Start の Islands architecture (partial hydration + selective interactivity) を target-neutral に扱う state machine。

```ts
export type IslandsState =
  | 'idle'
  | 'registered'
  | 'hydrating'
  | 'interactive'
  | 'static-verified';
```

#### `KiwaTestMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/real-driver.ts#L3) `packages/component/src/real-driver.ts`

```ts
export type KiwaTestMode = 'mock' | 'real';
```

#### `MockEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L121) `packages/component/src/types.ts`

event handler に渡す minimal event object。

```ts
export interface MockEvent {
  type: string;
  target: MockNode;
  /** input event 時の value。 */
  value?: string;
}
```

#### `MockNode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L107) `packages/component/src/types.ts`

in-memory な DOM node 表現。 実 DOM を使わず tag / attrs / children / text で tree を組む。 test で `click` / `fill` / `text` 操作を行うため event listener + value state だけ持たせる。

```ts
export interface MockNode {
  tag: string;
  attrs: Record<string, string>;
  text?: string;
  children: MockNode[];
  /** input / textarea の value (fill 操作で更新)。 */
  value?: string;
  /** on{event} handlers ({ click: [fn1, fn2], input: [fn3] })。 */
  handlers: Record<string, Array<(event: MockEvent) => void>>;
  /** parent への back reference (querySelector traversal 用)。 */
  parent: MockNode | null;
}
```

#### `ModalArgs`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/fixture.ts#L164) `packages/component/src/fixture.ts`

```ts
export interface ModalArgs {
  open: boolean;
  title: string;
  body: string;
  onClose?: () => void;
  closeOnBackdrop?: boolean;
}
```

#### `NeutralEventName`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/types.ts#L19) `packages/component/src/semantics/types.ts`

```ts
export type NeutralEventName =
  | 'rsc.render_started'
  | 'rsc.suspense_boundary'
  | 'rsc.html_chunk_streamed'
  | 'rsc.render_completed'
  | 'ssr.suspense_pending'
  | 'ssr.error_boundary_captured'
  | 'ssr.progressive_hydration_started'
  | 'ssr.selective_hydration_completed'
  | 'transition.element_started'
  | 'transition.element_finished'
  | 'transition.document_started'
  | 'transition.animation_asserted'
  | 'form.status_pending'
  | 'form.optimistic_applied'
  | 'form.progressive_enhanced'
  | 'form.action_resolved'
  // v1.49 react-19-actions (useActionState + useOptimistic + useFormStatus 統合)
  | 'action.state_initialized'
  | 'action.transition_pending'
  | 'action.optimistic_committed'
  | 'action.resolved'
  // v1.49 islands-architecture (partial hydration + selective interactivity)
  | 'islands.registered'
  | 'islands.hydration_started'
  | 'islands.interactive_ready'
  | 'islands.static_boundary_asserted';
```

#### `NodeLocator`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L175) `packages/component/src/types.ts`

Playwright Locator の subset — click / fill / textContent / count / expect。 mock は同一 API で real Playwright test と表面互換にする。

```ts
export interface NodeLocator {
  click(): Promise<void>;
  fill(value: string): Promise<void>;
  textContent(): Promise<string | null>;
  count(): Promise<number>;
  /** 対象 node への直接 access (mock 側 assert 用)。 */
  node(): MockNode | null;
}
```

#### `NodeOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/dom.ts#L38) `packages/component/src/dom.ts`

```ts
export interface NodeOptions {
  attrs?: Record<string, string>;
  text?: string;
  value?: string;
  children?: MockNode[];
  on?: Record<string, (event: MockEvent) => void>;
}
```

#### `PlayContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L65) `packages/component/src/types.ts`

Storybook 8 の PlayFunction が受ける context。 mock 互換用に最小 shape のみ。

```ts
export interface PlayContext<TArgs = Record<string, unknown>> {
  /** mount 済 root element (mock では in-memory DOM の抽象 handle)。 */
  canvasElement: CanvasElement;
  /** resolve 済 args (default + override の merge 後)。 */
  args: TArgs;
  /**
   * step wrapper — Storybook 8 の `step('label', async () => {...})` 互換。
   * mock では single-thread に順次実行、 label を trace に記録する。
   */
  step: (label: string, fn: () => Promise<void> | void) => Promise<void>;
}
```

#### `PlaywrightCTMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/playwright-ct.ts#L30) `packages/component/src/playwright-ct.ts`

Playwright Component Testing (CT) 互換の最小 mock。 real Playwright CT は `mount(component)` → `Locator` を返し、 `page.getByText().click()` 等で interact する。 mock は同じ API 表面 (mount / getByText / getByRole / click / fill / textContent / count) を持ち、 real vs mock で同じ test を回せる。 実 Playwright CT との差分 = (1) browser process を起動しない (in-memory)、 (2) network request の intercept / route は非 support (別の kiwa mock で 対応)、 (3) screenshot は Chromatic 経路に一本化する。 使い方 ... ```ts const ct = createPlaywrightCTMock(); const button = ct.mount((args) =&gt; createNode('button', { text: args.label, on: { click: args.onClick } }), { label: 'ok', onClick: () =&gt; hits++ }); await button.getByRole('button', { name: 'ok' }).click(); expect(hits).toBe(1); ```

```ts
export interface PlaywrightCTMock {
  mount<TArgs>(
    render: ComponentRender<TArgs>,
    args: TArgs,
  ): ComponentLocator;
  /** mount 済 locator 一覧 (test teardown で全 unmount する時使う)。 */
  activeMounts(): number;
  /** 全 mount を解放する — vitest afterEach 相当の cleanup。 */
  unmountAll(): void;
}
```

#### `ReactActionsSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/react-19-actions.ts#L13) `packages/component/src/semantics/react-19-actions.ts`

```ts
export interface ReactActionsSession {
  target: ComponentTarget;
  actionId: string;
  state: ReactActionsState;
  pendingCount: number;
  optimisticValues: string[];
  resolvedValue: string | null;
  history: AxisStep<ReactActionsState>[];
}
```

#### `ReactActionsState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/react-19-actions.ts#L7) `packages/component/src/semantics/react-19-actions.ts`

v1.49 react-19-actions axis — useActionState + useOptimistic + useFormStatus を統合した React 19 Actions API の deterministic state machine。

```ts
export type ReactActionsState =
  | 'idle'
  | 'transition-pending'
  | 'optimistic-committed'
  | 'resolved';
```

#### `ResolvedMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/real-driver.ts#L5) `packages/component/src/real-driver.ts`

```ts
export interface ResolvedMode {
  mode: KiwaTestMode;
  provider: ComponentTarget;
  reason: 'default-mock' | 'kiwa-mode-real' | 'missing-key' | 'invalid-mode';
}
```

#### `RscHarnessSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L5) `packages/component/src/semantics/rsc-harness.ts`

```ts
export interface RscHarnessSession {
  target: ComponentTarget;
  componentId: string;
  state: RscHarnessState;
  chunks: string[];
  suspenseFallback: string | null;
  history: AxisStep<RscHarnessState>[];
  error: string | null;
}
```

#### `RscHarnessState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/rsc-harness.ts#L3) `packages/component/src/semantics/rsc-harness.ts`

```ts
export type RscHarnessState = 'idle' | 'rendering' | 'suspended' | 'streaming' | 'completed' | 'errored';
```

#### `StoryEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L144) `packages/component/src/types.ts`

StoryRegistry の 1 entry — story ID → StoryObj + render + meta の bind。 Storybook 8 の `Meta` + `StoryObj` を 1 record に flatten した shape。

```ts
export interface StoryEntry<TArgs = Record<string, unknown>> {
  id: string;
  title: string;
  storyName: string;
  args: TArgs;
  render: ComponentRender<TArgs>;
  play?: (context: PlayContext<TArgs>) => Promise<void> | void;
  parameters: StoryParameters;
}
```

#### `StoryMeta`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/storybook.ts#L39) `packages/component/src/storybook.ts`

Storybook 8 の CSF3 と互換な最小 mock。 real Storybook (SB8) は Meta + StoryObj 単位で `.stories.tsx` を書き、 storybook が collect して registry を作る。 mock はその registry 相当を in-memory Map で表現する。 使い方 ... ```ts const registry = createStoryRegistry(); registry.register({ title: 'Button', render: (args) =&gt; createNode('button', { text: args.label }), stories: { Primary: { args: { label: 'Click me' } }, Disabled: { args: { label: 'nope', disabled: true } }, }, }); const canvas = await registry.mount('Button', 'Primary'); await registry.play('Button', 'Primary', canvas); ``` SB8 の実 API 互換で意識するのは (1) StoryObj.args の merge (2) play の step wrapper (3) parameters.chromatic / parameters.a11y の透過保持 の 3 点。 実 SB8 の docs mode / decorators / loaders / addons は mock 対象外 (テストが吸収する semantic は絞る)。

```ts
export interface StoryMeta<TArgs = Record<string, unknown>> {
  /** Storybook の title (e.g. 'Components/Button')。 */
  title: string;
  /** args → MockNode の render 関数、 framework agnostic。 */
  render: ComponentRender<TArgs>;
  /** meta 単位の default args (story 単位で override 可)。 */
  args?: Partial<TArgs>;
  /** meta 単位の default parameters (story 単位で shallow merge)。 */
  parameters?: StoryParameters;
  /** 登録する story 群、 key が story 名になる。 */
  stories: Record<string, StoryObj<TArgs>>;
}
```

#### `StoryMountResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/storybook.ts#L52) `packages/component/src/storybook.ts`

```ts
export interface StoryMountResult {
  canvas: CanvasElement;
  entry: StoryEntry<Record<string, unknown>>;
}
```

#### `StoryObj`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L27) `packages/component/src/types.ts`

Storybook 8 の `StoryObj` (CSF3) と互換な最小 shape。 args + play + parameters の 3 field を持ち、 story 登録後に registry から名前指定で resolve できる。 Storybook 8 の実際の `StoryObj` は component / render / decorators 等の 追加 field を持つが、 mock harness は「args を解決して play を回して DOM を触る」 core loop だけを模倣する。

```ts
export interface StoryObj<TArgs = Record<string, unknown>> {
  /** story 表示名 (未指定時は export 名を使う想定、 mock では登録時に必須)。 */
  name?: string;
  /** default args (registry で resolve 時 override args と shallow merge)。 */
  args?: Partial<TArgs>;
  /**
   * play function — story mount 後に interaction を実行する。 Storybook 8 の
   * PlayFunction と互換な `{ canvasElement, args, step }` を受ける。
   */
  play?: (context: PlayContext<TArgs>) => Promise<void> | void;
  /** story 単位の parameters (chromatic viewport, layout 等)。 */
  parameters?: StoryParameters;
}
```

#### `StoryParameters`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L42) `packages/component/src/types.ts`

Storybook 8 の `parameters` field の最小 shape。 mock で意味のある値のみ抽出。

```ts
export interface StoryParameters {
  /** chromatic diffThreshold (0-1)、 viewport 名一覧、 delay ms 等。 */
  chromatic?: {
    /** pixel diff の許容率 (0-1)、 default 0)。 */
    diffThreshold?: number;
    /** capture 時の viewport 名一覧 (ChromaticVisualMock で切替)。 */
    viewports?: string[];
    /** capture 前に待つ ms、 mock では noop。 */
    delay?: number;
    /** true なら chromatic capture 対象外。 */
    disable?: boolean;
  };
  /** a11y addon parameters (rules disable/enable、 mock で violations を模倣)。 */
  a11y?: {
    disable?: boolean;
    /** violation を 1 件模倣、 test で violations 検出を assert できる。 */
    injectViolations?: A11yViolation[];
  };
  /** layout hint (centered / fullscreen / padded)、 mock では未使用。 */
  layout?: 'centered' | 'fullscreen' | 'padded';
}
```

#### `StoryPlayResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/storybook.ts#L57) `packages/component/src/storybook.ts`

```ts
export interface StoryPlayResult {
  steps: Array<{ label: string; ok: boolean; error?: string }>;
  ok: boolean;
}
```

#### `StoryRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/storybook.ts#L62) `packages/component/src/storybook.ts`

```ts
export interface StoryRegistry {
  register<TArgs>(meta: StoryMeta<TArgs>): void;
  list(): StoryEntry[];
  get(title: string, storyName: string): StoryEntry;
  mount(title: string, storyName: string, overrideArgs?: Record<string, unknown>): StoryMountResult;
  play(title: string, storyName: string, canvas: CanvasElement, args?: Record<string, unknown>): Promise<StoryPlayResult>;
  runA11y(title: string, storyName: string, canvas: CanvasElement): { violations: A11yViolation[] };
}
```

#### `StreamingSsrSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L10) `packages/component/src/semantics/streaming-ssr.ts`

```ts
export interface StreamingSsrSession {
  target: ComponentTarget;
  routeId: string;
  state: StreamingSsrState;
  pendingBoundaries: Set<string>;
  hydratedBoundaries: Set<string>;
  errors: Array<{ boundaryId: string; message: string }>;
  history: AxisStep<StreamingSsrState>[];
}
```

#### `StreamingSsrState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/streaming-ssr.ts#L3) `packages/component/src/semantics/streaming-ssr.ts`

```ts
export type StreamingSsrState =
  | 'idle'
  | 'suspense-pending'
  | 'error-captured'
  | 'progressive-hydrating'
  | 'selective-hydrated';
```

#### `ViewTransitionSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L10) `packages/component/src/semantics/view-transitions.ts`

```ts
export interface ViewTransitionSession {
  target: ComponentTarget;
  transitionId: string;
  state: ViewTransitionState;
  activeElements: Set<string>;
  documentTransition: string | null;
  assertions: string[];
  history: AxisStep<ViewTransitionState>[];
}
```

#### `ViewTransitionState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/view-transitions.ts#L3) `packages/component/src/semantics/view-transitions.ts`

```ts
export type ViewTransitionState =
  | 'idle'
  | 'element-transitioning'
  | 'document-transitioning'
  | 'asserted'
  | 'finished';
```

#### `VisualBaseline`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L188) `packages/component/src/types.ts`

Chromatic の 1 baseline entry — story id + viewport + markup + hash。 baseline JSON store に永続化される (mock は in-memory Map で代替)。

```ts
export interface VisualBaseline {
  storyId: string;
  viewport: string;
  markup: string;
  /** markup の deterministic hash (SHA-256 hex substring)。 */
  hash: string;
  /** baseline 生成時刻 (ms)、 accept workflow で比較に使う。 */
  capturedAt: number;
}
```

#### `VisualDiff`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L202) `packages/component/src/types.ts`

Chromatic の diff 結果 1 件。 changed=true なら pixel diff 検出、 pixelDiffRatio が threshold を超えると status=failed になる。

```ts
export interface VisualDiff {
  storyId: string;
  viewport: string;
  baselineHash: string;
  currentHash: string;
  changed: boolean;
  /** markup 差分 (0-1)、 hash 完全一致で 0、 完全不一致で 1。 */
  pixelDiffRatio: number;
  status: 'passed' | 'failed' | 'new';
  /** threshold 判定に使った値 (parameters.chromatic.diffThreshold or default)。 */
  threshold: number;
}
```

#### `VisualReviewAction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L219) `packages/component/src/types.ts`

accept / reject workflow の 1 action。 accept は baseline を current で 置換、 reject は baseline を保持したまま diff status を残す。

```ts
export type VisualReviewAction = 'accept' | 'reject';
```

#### `VisualReviewEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L221) `packages/component/src/types.ts`

```ts
export interface VisualReviewEntry {
  storyId: string;
  viewport: string;
  action: VisualReviewAction;
  reviewedAt: number;
}
```
<!-- kiwa-public-api:end -->
