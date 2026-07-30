---
title: "@kiwa-lab/perf-harness three-layer の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>three-layer</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>pruneStaleOps</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L531) <code v-pre>packages/perf-harness/src/three-layer.ts</code>

今回測っていない op を baseline から落とすかを決める。 呼出が明示していればそれに従い、 していなければ suite 全体を回す経路が 立てる環境変数を見る。 絞り込み実行でこの変数が立つことはないため、 「今回の op 一覧が完全である」 という前提が成り立つ場合だけ掃除が働く。

```ts
export declare function pruneStaleOps(input: {
    pruneStaleBaselineOps?: boolean;
}): boolean;
```

#### <code v-pre>resolveKiwaRepoRoot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L878) <code v-pre>packages/perf-harness/src/three-layer.ts</code>

resolveKiwaRepoRoot — walk upward from `start` until finding a package.json whose `name` matches `kiwa-monorepo`. Used by every kiwa perf test to resolve the report path regardless of vitest cwd.

```ts
export declare function resolveKiwaRepoRoot(start: string): string;
```

#### <code v-pre>runPerf3Layer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L269) <code v-pre>packages/perf-harness/src/three-layer.ts</code>

```ts
export declare function runPerf3Layer(input: RunPerf3LayerInput): Promise<RunPerf3LayerResult>;
```

#### <code v-pre>runPerf3LayerStrict</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L858) <code v-pre>packages/perf-harness/src/three-layer.ts</code>

runPerf3LayerStrict — v0.3 strict variant。 iter 2 倍 + CI 99% + delta 10%。 見逃し (退行を stable と判定) が致命的な経路で使う。 defaults ... - serialIterations: 400 (v0.2 200) - serialWarmup: 10 (v0.2 5) - concurrency: 20 (v0.2 10) - iterationsPerWorker: 100 (v0.2 50) - memoryIterations: 400 (v0.2 200) - regressionThreshold: 0.1 (v0.2 0.2) - regressionConfidenceLevel: 0.99 (v0.2 0.95) 回帰判定の 2 つは、 名前が strict でありながら通常版と同じ設定で動いていた (`runPerf3Layer` が閾値を内部で固定していた)。 標本数だけ増えて判定は緩いまま だったので、 呼出から渡せるようにして名前どおりの挙動に揃えた (#1718)。

```ts
export declare function runPerf3LayerStrict(input: RunPerf3LayerInput): Promise<RunPerf3LayerResult>;
```

### 型

#### <code v-pre>OpOutcome</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L209) <code v-pre>packages/perf-harness/src/three-layer.ts</code>

```ts
export interface OpOutcome {
    name: string;
    serial: MeasureResult;
    /** serial と 1 呼出ずつ交互に測った基準 op の実測値。 */
    serialReference: MeasureResult;
    concurrent: MeasureResult;
    memory: MemorySample;
    serialGatePassed: boolean;
    concurrentGatePassed: boolean;
    memoryGatePassed: boolean;
    /**
     * `n/a` は 2 種を分ける。 `baseline seeded` = 記録が無い実行 (初回)、
     * `比較せず` = 記録はあるが基準が揃わず比較できない実行。 後者を seeded と
     * 書くと、 書込が起きていない実行でも seed したと読める。
     */
    regressionVerdict: 'stable' | 'improved' | 'regressed' | 'n/a (baseline seeded)' | 'n/a (比較せず)';
    /**
     * verdict だけでは伝わらない判定の状態。 stable の理由が「変化が無い」 なのか
     * 「差が絶対下限に届かず判定できない」 なのかを report 読者に見せるために持つ。
     * 補足が要らない場合は undefined。
     */
    regressionNote?: string;
    /**
     * 判定の内訳。 比較対象が無かった実行では undefined。
     *
     * verdict だけを返すと、 正規化が効いたのか (normalizationScale) と、
     * 換算後の値が baseline とどれだけ離れたのかを呼出側から確認できない。
     */
    regression?: RegressionResult;
}
```

#### <code v-pre>PerfOpSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L37) <code v-pre>packages/perf-harness/src/three-layer.ts</code>

```ts
export interface PerfOpSpec {
    name: string;
    fn: () => Promise<unknown> | unknown;
    /**
     * Serial p95 hard cap (ms). Source: docs/quality/perf-thresholds.md.
     */
    serialP95CapMs: number;
    /**
     * Optional override for concurrent cap. Default = 2 × serial cap per SSOT.
     */
    concurrentP95CapMs?: number;
    /**
     * 回帰と判定する p10 差の下限 (ms)。
     *
     * 既定はこの実行で測った測定系の分解能 (何もしない関数を同じ経路で呼んだ費用) の
     * `RESOLUTION_FLOOR_MULTIPLE` 倍に、 実行内正規化の倍率を掛けた値。 分解能も今回の
     * 実行で測った値なので、 差と同じ単位 (baseline を測った時の機械の ms) へ揃える。
     * 分解能より小さい差は op ではなく harness 自身の往復を見ているため判定に使えない。
     *
     * 明示すると既定を上書きする。 その値には倍率を掛けない (どの実行の測定値でもない
     * 定数のため、 掛けると gate の感度がその日の機械で変わる)。 実際に効いた値は
     * report の「下限」 列に出る。
     */
    regressionMinDeltaMs?: number;
    /**
     * 実行内正規化の基準 op の種類 (default `cpu`)。
     *
     * 回帰判定は、 同じ実行の中で交互に測った基準 op との比で行う。 基準は対象と
     * 同じ邪魔を受けるものでないと相殺が起きないため、 fs を触る op は `fs-read` /
     * `fs-write` を宣言する。 種類を外すと素の値より悪化する
     * (fs read の実行間振れ幅 = 素 135% / `fs-read` 基準 17% / `cpu` 基準 171%、
     * `scripts/reference-op-probe.mjs` 実測)。
     *
     * 選び方と却下した案は `docs/quality/perf-thresholds.md` § In-run normalization。
     */
    referenceKind?: PerfReferenceKind;
    /**
     * Optional override for memory arrayBuffers cap.
     * Default = 100 KB across 200 iterations.
     */
    memoryArrayBuffersCapBytes?: number;
    /**
     * memory 軸の判定を外す理由。 空でない文字列を渡した op だけが対象。
     *
     * `arrayBuffers` は Node の Buffer pool の伸びをそのまま拾うため、 fs を
     * 多く触る対象では実行ごとの振れ幅が上限と同規模になり、 実装の保持量を
     * 表さなくなる (#1708 で fs 系 op の振れ幅が ±70KB、 上限が 100KB と実測)。
     * その状態で判定を続けても、 通るか落ちるかが実装と無関係に決まる。
     *
     * 上限値の引き上げではなく除外にしているのは、 「この op は測れていない」 を
     * report に残すため。 上限を上げると測れているように見えてしまう。
     * 軸そのものの作り直しは別 Issue で扱う。
     */
    memoryGateWaived?: string;
    /**
     * 回帰判定を gate から外す理由。 空でない文字列を渡した op だけが対象。
     *
     * 回帰判定は別々の実行で測った値を比べるため、 その op の実行ごとの振れ幅が
     * 閾値 20% を超えていると、 実装と無関係に判定が入れ替わる。 判定軸を分布の
     * 下側 (p10) へ移し (#1718)、 さらに同じ実行の中で測った基準 op との比で
     * 判定するようにして (#1737) 大半の op はこの条件を満たすようになったが、
     * 基準と邪魔を共有しない op (子 process の起動を含むもの 等) は残る。
     *
     * 判定は report に残したまま gate から外す。 閾値を緩めたり下限を実測の
     * 振れ幅まで引き上げたりすると、 測れているように見えてしまう。
     * 指定する時は理由に実測の根拠を書く。 落ちたから付ける、 はしない。
     *
     * 上限 (serial / concurrent) の判定はこの指定でも外れない。 上限は 1 回の
     * 実行の中で完結する判定で、 実行間の振れ幅の影響を受けないため。
     */
    regressionGateWaived?: string;
}
```

#### <code v-pre>RunPerf3LayerInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L110) <code v-pre>packages/perf-harness/src/three-layer.ts</code>

```ts
export interface RunPerf3LayerInput {
    moduleName: string;
    ops: PerfOpSpec[];
    /**
     * Absolute path to the markdown report file. Overwritten each run.
     */
    reportPath: string;
    /**
     * Optional override for baseline path. Default = defaultBaselinePath(moduleName).
     */
    baselinePath?: string;
    /**
     * Iterations for the serial phase. Default 200.
     */
    serialIterations?: number;
    /**
     * Warmup iterations for the serial phase (discarded). Default 5.
     */
    serialWarmup?: number;
    /**
     * Worker count for the concurrent phase. Default 10.
     */
    concurrency?: number;
    /**
     * Per-worker iterations for the concurrent phase. Default 50.
     */
    iterationsPerWorker?: number;
    /**
     * Iterations for the memory phase. Default 200.
     */
    memoryIterations?: number;
    /**
     * 計測区間の前に空回しする回数。 既定は `memoryIterations` の 1 割 (最低 3)。
     *
     * 初回の呼出に混ざる 1 回きりの確保を計測区間の外へ出すためのもの。
     * fs を触る対象では Node の Buffer pool が最初の数回で 8KB 単位に伸び、
     * その分が反復数で割られて「1 回あたりの保持」 として上限判定に載る。
     */
    memoryWarmup?: number;
    /**
     * 回帰判定を `allPassed` に反映するか (default false)。
     *
     * 回帰判定は別々の実行で測った値を比べるため、 op の実行ごとの振れ幅が
     * 閾値 20% を下回っていて初めて成立する。 実行内正規化で実行全体に乗る
     * ずれは消えた (全 492 op の比の変化の中央値が 2 回の実測とも 0.0%、 #1737) が、
     * op 個別のばらつきは残り、 |変化| の p90 が 17-20% と閾値のすぐ下にある。
     *
     * 既定を true にすると、 実装を変えていないのに毎回 20-30 package が落ちる
     * (実測 = 2 回目 22 / 3 回目 29)。 上限の実 breach がその中に埋もれるため、
     * 既定は false のままにしてある。 詳細と残りの根は
     * `docs/quality/perf-thresholds.md` § In-run normalization。
     *
     * 上限 (serial / concurrent / memory) の判定は 1 回の実行の中で完結するので
     * この指定に関わらず従来どおり反映する。
     */
    regressionGate?: boolean;
    /**
     * 回帰と判定する相対閾値 (default 0.2 = 20%)。
     *
     * `runPerf3LayerStrict` が 0.1 を渡す。 呼出が指定しなければ既定のまま。
     */
    regressionThreshold?: number;
    /**
     * 回帰判定の信頼区間 (default 0.95)。
     *
     * `runPerf3LayerStrict` が 0.99 を渡す。 見逃しが致命的な経路で幅を広げ、
     * 有意と認める条件を厳しくする。
     */
    regressionConfidenceLevel?: number;
    /**
     * Path (relative to reportPath's directory tree) that the report references
     * as the threshold SSOT. Default: '../../quality/perf-thresholds'.
     */
    thresholdDocLink?: string;
    /**
     * 今回測っていない op を baseline から削除する。
     *
     * op 名を別処理へ付け替えたときに無関係な過去値と比較しないための掃除だが、
     * 常に有効だと絞り込み実行で op が一度欠けるだけで過去値が消える。
     * 次の完全実行では再 seed されて直前の退行を見逃すので、suite 全体を
     * 回す呼出だけが明示的に有効化する。
     *
     * 明示しない場合は環境変数 `KIWA_PERF_PRUNE_STALE=1` の有無で決まる。
     * kiwa の root `test:perf` はこれを立てる = 全 package を絞り込みなしで
     * 回す唯一の経路で、 そこでだけ掃除が働く。 個別 package の実行や
     * `-t` での絞り込みでは立たないため、 過去値を巻き添えにしない。
     */
    pruneStaleBaselineOps?: boolean;
    /**
     * GC を呼べない測定を memory gate の失敗として扱う (default false)。
     *
     * `--expose-gc` 無しの測定は解放される一時使用まで拾うため上限との比較が
     * 成立しない。 ただし既定で失敗にすると、 GC 無しでも動いていた既存の
     * 呼出が一斉に落ちる。 kiwa 内部の suite のように前提を固定できる呼出だけが
     * 有効化する。
     */
    requireGc?: boolean;
}
```

#### <code v-pre>RunPerf3LayerResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/three-layer.ts#L245) <code v-pre>packages/perf-harness/src/three-layer.ts</code>

```ts
export interface RunPerf3LayerResult {
    outcomes: OpOutcome[];
    allPassed: boolean;
    baselineSeeded: boolean;
}
```
