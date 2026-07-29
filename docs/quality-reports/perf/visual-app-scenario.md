# Perf Suite — visual-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.0091ms | 0.02ms | 30ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| burst_compare (5 different 10x10 diff) | 0.04ms | 0.06ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| large_image_diff (100x100 png) | 0.0087ms | 0.01ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 2, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| baseline_compare (identical 10x10 png) | 0.03ms | 60ms | PASS |
| burst_compare (5 different 10x10 diff) | 0.11ms | 200ms | PASS |
| large_image_diff (100x100 png) | 0.03ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| baseline_compare (identical 10x10 png) | 73288 B | 0 B | 102400 B | yes | PASS |
| burst_compare (5 different 10x10 diff) | 478400 B | 0 B | 102400 B | yes | PASS |
| large_image_diff (100x100 png) | 95976 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### baseline_compare (identical 10x10 png)

# Perf Report — baseline_compare (identical 10x10 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0091ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0029ms |
| min | 0.0085ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0091ms | 0.0088ms | +0.00028ms | +3.17% |
| p50 | 0.01ms | 0.01ms | -0.00013ms | -1.18% |
| p95 | 0.02ms | 0.02ms | -0.0031ms | -15.77% |
| p99 | 0.02ms | 0.02ms | -0.0028ms | -12.54% |
| mean | 0.01ms | 0.01ms | -0.00066ms | -5.55% |
| min | 0.0085ms | 0.0087ms | -0.00013ms | -1.44% |
| max | 0.02ms | 0.02ms | -0.0028ms | -11.88% |
| total | 0.23ms | 0.24ms | -0.01ms | -5.55% |

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
| stdev | 0.0065ms |
| min | 0.04ms |
| max | 0.07ms |
| total | 1.02ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.04ms | 0.05ms | -0.0059ms | -11.84% |
| p50 | 0.05ms | 0.05ms | -0.0056ms | -10.25% |
| p95 | 0.06ms | 0.13ms | -0.07ms | -53.15% |
| p99 | 0.07ms | 0.35ms | -0.29ms | -81.23% |
| mean | 0.05ms | 0.08ms | -0.03ms | -33.95% |
| min | 0.04ms | 0.05ms | -0.0068ms | -13.82% |
| max | 0.07ms | 0.41ms | -0.34ms | -83.53% |
| total | 1.02ms | 1.55ms | -0.53ms | -33.95% |

### large_image_diff (100x100 png)

# Perf Report — large_image_diff (100x100 png).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0087ms |
| p50 | 0.0093ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0023ms |
| min | 0.0083ms |
| max | 0.02ms |
| total | 0.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0087ms | 0.0095ms | -0.00076ms | -8.06% |
| p50 | 0.0093ms | 0.01ms | -0.00096ms | -9.37% |
| p95 | 0.01ms | 0.01ms | -0.00065ms | -5.15% |
| p99 | 0.02ms | 0.01ms | +0.0040ms | +29.75% |
| mean | 0.01ms | 0.01ms | -0.00049ms | -4.64% |
| min | 0.0083ms | 0.0093ms | -0.0011ms | -11.60% |
| max | 0.02ms | 0.01ms | +0.0051ms | +37.96% |
| total | 0.20ms | 0.21ms | -0.0098ms | -4.64% |

