# Perf Suite — observability

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| collectRunHistory | 0.01ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| detectFlaky | 0.0047ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| checkThresholds | 0.00038ms | 0.00067ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderDashboard | 0.0018ms | 0.0064ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| collectRunHistory | 0.18ms | 10ms | PASS |
| detectFlaky | 0.06ms | 10ms | PASS |
| checkThresholds | 0.01ms | 10ms | PASS |
| renderDashboard | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| collectRunHistory | -3392 B | 0 B | 102400 B | yes | PASS |
| detectFlaky | -8264 B | 0 B | 102400 B | yes | PASS |
| checkThresholds | 712 B | 0 B | 102400 B | yes | PASS |
| renderDashboard | 632 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### collectRunHistory

# Perf Report — collectRunHistory.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.01ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.01ms |
| max | 0.25ms |
| total | 3.92ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.02ms | -0.0035ms | -18.78% |
| p50 | 0.02ms | 0.02ms | -0.0025ms | -13.04% |
| p95 | 0.03ms | 0.03ms | -0.0057ms | -17.30% |
| p99 | 0.04ms | 0.04ms | -0.0042ms | -9.43% |
| mean | 0.02ms | 0.02ms | -0.0047ms | -19.44% |
| min | 0.01ms | 0.02ms | -0.0023ms | -13.44% |
| max | 0.25ms | 0.51ms | -0.26ms | -51.31% |
| total | 3.92ms | 4.87ms | -0.95ms | -19.44% |

### detectFlaky

# Perf Report — detectFlaky.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0047ms |
| p50 | 0.0049ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0073ms |
| stdev | 0.0045ms |
| min | 0.0046ms |
| max | 0.03ms |
| total | 1.46ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0047ms | 0.0055ms | -0.00087ms | -15.77% |
| p50 | 0.0049ms | 0.0057ms | -0.00083ms | -14.59% |
| p95 | 0.01ms | 0.02ms | -0.0021ms | -12.36% |
| p99 | 0.02ms | 0.03ms | -0.0059ms | -23.42% |
| mean | 0.0073ms | 0.0099ms | -0.0026ms | -25.89% |
| min | 0.0046ms | 0.0055ms | -0.00087ms | -16.03% |
| max | 0.03ms | 0.04ms | -0.01ms | -33.50% |
| total | 1.46ms | 1.97ms | -0.51ms | -25.89% |

### checkThresholds

# Perf Report — checkThresholds.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00067ms |
| p99 | 0.0027ms |
| mean | 0.00054ms |
| stdev | 0.0012ms |
| min | 0.00038ms |
| max | 0.02ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| p95 | 0.00067ms | 0.00071ms | -0.000043ms | -6.07% |
| p99 | 0.0027ms | 0.0030ms | -0.00032ms | -10.55% |
| mean | 0.00054ms | 0.00053ms | +0.0000063ms | +1.18% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.02ms | 0.0088ms | +0.0081ms | +91.50% |
| total | 0.11ms | 0.11ms | +0.0013ms | +1.18% |

### renderDashboard

# Perf Report — renderDashboard.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0018ms |
| p95 | 0.0064ms |
| p99 | 0.02ms |
| mean | 0.0028ms |
| stdev | 0.0025ms |
| min | 0.0018ms |
| max | 0.02ms |
| total | 0.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0020ms | -0.00029ms | -14.30% |
| p50 | 0.0018ms | 0.0047ms | -0.0030ms | -62.27% |
| p95 | 0.0064ms | 0.0077ms | -0.0013ms | -16.75% |
| p99 | 0.02ms | 0.02ms | -0.0030ms | -16.18% |
| mean | 0.0028ms | 0.0048ms | -0.0020ms | -41.54% |
| min | 0.0018ms | 0.0020ms | -0.00021ms | -10.62% |
| max | 0.02ms | 0.03ms | -0.01ms | -38.57% |
| total | 0.56ms | 0.96ms | -0.40ms | -41.54% |

