# Perf Suite — design-check

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| checkSpecConformance | 0.0029ms | 0.0057ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| checkLayoutRegression | 0.0060ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| checkSpecConformance | 0.01ms | 10ms | PASS |
| checkLayoutRegression | 0.03ms | 10ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| checkSpecConformance | -46584 B | 0 B | 102400 B | yes | PASS |
| checkLayoutRegression | -1896 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### checkSpecConformance

# Perf Report — checkSpecConformance.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 5 |
| p10 | 0.0029ms |
| p50 | 0.0030ms |
| p95 | 0.0057ms |
| p99 | 0.01ms |
| mean | 0.0034ms |
| stdev | 0.0015ms |
| min | 0.0023ms |
| max | 0.01ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0029ms | 0.0030ms | -0.00017ms | -5.49% |
| p50 | 0.0030ms | 0.0032ms | -0.00021ms | -6.57% |
| p95 | 0.0057ms | 0.0055ms | +0.00024ms | +4.45% |
| p99 | 0.01ms | 0.0095ms | +0.00058ms | +6.10% |
| mean | 0.0034ms | 0.0036ms | -0.00020ms | -5.44% |
| min | 0.0023ms | 0.0021ms | +0.00021ms | +9.79% |
| max | 0.01ms | 0.01ms | +0.00038ms | +3.37% |
| total | 0.17ms | 0.18ms | -0.0099ms | -5.44% |

### checkLayoutRegression

# Perf Report — checkLayoutRegression.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 5 |
| p10 | 0.0060ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.0098ms |
| min | 0.0059ms |
| max | 0.04ms |
| total | 0.79ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0060ms | 0.0061ms | -0.00017ms | -2.79% |
| p50 | 0.02ms | 0.02ms | -0.00035ms | -1.65% |
| p95 | 0.03ms | 0.03ms | +0.0024ms | +7.49% |
| p99 | 0.04ms | 0.20ms | -0.17ms | -82.20% |
| mean | 0.02ms | 0.03ms | -0.01ms | -40.25% |
| min | 0.0059ms | 0.0060ms | -0.00017ms | -2.76% |
| max | 0.04ms | 0.36ms | -0.32ms | -89.58% |
| total | 0.79ms | 1.32ms | -0.53ms | -40.25% |

