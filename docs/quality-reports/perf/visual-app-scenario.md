# Perf Suite — visual-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.0082ms | 0.02ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| burst_compare (5 different 10x10 diff) | 0.05ms | 0.06ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_image_diff (100x100 png) | 0.0091ms | 0.01ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.03ms | 60ms | PASS |
| burst_compare (5 different 10x10 diff) | 0.11ms | 200ms | PASS |
| large_image_diff (100x100 png) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 90848 B | 0 B | 102400 B | yes | PASS |
| burst_compare (5 different 10x10 diff) | 478368 B | 0 B | 102400 B | yes | PASS |
| large_image_diff (100x100 png) | 96048 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### baseline_compare (identical 10x10 png)

# Perf Report — baseline_compare (identical 10x10 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0082ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0042ms |
| min | 0.0077ms |
| max | 0.02ms |
| total | 0.24ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0082ms | 0.0088ms | -0.00060ms | -6.79% |
| p50 | 0.01ms | 0.01ms | +0.00042ms | +3.92% |
| p95 | 0.02ms | 0.02ms | +0.0018ms | +9.45% |
| p99 | 0.02ms | 0.02ms | -0.00060ms | -2.64% |
| mean | 0.01ms | 0.01ms | -0.000010ms | -0.09% |
| min | 0.0077ms | 0.0087ms | -0.00092ms | -10.58% |
| max | 0.02ms | 0.02ms | -0.0012ms | -5.14% |
| total | 0.24ms | 0.24ms | -0.00021ms | -0.09% |

### burst_compare (5 different 10x10 diff)

# Perf Report — burst_compare (5 different 10x10 diff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.05ms |
| stdev | 0.0076ms |
| min | 0.04ms |
| max | 0.07ms |
| total | 1.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0042ms | -8.30% |
| p50 | 0.05ms | 0.05ms | -0.0059ms | -10.82% |
| p95 | 0.06ms | 0.13ms | -0.07ms | -51.37% |
| p99 | 0.07ms | 0.35ms | -0.28ms | -79.70% |
| mean | 0.05ms | 0.08ms | -0.03ms | -32.72% |
| min | 0.04ms | 0.05ms | -0.0067ms | -13.65% |
| max | 0.07ms | 0.41ms | -0.33ms | -82.01% |
| total | 1.04ms | 1.55ms | -0.51ms | -32.72% |

### large_image_diff (100x100 png)

# Perf Report — large_image_diff (100x100 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0091ms |
| p50 | 0.0095ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0099ms |
| stdev | 0.0010ms |
| min | 0.0088ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0091ms | 0.0095ms | -0.00033ms | -3.52% |
| p50 | 0.0095ms | 0.01ms | -0.00069ms | -6.73% |
| p95 | 0.01ms | 0.01ms | -0.0011ms | -8.97% |
| p99 | 0.01ms | 0.01ms | -0.00073ms | -5.46% |
| mean | 0.0099ms | 0.01ms | -0.00063ms | -5.96% |
| min | 0.0088ms | 0.0093ms | -0.00058ms | -6.25% |
| max | 0.01ms | 0.01ms | -0.00063ms | -4.63% |
| total | 0.20ms | 0.21ms | -0.01ms | -5.96% |

