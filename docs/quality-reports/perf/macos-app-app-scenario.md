# Perf Suite — macos-app-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.01ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| a11y_batch (5 accessibility tree capture) | 0.0030ms | 0.0055ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| notification_error_handling (5 empty title/body reject) | 0.0014ms | 0.0020ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0092ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.07ms | 200ms | PASS |
| a11y_batch (5 accessibility tree capture) | 0.02ms | 200ms | PASS |
| notification_error_handling (5 empty title/body reject) | 0.01ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.12ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.04ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | -2008 B | 0 B | 102400 B | yes | PASS |
| a11y_batch (5 accessibility tree capture) | -1992 B | 0 B | 102400 B | yes | PASS |
| notification_error_handling (5 empty title/body reject) | -13792 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 2880 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 3840 B | 0 B | 102400 B | yes | PASS |

## Detailed serial reports

### user_flow_workflow (10 interaction+screencap cycle across modes)

# Perf Report — user_flow_workflow (10 interaction+screencap cycle across modes).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.01ms |
| p50 | 0.03ms |
| p95 | 0.04ms |
| p99 | 0.05ms |
| mean | 0.02ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 0.50ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00097ms | -6.74% |
| p50 | 0.03ms | 0.02ms | +0.0038ms | +15.48% |
| p95 | 0.04ms | 0.04ms | +0.00057ms | +1.43% |
| p99 | 0.05ms | 0.04ms | +0.0030ms | +6.99% |
| mean | 0.02ms | 0.03ms | -0.00032ms | -1.29% |
| min | 0.01ms | 0.01ms | -0.00058ms | -4.19% |
| max | 0.05ms | 0.04ms | +0.0036ms | +8.28% |
| total | 0.50ms | 0.50ms | -0.0065ms | -1.29% |

### a11y_batch (5 accessibility tree capture)

# Perf Report — a11y_batch (5 accessibility tree capture).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0030ms |
| p50 | 0.0038ms |
| p95 | 0.0055ms |
| p99 | 0.0075ms |
| mean | 0.0039ms |
| stdev | 0.0012ms |
| min | 0.0029ms |
| max | 0.0080ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0030ms | 0.0030ms | -0.000084ms | -2.76% |
| p50 | 0.0038ms | 0.0031ms | +0.00065ms | +20.54% |
| p95 | 0.0055ms | 0.0061ms | -0.00057ms | -9.34% |
| p99 | 0.0075ms | 0.0065ms | +0.00095ms | +14.64% |
| mean | 0.0039ms | 0.0035ms | +0.00032ms | +8.95% |
| min | 0.0029ms | 0.0030ms | -0.000084ms | -2.80% |
| max | 0.0080ms | 0.0066ms | +0.0013ms | +20.14% |
| total | 0.08ms | 0.07ms | +0.0063ms | +8.95% |

### notification_error_handling (5 empty title/body reject)

# Perf Report — notification_error_handling (5 empty title/body reject).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0014ms |
| p50 | 0.0015ms |
| p95 | 0.0020ms |
| p99 | 0.0034ms |
| mean | 0.0017ms |
| stdev | 0.00051ms |
| min | 0.0013ms |
| max | 0.0037ms |
| total | 0.03ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0014ms | 0.0014ms | -0.000041ms | -2.90% |
| p50 | 0.0015ms | 0.0014ms | +0.000063ms | +4.35% |
| p95 | 0.0020ms | 0.0021ms | -0.000056ms | -2.69% |
| p99 | 0.0034ms | 0.0036ms | -0.00028ms | -7.59% |
| mean | 0.0017ms | 0.0017ms | +0.0000020ms | +0.12% |
| min | 0.0013ms | 0.0014ms | -0.000083ms | -5.86% |
| max | 0.0037ms | 0.0040ms | -0.00033ms | -8.22% |
| total | 0.03ms | 0.03ms | +0.000041ms | +0.12% |

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
| stdev | 0.0040ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.57ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | -0.00042ms | -1.56% |
| p50 | 0.03ms | 0.03ms | -0.00081ms | -2.89% |
| p95 | 0.04ms | 0.04ms | -0.0015ms | -3.96% |
| p99 | 0.04ms | 0.04ms | +0.0031ms | +8.02% |
| mean | 0.03ms | 0.03ms | -0.00033ms | -1.14% |
| min | 0.03ms | 0.03ms | -0.00046ms | -1.70% |
| max | 0.04ms | 0.04ms | +0.0042ms | +10.80% |
| total | 0.57ms | 0.58ms | -0.0066ms | -1.14% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0092ms |
| p50 | 0.0098ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0023ms |
| min | 0.0092ms |
| max | 0.02ms |
| total | 0.21ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0092ms | 0.0095ms | -0.00021ms | -2.21% |
| p50 | 0.0098ms | 0.01ms | -0.00050ms | -4.83% |
| p95 | 0.02ms | 0.02ms | +0.0015ms | +9.64% |
| p99 | 0.02ms | 0.02ms | -0.0019ms | -10.04% |
| mean | 0.01ms | 0.01ms | -0.00046ms | -4.17% |
| min | 0.0092ms | 0.0094ms | -0.00025ms | -2.64% |
| max | 0.02ms | 0.02ms | -0.0027ms | -13.86% |
| total | 0.21ms | 0.22ms | -0.0093ms | -4.17% |

