---
title: "@kiwa-lab/perf-harness live の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>live</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/live.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>runPerf3LayerLive</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/live.ts#L110) <code v-pre>packages/perf-harness/src/live.ts</code>

```ts
export declare function runPerf3LayerLive(input: RunPerf3LayerLiveInput): Promise<RunPerf3LayerLiveResult>;
```

### 型

#### <code v-pre>LiveOpOutcome</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/live.ts#L97) <code v-pre>packages/perf-harness/src/live.ts</code>

```ts
export interface LiveOpOutcome extends Partial<OpOutcome> {
    name: string;
    skipped: boolean;
    skipReason: string | null;
}
```

#### <code v-pre>LivePerfOpSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/live.ts#L50) <code v-pre>packages/perf-harness/src/live.ts</code>

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

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/live.ts#L58) <code v-pre>packages/perf-harness/src/live.ts</code>

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
    /**
     * 今回測っていない op を baseline から落とす (default false)。
     *
     * 落とさないと、 op 名を付け替えた時に旧名の記録が残り続ける。 後から同じ名前を
     * 別の処理に使うと、 その処理は無関係な測定値と比較される (#1746)。
     *
     * mock 経路 (`runPerf3Layer`) と違い、 環境変数 `KIWA_PERF_PRUNE_STALE` は見ない。
     * あの変数が言えるのは「今回の op 一覧が絞り込まれていない」 ことまでで、 live の
     * op 一覧が完全かどうかは credential が揃っているかにも依る。 root の `test:perf`
     * は変数を立てたまま example の live 経路も回すため、 変数を見ると credential を
     * 持たない環境の実行が黙って掃除を始める。 呼出が明示した時だけ働かせる。
     *
     * 明示しても、 env 欠落で飛ばした op がある実行では掃除しない。 その実行の op 一覧は
     * 「測っていない」 のではなく「測れなかった」 ものを含むので、 落とすと credential を
     * 1 つ外した実行が他の op の比較対象を壊す (#1740 でそう決めた)。
     */
    pruneStaleBaselineOps?: boolean;
}
```

#### <code v-pre>RunPerf3LayerLiveResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/live.ts#L103) <code v-pre>packages/perf-harness/src/live.ts</code>

```ts
export interface RunPerf3LayerLiveResult {
    outcomes: LiveOpOutcome[];
    allPassed: boolean;
    anySkipped: boolean;
    baselineSeeded: boolean;
}
```
