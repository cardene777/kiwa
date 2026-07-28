---
title: "@kiwa-lab/a11y layer-harness の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/a11y</code> <code v-pre>layer-harness</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>bucketViolations</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L120) <code v-pre>packages/a11y/src/layer-harness.ts</code>

Bucket a set of axe violations by impact, returning the same shape as `LayerReport.violations`. Exported so tests can call it without hitting axe-core. `Object.hasOwn` gates the `counts` write to protect against prototype chain contamination — a violation whose `impact` accidentally names `toString` or `constructor` cannot corrupt the counts record.

```ts
export declare function bucketViolations(violations: AxeViolation[]): {
    counts: Record<Impact, number>;
    surviving: LayerReport['surviving'];
};
```

#### <code v-pre>computeTotals</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L340) <code v-pre>packages/a11y/src/layer-harness.ts</code>

Compute the totals (sum by impact across every applicable layer) — a layer marked `absent` contributes zero.

```ts
export declare function computeTotals(layers: HarnessReport['layers']): Record<Impact, number>;
```

#### <code v-pre>IMPACTS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L30) <code v-pre>packages/a11y/src/layer-harness.ts</code>

Impact buckets in the order axe-core emits them.

```ts
export declare const IMPACTS: readonly ["critical", "serious", "moderate", "minor"];
```

#### <code v-pre>isHarnessOk</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L362) <code v-pre>packages/a11y/src/layer-harness.ts</code>

True iff every applicable layer has zero critical + zero serious + zero moderate violations. `minor` never gates `ok`. Absent layers pass. Critical, serious, and moderate all block because a downstream tier threshold breach at any of the three levels should never flip `report.ok` to true. `minor` is excluded because it is unbounded on every current tier (SSOT: docs/quality/a11y-thresholds.md).

```ts
export declare function isHarnessOk(layers: HarnessReport['layers']): boolean;
```

#### <code v-pre>runLayerHarness</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L380) <code v-pre>packages/a11y/src/layer-harness.ts</code>

Run the 3-layer harness against a set of fixtures. Missing layers are recorded as `absent`. Returns the whole baseline payload.

```ts
export declare function runLayerHarness(pkgName: string, fixtures?: HarnessFixtures, now?: Date): Promise<HarnessReport>;
```

#### <code v-pre>summariseHarness</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L405) <code v-pre>packages/a11y/src/layer-harness.ts</code>

Turn a `HarnessReport` into a `reportViolations`-style summary string, unioned across every applicable layer with cross-layer dedup by rule id. A rule that fires in both `jsdom` and `ssrHydration` surfaces once with node counts summed and the most severe impact preserved.

```ts
export declare function summariseHarness(report: HarnessReport): string;
```

#### <code v-pre>unionByRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L149) <code v-pre>packages/a11y/src/layer-harness.ts</code>

Merge the SSR-parsed violation set with the hydrated violation set, deduplicated by rule id. Node arrays are concatenated across sides so a rule that fires against 3 nodes in SSR and 5 nodes in the hydrated tree is recorded with 8 nodes rather than dropped to whichever side landed first. Impact is taken from whichever side reports a non-null value first, so hydration-only impact metadata surfaces even when the SSR side reports null. Exposed for tests.

```ts
export declare function unionByRule(a: AxeViolation[], b: AxeViolation[]): AxeViolation[];
```

#### <code v-pre>zeroImpacts</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L107) <code v-pre>packages/a11y/src/layer-harness.ts</code>

Empty impact bucket used both as the zero baseline and as a reset target.

```ts
export declare function zeroImpacts(): Record<Impact, number>;
```

### 型

#### <code v-pre>HarnessFixtures</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L75) <code v-pre>packages/a11y/src/layer-harness.ts</code>

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

#### <code v-pre>HarnessReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L51) <code v-pre>packages/a11y/src/layer-harness.ts</code>

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

#### <code v-pre>Impact</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L31) <code v-pre>packages/a11y/src/layer-harness.ts</code>

```ts
export type Impact = (typeof IMPACTS)[number];
```

#### <code v-pre>LayerReport</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/a11y/src/layer-harness.ts#L40) <code v-pre>packages/a11y/src/layer-harness.ts</code>

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
