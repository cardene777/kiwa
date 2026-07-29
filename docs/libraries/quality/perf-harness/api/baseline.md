---
title: "@kiwa-lab/perf-harness baseline の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>baseline</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>captureEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L141) <code v-pre>packages/perf-harness/src/baseline.ts</code>

現行環境の env metadata を取得する。 git 未 install / 非 repo 環境では gitSha は "unknown"。

```ts
export declare function captureEnv(): BaselineEnv;
```

#### <code v-pre>defaultBaselinePath</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L87) <code v-pre>packages/perf-harness/src/baseline.ts</code>

baseline の既定の置き場を決める。 `process.cwd()` をそのまま使うと、 同じ module の baseline が起動場所ごとに 別 file に分かれる。 kiwa では `pnpm --filter &lt;pkg&gt; test:perf` (cwd = package) と repo root からの起動が混在し、 `&lt;root&gt;/.perf-baseline/` と `packages/&lt;name&gt;/.perf-baseline/` の 2 箇所に同じ module の値が溜まっていた。 片方だけを読む実行は毎回「baseline が無い」 と判断して作り直すため、 回帰判定がいつまでも成立しない。 workspace の目印 (`pnpm-workspace.yaml` / `.git`) を cwd から上に辿って 見つかった場所を基準にする。 目印が無い単体 package からの利用では 従来どおり cwd を使うので、 repo の外の呼出には影響しない。

```ts
export declare function defaultBaselinePath(moduleName: string): string;
```

#### <code v-pre>isComparableEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L161) <code v-pre>packages/perf-harness/src/baseline.ts</code>

baseline を比較対象として使えるかを判定する。 `gitSha` や `hostname` の違いは測定値の意味を変えないが、GC を呼べるかどうかは memory 測定の前提そのものを変える。前提が違う baseline と比べると、実装が 変わっていなくても回帰と判定されてしまう。

```ts
export declare function isComparableEnv(baseline: BaselineEnv, current: BaselineEnv): boolean;
```

#### <code v-pre>loadBaseline</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L19) <code v-pre>packages/perf-harness/src/baseline.ts</code>

Baseline を load して現行環境と envelope の env を比較、 mismatch field を検出する。 legacy schema (単一 MeasureResult) は自動 upgrade して読む。

```ts
export declare function loadBaseline(path: string): Promise<BaselineLoadResult | null>;
```

#### <code v-pre>MEASUREMENT&#95;PREMISE</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L138) <code v-pre>packages/perf-harness/src/baseline.ts</code>

測定の取り方の版。 機械も Node も同じでも測り方が変われば、 保存済みの値は 比較対象にならない。 そのとき baseline を手で消して回るのではなく、 ここを 1 上げて「前提が違う」 と宣言し、 測定が成立している次の実行で作り直させる。 - 版 1 = workspace も vitest の file も並列で測っていた頃 (この field 自体が無い) - 版 2 = workspace を `--workspace-concurrency=1`、 vitest を `fileParallelism: false` にして 1 件ずつ測る (#1708) - 版 3 = memory 測定に空回しを入れた (#1708)。 それまでは初回の 1 回きりの 確保が反復数で割られて「1 回あたりの保持」 に載っており、 同じ実装でも arrayBuffers の増分が変わる。 serial / concurrent の測り方は版 2 と同じ (標本数の引き上げは試したが効果が確認できず戻した) - 版 4 = op を測る前に測定系の分解能を測るようになった (#1718)。 空の関数を 200 回まわしてから 1 つ目の op に入るため、 版 3 までは冷えたまま測られていた 最初の op が暖まった状態で測られる。 判定軸を p95 から p10 へ移した変更自体は 保存する値の意味を変えないが、 この空回しは同じ実装の測定値を動かす 上げる条件は「同じ実装を測っても値が変わる」 変更に限る。 閾値や判定の変更は 測り方ではないので上げない。

```ts
export declare const MEASUREMENT_PREMISE = 4;
```

#### <code v-pre>resolveBaselineRoot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L97) <code v-pre>packages/perf-harness/src/baseline.ts</code>

workspace の目印を cwd から上に辿る。 見つからなければ起点をそのまま返す。 起点は symlink を解いてから辿る。 解かないと、 同じ package を実体経由と link 経由で起動した時に別の root を掴み、 baseline が分裂する。

```ts
export declare function resolveBaselineRoot(start: string): string;
```

#### <code v-pre>saveBaseline</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L41) <code v-pre>packages/perf-harness/src/baseline.ts</code>

単一結果 baseline を保存する compat 経路。 内部で envelope に wrap して保存する。 `moduleName` は複数 op を 1 baseline に集約する時 (three-layer) に使う default key。

```ts
export declare function saveBaseline(path: string, result: MeasureResult, opts?: {
    key?: string;
}): Promise<void>;
```

#### <code v-pre>saveBaselineEnvelope</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/baseline.ts#L55) <code v-pre>packages/perf-harness/src/baseline.ts</code>

Envelope を直接保存する経路。 three-layer 等で複数 op を集約する場合に使う。

```ts
export declare function saveBaselineEnvelope(path: string, envelope: BaselineEnvelope): Promise<void>;
```


