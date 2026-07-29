# Perf Suite — ai-llm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.0057ms | 0.01ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| streaming_workload (5 runStream + chunk collect) | 18.02ms | 19.39ms | 100ms | 0.00048ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_turn_conversation (10-turn chat + reset) | 0.0068ms | 0.01ms | 100ms | 0.00050ms | PASS | stable (p10 +9% (閾値未満)、 p95 +28% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | cpu | 0.08ms | 0.0057ms | 0.069 | 0.076 | 0.0055ms | 0.0060ms |
| streaming_workload (5 runStream + chunk collect) | cpu | 0.08ms | 18.02ms | 218.122 | 212.484 | 17.71ms | 17.25ms |
| multi_turn_conversation (10-turn chat + reset) | cpu | 0.08ms | 0.0068ms | 0.084 | 0.077 | 0.0069ms | 0.0064ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.04ms | 200ms | PASS |
| streaming_workload (5 runStream + chunk collect) | 19.39ms | 200ms | PASS |
| multi_turn_conversation (10-turn chat + reset) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | -8000 B | 0 B | 102400 B | yes | PASS |
| streaming_workload (5 runStream + chunk collect) | -5736 B | 0 B | 102400 B | yes | PASS |
| multi_turn_conversation (10-turn chat + reset) | 632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_completion (10x runChat + getMetrics)

# Perf Report — chat_completion (10x runChat + getMetrics).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0057ms |
| p50 | 0.0063ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0075ms |
| stdev | 0.0023ms |
| min | 0.0057ms |
| max | 0.01ms |
| total | 0.15ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0057ms | 0.0060ms | -0.00032ms | -5.37% |
| p50 | 0.0063ms | 0.0075ms | -0.0012ms | -15.60% |
| p95 | 0.01ms | 0.02ms | -0.0052ms | -33.52% |
| p99 | 0.01ms | 0.02ms | -0.0085ms | -38.34% |
| mean | 0.0075ms | 0.0086ms | -0.0011ms | -12.59% |
| min | 0.0057ms | 0.0059ms | -0.00021ms | -3.56% |
| max | 0.01ms | 0.02ms | -0.0093ms | -39.12% |
| total | 0.15ms | 0.17ms | -0.02ms | -12.59% |

### streaming_workload (5 runStream + chunk collect)

# Perf Report — streaming_workload (5 runStream + chunk collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 18.02ms |
| p50 | 19.24ms |
| p95 | 19.39ms |
| p99 | 19.39ms |
| mean | 18.97ms |
| stdev | 0.52ms |
| min | 17.82ms |
| max | 19.39ms |
| total | 379.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 18.02ms | 17.25ms | +0.77ms | +4.47% |
| p50 | 19.24ms | 17.49ms | +1.75ms | +10.00% |
| p95 | 19.39ms | 17.80ms | +1.59ms | +8.92% |
| p99 | 19.39ms | 17.87ms | +1.52ms | +8.51% |
| mean | 18.97ms | 17.40ms | +1.58ms | +9.06% |
| min | 17.82ms | 15.63ms | +2.19ms | +14.02% |
| max | 19.39ms | 17.88ms | +1.50ms | +8.41% |
| total | 379.46ms | 347.94ms | +31.52ms | +9.06% |

### multi_turn_conversation (10-turn chat + reset)

# Perf Report — multi_turn_conversation (10-turn chat + reset).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0068ms |
| p50 | 0.0079ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0081ms |
| stdev | 0.0012ms |
| min | 0.0064ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0068ms | 0.0064ms | +0.00045ms | +6.99% |
| p50 | 0.0079ms | 0.0065ms | +0.0013ms | +20.37% |
| p95 | 0.01ms | 0.0081ms | +0.0021ms | +25.45% |
| p99 | 0.01ms | 0.0084ms | +0.0024ms | +28.25% |
| mean | 0.0081ms | 0.0068ms | +0.0013ms | +18.98% |
| min | 0.0064ms | 0.0063ms | +0.000083ms | +1.32% |
| max | 0.01ms | 0.0085ms | +0.0025ms | +28.92% |
| total | 0.16ms | 0.14ms | +0.03ms | +18.98% |

