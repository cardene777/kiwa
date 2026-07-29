# Perf Suite — visual-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00049ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.0085ms | 0.02ms | 30ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |
| burst_compare (5 different 10x10 diff) | 0.05ms | 0.44ms | 100ms | 0.00049ms | PASS | stable (p10 -2% (閾値未満)、 p95 +228% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| large_image_diff (100x100 png) | 0.0086ms | 0.01ms | 100ms | 0.00049ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.02ms | 60ms | PASS |
| burst_compare (5 different 10x10 diff) | 1.27ms | 200ms | PASS |
| large_image_diff (100x100 png) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 90224 B | 0 B | 102400 B | yes | PASS |
| burst_compare (5 different 10x10 diff) | 502952 B | 50943 B | 102400 B | yes | PASS |
| large_image_diff (100x100 png) | 101792 B | 10205 B | 102400 B | yes | PASS |

## Detailed serial reports

### baseline_compare (identical 10x10 png)

# Perf Report — baseline_compare (identical 10x10 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0085ms |
| p50 | 0.0092ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0028ms |
| min | 0.0078ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0085ms | 0.0088ms | -0.00030ms | -3.47% |
| p50 | 0.0092ms | 0.01ms | -0.0014ms | -13.36% |
| p95 | 0.02ms | 0.02ms | -0.0029ms | -15.01% |
| p99 | 0.02ms | 0.02ms | -0.0055ms | -24.32% |
| mean | 0.01ms | 0.01ms | -0.0014ms | -12.07% |
| min | 0.0078ms | 0.0087ms | -0.00083ms | -9.62% |
| max | 0.02ms | 0.02ms | -0.0062ms | -26.24% |
| total | 0.21ms | 0.24ms | -0.03ms | -12.07% |

### burst_compare (5 different 10x10 diff)

# Perf Report — burst_compare (5 different 10x10 diff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.13ms |
| p95 | 0.44ms |
| p99 | 0.67ms |
| mean | 0.16ms |
| stdev | 0.16ms |
| min | 0.05ms |
| max | 0.73ms |
| total | 3.12ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.00080ms | -1.59% |
| p50 | 0.13ms | 0.05ms | +0.07ms | +137.50% |
| p95 | 0.44ms | 0.13ms | +0.30ms | +228.30% |
| p99 | 0.67ms | 0.35ms | +0.32ms | +90.80% |
| mean | 0.16ms | 0.08ms | +0.08ms | +102.01% |
| min | 0.05ms | 0.05ms | -0.0035ms | -6.99% |
| max | 0.73ms | 0.41ms | +0.32ms | +79.55% |
| total | 3.12ms | 1.55ms | +1.58ms | +102.01% |

### large_image_diff (100x100 png)

# Perf Report — large_image_diff (100x100 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0086ms |
| p50 | 0.0092ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0094ms |
| stdev | 0.0010ms |
| min | 0.0082ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0086ms | 0.0095ms | -0.00088ms | -9.34% |
| p50 | 0.0092ms | 0.01ms | -0.0010ms | -10.19% |
| p95 | 0.01ms | 0.01ms | -0.0024ms | -18.56% |
| p99 | 0.01ms | 0.01ms | -0.00084ms | -6.29% |
| mean | 0.0094ms | 0.01ms | -0.0011ms | -10.84% |
| min | 0.0082ms | 0.0093ms | -0.0012ms | -12.49% |
| max | 0.01ms | 0.01ms | -0.00046ms | -3.40% |
| total | 0.19ms | 0.21ms | -0.02ms | -10.84% |

