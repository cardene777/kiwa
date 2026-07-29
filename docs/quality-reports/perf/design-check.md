# Perf Suite — design-check

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00046ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00092ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| checkSpecConformance | 0.0030ms | 0.0049ms | 5ms | 0.00092ms | PASS | stable — gate 無効 (regressionGate=false) |
| checkLayoutRegression | 0.0082ms | 0.04ms | 5ms | 0.00092ms | PASS | regressed — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| checkSpecConformance | 0.02ms | 10ms | PASS |
| checkLayoutRegression | 0.03ms | 10ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| checkSpecConformance | -45696 B | 0 B | 102400 B | yes | PASS |
| checkLayoutRegression | -1896 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### checkSpecConformance

# Perf Report — checkSpecConformance.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 5 |
| p10 | 0.0030ms |
| p50 | 0.0030ms |
| p95 | 0.0049ms |
| p99 | 0.0065ms |
| mean | 0.0034ms |
| stdev | 0.00082ms |
| min | 0.0030ms |
| max | 0.0073ms |
| total | 0.17ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0030ms | -0.000042ms | -1.38% |
| p50 | 0.0030ms | 0.0032ms | -0.00012ms | -3.92% |
| p95 | 0.0049ms | 0.0055ms | -0.00060ms | -11.03% |
| p99 | 0.0065ms | 0.0095ms | -0.0031ms | -32.14% |
| mean | 0.0034ms | 0.0036ms | -0.00027ms | -7.29% |
| min | 0.0030ms | 0.0021ms | +0.00083ms | +39.20% |
| max | 0.0073ms | 0.01ms | -0.0038ms | -34.33% |
| total | 0.17ms | 0.18ms | -0.01ms | -7.29% |

### checkLayoutRegression

# Perf Report — checkLayoutRegression.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 5 |
| p10 | 0.0082ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0089ms |
| min | 0.0070ms |
| max | 0.05ms |
| total | 1.27ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0082ms | 0.0061ms | +0.0021ms | +33.66% |
| p50 | 0.03ms | 0.02ms | +0.0037ms | +17.15% |
| p95 | 0.04ms | 0.03ms | +0.0058ms | +18.33% |
| p99 | 0.04ms | 0.20ms | -0.16ms | -79.18% |
| mean | 0.03ms | 0.03ms | -0.0011ms | -4.19% |
| min | 0.0070ms | 0.0060ms | +0.00096ms | +15.86% |
| max | 0.05ms | 0.36ms | -0.31ms | -86.97% |
| total | 1.27ms | 1.32ms | -0.06ms | -4.19% |

