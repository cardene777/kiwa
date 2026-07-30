# Perf Suite — ai-llm-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (実測) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.0072ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| streaming_workload (5 runStream + chunk collect) | 16.38ms | 17.61ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| multi_turn_conversation (10-turn chat + reset) | 0.0066ms | 0.0099ms | 100ms | 0.00051ms | PASS | stable — gate 無効 (regressionGate=false) |

## 実行内正規化 (回帰判定はこの比で行う)

回帰判定は実測値そのものではなく、 同じ実行の中で 1 呼出ずつ交互に測った基準 op との比を読む。 実行と実行の間で機械の状態が変わっても、 その差が分子と分母で相殺される。 「換算後 p10」 は今回の比を baseline を測った時の基準 p10 で ms に戻した値で、 baseline の実測 p10 と直接比べられる。

| op | 基準 op | 基準 p10 | 基準 p95 | 実測 p10 | 比 | baseline の比 | 換算後 p10 | baseline p10 |
|---|---|---|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | cpu | 0.08ms | 0.10ms | 0.0072ms | 0.086 | 0.097 | 0.0072ms | 0.0081ms |
| streaming_workload (5 runStream + chunk collect) | cpu | 0.08ms | 0.10ms | 16.38ms | 199.585 | 215.479 | 16.53ms | 17.84ms |
| multi_turn_conversation (10-turn chat + reset) | cpu | 0.08ms | 0.09ms | 0.0066ms | 0.081 | 0.081 | 0.0067ms | 0.0067ms |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | 0.05ms | 200ms | PASS |
| streaming_workload (5 runStream + chunk collect) | 17.50ms | 200ms | PASS |
| multi_turn_conversation (10-turn chat + reset) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| chat_completion (10x runChat + getMetrics) | -8752 B | 0 B | 102400 B | yes | PASS |
| streaming_workload (5 runStream + chunk collect) | -4376 B | 0 B | 102400 B | yes | PASS |
| multi_turn_conversation (10-turn chat + reset) | 632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### chat_completion (10x runChat + getMetrics)

# Perf Report — chat_completion (10x runChat + getMetrics).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0072ms |
| p50 | 0.0088ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0094ms |
| stdev | 0.0026ms |
| min | 0.0065ms |
| max | 0.02ms |
| total | 0.19ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.005)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0072ms | 0.0081ms | -0.00088ms | -10.86% |
| p50 | 0.0088ms | 0.01ms | -0.0014ms | -13.83% |
| p95 | 0.01ms | 0.02ms | -0.0063ms | -32.83% |
| p99 | 0.02ms | 0.02ms | -0.0061ms | -26.12% |
| mean | 0.0095ms | 0.01ms | -0.0017ms | -15.39% |
| min | 0.0066ms | 0.0073ms | -0.00076ms | -10.34% |
| max | 0.02ms | 0.02ms | -0.0061ms | -24.80% |
| total | 0.19ms | 0.22ms | -0.03ms | -15.39% |

### streaming_workload (5 runStream + chunk collect)

# Perf Report — streaming_workload (5 runStream + chunk collect).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 16.38ms |
| p50 | 17.45ms |
| p95 | 17.61ms |
| p99 | 17.70ms |
| mean | 17.31ms |
| stdev | 0.44ms |
| min | 16.27ms |
| max | 17.72ms |
| total | 346.26ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.009)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 16.53ms | 17.84ms | -1.32ms | -7.38% |
| p50 | 17.61ms | 19.18ms | -1.56ms | -8.16% |
| p95 | 17.77ms | 19.46ms | -1.69ms | -8.67% |
| p99 | 17.86ms | 19.48ms | -1.63ms | -8.34% |
| mean | 17.47ms | 18.82ms | -1.35ms | -7.17% |
| min | 16.42ms | 16.96ms | -0.54ms | -3.17% |
| max | 17.88ms | 19.49ms | -1.61ms | -8.26% |
| total | 349.42ms | 376.40ms | -26.98ms | -7.17% |

### multi_turn_conversation (10-turn chat + reset)

# Perf Report — multi_turn_conversation (10-turn chat + reset).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0066ms |
| p50 | 0.0081ms |
| p95 | 0.0099ms |
| p99 | 0.01ms |
| mean | 0.0080ms |
| stdev | 0.0012ms |
| min | 0.0064ms |
| max | 0.01ms |
| total | 0.16ms |

## Baseline diff

current は baseline を測った時の機械の速さへ換算済み (倍率 1.021)。 回帰判定が読む量と同じ。 実測値は上表。

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0067ms | 0.0067ms | +0.000045ms | +0.68% |
| p50 | 0.0083ms | 0.0069ms | +0.0014ms | +20.31% |
| p95 | 0.01ms | 0.0086ms | +0.0016ms | +18.39% |
| p99 | 0.01ms | 0.0087ms | +0.0021ms | +24.32% |
| mean | 0.0082ms | 0.0071ms | +0.0011ms | +15.35% |
| min | 0.0065ms | 0.0066ms | -0.00012ms | -1.78% |
| max | 0.01ms | 0.0088ms | +0.0023ms | +25.76% |
| total | 0.16ms | 0.14ms | +0.02ms | +15.35% |

