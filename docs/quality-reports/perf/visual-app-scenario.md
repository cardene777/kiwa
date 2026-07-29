# Perf Suite — visual-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.0082ms | 0.02ms | 30ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| burst_compare (5 different 10x10 diff) | 0.05ms | 0.06ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_image_diff (100x100 png) | 0.0091ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.03ms | 60ms | PASS |
| burst_compare (5 different 10x10 diff) | 0.12ms | 200ms | PASS |
| large_image_diff (100x100 png) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 89584 B | 0 B | 102400 B | yes | PASS |
| burst_compare (5 different 10x10 diff) | 477352 B | 0 B | 102400 B | yes | PASS |
| large_image_diff (100x100 png) | 95976 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### baseline_compare (identical 10x10 png)

# Perf Report — baseline_compare (identical 10x10 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0082ms |
| p50 | 0.0095ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0027ms |
| min | 0.0076ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0082ms | 0.0088ms | -0.00059ms | -6.74% |
| p50 | 0.0095ms | 0.01ms | -0.0011ms | -10.81% |
| p95 | 0.02ms | 0.02ms | -0.0042ms | -21.64% |
| p99 | 0.02ms | 0.02ms | -0.0049ms | -21.49% |
| mean | 0.01ms | 0.01ms | -0.0016ms | -13.71% |
| min | 0.0076ms | 0.0087ms | -0.0010ms | -12.02% |
| max | 0.02ms | 0.02ms | -0.0050ms | -21.46% |
| total | 0.21ms | 0.24ms | -0.03ms | -13.71% |

### burst_compare (5 different 10x10 diff)

# Perf Report — burst_compare (5 different 10x10 diff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.06ms |
| mean | 0.05ms |
| stdev | 0.0044ms |
| min | 0.05ms |
| max | 0.06ms |
| total | 1.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0025ms | -5.09% |
| p50 | 0.05ms | 0.05ms | -0.0054ms | -9.90% |
| p95 | 0.06ms | 0.13ms | -0.07ms | -55.65% |
| p99 | 0.06ms | 0.35ms | -0.29ms | -83.05% |
| mean | 0.05ms | 0.08ms | -0.03ms | -33.38% |
| min | 0.05ms | 0.05ms | -0.0029ms | -5.90% |
| max | 0.06ms | 0.41ms | -0.35ms | -85.29% |
| total | 1.03ms | 1.55ms | -0.52ms | -33.38% |

### large_image_diff (100x100 png)

# Perf Report — large_image_diff (100x100 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0091ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0027ms |
| min | 0.0086ms |
| max | 0.02ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0091ms | 0.0095ms | -0.00032ms | -3.34% |
| p50 | 0.01ms | 0.01ms | -0.00015ms | -1.43% |
| p95 | 0.01ms | 0.01ms | +0.00091ms | +7.14% |
| p99 | 0.02ms | 0.01ms | +0.0065ms | +48.58% |
| mean | 0.01ms | 0.01ms | +0.00021ms | +2.03% |
| min | 0.0086ms | 0.0093ms | -0.00075ms | -8.04% |
| max | 0.02ms | 0.01ms | +0.0079ms | +58.33% |
| total | 0.22ms | 0.21ms | +0.0043ms | +2.03% |

