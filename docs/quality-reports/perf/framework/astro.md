# Perf Suite — astro

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderAstroPage | 0.0092ms | 0.04ms | 5ms | 0.00033ms | PASS | stable (p10 -15% (閾値未満)、 p95 +30% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| invokeEndpoint | 0.0077ms | 0.0093ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderAstroPage | 0.16ms | 10ms | PASS |
| invokeEndpoint | 0.10ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderAstroPage | -123304 B | 0 B | 102400 B | yes | PASS |
| invokeEndpoint | -10640 B | -803 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderAstroPage

# Perf Report — renderAstroPage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0092ms |
| p50 | 0.01ms |
| p95 | 0.04ms |
| p99 | 0.09ms |
| mean | 0.02ms |
| stdev | 0.04ms |
| min | 0.0090ms |
| max | 0.48ms |
| total | 3.47ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0092ms | 0.01ms | -0.0016ms | -14.98% |
| p50 | 0.01ms | 0.01ms | -0.0015ms | -12.27% |
| p95 | 0.04ms | 0.03ms | +0.0085ms | +29.67% |
| p99 | 0.09ms | 0.07ms | +0.02ms | +36.51% |
| mean | 0.02ms | 0.02ms | +0.0019ms | +12.15% |
| min | 0.0090ms | 0.0096ms | -0.00067ms | -6.93% |
| max | 0.48ms | 0.10ms | +0.39ms | +404.53% |
| total | 3.47ms | 3.10ms | +0.38ms | +12.15% |

### invokeEndpoint

# Perf Report — invokeEndpoint.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0077ms |
| p50 | 0.0080ms |
| p95 | 0.0093ms |
| p99 | 0.02ms |
| mean | 0.0083ms |
| stdev | 0.0017ms |
| min | 0.0075ms |
| max | 0.02ms |
| total | 1.66ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0077ms | 0.0077ms | 0.00ms | 0.00% |
| p50 | 0.0080ms | 0.0080ms | 0.00ms | 0.00% |
| p95 | 0.0093ms | 0.0091ms | +0.00017ms | +1.83% |
| p99 | 0.02ms | 0.02ms | -0.000046ms | -0.28% |
| mean | 0.0083ms | 0.0083ms | -0.000026ms | -0.31% |
| min | 0.0075ms | 0.0076ms | -0.000083ms | -1.09% |
| max | 0.02ms | 0.02ms | +0.00088ms | +3.91% |
| total | 1.66ms | 1.66ms | -0.0052ms | -0.31% |

