# Perf Suite — ai-llm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00029ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00057ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.0073ms | 0.01ms | 100ms | 0.00049ms | PASS | improved — gate 無効 (regressionGate=false) |
| streaming_workload (5 runStream + chunk collect) | 17.93ms | 30.58ms | 100ms | 0.00057ms | PASS | stable (換算後 p10 +0% (閾値未満)、 p95 +57% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| multi_turn_conversation (10-turn chat + reset) | 0.0070ms | 0.0085ms | 100ms | 0.00055ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。


「実行間のばらつき」 は baseline が持つ過去の比が、 baseline 自身の比からどれだけ離れたかの最大値。 その op が実装を変えずに測るだけでどれだけ動くかを表す。 判定はこの幅の 2 倍と相対閾値の大きい方を超えた差だけを有意として扱う (#1739)。 履歴が 3 件に満たない op では推定できないため n/a になり、 相対閾値だけで判定する。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 実行間のばらつき | 実効閾値 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | cpu | 0.10ms | 0.10ms | 0.0073ms | 0.075 | 0.097 | n/a | 20.0% | 0.0062ms | 0.0081ms |
| streaming_workload (5 runStream + chunk collect) | cpu | 0.08ms | 0.39ms | 17.93ms | 215.702 | 215.479 | n/a | 20.0% | 17.86ms | 17.84ms |
| multi_turn_conversation (10-turn chat + reset) | cpu | 0.09ms | 0.09ms | 0.0070ms | 0.080 | 0.081 | n/a | 20.0% | 0.0066ms | 0.0067ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.05ms | 200ms | PASS |
| streaming_workload (5 runStream + chunk collect) | 19.96ms | 200ms | PASS |
| multi_turn_conversation (10-turn chat + reset) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | 呼出 (空回し + 反復) | verdict |
|---|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | -2040 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| streaming_workload (5 runStream + chunk collect) | -4224 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |
| multi_turn_conversation (10-turn chat + reset) | 728 B | 0 B | 102400 B | yes | 23 (3 + 20) | PASS |

## Detailed serial reports

### chat_completion (10x runChat + getMetrics)

# Perf Report — chat_completion (10x runChat + getMetrics).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0073ms |
| p50 | 0.0081ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0094ms |
| stdev | 0.0028ms |
| min | 0.0073ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.854)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0062ms | 0.0081ms | -0.0018ms | -22.88% |
| p50 | 0.0070ms | 0.01ms | -0.0033ms | -31.98% |
| p95 | 0.01ms | 0.02ms | -0.0080ms | -41.59% |
| p99 | 0.01ms | 0.02ms | -0.0089ms | -37.97% |
| mean | 0.0080ms | 0.01ms | -0.0032ms | -28.32% |
| min | 0.0062ms | 0.0073ms | -0.0011ms | -15.56% |
| max | 0.02ms | 0.02ms | -0.0091ms | -37.25% |
| total | 0.16ms | 0.22ms | -0.06ms | -28.32% |

### streaming_workload (5 runStream + chunk collect)

# Perf Report — streaming_workload (5 runStream + chunk collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 17.93ms |
| p50 | 19.86ms |
| p95 | 30.58ms |
| p99 | 42.47ms |
| mean | 21.92ms |
| stdev | 6.52ms |
| min | 16.87ms |
| max | 45.44ms |
| total | 438.45ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.996)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 17.86ms | 17.84ms | +0.02ms | +0.10% |
| p50 | 19.78ms | 19.18ms | +0.61ms | +3.16% |
| p95 | 30.45ms | 19.46ms | +11.00ms | +56.52% |
| p99 | 42.29ms | 19.48ms | +22.81ms | +117.09% |
| mean | 21.83ms | 18.82ms | +3.01ms | +16.01% |
| min | 16.81ms | 16.96ms | -0.15ms | -0.90% |
| max | 45.25ms | 19.49ms | +25.77ms | +132.21% |
| total | 436.67ms | 376.40ms | +60.27ms | +16.01% |

### multi_turn_conversation (10-turn chat + reset)

# Perf Report — multi_turn_conversation (10-turn chat + reset).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0070ms |
| p50 | 0.0072ms |
| p95 | 0.0085ms |
| p99 | 0.0087ms |
| mean | 0.0074ms |
| stdev | 0.00055ms |
| min | 0.0069ms |
| max | 0.0088ms |
| total | 0.15ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 0.955)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0066ms | 0.0067ms | -0.000060ms | -0.90% |
| p50 | 0.0069ms | 0.0069ms | +0.000028ms | +0.41% |
| p95 | 0.0081ms | 0.0086ms | -0.00042ms | -4.96% |
| p99 | 0.0083ms | 0.0087ms | -0.00040ms | -4.60% |
| mean | 0.0071ms | 0.0071ms | -4.9e-7ms | -0.01% |
| min | 0.0066ms | 0.0066ms | -0.000060ms | -0.91% |
| max | 0.0084ms | 0.0088ms | -0.00040ms | -4.51% |
| total | 0.14ms | 0.14ms | -0.0000099ms | -0.01% |

