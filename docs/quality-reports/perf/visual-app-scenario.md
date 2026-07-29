# Perf Suite — visual-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.0078ms | 0.01ms | 30ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| burst_compare (5 different 10x10 diff) | 0.05ms | 0.08ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_image_diff (100x100 png) | 0.0085ms | 0.0098ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.02ms | 60ms | PASS |
| burst_compare (5 different 10x10 diff) | 0.11ms | 200ms | PASS |
| large_image_diff (100x100 png) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 92064 B | 0 B | 102400 B | yes | PASS |
| burst_compare (5 different 10x10 diff) | 477352 B | 0 B | 102400 B | yes | PASS |
| large_image_diff (100x100 png) | 95976 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### baseline_compare (identical 10x10 png)

# Perf Report — baseline_compare (identical 10x10 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0078ms |
| p50 | 0.0090ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0098ms |
| stdev | 0.0022ms |
| min | 0.0076ms |
| max | 0.01ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0078ms | 0.0088ms | -0.0010ms | -11.44% |
| p50 | 0.0090ms | 0.01ms | -0.0016ms | -14.93% |
| p95 | 0.01ms | 0.02ms | -0.0051ms | -26.18% |
| p99 | 0.01ms | 0.02ms | -0.0078ms | -34.46% |
| mean | 0.0098ms | 0.01ms | -0.0022ms | -18.21% |
| min | 0.0076ms | 0.0087ms | -0.0010ms | -12.02% |
| max | 0.01ms | 0.02ms | -0.0085ms | -36.17% |
| total | 0.20ms | 0.24ms | -0.04ms | -18.21% |

### burst_compare (5 different 10x10 diff)

# Perf Report — burst_compare (5 different 10x10 diff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.08ms |
| p99 | 0.11ms |
| mean | 0.06ms |
| stdev | 0.02ms |
| min | 0.04ms |
| max | 0.12ms |
| total | 1.14ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0049ms | -9.73% |
| p50 | 0.05ms | 0.05ms | -0.0021ms | -3.82% |
| p95 | 0.08ms | 0.13ms | -0.05ms | -36.15% |
| p99 | 0.11ms | 0.35ms | -0.24ms | -68.22% |
| mean | 0.06ms | 0.08ms | -0.02ms | -26.44% |
| min | 0.04ms | 0.05ms | -0.0045ms | -9.10% |
| max | 0.12ms | 0.41ms | -0.29ms | -70.85% |
| total | 1.14ms | 1.55ms | -0.41ms | -26.44% |

### large_image_diff (100x100 png)

# Perf Report — large_image_diff (100x100 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0085ms |
| p50 | 0.0087ms |
| p95 | 0.0098ms |
| p99 | 0.0099ms |
| mean | 0.0089ms |
| stdev | 0.00052ms |
| min | 0.0082ms |
| max | 0.010ms |
| total | 0.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0085ms | 0.0095ms | -0.00099ms | -10.52% |
| p50 | 0.0087ms | 0.01ms | -0.0015ms | -14.87% |
| p95 | 0.0098ms | 0.01ms | -0.0029ms | -22.58% |
| p99 | 0.0099ms | 0.01ms | -0.0034ms | -25.54% |
| mean | 0.0089ms | 0.01ms | -0.0016ms | -15.50% |
| min | 0.0082ms | 0.0093ms | -0.0011ms | -12.05% |
| max | 0.010ms | 0.01ms | -0.0035ms | -26.24% |
| total | 0.18ms | 0.21ms | -0.03ms | -15.50% |

