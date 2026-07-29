# Perf Suite — macos-app-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00021ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00042ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.01ms | 0.05ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| a11y_batch (5 accessibility tree capture) | 0.0030ms | 0.0053ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| notification_error_handling (5 empty title/body reject) | 0.0013ms | 0.0020ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0095ms | 0.02ms | 100ms | 0.00042ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.07ms | 200ms | PASS |
| a11y_batch (5 accessibility tree capture) | 0.02ms | 200ms | PASS |
| notification_error_handling (5 empty title/body reject) | 0.01ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | -1992 B | 0 B | 102400 B | yes | PASS |
| a11y_batch (5 accessibility tree capture) | -1896 B | 0 B | 102400 B | yes | PASS |
| notification_error_handling (5 empty title/body reject) | 616 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 48 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 3344 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 interaction+screencap cycle across modes)

# Perf Report — user_flow_workflow (10 interaction+screencap cycle across modes).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.03ms |
| p95 | 0.05ms |
| p99 | 0.07ms |
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.07ms |
| total | 0.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.0010ms | -7.09% |
| p50 | 0.03ms | 0.02ms | +0.0050ms | +20.19% |
| p95 | 0.05ms | 0.04ms | +0.0072ms | +18.05% |
| p99 | 0.07ms | 0.04ms | +0.02ms | +58.10% |
| mean | 0.03ms | 0.03ms | +0.0029ms | +11.71% |
| min | 0.01ms | 0.01ms | -0.00087ms | -6.28% |
| max | 0.07ms | 0.04ms | +0.03ms | +67.37% |
| total | 0.56ms | 0.50ms | +0.06ms | +11.71% |

### a11y_batch (5 accessibility tree capture)

# Perf Report — a11y_batch (5 accessibility tree capture).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0030ms |
| p50 | 0.0031ms |
| p95 | 0.0053ms |
| p99 | 0.0072ms |
| mean | 0.0035ms |
| stdev | 0.0011ms |
| min | 0.0030ms |
| max | 0.0077ms |
| total | 0.07ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0030ms | -9.0e-7ms | -0.03% |
| p50 | 0.0031ms | 0.0031ms | -0.000020ms | -0.65% |
| p95 | 0.0053ms | 0.0061ms | -0.00078ms | -12.83% |
| p99 | 0.0072ms | 0.0065ms | +0.00068ms | +10.39% |
| mean | 0.0035ms | 0.0035ms | -0.000017ms | -0.47% |
| min | 0.0030ms | 0.0030ms | 0.00ms | 0.00% |
| max | 0.0077ms | 0.0066ms | +0.0010ms | +15.71% |
| total | 0.07ms | 0.07ms | -0.00034ms | -0.47% |

### notification_error_handling (5 empty title/body reject)

# Perf Report — notification_error_handling (5 empty title/body reject).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0013ms |
| p50 | 0.0014ms |
| p95 | 0.0020ms |
| p99 | 0.0033ms |
| mean | 0.0016ms |
| stdev | 0.00051ms |
| min | 0.0013ms |
| max | 0.0036ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0013ms | 0.0014ms | -0.000082ms | -5.80% |
| p50 | 0.0014ms | 0.0014ms | -0.000063ms | -4.35% |
| p95 | 0.0020ms | 0.0021ms | -0.00010ms | -4.83% |
| p99 | 0.0033ms | 0.0036ms | -0.00035ms | -9.68% |
| mean | 0.0016ms | 0.0017ms | -0.000083ms | -5.03% |
| min | 0.0013ms | 0.0014ms | -0.000083ms | -5.86% |
| max | 0.0036ms | 0.0040ms | -0.00042ms | -10.29% |
| total | 0.03ms | 0.03ms | -0.0017ms | -5.03% |

### retry_recovery (5 flaky async retry to success)

# Perf Report — retry_recovery (5 flaky async retry to success).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.03ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.04ms |
| mean | 0.03ms |
| stdev | 0.0037ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.59ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00016ms | +0.59% |
| p50 | 0.03ms | 0.03ms | -0.00035ms | -1.26% |
| p95 | 0.04ms | 0.04ms | +0.0016ms | +4.42% |
| p99 | 0.04ms | 0.04ms | +0.0015ms | +3.84% |
| mean | 0.03ms | 0.03ms | +0.00024ms | +0.81% |
| min | 0.03ms | 0.03ms | +0.00013ms | +0.47% |
| max | 0.04ms | 0.04ms | +0.0015ms | +3.71% |
| total | 0.59ms | 0.58ms | +0.0047ms | +0.81% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0095ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0022ms |
| min | 0.0094ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0095ms | 0.0095ms | +0.000037ms | +0.39% |
| p50 | 0.01ms | 0.01ms | -0.00031ms | -3.02% |
| p95 | 0.02ms | 0.02ms | +0.0011ms | +7.14% |
| p99 | 0.02ms | 0.02ms | -0.0018ms | -9.57% |
| mean | 0.01ms | 0.01ms | -0.00041ms | -3.72% |
| min | 0.0094ms | 0.0094ms | 0.00ms | 0.00% |
| max | 0.02ms | 0.02ms | -0.0025ms | -12.82% |
| total | 0.21ms | 0.22ms | -0.0083ms | -3.72% |

