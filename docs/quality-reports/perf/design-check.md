# Perf Suite — design-check

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| checkSpecConformance | 0.0021ms | 0.0050ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| checkLayoutRegression | 0.0059ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 10 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| checkSpecConformance | 0.01ms | 10ms | PASS |
| checkLayoutRegression | 0.03ms | 10ms | PASS |

## Memory retention (50 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| checkSpecConformance | 252224 B | 0 B | 102400 B | yes | PASS |
| checkLayoutRegression | -1896 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### checkSpecConformance

# Perf Report — checkSpecConformance.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 5 |
| p10 | 0.0021ms |
| p50 | 0.0030ms |
| p95 | 0.0050ms |
| p99 | 0.0066ms |
| mean | 0.0031ms |
| stdev | 0.00093ms |
| min | 0.0020ms |
| max | 0.0066ms |
| total | 0.16ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0021ms | 0.0030ms | -0.00092ms | -30.28% |
| p50 | 0.0030ms | 0.0032ms | -0.00019ms | -5.89% |
| p95 | 0.0050ms | 0.0055ms | -0.00044ms | -7.98% |
| p99 | 0.0066ms | 0.0095ms | -0.0029ms | -30.78% |
| mean | 0.0031ms | 0.0036ms | -0.00052ms | -14.19% |
| min | 0.0020ms | 0.0021ms | -0.000083ms | -3.91% |
| max | 0.0066ms | 0.01ms | -0.0046ms | -41.04% |
| total | 0.16ms | 0.18ms | -0.03ms | -14.19% |

### checkLayoutRegression

# Perf Report — checkLayoutRegression.serial

| metric | value |
|---|---|
| iterations | 50 |
| warmup | 5 |
| p10 | 0.0059ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.03ms |
| mean | 0.02ms |
| stdev | 0.0087ms |
| min | 0.0058ms |
| max | 0.03ms |
| total | 0.76ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0059ms | 0.0061ms | -0.00025ms | -4.08% |
| p50 | 0.02ms | 0.02ms | -0.00056ms | -2.62% |
| p95 | 0.03ms | 0.03ms | -0.0035ms | -11.11% |
| p99 | 0.03ms | 0.20ms | -0.17ms | -84.39% |
| mean | 0.02ms | 0.03ms | -0.01ms | -42.43% |
| min | 0.0058ms | 0.0060ms | -0.00021ms | -3.46% |
| max | 0.03ms | 0.36ms | -0.32ms | -90.45% |
| total | 0.76ms | 1.32ms | -0.56ms | -42.43% |

