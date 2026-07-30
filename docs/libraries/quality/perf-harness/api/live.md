---
title: "@kiwa-lab/perf-harness live の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>live</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/live.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>runPerf3LayerLive</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/live.ts#L91) <code v-pre>packages/perf-harness/src/live.ts</code>

```ts
export declare function runPerf3LayerLive(input: RunPerf3LayerLiveInput): Promise<RunPerf3LayerLiveResult>;
```

### 型

#### <code v-pre>LiveOpOutcome</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/live.ts#L78) <code v-pre>packages/perf-harness/src/live.ts</code>

```ts
export interface LiveOpOutcome extends Partial<OpOutcome> {
    name: string;
    skipped: boolean;
    skipReason: string | null;
}
```

#### <code v-pre>LivePerfOpSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/live.ts#L48) <code v-pre>packages/perf-harness/src/live.ts</code>

```ts
export interface LivePerfOpSpec extends PerfOpSpec {
    /**
     * Env vars that must all be set for this op to reach the live API.
     * When any is missing the op is skipped and reported as LIVE_ENV_MISSING.
     */
    requiredEnv: string[];
}
```

#### <code v-pre>RunPerf3LayerLiveInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/live.ts#L56) <code v-pre>packages/perf-harness/src/live.ts</code>

```ts
export interface RunPerf3LayerLiveInput {
    moduleName: string;
    ops: LivePerfOpSpec[];
    reportPath: string;
    baselinePath?: string;
    serialIterations?: number;
    serialWarmup?: number;
    concurrency?: number;
    iterationsPerWorker?: number;
    memoryIterations?: number;
    thresholdDocLink?: string;
    /**
     * GC を呼べない測定を memory gate の失敗として扱う (default false)。
     *
     * `--expose-gc` 無しの測定は解放される一時使用まで拾うため上限との比較が
     * 成立しない。 config 側で GC を可能にしても、呼出が要求しなければ
     * 「測れていない実行」 が上限内として通る。 mock 経路 (`runPerf3Layer`) と
     * 同じ契約にする (#1708)。
     */
    requireGc?: boolean;
}
```

#### <code v-pre>RunPerf3LayerLiveResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/live.ts#L84) <code v-pre>packages/perf-harness/src/live.ts</code>

```ts
export interface RunPerf3LayerLiveResult {
    outcomes: LiveOpOutcome[];
    allPassed: boolean;
    anySkipped: boolean;
    baselineSeeded: boolean;
}
```
