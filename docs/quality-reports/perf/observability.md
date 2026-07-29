# Perf Suite — observability

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| collectRunHistory | 0.02ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| detectFlaky | 0.0048ms | 0.01ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| checkThresholds | 0.00038ms | 0.00063ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
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
| collectRunHistory | -3800 B | 0 B | 102400 B | yes | PASS |
| detectFlaky | -8760 B | 0 B | 102400 B | yes | PASS |
| checkThresholds | 616 B | 0 B | 102400 B | yes | PASS |
| renderDashboard | 632 B | 0 B | 102400 B | yes | PASS |

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
| p99 | 0.04ms |
| mean | 0.02ms |
| stdev | 0.03ms |
| min | 0.01ms |
| max | 0.38ms |
| total | 4.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0018ms | -9.98% |
| p50 | 0.02ms | 0.02ms | -0.0020ms | -10.04% |
| p95 | 0.03ms | 0.03ms | -0.0037ms | -11.09% |
| p99 | 0.04ms | 0.04ms | -0.0040ms | -8.99% |
| mean | 0.02ms | 0.02ms | -0.0033ms | -13.48% |
| min | 0.01ms | 0.02ms | -0.0021ms | -12.46% |
| max | 0.38ms | 0.51ms | -0.13ms | -25.99% |
| total | 4.21ms | 4.87ms | -0.66ms | -13.48% |

### detectFlaky

# Perf Report — detectFlaky.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0048ms |
| p50 | 0.0051ms |
| p95 | 0.01ms |
| p99 | 0.02ms |
| mean | 0.0074ms |
| stdev | 0.0044ms |
| min | 0.0047ms |
| max | 0.03ms |
| total | 1.49ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0048ms | 0.0055ms | -0.00071ms | -12.76% |
| p50 | 0.0051ms | 0.0057ms | -0.00063ms | -10.95% |
| p95 | 0.01ms | 0.02ms | -0.0017ms | -10.34% |
| p99 | 0.02ms | 0.03ms | -0.0071ms | -27.84% |
| mean | 0.0074ms | 0.0099ms | -0.0024ms | -24.72% |
| min | 0.0047ms | 0.0055ms | -0.00071ms | -12.97% |
| max | 0.03ms | 0.04ms | -0.01ms | -27.05% |
| total | 1.49ms | 1.97ms | -0.49ms | -24.72% |

### checkThresholds

# Perf Report — checkThresholds.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00038ms |
| p95 | 0.00063ms |
| p99 | 0.0027ms |
| mean | 0.00049ms |
| stdev | 0.00063ms |
| min | 0.00033ms |
| max | 0.0077ms |
| total | 0.10ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| p50 | 0.00038ms | 0.00046ms | -0.000083ms | -18.12% |
| p95 | 0.00063ms | 0.00071ms | -0.000083ms | -11.69% |
| p99 | 0.0027ms | 0.0030ms | -0.00035ms | -11.65% |
| mean | 0.00049ms | 0.00053ms | -0.000043ms | -8.02% |
| min | 0.00033ms | 0.00042ms | -0.000083ms | -19.95% |
| max | 0.0077ms | 0.0088ms | -0.0011ms | -12.27% |
| total | 0.10ms | 0.11ms | -0.0085ms | -8.02% |

### renderDashboard

# Perf Report — renderDashboard.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0019ms |
| p95 | 0.0064ms |
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
| p50 | 0.0019ms | 0.0047ms | -0.0029ms | -60.09% |
| p95 | 0.0064ms | 0.0077ms | -0.0013ms | -17.30% |
| p99 | 0.02ms | 0.02ms | -0.0032ms | -17.33% |
| mean | 0.0032ms | 0.0048ms | -0.0016ms | -33.75% |
| min | 0.0018ms | 0.0020ms | -0.00017ms | -8.53% |
| max | 0.02ms | 0.03ms | -0.01ms | -36.80% |
| total | 0.64ms | 0.96ms | -0.33ms | -33.75% |

