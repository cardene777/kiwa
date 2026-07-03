/**
 * Shared types for `@kiwa-test/component` — the 3-integration unified mock
 * harness for Storybook 8 + Playwright Component Testing + Chromatic.
 *
 * v1.16 milestone (Issue #762, sub #763) 新設。 kiwa の思想 =
 * 「1 度書けば Storybook / Playwright CT / Chromatic の 3 SDK 同一挙動で
 * 回せる mock」 を実現するため、 3 統合非依存な共通契約を SSOT として定義する。
 *
 * 各 module (`storybook.ts` / `playwright-ct.ts` / `chromatic.ts`) は本 file
 * の共通型を SDK 固有 shape に変換する薄い層に留める。
 */

/**
 * どの integration が emit した mock かを識別する。 release-gate 11 軸 dispatch
 * の provider prefix として使う。
 */
export type ComponentProvider = 'storybook' | 'playwright-ct' | 'chromatic';

/**
 * Storybook 8 の `StoryObj` (CSF3) と互換な最小 shape。 args + play + parameters
 * の 3 field を持ち、 story 登録後に registry から名前指定で resolve できる。
 *
 * Storybook 8 の実際の `StoryObj` は component / render / decorators 等の
 * 追加 field を持つが、 mock harness は「args を解決して play を回して
 * DOM を触る」 core loop だけを模倣する。
 */
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

/** Storybook 8 の `parameters` field の最小 shape。 mock で意味のある値のみ抽出。 */
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

/** Storybook 8 の PlayFunction が受ける context。 mock 互換用に最小 shape のみ。 */
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

/**
 * mount 済 root の抽象 handle。 実 DOM ではなく、 in-memory な要素 tree として
 * 扱う。 test は `getByText` / `getByRole` / `querySelector` の subset を通じて
 * 要素を取り出し、 `click` / `fill` / `assert` を実行する。
 */
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

/**
 * mount 対象の component 表現。 実 React / Vue / Svelte component を直接
 * 扱わず、 純関数 `(args) => MockNode` として抽象化する。 mock harness は
 * framework agnostic — Storybook の render callback / Playwright CT の
 * component 引数 / Chromatic の capture 対象を同じ関数で表現する。
 */
export type ComponentRender<TArgs = Record<string, unknown>> = (args: TArgs) => MockNode;

/**
 * in-memory な DOM node 表現。 実 DOM を使わず tag / attrs / children /
 * text で tree を組む。 test で `click` / `fill` / `text` 操作を行うため
 * event listener + value state だけ持たせる。
 */
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

/** event handler に渡す minimal event object。 */
export interface MockEvent {
  type: string;
  target: MockNode;
  /** input event 時の value。 */
  value?: string;
}

/**
 * a11y violation を 1 件模倣。 実 axe-core の Result と field を揃える。
 * (mock harness では injectViolations で外部から注入して test 対象にする)
 */
export interface A11yViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  helpUrl?: string;
  nodes: Array<{ target: string[]; html: string }>;
}

/**
 * StoryRegistry の 1 entry — story ID → StoryObj + render + meta の bind。
 * Storybook 8 の `Meta` + `StoryObj` を 1 record に flatten した shape。
 */
export interface StoryEntry<TArgs = Record<string, unknown>> {
  id: string;
  title: string;
  storyName: string;
  args: TArgs;
  render: ComponentRender<TArgs>;
  play?: (context: PlayContext<TArgs>) => Promise<void> | void;
  parameters: StoryParameters;
}

/**
 * Playwright CT の `mount(component)` が返す ComponentLocator の subset。
 * 実 Playwright CT は `Locator` を返して page 全体を操作するが、 mock は
 * mount 済 canvas を直接返して interact に集中する。
 */
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

/**
 * Playwright Locator の subset — click / fill / textContent / count / expect。
 * mock は同一 API で real Playwright test と表面互換にする。
 */
export interface NodeLocator {
  click(): Promise<void>;
  fill(value: string): Promise<void>;
  textContent(): Promise<string | null>;
  count(): Promise<number>;
  /** 対象 node への直接 access (mock 側 assert 用)。 */
  node(): MockNode | null;
}

/**
 * Chromatic の 1 baseline entry — story id + viewport + markup + hash。
 * baseline JSON store に永続化される (mock は in-memory Map で代替)。
 */
export interface VisualBaseline {
  storyId: string;
  viewport: string;
  markup: string;
  /** markup の deterministic hash (SHA-256 hex substring)。 */
  hash: string;
  /** baseline 生成時刻 (ms)、 accept workflow で比較に使う。 */
  capturedAt: number;
}

/**
 * Chromatic の diff 結果 1 件。 changed=true なら pixel diff 検出、
 * pixelDiffRatio が threshold を超えると status=failed になる。
 */
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

/**
 * accept / reject workflow の 1 action。 accept は baseline を current で
 * 置換、 reject は baseline を保持したまま diff status を残す。
 */
export type VisualReviewAction = 'accept' | 'reject';

export interface VisualReviewEntry {
  storyId: string;
  viewport: string;
  action: VisualReviewAction;
  reviewedAt: number;
}
