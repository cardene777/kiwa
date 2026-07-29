# Perf Suite — visual-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

## Serial p95 (concurrency = 1)

| op | p95 | cap | gate | regression |
|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.08ms | 30ms | PASS | stable (差 0.05ms が下限 0.5ms 未満で判定を保留) — gate 無効 (regressionGate=false) |
| burst_compare (5 different 10x10 diff) | 0.08ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +636%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |
| large_image_diff (100x100 png) | 0.01ms | 100ms | PASS | stable (検知には +0.5ms (baseline 比 +2733%) 以上の悪化が必要) — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.06ms | 60ms | PASS |
| burst_compare (5 different 10x10 diff) | 0.71ms | 200ms | PASS |
| large_image_diff (100x100 png) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 89784 B | 0 B | 102400 B | yes | PASS |
| burst_compare (5 different 10x10 diff) | 481480 B | 0 B | 102400 B | yes | PASS |
| large_image_diff (100x100 png) | 84576 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### baseline_compare (identical 10x10 png)

# Perf Report — baseline_compare (identical 10x10 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.03ms |
| p95 | 0.08ms |
| p99 | 0.17ms |
| mean | 0.04ms |
| stdev | 0.04ms |
| min | 0.02ms |
| max | 0.19ms |
| total | 0.77ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.03ms | 0.01ms | +0.01ms | +119.58% |
| p95 | 0.08ms | 0.03ms | +0.05ms | +195.14% |
| p99 | 0.17ms | 0.03ms | +0.14ms | +466.82% |
| mean | 0.04ms | 0.01ms | +0.02ms | +178.52% |
| min | 0.02ms | 0.01ms | +0.01ms | +144.23% |
| max | 0.19ms | 0.03ms | +0.16ms | +523.27% |
| total | 0.77ms | 0.28ms | +0.49ms | +178.52% |

### burst_compare (5 different 10x10 diff)

# Perf Report — burst_compare (5 different 10x10 diff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.05ms |
| p95 | 0.08ms |
| p99 | 0.11ms |
| mean | 0.06ms |
| stdev | 0.01ms |
| min | 0.05ms |
| max | 0.11ms |
| total | 1.18ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.05ms | 0.05ms | -0.00ms | -1.48% |
| p95 | 0.08ms | 0.08ms | +0.01ms | +7.82% |
| p99 | 0.11ms | 0.14ms | -0.04ms | -25.37% |
| mean | 0.06ms | 0.06ms | -0.00ms | -2.98% |
| min | 0.05ms | 0.05ms | +0.00ms | +5.07% |
| max | 0.11ms | 0.16ms | -0.05ms | -29.50% |
| total | 1.18ms | 1.22ms | -0.04ms | -2.98% |

### large_image_diff (100x100 png)

# Perf Report — large_image_diff (100x100 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.01ms |
| mean | 0.01ms |
| stdev | 0.00ms |
| min | 0.01ms |
| max | 0.01ms |
| total | 0.22ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p50 | 0.01ms | 0.01ms | +0.00ms | +13.47% |
| p95 | 0.01ms | 0.02ms | -0.00ms | -26.19% |
| p99 | 0.01ms | 0.03ms | -0.02ms | -58.41% |
| mean | 0.01ms | 0.01ms | -0.00ms | -6.25% |
| min | 0.01ms | 0.01ms | +0.00ms | +11.23% |
| max | 0.01ms | 0.04ms | -0.02ms | -62.27% |
| total | 0.22ms | 0.23ms | -0.01ms | -6.25% |

