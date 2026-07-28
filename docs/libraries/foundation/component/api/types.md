---
title: "@kiwa-lab/component types の API 契約"
---

# <code v-pre>@kiwa-lab/component</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>A11yViolation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L132) <code v-pre>packages/component/src/types.ts</code>

a11y violation を 1 件模倣。 実 axe-core の Result と field を揃える。 (mock harness では injectViolations で外部から注入して test 対象にする)

```ts
export interface A11yViolation {
    id: string;
    impact: 'minor' | 'moderate' | 'serious' | 'critical';
    description: string;
    helpUrl?: string;
    nodes: Array<{
        target: string[];
        html: string;
    }>;
}
```

#### <code v-pre>CanvasElement</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L82) <code v-pre>packages/component/src/types.ts</code>

mount 済 root の抽象 handle。 実 DOM ではなく、 in-memory な要素 tree として 扱う。 test は `getByText` / `getByRole` / `querySelector` の subset を通じて 要素を取り出し、 `click` / `fill` / `assert` を実行する。

```ts
export interface CanvasElement {
    /** mount 時に render された root node。 */
    root: MockNode;
    /** 要素 lookup helpers (最小 subset)。 */
    getByText(text: string): MockNode;
    getByRole(role: string, options?: {
        name?: string;
    }): MockNode;
    querySelector(selector: string): MockNode | null;
    querySelectorAll(selector: string): MockNode[];
    /** capture 時のセルフ dump (Chromatic に渡す markup 表現)。 */
    toMarkup(): string;
}
```

#### <code v-pre>ComponentLocator</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L159) <code v-pre>packages/component/src/types.ts</code>

Playwright CT の `mount(component)` が返す ComponentLocator の subset。 実 Playwright CT は `Locator` を返して page 全体を操作するが、 mock は mount 済 canvas を直接返して interact に集中する。

```ts
export interface ComponentLocator {
    /** mount 時に生成された canvas。 */
    canvas: CanvasElement;
    /** locator chain の起点 element。 */
    root: MockNode;
    /** テキスト locator の subset。 */
    getByText(text: string): NodeLocator;
    getByRole(role: string, options?: {
        name?: string;
    }): NodeLocator;
    /** element を unmount して event handler を全 clear する。 */
    unmount(): void;
}
```

#### <code v-pre>ComponentProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L17) <code v-pre>packages/component/src/types.ts</code>

どの integration が emit した mock かを識別する。 release-gate 11 軸 dispatch の provider prefix として使う。

```ts
export type ComponentProvider = 'storybook' | 'playwright-ct' | 'chromatic';
```

#### <code v-pre>ComponentRender</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L100) <code v-pre>packages/component/src/types.ts</code>

mount 対象の component 表現。 実 React / Vue / Svelte component を直接 扱わず、 純関数 `(args) =&gt; MockNode` として抽象化する。 mock harness は framework agnostic — Storybook の render callback / Playwright CT の component 引数 / Chromatic の capture 対象を同じ関数で表現する。

```ts
export type ComponentRender<TArgs = Record<string, unknown>> = (args: TArgs) => MockNode;
```

#### <code v-pre>MockEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L121) <code v-pre>packages/component/src/types.ts</code>

event handler に渡す minimal event object。

```ts
export interface MockEvent {
    type: string;
    target: MockNode;
    /** input event 時の value。 */
    value?: string;
}
```

#### <code v-pre>MockNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L107) <code v-pre>packages/component/src/types.ts</code>

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

#### <code v-pre>NodeLocator</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L175) <code v-pre>packages/component/src/types.ts</code>

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

#### <code v-pre>PlayContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L65) <code v-pre>packages/component/src/types.ts</code>

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

#### <code v-pre>StoryEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L144) <code v-pre>packages/component/src/types.ts</code>

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

#### <code v-pre>StoryObj</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L27) <code v-pre>packages/component/src/types.ts</code>

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

#### <code v-pre>StoryParameters</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L42) <code v-pre>packages/component/src/types.ts</code>

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

#### <code v-pre>VisualBaseline</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L188) <code v-pre>packages/component/src/types.ts</code>

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

#### <code v-pre>VisualDiff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L202) <code v-pre>packages/component/src/types.ts</code>

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

#### <code v-pre>VisualReviewAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L219) <code v-pre>packages/component/src/types.ts</code>

accept / reject workflow の 1 action。 accept は baseline を current で 置換、 reject は baseline を保持したまま diff status を残す。

```ts
export type VisualReviewAction = 'accept' | 'reject';
```

#### <code v-pre>VisualReviewEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/types.ts#L221) <code v-pre>packages/component/src/types.ts</code>

```ts
export interface VisualReviewEntry {
    storyId: string;
    viewport: string;
    action: VisualReviewAction;
    reviewedAt: number;
}
```
