# Perf Suite — astro

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderAstroPage | 0.01ms | 0.02ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeEndpoint | 0.0074ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderAstroPage | 0.23ms | 10ms | PASS |
| invokeEndpoint | 0.09ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderAstroPage | -108960 B | 0 B | 102400 B | yes | PASS |
| invokeEndpoint | -12512 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderAstroPage

# Perf Report — renderAstroPage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.07ms |
| mean | 0.01ms |
| stdev | 0.01ms |
| min | 0.0096ms |
| max | 0.10ms |
| total | 2.88ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00054ms | -4.98% |
| p50 | 0.01ms | 0.01ms | -0.00075ms | -6.13% |
| p95 | 0.02ms | 0.03ms | -0.0044ms | -15.37% |
| p99 | 0.07ms | 0.07ms | +0.00052ms | +0.77% |
| mean | 0.01ms | 0.02ms | -0.0011ms | -6.98% |
| min | 0.0096ms | 0.0096ms | 0.00ms | 0.00% |
| max | 0.10ms | 0.10ms | +0.0018ms | +1.91% |
| total | 2.88ms | 3.10ms | -0.22ms | -6.98% |

### invokeEndpoint

# Perf Report — invokeEndpoint.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0074ms |
| p50 | 0.0076ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0081ms |
| stdev | 0.0018ms |
| min | 0.0072ms |
| max | 0.02ms |
| total | 1.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0074ms | 0.0077ms | -0.00038ms | -4.84% |
| p50 | 0.0076ms | 0.0080ms | -0.00037ms | -4.70% |
| p95 | 0.01ms | 0.0091ms | +0.0016ms | +17.59% |
| p99 | 0.02ms | 0.02ms | -0.00090ms | -5.51% |
| mean | 0.0081ms | 0.0083ms | -0.00026ms | -3.15% |
| min | 0.0072ms | 0.0076ms | -0.00042ms | -5.46% |
| max | 0.02ms | 0.02ms | +0.000041ms | +0.18% |
| total | 1.61ms | 1.66ms | -0.05ms | -3.15% |

