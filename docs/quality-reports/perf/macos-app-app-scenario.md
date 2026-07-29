# Perf Suite — macos-app-app-scenario

Threshold source: [docs/quality/perf-thresholds.md](../../quality/perf-thresholds)

測定系の分解能 = 0.00025ms (何もしない関数を同じ経路で呼んだ時の p10)。 回帰判定の絶対下限は既定でこの 2 倍 = 0.00050ms、 op ごとの実効値は下表の「下限」 列。

## Serial (concurrency = 1)

| op | p10 (回帰判定) | p95 (上限判定) | cap | 下限 | gate | regression |
|---|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.01ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| a11y_batch (5 accessibility tree capture) | 0.0031ms | 0.0058ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| notification_error_handling (5 empty title/body reject) | 0.0015ms | 0.0037ms | 100ms | 0.00050ms | PASS | stable (p10 +3% (閾値未満)、 p95 +80% (裾は実行間の振れ幅と区別できないため判定には使わない)) — gate 無効 (regressionGate=false) |
| retry_recovery (5 flaky async retry to success) | 0.03ms | 0.04ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.0099ms | 0.02ms | 100ms | 0.00050ms | PASS | stable — gate 無効 (regressionGate=false) |

## Concurrent p95 (concurrency = 4, 5 iter each)

| op | p95 | cap | gate |
|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | 0.08ms | 200ms | PASS |
| a11y_batch (5 accessibility tree capture) | 0.02ms | 200ms | PASS |
| notification_error_handling (5 empty title/body reject) | 0.01ms | 200ms | PASS |
| retry_recovery (5 flaky async retry to success) | 0.13ms | 200ms | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 0.05ms | 200ms | PASS |

## Memory retention (20 iter, arrayBuffers axis is the gate; heap is informational)

| op | heapUsed Δ | arrayBuffers Δ | cap | gc exposed | verdict |
|---|---|---|---|---|---|
| user_flow_workflow (10 interaction+screencap cycle across modes) | -2488 B | 8208 B | 102400 B | yes | PASS |
| a11y_batch (5 accessibility tree capture) | 3240 B | 0 B | 102400 B | yes | PASS |
| notification_error_handling (5 empty title/body reject) | 712 B | 0 B | 102400 B | yes | PASS |
| retry_recovery (5 flaky async retry to success) | 6632 B | 0 B | 102400 B | yes | PASS |
| concurrent_batch (5 batches of 4 items with error isolation) | 6328 B | 0 B | 102400 B | yes | PASS |

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
| mean | 0.03ms |
| stdev | 0.01ms |
| min | 0.01ms |
| max | 0.05ms |
| total | 0.56ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.01ms | 0.01ms | -0.00017ms | -1.16% |
| p50 | 0.03ms | 0.02ms | +0.0048ms | +19.51% |
| p95 | 0.04ms | 0.04ms | +0.00095ms | +2.38% |
| p99 | 0.05ms | 0.04ms | +0.0085ms | +19.91% |
| mean | 0.03ms | 0.03ms | +0.0028ms | +11.33% |
| min | 0.01ms | 0.01ms | -0.00029ms | -2.09% |
| max | 0.05ms | 0.04ms | +0.01ms | +23.97% |
| total | 0.56ms | 0.50ms | +0.06ms | +11.33% |

### a11y_batch (5 accessibility tree capture)

# Perf Report — a11y_batch (5 accessibility tree capture).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0031ms |
| p50 | 0.0039ms |
| p95 | 0.0058ms |
| p99 | 0.0078ms |
| mean | 0.0041ms |
| stdev | 0.0013ms |
| min | 0.0031ms |
| max | 0.0083ms |
| total | 0.08ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0031ms | 0.0030ms | +0.000042ms | +1.38% |
| p50 | 0.0039ms | 0.0031ms | +0.00073ms | +23.18% |
| p95 | 0.0058ms | 0.0061ms | -0.00027ms | -4.53% |
| p99 | 0.0078ms | 0.0065ms | +0.0012ms | +19.11% |
| mean | 0.0041ms | 0.0035ms | +0.00059ms | +16.59% |
| min | 0.0031ms | 0.0030ms | +0.000083ms | +2.77% |
| max | 0.0083ms | 0.0066ms | +0.0016ms | +24.53% |
| total | 0.08ms | 0.07ms | +0.01ms | +16.59% |

### notification_error_handling (5 empty title/body reject)

# Perf Report — notification_error_handling (5 empty title/body reject).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0015ms |
| p50 | 0.0017ms |
| p95 | 0.0037ms |
| p99 | 0.0049ms |
| mean | 0.0021ms |
| stdev | 0.00095ms |
| min | 0.0014ms |
| max | 0.0052ms |
| total | 0.04ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0015ms | 0.0014ms | +0.000042ms | +2.97% |
| p50 | 0.0017ms | 0.0014ms | +0.00023ms | +15.93% |
| p95 | 0.0037ms | 0.0021ms | +0.0016ms | +79.53% |
| p99 | 0.0049ms | 0.0036ms | +0.0012ms | +33.71% |
| mean | 0.0021ms | 0.0017ms | +0.00045ms | +27.20% |
| min | 0.0014ms | 0.0014ms | 0.00ms | 0.00% |
| max | 0.0052ms | 0.0040ms | +0.0011ms | +27.86% |
| total | 0.04ms | 0.03ms | +0.0090ms | +27.20% |

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
| stdev | 0.0029ms |
| min | 0.03ms |
| max | 0.04ms |
| total | 0.61ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.03ms | 0.03ms | +0.00076ms | +2.81% |
| p50 | 0.03ms | 0.03ms | +0.0015ms | +5.34% |
| p95 | 0.04ms | 0.04ms | -0.00049ms | -1.34% |
| p99 | 0.04ms | 0.04ms | -0.0022ms | -5.75% |
| mean | 0.03ms | 0.03ms | +0.0014ms | +4.67% |
| min | 0.03ms | 0.03ms | +0.00033ms | +1.24% |
| max | 0.04ms | 0.04ms | -0.0027ms | -6.78% |
| total | 0.61ms | 0.58ms | +0.03ms | +4.67% |

### concurrent_batch (5 batches of 4 items with error isolation)

# Perf Report — concurrent_batch (5 batches of 4 items with error isolation).serial

| metric | value |
|---|---|
| iterations | 20 |
| warmup | 3 |
| p10 | 0.0099ms |
| p50 | 0.01ms |
| p95 | 0.02ms |
| p99 | 0.02ms |
| mean | 0.01ms |
| stdev | 0.0027ms |
| min | 0.0098ms |
| max | 0.02ms |
| total | 0.23ms |

## Baseline diff

| metric | current | baseline | delta ms | delta % |
|---|---|---|---|---|
| p10 | 0.0099ms | 0.0095ms | +0.00042ms | +4.40% |
| p50 | 0.01ms | 0.01ms | +0.00015ms | +1.41% |
| p95 | 0.02ms | 0.02ms | +0.0019ms | +12.09% |
| p99 | 0.02ms | 0.02ms | +0.00041ms | +2.14% |
| mean | 0.01ms | 0.01ms | +0.00034ms | +3.03% |
| min | 0.0098ms | 0.0094ms | +0.00038ms | +3.99% |
| max | 0.02ms | 0.02ms | +0.000042ms | +0.21% |
| total | 0.23ms | 0.22ms | +0.0068ms | +3.03% |

