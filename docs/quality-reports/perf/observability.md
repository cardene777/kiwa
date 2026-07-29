# Perf Suite — observability

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00017ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00033ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| collectRunHistory | 0.02ms | 0.03ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| detectFlaky | 0.0053ms | 0.02ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| checkThresholds | 0.00038ms | 0.00071ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |
| renderDashboard | 0.0018ms | 0.0066ms | 5ms | 0.00033ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 10, 50 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| collectRunHistory | 0.22ms | 10ms | PASS |
| detectFlaky | 0.06ms | 10ms | PASS |
| checkThresholds | 0.01ms | 10ms | PASS |
| renderDashboard | 0.03ms | 10ms | PASS |

## Memory retention (200 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| collectRunHistory | -3736 B | 0 B | 102400 B | yes | PASS |
| detectFlaky | -9112 B | 0 B | 102400 B | yes | PASS |
| checkThresholds | 712 B | 0 B | 102400 B | yes | PASS |
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
| stdev | 0.02ms |
| min | 0.02ms |
| max | 0.30ms |
| total | 4.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.02ms | 0.02ms | -0.0027ms | -14.73% |
| p50 | 0.02ms | 0.02ms | -0.0020ms | -10.26% |
| p95 | 0.03ms | 0.03ms | -0.0058ms | -17.53% |
| p99 | 0.04ms | 0.04ms | -0.0028ms | -6.21% |
| mean | 0.02ms | 0.02ms | -0.0039ms | -16.19% |
| min | 0.02ms | 0.02ms | -0.0017ms | -10.02% |
| max | 0.30ms | 0.51ms | -0.21ms | -40.97% |
| total | 4.08ms | 4.87ms | -0.79ms | -16.19% |

### detectFlaky

# Perf Report — detectFlaky.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0053ms |
| p50 | 0.0053ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.0077ms |
| stdev | 0.0051ms |
| min | 0.0052ms |
| max | 0.04ms |
| total | 1.54ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0053ms | 0.0055ms | -0.00029ms | -5.25% |
| p50 | 0.0053ms | 0.0057ms | -0.00040ms | -6.93% |
| p95 | 0.02ms | 0.02ms | -0.00064ms | -3.83% |
| p99 | 0.02ms | 0.03ms | -0.0014ms | -5.38% |
| mean | 0.0077ms | 0.0099ms | -0.0021ms | -21.72% |
| min | 0.0052ms | 0.0055ms | -0.00029ms | -5.35% |
| max | 0.04ms | 0.04ms | -0.0033ms | -7.83% |
| total | 1.54ms | 1.97ms | -0.43ms | -21.72% |

### checkThresholds

# Perf Report — checkThresholds.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.00038ms |
| p50 | 0.00042ms |
| p95 | 0.00071ms |
| p99 | 0.0047ms |
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
| p95 | 0.00071ms | 0.00071ms | 0.00ms | 0.00% |
| p99 | 0.0047ms | 0.0030ms | +0.0017ms | +54.29% |
| mean | 0.00056ms | 0.00053ms | +0.000032ms | +5.96% |
| min | 0.00038ms | 0.00042ms | -0.000041ms | -9.86% |
| max | 0.01ms | 0.0088ms | +0.0038ms | +42.91% |
| total | 0.11ms | 0.11ms | +0.0063ms | +5.96% |

### renderDashboard

# Perf Report — renderDashboard.serial

| metric | value |
|---|---|
| iterations | 200 |
| warmup | 5 |
| p10 | 0.0018ms |
| p50 | 0.0018ms |
| p95 | 0.0066ms |
| p99 | 0.01ms |
| mean | 0.0031ms |
| stdev | 0.0029ms |
| min | 0.0018ms |
| max | 0.03ms |
| total | 0.62ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0018ms | 0.0020ms | -0.00025ms | -12.29% |
| p50 | 0.0018ms | 0.0047ms | -0.0029ms | -61.39% |
| p95 | 0.0066ms | 0.0077ms | -0.0011ms | -14.00% |
| p99 | 0.01ms | 0.02ms | -0.0040ms | -21.51% |
| mean | 0.0031ms | 0.0048ms | -0.0017ms | -35.24% |
| min | 0.0018ms | 0.0020ms | -0.00021ms | -10.62% |
| max | 0.03ms | 0.03ms | -0.00017ms | -0.55% |
| total | 0.62ms | 0.96ms | -0.34ms | -35.24% |

