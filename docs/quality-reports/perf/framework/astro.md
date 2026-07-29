# Perf Suite — astro

Threshold source: [docs/quality/perf-thresholds.md](../../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| renderAstroPage | 0.01ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| invokeEndpoint | 0.0079ms | 0.0098ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| renderAstroPage | 0.40ms | 10ms | PASS |
| invokeEndpoint | 0.11ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| renderAstroPage | -111520 B | 0 B | 102400 B | yes | PASS |
| invokeEndpoint | -9728 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### renderAstroPage

# Perf Report — renderAstroPage.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.01ms |
| p95 | 0.03ms |
| p99 | 0.07ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.0097ms |
| max | 0.10ms |
| total | 3.06ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | +0.00017ms | +1.54% |
| p50 | 0.01ms | 0.01ms | -5.0e-7ms | -0.00% |
| p95 | 0.03ms | 0.03ms | -0.0019ms | -6.49% |
| p99 | 0.07ms | 0.07ms | +0.0031ms | +4.65% |
| mean | 0.02ms | 0.02ms | -0.00017ms | -1.08% |
| min | 0.0097ms | 0.0096ms | +0.00013ms | +1.30% |
| max | 0.10ms | 0.10ms | +0.0051ms | +5.31% |
| total | 3.06ms | 3.10ms | -0.03ms | -1.08% |

### invokeEndpoint

# Perf Report — invokeEndpoint.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0079ms |
| p50 | 0.0083ms |
| p95 | 0.0098ms |
| p99 | 0.02ms |
| mean | 0.0087ms |
| stdev | 0.0019ms |
| min | 0.0077ms |
| max | 0.02ms |
| total | 1.74ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0079ms | 0.0077ms | +0.00013ms | +1.61% |
| p50 | 0.0083ms | 0.0080ms | +0.00033ms | +4.19% |
| p95 | 0.0098ms | 0.0091ms | +0.00069ms | +7.58% |
| p99 | 0.02ms | 0.02ms | +0.00023ms | +1.44% |
| mean | 0.0087ms | 0.0083ms | +0.00036ms | +4.33% |
| min | 0.0077ms | 0.0076ms | +0.000041ms | +0.54% |
| max | 0.02ms | 0.02ms | +0.0017ms | +7.63% |
| total | 1.74ms | 1.66ms | +0.07ms | +4.33% |

