# A11y リファレンス

## DOM audit

| API | 内容 |
| --- | --- |
| `runAxe` | `context` と axe `runOptions` を使い jsdom 上で axe を実行します |
| `reportViolations` | `maxImpact` 以上を `blocking` として取り出し、診断用 summary を作ります |
| `expectNoViolations` | blocking 違反があれば summary を含む error を throw します |

`runAxe` の `context` は `Element`、`Document`、selector を受け取ります。`context` を省略するとglobal `document` を使います。どちらもないNode environmentでは実行できません。`axe-core` はdynamic importするpeer dependencyで、未install時は導入方法を含むerrorになります。

## layer harness

| API | 内容 |
| --- | --- |
| `runLayerHarness` | jsdom、Playwright、SSR hydration の layer report を作ります |
| `bucketViolations` | axe violation を impact ごとに集計します |
| `unionByRule` | SSR と hydration の同一 rule を node 数を保って結合します |
| `computeTotals` | 適用済み layer の impact count を合算します |
| `isHarnessOk` | critical、serious、moderate が0件かを判定します |
| `summariseHarness` | layer report の診断用 text を作ります |

`runLayerHarness` のPlaywright layerは事前に取得した `AxeResults` を受け取ります。browserを起動したりaxe scriptを注入したりはしません。`results.violations` が不正または欠けているPlaywright fixtureは空の違反として集計されます。SSR hydration layerではSSR stringと任意のhydrated elementを渡します。

## 設定と lifecycle

`maxImpact` は `minor`、`moderate`、`serious`、`critical` のいずれかです。impactが未指定のviolationはblockingから除外されます。DOMを書き換えるtestは `afterEach` で元のmarkupに戻してください。detached elementをlayer harnessに渡した場合、実行中だけdocumentに接続し、完了後に元の位置へ戻します。

## 制約

`runAxe` は jsdom 向けです。Playwright の `Page` を直接渡すことはできません。browser audit は page 側の axe 実行結果を `runLayerHarness` に渡してください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| 'runAxe requires "axe-core" to be installed. Run `pnpm add -D axe-core`.' | [packages/a11y/src/audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/audit.ts#L20) |
| 'runAxe: no context and no global document (jsdom env required).' | [packages/a11y/src/audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/audit.ts#L29) |
| report.summary | [packages/a11y/src/audit.ts](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/audit.ts#L64) |
| 'ssrHydration layer requires a jsdom-like global document (vitest env=jsdom).' | [packages/a11y/src/layer-harness.ts](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L312) |
| 'ssrHydration layer requires a string ssrHtml fixture — got ' + typeof fixture.ssrHtml + '.' | [packages/a11y/src/layer-harness.ts](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L320) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `bucketViolations`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L120) `packages/a11y/src/layer-harness.ts`

Bucket a set of axe violations by impact, returning the same shape as `LayerReport.violations`. Exported so tests can call it without hitting axe-core. `Object.hasOwn` gates the `counts` write to protect against prototype chain contamination — a violation whose `impact` accidentally names `toString` or `constructor` cannot corrupt the counts record.

```ts
export declare function bucketViolations(violations: AxeViolation[]): {
    counts: Record<Impact, number>;
    surviving: LayerReport['surviving'];
};
```

#### `computeTotals`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L340) `packages/a11y/src/layer-harness.ts`

Compute the totals (sum by impact across every applicable layer) — a layer marked `absent` contributes zero.

```ts
export declare function computeTotals(layers: HarnessReport['layers']): Record<Impact, number>;
```

#### `expectNoViolations`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/audit.ts#L57) `packages/a11y/src/audit.ts`

```ts
export declare function expectNoViolations(results: AxeResults, expect: {
    (actual: unknown): {
        toBe: (expected: unknown) => void;
    };
}, opts?: {
    maxImpact?: AuditOptions['maxImpact'];
}): void;
```

#### `IMPACTS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L30) `packages/a11y/src/layer-harness.ts`

Impact buckets in the order axe-core emits them.

```ts
export declare const IMPACTS: readonly ["critical", "serious", "moderate", "minor"];
```

#### `isHarnessOk`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L362) `packages/a11y/src/layer-harness.ts`

True iff every applicable layer has zero critical + zero serious + zero moderate violations. `minor` never gates `ok`. Absent layers pass. Critical, serious, and moderate all block because a downstream tier threshold breach at any of the three levels should never flip `report.ok` to true. `minor` is excluded because it is unbounded on every current tier (SSOT: docs/quality/a11y-thresholds.md).

```ts
export declare function isHarnessOk(layers: HarnessReport['layers']): boolean;
```

#### `reportViolations`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/audit.ts#L40) `packages/a11y/src/audit.ts`

```ts
export declare function reportViolations(results: AxeResults, opts?: {
    maxImpact?: AuditOptions['maxImpact'];
}): ViolationReport;
```

#### `runAxe`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/audit.ts#L24) `packages/a11y/src/audit.ts`

```ts
export declare function runAxe(opts?: AuditOptions): Promise<AxeResults>;
```

#### `runLayerHarness`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L380) `packages/a11y/src/layer-harness.ts`

Run the 3-layer harness against a set of fixtures. Missing layers are recorded as `absent`. Returns the whole baseline payload.

```ts
export declare function runLayerHarness(pkgName: string, fixtures?: HarnessFixtures, now?: Date): Promise<HarnessReport>;
```

#### `summariseHarness`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L405) `packages/a11y/src/layer-harness.ts`

Turn a `HarnessReport` into a `reportViolations`-style summary string, unioned across every applicable layer with cross-layer dedup by rule id. A rule that fires in both `jsdom` and `ssrHydration` surfaces once with node counts summed and the most severe impact preserved.

```ts
export declare function summariseHarness(report: HarnessReport): string;
```

#### `unionByRule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L149) `packages/a11y/src/layer-harness.ts`

Merge the SSR-parsed violation set with the hydrated violation set, deduplicated by rule id. Node arrays are concatenated across sides so a rule that fires against 3 nodes in SSR and 5 nodes in the hydrated tree is recorded with 8 nodes rather than dropped to whichever side landed first. Impact is taken from whichever side reports a non-null value first, so hydration-only impact metadata surfaces even when the SSR side reports null. Exposed for tests.

```ts
export declare function unionByRule(a: AxeViolation[], b: AxeViolation[]): AxeViolation[];
```

#### `zeroImpacts`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L107) `packages/a11y/src/layer-harness.ts`

Empty impact bucket used both as the zero baseline and as a reset target.

```ts
export declare function zeroImpacts(): Record<Impact, number>;
```

### 型

#### `AuditOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/types.ts#L17) `packages/a11y/src/types.ts`

```ts
export interface AuditOptions {
    /** Element / selector / Document to scan (default: document) */
    context?: Element | Document | string;
    /** axe-core run options (passed verbatim) */
    runOptions?: Record<string, unknown>;
    /** Maximum impact level allowed before reportViolations throws */
    maxImpact?: 'minor' | 'moderate' | 'serious' | 'critical';
}
```

#### `AxeResults`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/types.ts#L10) `packages/a11y/src/types.ts`

```ts
export interface AxeResults {
    violations: AxeViolation[];
    passes: Array<{
        id: string;
    }>;
    incomplete: Array<{
        id: string;
    }>;
    inapplicable: Array<{
        id: string;
    }>;
}
```

#### `AxeRunModule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/types.ts#L26) `packages/a11y/src/types.ts`

```ts
export interface AxeRunModule {
    run: (context?: Element | Document | string, options?: Record<string, unknown>) => Promise<AxeResults>;
}
```

#### `AxeViolation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/types.ts#L1) `packages/a11y/src/types.ts`

```ts
export interface AxeViolation {
    id: string;
    impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
    description: string;
    help: string;
    helpUrl: string;
    nodes: Array<{
        target: string[];
        html: string;
        failureSummary?: string;
    }>;
}
```

#### `HarnessFixtures`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L75) `packages/a11y/src/layer-harness.ts`

Fixture surface a `.axe-config.mjs` can hand to the harness. A missing field means the layer is `absent` — the harness records that verdict without spinning up axe (the corresponding cost — jsdom construction, Playwright browser boot, SSR string render — is skipped).

```ts
export interface HarnessFixtures {
    jsdom?: {
        /** Element / Document / selector to hand to axe-core. */
        context: AuditOptions['context'];
        /** Optional axe-core `runOptions` override for this layer. */
        runOptions?: AuditOptions['runOptions'];
    };
    playwright?: {
        /**
         * Awaited result of `page.evaluate(() => axe.run(document, opts))` —
         * axe-playwright caller is responsible for wiring; the harness only
         * aggregates the result to keep this module Playwright-free at build
         * time (Playwright is a peerDep, not a dep, so requiring it at import
         * time would break Node-only consumers).
         */
        results: AxeResults;
    };
    ssrHydration?: {
        /** SSR HTML string produced by the framework adapter under test. */
        ssrHtml: string;
        /**
         * Optional post-hydration Element — when supplied, axe runs against both
         * the SSR-parsed Element and this Element, and violations are unioned by
         * rule id with provenance recorded per layer.
         */
        hydrated?: Element | Document;
        /** Optional axe-core `runOptions` override for this layer. */
        runOptions?: AuditOptions['runOptions'];
    };
}
```

#### `HarnessReport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L51) `packages/a11y/src/layer-harness.ts`

Aggregated 3-layer report — the whole baseline payload for one package.

```ts
export interface HarnessReport {
    package: string;
    generatedAt: string;
    layers: {
        jsdom: LayerReport;
        playwright: LayerReport;
        ssrHydration: LayerReport;
    };
    /** Sum of all impact counts across every applicable layer. */
    totals: Record<Impact, number>;
    /**
     * True when every applicable layer has zero critical, zero serious, and
     * zero moderate violations. `minor` never gates `ok`. Absent layers do
     * not affect `ok`.
     */
    ok: boolean;
}
```

#### `Impact`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L31) `packages/a11y/src/layer-harness.ts`

```ts
export type Impact = (typeof IMPACTS)[number];
```

#### `LayerReport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L40) `packages/a11y/src/layer-harness.ts`

Per-layer violation summary — the shape that lands in `.a11y-baseline/{pkg}.json`. `applicable: false` means the package intentionally does not participate in the layer (e.g. Core-tier no-DOM package skipping the Playwright layer). `applicable: true` records axe's verdict.

```ts
export interface LayerReport {
    layer: 'jsdom' | 'playwright' | 'ssrHydration';
    applicable: boolean;
    /** One-line reason recorded when applicable is false. */
    reason?: string;
    violations: Record<Impact, number>;
    /** Rule ids of every surviving violation, deduplicated per layer. */
    surviving: Array<{
        id: string;
        impact: Impact | null;
        help: string;
        nodes: number;
    }>;
}
```

#### `ViolationReport`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/audit.ts#L34) `packages/a11y/src/audit.ts`

```ts
export interface ViolationReport {
    violations: AxeViolation[];
    blocking: AxeViolation[];
    summary: string;
}
```
<!-- kiwa-public-api:end -->
