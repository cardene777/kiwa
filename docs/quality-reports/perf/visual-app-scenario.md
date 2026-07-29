# Perf Suite — visual-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.0091ms | 0.05ms | 30ms | 0.00050ms | PASS | stable (p10 +4% (閾値未満)、 p95 +132% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| burst_compare (5 different 10x10 diff) | 0.05ms | 0.11ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_image_diff (100x100 png) | 0.0091ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.02ms | 60ms | PASS |
| burst_compare (5 different 10x10 diff) | 0.11ms | 200ms | PASS |
| large_image_diff (100x100 png) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 88960 B | 0 B | 102400 B | yes | PASS |
| burst_compare (5 different 10x10 diff) | 478352 B | 0 B | 102400 B | yes | PASS |
| large_image_diff (100x100 png) | 95712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### baseline_compare (identical 10x10 png)

# Perf Report — baseline_compare (identical 10x10 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0091ms |
| p50 | 0.01ms |
| p95 | 0.05ms |
| p99 | 0.10ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.0083ms |
| max | 0.12ms |
| total | 0.39ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0091ms | 0.0088ms | +0.00036ms | +4.08% |
| p50 | 0.01ms | 0.01ms | -0.000021ms | -0.20% |
| p95 | 0.05ms | 0.02ms | +0.03ms | +132.36% |
| p99 | 0.10ms | 0.02ms | +0.08ms | +348.65% |
| mean | 0.02ms | 0.01ms | +0.0077ms | +64.31% |
| min | 0.0083ms | 0.0087ms | -0.00033ms | -3.85% |
| max | 0.12ms | 0.02ms | +0.09ms | +393.44% |
| total | 0.39ms | 0.24ms | +0.15ms | +64.31% |

### burst_compare (5 different 10x10 diff)

# Perf Report — burst_compare (5 different 10x10 diff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.11ms |
| p99 | 0.14ms |
| mean | 0.06ms |
| stdev | 0.02ms |
| min | 0.05ms |
| max | 0.14ms |
| total | 1.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | +0.00046ms | +0.92% |
| p50 | 0.05ms | 0.05ms | +0.00021ms | +0.38% |
| p95 | 0.11ms | 0.13ms | -0.03ms | -20.06% |
| p99 | 0.14ms | 0.35ms | -0.22ms | -61.13% |
| mean | 0.06ms | 0.08ms | -0.02ms | -20.75% |
| min | 0.05ms | 0.05ms | -0.0015ms | -3.12% |
| max | 0.14ms | 0.41ms | -0.26ms | -64.48% |
| total | 1.23ms | 1.55ms | -0.32ms | -20.75% |

### large_image_diff (100x100 png)

# Perf Report — large_image_diff (100x100 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0091ms |
| p50 | 0.0099ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0026ms |
| min | 0.0088ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0091ms | 0.0095ms | -0.00037ms | -3.96% |
| p50 | 0.0099ms | 0.01ms | -0.00029ms | -2.85% |
| p95 | 0.01ms | 0.01ms | +0.000058ms | +0.45% |
| p99 | 0.02ms | 0.01ms | +0.0060ms | +45.06% |
| mean | 0.01ms | 0.01ms | +0.000098ms | +0.93% |
| min | 0.0088ms | 0.0093ms | -0.00058ms | -6.25% |
| max | 0.02ms | 0.01ms | +0.0075ms | +55.56% |
| total | 0.21ms | 0.21ms | +0.0020ms | +0.93% |

