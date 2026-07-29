# Perf Suite — visual-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.0080ms | 0.02ms | 30ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| burst_compare (5 different 10x10 diff) | 0.05ms | 0.07ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_image_diff (100x100 png) | 0.0085ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.02ms | 60ms | PASS |
| burst_compare (5 different 10x10 diff) | 0.13ms | 200ms | PASS |
| large_image_diff (100x100 png) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 89584 B | 0 B | 102400 B | yes | PASS |
| burst_compare (5 different 10x10 diff) | 478432 B | 0 B | 102400 B | yes | PASS |
| large_image_diff (100x100 png) | 95424 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### baseline_compare (identical 10x10 png)

# Perf Report — baseline_compare (identical 10x10 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0080ms |
| p50 | 0.0087ms |
| p95 | 0.02ms |
| p99 | 0.03ms |
| mean | 0.01ms |
| stdev | 0.0050ms |
| min | 0.0077ms |
| max | 0.03ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0080ms | 0.0088ms | -0.00075ms | -8.55% |
| p50 | 0.0087ms | 0.01ms | -0.0019ms | -18.27% |
| p95 | 0.02ms | 0.02ms | -0.0032ms | -16.61% |
| p99 | 0.03ms | 0.02ms | +0.0040ms | +17.57% |
| mean | 0.01ms | 0.01ms | -0.00085ms | -7.11% |
| min | 0.0077ms | 0.0087ms | -0.00092ms | -10.58% |
| max | 0.03ms | 0.02ms | +0.0058ms | +24.64% |
| total | 0.22ms | 0.24ms | -0.02ms | -7.11% |

### burst_compare (5 different 10x10 diff)

# Perf Report — burst_compare (5 different 10x10 diff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.05ms |
| p50 | 0.05ms |
| p95 | 0.07ms |
| p99 | 0.07ms |
| mean | 0.05ms |
| stdev | 0.0078ms |
| min | 0.04ms |
| max | 0.07ms |
| total | 1.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.05ms | 0.05ms | -0.0043ms | -8.56% |
| p50 | 0.05ms | 0.05ms | -0.0039ms | -7.11% |
| p95 | 0.07ms | 0.13ms | -0.06ms | -48.12% |
| p99 | 0.07ms | 0.35ms | -0.28ms | -79.26% |
| mean | 0.05ms | 0.08ms | -0.02ms | -31.48% |
| min | 0.04ms | 0.05ms | -0.0050ms | -10.02% |
| max | 0.07ms | 0.41ms | -0.33ms | -81.81% |
| total | 1.06ms | 1.55ms | -0.49ms | -31.48% |

### large_image_diff (100x100 png)

# Perf Report — large_image_diff (100x100 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0085ms |
| p50 | 0.0092ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.0094ms |
| stdev | 0.00078ms |
| min | 0.0084ms |
| max | 0.01ms |
| total | 0.19ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0085ms | 0.0095ms | -0.00099ms | -10.52% |
| p50 | 0.0092ms | 0.01ms | -0.0010ms | -10.19% |
| p95 | 0.01ms | 0.01ms | -0.0019ms | -14.71% |
| p99 | 0.01ms | 0.01ms | -0.0024ms | -18.04% |
| mean | 0.0094ms | 0.01ms | -0.0012ms | -11.04% |
| min | 0.0084ms | 0.0093ms | -0.00096ms | -10.26% |
| max | 0.01ms | 0.01ms | -0.0025ms | -18.83% |
| total | 0.19ms | 0.21ms | -0.02ms | -11.04% |

