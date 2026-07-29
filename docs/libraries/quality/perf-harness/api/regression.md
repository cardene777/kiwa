---
title: "@kiwa-lab/perf-harness regression の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/perf-harness</code> <code v-pre>regression</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/regression.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>detectRegression</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/regression.ts#L42) <code v-pre>packages/perf-harness/src/regression.ts</code>

Bootstrap CI on p10 delta で regression を判定する。 (1) 信頼区間が 0 を含まない (= 有意な差) かつ (2) delta が threshold を超え、 かつ (3) 差が絶対下限 (既定 = `resolutionMs` の `RESOLUTION_FLOOR_MULTIPLE` 倍) 以上の場合のみ regressed / improved と判定する。 p95 の変化率も `tailDeltaPct` として返すが判定には使わない。 実行をまたぐと 実装と無関係に動くため gate に載せられない一方、 一部の呼出だけが遅くなる変化は そこにしか現れないため、 報告には残す。

```ts
export declare function detectRegression(input: RegressionInput): RegressionResult;
```

#### <code v-pre>detectRegressionStrict</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/regression.ts#L105) <code v-pre>packages/perf-harness/src/regression.ts</code>

strict mode — CI 99% + threshold 10%。 false negative を最小化。 見逃し (regressed を stable と判定) が致命的な release gate 経路で使う。

```ts
export declare function detectRegressionStrict(input: RegressionInput): RegressionResult;
```

#### <code v-pre>REGRESSION&#95;JUDGED&#95;PERCENTILE</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/regression.ts#L15) <code v-pre>packages/perf-harness/src/regression.ts</code>

回帰判定が読む分位。 分布の下側 10%。 上側 (p95) を読んでいた頃は、 実装を変えずに 4 回測るだけで判定が入れ替わった (#1718 実測 = `cli-test` の `readFile` で p95 が 134-974%、 `writeFile` で 289-313% 動く)。 測定を乱す要因はどれも実行時間を伸ばす方向にしか働かないので、 上側の裾は その日の機械の状態を測っている。 同じ実測で下側は p10 が 6-12% に収まった。 min ではなく p10 にしているのは、 min が 1 標本だけで決まるため計時の粒度と 1 回の幸運にそのまま晒されるから。 n = 200 なら p10 は 20 標本ぶんの深さを持つ。

```ts
export declare const REGRESSION_JUDGED_PERCENTILE = 0.1;
```

#### <code v-pre>RESOLUTION&#95;FLOOR&#95;MULTIPLE</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/perf-harness/src/regression.ts#L29) <code v-pre>packages/perf-harness/src/regression.ts</code>

絶対下限を測定系の分解能の何倍に置くか。 分解能そのものを下限にすると、 分解能と同じ帯にいる op (`@kiwa-lab/cache` の env accessor は p10 が 0.00013ms で、 何もしない呼出の 0.00017ms より速い) で 判定が入れ替わる。 実装無変更の 4 連続実行で、 p10 が 1 度だけ 0.00013 → 0.00033ms へ 動き、 差 0.0002ms が分解能 0.00017ms を超えて regressed になった (#1718 実測)。 2 倍にすると、 その差は下限 0.00034ms に届かず保留になる。 一方で完了条件が 求める「baseline p95 の 3 倍の遅延」 は 0.0034ms 規模で、 下限の 10 倍あるため 従来どおり検知できる。 検知できる悪化の大きさを削らずに、 揺らぎだけを外せる。

```ts
export declare const RESOLUTION_FLOOR_MULTIPLE = 2;
```


