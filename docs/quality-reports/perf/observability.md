# Perf Suite — observability

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| collectRunHistory | 0.02ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| detectFlaky | 0.0051ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| checkThresholds | 0.00038ms | 0.00067ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderDashboard | 0.0018ms | 0.0065ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| collectRunHistory | 0.19ms | 10ms | PASS |
| detectFlaky | 0.08ms | 10ms | PASS |
| checkThresholds | 0.01ms | 10ms | PASS |
| renderDashboard | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| collectRunHistory | -3688 B | 0 B | 102400 B | yes | PASS |
| detectFlaky | -7896 B | 0 B | 102400 B | yes | PASS |
| checkThresholds | 1552 B | 0 B | 102400 B | yes | PASS |
| renderDashboard | 712 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### collectRunHistory

# Perf Report — collectRunHistory.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.02ms |
| p50 | 0.02ms |
| p95 | 0.03ms |
| p99 | 0.06ms |
| mean | 0.02ms |
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.28ms |
| total | 4.20ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0031ms | -17.00% |
| p50 | 0.02ms | 0.02ms | -0.0022ms | -11.11% |
| p95 | 0.03ms | 0.03ms | -0.0018ms | -5.45% |
| p99 | 0.06ms | 0.04ms | +0.01ms | +26.65% |
| mean | 0.02ms | 0.02ms | -0.0034ms | -13.81% |
| min | 0.02ms | 0.02ms | -0.0019ms | -11.24% |
| max | 0.28ms | 0.51ms | -0.23ms | -45.09% |
| total | 4.20ms | 4.87ms | -0.67ms | -13.81% |

### detectFlaky

# Perf Report — detectFlaky.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0051ms |
| p50 | 0.0052ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0075ms |
| stdev | 0.0043ms |
| min | 0.0050ms |
| max | 0.02ms |
| total | 1.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0051ms | 0.0055ms | -0.00046ms | -8.27% |
| p50 | 0.0052ms | 0.0057ms | -0.00050ms | -8.76% |
| p95 | 0.01ms | 0.02ms | -0.0017ms | -10.12% |
| p99 | 0.02ms | 0.03ms | -0.0058ms | -22.81% |
| mean | 0.0075ms | 0.0099ms | -0.0024ms | -24.36% |
| min | 0.0050ms | 0.0055ms | -0.00042ms | -7.64% |
| max | 0.02ms | 0.04ms | -0.02ms | -42.42% |
| total | 1.49ms | 1.97ms | -0.48ms | -24.36% |

### checkThresholds

# Perf Report — checkThresholds.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00067ms |
| p99 | 0.0045ms |
| mean | 0.00056ms |
| stdev | 0.0011ms |
| min | 0.00038ms |
| max | 0.01ms |
| total | 0.11ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| p50 | 0.00042ms | 0.00046ms | -0.000042ms | -9.17% |
| p95 | 0.00067ms | 0.00071ms | -0.000044ms | -6.20% |
| p99 | 0.0045ms | 0.0030ms | +0.0015ms | +47.88% |
| mean | 0.00056ms | 0.00053ms | +0.000028ms | +5.32% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.01ms | 0.0088ms | +0.0045ms | +50.93% |
| total | 0.11ms | 0.11ms | +0.0057ms | +5.32% |

### renderDashboard

# Perf Report — renderDashboard.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0019ms |
| p95 | 0.0065ms |
| p99 | 0.02ms |
| mean | 0.0032ms |
| stdev | 0.0027ms |
| min | 0.0018ms |
| max | 0.02ms |
| total | 0.64ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0020ms | -0.00021ms | -10.24% |
| p50 | 0.0019ms | 0.0047ms | -0.0028ms | -59.66% |
| p95 | 0.0065ms | 0.0077ms | -0.0012ms | -16.09% |
| p99 | 0.02ms | 0.02ms | -0.00091ms | -4.90% |
| mean | 0.0032ms | 0.0048ms | -0.0016ms | -33.92% |
| min | 0.0018ms | 0.0020ms | -0.00017ms | -8.48% |
| max | 0.02ms | 0.03ms | -0.01ms | -34.06% |
| total | 0.64ms | 0.96ms | -0.33ms | -33.92% |

