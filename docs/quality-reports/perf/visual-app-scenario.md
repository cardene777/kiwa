# Perf Suite — visual-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00058ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.0012ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.0080ms | 0.02ms | 30ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| burst_compare (5 different 10x10 diff) | 0.04ms | 0.06ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_image_diff (100x100 png) | 0.0097ms | 0.01ms | 100ms | 0.0012ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.03ms | 60ms | PASS |
| burst_compare (5 different 10x10 diff) | 0.12ms | 200ms | PASS |
| large_image_diff (100x100 png) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 94968 B | -285888 B | 102400 B | yes | PASS |
| burst_compare (5 different 10x10 diff) | 476440 B | 0 B | 102400 B | yes | PASS |
| large_image_diff (100x100 png) | 95944 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### baseline_compare (identical 10x10 png)

# Perf Report — baseline_compare (identical 10x10 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0080ms |
| p50 | 0.0092ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0038ms |
| min | 0.0077ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0080ms | 0.0088ms | -0.00080ms | -9.11% |
| p50 | 0.0092ms | 0.01ms | -0.0014ms | -13.56% |
| p95 | 0.02ms | 0.02ms | -0.0020ms | -10.30% |
| p99 | 0.02ms | 0.02ms | -0.00017ms | -0.74% |
| mean | 0.01ms | 0.01ms | -0.0016ms | -13.74% |
| min | 0.0077ms | 0.0087ms | -0.00096ms | -11.06% |
| max | 0.02ms | 0.02ms | +0.00029ms | +1.24% |
| total | 0.21ms | 0.24ms | -0.03ms | -13.74% |

### burst_compare (5 different 10x10 diff)

# Perf Report — burst_compare (5 different 10x10 diff).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.04ms |
| p50 | 0.05ms |
| p95 | 0.06ms |
| p99 | 0.07ms |
| mean | 0.05ms |
| stdev | 0.0077ms |
| min | 0.04ms |
| max | 0.07ms |
| total | 1.05ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.05ms | -0.0058ms | -11.55% |
| p50 | 0.05ms | 0.05ms | -0.0016ms | -2.98% |
| p95 | 0.06ms | 0.13ms | -0.07ms | -53.58% |
| p99 | 0.07ms | 0.35ms | -0.28ms | -79.93% |
| mean | 0.05ms | 0.08ms | -0.02ms | -31.87% |
| min | 0.04ms | 0.05ms | -0.0072ms | -14.49% |
| max | 0.07ms | 0.41ms | -0.33ms | -82.08% |
| total | 1.05ms | 1.55ms | -0.49ms | -31.87% |

### large_image_diff (100x100 png)

# Perf Report — large_image_diff (100x100 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0097ms |
| p50 | 0.01ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0028ms |
| min | 0.0094ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0097ms | 0.0095ms | +0.00025ms | +2.60% |
| p50 | 0.01ms | 0.01ms | +0.00023ms | +2.23% |
| p95 | 0.01ms | 0.01ms | +0.0013ms | +10.54% |
| p99 | 0.02ms | 0.01ms | +0.0071ms | +53.47% |
| mean | 0.01ms | 0.01ms | +0.00093ms | +8.79% |
| min | 0.0094ms | 0.0093ms | +0.000042ms | +0.45% |
| max | 0.02ms | 0.01ms | +0.0086ms | +63.58% |
| total | 0.23ms | 0.21ms | +0.02ms | +8.79% |

